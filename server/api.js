// API mantiqi — freymvorkdan mustaqil: Node (Express) va Supabase Edge Function bir xil ishlatadi.
// handle({ method, path, query, body, headers }) -> { status, body, headers? }
const crypto = require("crypto");
const db = require("./db");
const ai = require("./ai");
const { projectStats, employeeStats, dashboard } = require("./finance");
const { seedDemo } = require("./demo");

const today = () => new Date().toISOString().slice(0, 10);
const ok = (body) => ({ status: 200, body });
const fail = (status, error) => ({ status, body: { error } });

const FIELDS = {
  transactions: ["type", "amount", "scope", "categoryId", "date", "note", "projectId", "employeeId", "source"],
  categories: ["name", "type", "scope", "color"],
  projects: ["name", "client", "status", "budget", "startDate", "endDate", "items", "note"],
  employees: ["name", "role", "payType", "rate", "pieceRate", "unitName", "startDate", "endDate", "active", "phone", "note"],
  workLogs: ["employeeId", "date", "qty", "rate", "projectId", "note"],
};

function clean(collection, body) {
  const out = {};
  for (const k of FIELDS[collection]) if (body[k] !== undefined) out[k] = body[k];
  for (const k of ["amount", "budget", "rate", "pieceRate", "qty"]) if (out[k] != null && out[k] !== "") out[k] = Number(out[k]);
  for (const k of ["projectId", "employeeId", "categoryId"]) if (out[k] === "") out[k] = null;
  if (out.rate === "") delete out.rate;
  return out;
}

function validate(collection, item) {
  if (collection === "transactions") {
    if (!["income", "expense"].includes(item.type)) return "Turi noto'g'ri";
    if (!(item.amount > 0)) return "Summa 0 dan katta bo'lishi kerak";
    if (!db.load().scopes.some((x) => x.id === item.scope)) return "Bo'lim noto'g'ri";
  }
  if (["categories", "projects", "employees"].includes(collection) && !String(item.name || "").trim())
    return "Nomi kiritilmagan";
  if (collection === "workLogs" && (!item.employeeId || !(item.qty > 0))) return "Xodim va miqdor kerak";
  return null;
}

// Ichki xizmat ma'lumotlari (bot holati, foydalanuvchilar, parol xeshi) mijozga yuborilmaydi
function publicData(d) {
  const { _bot, _users, _acct, ...rest } = d;
  return rest;
}
const internal = (d) => ({ _bot: d._bot, _users: d._users, _acct: d._acct });

// ---------- Kirish: egasi (APP_PASSWORD) va u qo'shgan foydalanuvchilar ----------
const OWNER_NAMES = ["", "egasi", "owner", "admin", "main"];
const normUser = (s) => String(s || "").trim().toLowerCase();
const validUser = (s) => /^[a-z0-9_.-]{3,32}$/.test(s) && !OWNER_NAMES.includes(s);
const b64u = (s) => Buffer.from(s).toString("base64url");
const secret = () => crypto.createHash("sha256").update("glass-token:" + (process.env.APP_PASSWORD || "")).digest();
const sign = (body) => crypto.createHmac("sha256", secret()).update(body).digest("hex");
const TOKEN_DAYS = 60;

function makeToken(u, v) {
  const body = b64u(JSON.stringify({ u, v: v || "", exp: Date.now() + TOKEN_DAYS * 864e5 }));
  return `v1.${body}.${sign(body)}`;
}
function readToken(t) {
  const [tag, body, sig] = String(t || "").split(".");
  if (tag !== "v1" || !body || !sig) return null;
  const want = sign(body);
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}
const hashPw = (pw, salt) => crypto.pbkdf2Sync(String(pw), salt, 100000, 32, "sha256").toString("hex");
const eq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function newAcct(pw) {
  const salt = crypto.randomBytes(12).toString("hex");
  return { salt, hash: hashPw(pw, salt), ver: crypto.randomBytes(4).toString("hex") };
}

// Ketma-ket noto'g'ri urinishlarni sekinlashtirish
const fails = new Map();
function throttled(key) {
  const f = fails.get(key);
  return f && f.n >= 8 && Date.now() - f.t < 10 * 60 * 1000;
}
const failed = (key) => fails.set(key, { n: (fails.get(key)?.n || 0) + 1, t: Date.now() });

const routes = [];
const route = (method, pattern, fn) => {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
  routes.push({ method, re, keys, fn });
};

route("POST", "/auth", async (req) => {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return ok({ ok: true, required: false, user: { name: "", owner: true } });
  const name = normUser(req.body?.username);
  const pw = String(req.body?.password || "");
  const key = name || "main";
  if (throttled(key)) return fail(429, "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring");
  if (OWNER_NAMES.includes(name)) {
    if (eq(pw, pass)) return ok({ ok: true, required: true, token: makeToken("main"), user: { name: "egasi", owner: true } });
  } else if (validUser(name) && (await db.exists(name))) {
    const acct = await db.session(name, () => db.load()._acct);
    if (acct && acct.hash && eq(hashPw(pw, acct.salt), acct.hash))
      return ok({ ok: true, required: true, token: makeToken(name, acct.ver), user: { name, owner: false } });
  }
  failed(key);
  return ok({ ok: false, required: true });
});

route("GET", "/state", (req) => {
  const d = db.load();
  const month = req.query.month || today().slice(0, 7);
  return ok({
    ...publicData(d),
    me: { name: req.user.name, owner: req.user.owner },
    aiEnabled: ai.hasKey(),
    aiProvider: ai.providerName(),
    projects: d.projects.map((p) => ({ ...p, stats: projectStats(d, p) })),
    employees: d.employees.map((e) => ({ ...e, stats: employeeStats(d, e, month) })),
  });
});

route("GET", "/dashboard", (req) => ok(dashboard(db.load(), req.query)));

for (const collection of Object.keys(FIELDS)) {
  route("POST", `/${collection}`, (req) => {
    const d = db.load();
    const list = Array.isArray(req.body) ? req.body : [req.body || {}];
    const created = [];
    for (const body of list) {
      const item = { id: db.uid(), ...clean(collection, body), createdAt: new Date().toISOString() };
      if (collection === "transactions" || collection === "workLogs") item.date ||= today();
      if (collection === "projects") item.items ||= [];
      const err = validate(collection, item);
      if (err) return fail(400, err);
      created.push(item);
    }
    d[collection].push(...created);
    db.save();
    return ok(Array.isArray(req.body) ? created : created[0]);
  });

  route("PUT", `/${collection}/:id`, (req) => {
    const d = db.load();
    const item = d[collection].find((x) => x.id === req.params.id);
    if (!item) return fail(404, "Topilmadi");
    const next = { ...item, ...clean(collection, req.body || {}) };
    const err = validate(collection, next);
    if (err) return fail(400, err);
    Object.assign(item, next);
    db.save();
    return ok(item);
  });

  route("DELETE", `/${collection}/:id`, (req) => {
    const d = db.load();
    const idx = d[collection].findIndex((x) => x.id === req.params.id);
    if (idx < 0) return fail(404, "Topilmadi");
    const [removed] = d[collection].splice(idx, 1);
    // Bog'liq yozuvlarni tozalash
    if (collection === "categories")
      d.transactions.forEach((t) => t.categoryId === removed.id && (t.categoryId = null));
    if (collection === "projects") {
      d.transactions.forEach((t) => t.projectId === removed.id && (t.projectId = null));
      d.workLogs.forEach((w) => w.projectId === removed.id && (w.projectId = null));
    }
    if (collection === "employees") {
      d.transactions.forEach((t) => t.employeeId === removed.id && (t.employeeId = null));
      d.workLogs = d.workLogs.filter((w) => w.employeeId !== removed.id);
    }
    db.save();
    return ok({ ok: true });
  });
}

// Xodimga to'lov — avtomatik "Ish haqi" chiqimi sifatida yoziladi
route("POST", "/employees/:id/pay", (req) => {
  const d = db.load();
  const emp = d.employees.find((e) => e.id === req.params.id);
  if (!emp) return fail(404, "Xodim topilmadi");
  const amount = Number(req.body?.amount);
  if (!(amount > 0)) return fail(400, "Summa kiriting");
  const catName = emp.payType === "piece" ? "Dona ish haqi (frilans)" : "Ish haqi / oylik";
  const cat =
    d.categories.find((c) => c.name === catName) ||
    d.categories.find((c) => c.type === "expense" && c.scope !== "personal");
  const tx = {
    id: db.uid(),
    type: "expense",
    scope: d.scopes.find((x) => x.id === req.body?.scope)?.id || (d.scopes.find((x) => x.kind !== "personal") || d.scopes[0]).id,
    amount,
    date: req.body.date || today(),
    categoryId: cat?.id || null,
    employeeId: emp.id,
    projectId: req.body.projectId || null,
    note: req.body.note || `${emp.name} — to'lov`,
    source: "payroll",
    createdAt: new Date().toISOString(),
  };
  d.transactions.push(tx);
  db.save();
  return ok(tx);
});

route("POST", "/ai/parse", async (req) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return fail(400, "Matn bo'sh");
  return ok(await ai.parseTransactions(db.load(), text, req.body.scope));
});

route("POST", "/ai/chat", async (req) => {
  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-30) : [];
  if (!history.length || history.at(-1).role !== "user") return fail(400, "Xabar yo'q");
  return ok(await ai.chat(db.load(), history, { uid: db.uid, save: db.save }));
});

route("GET", "/export", () => ({
  status: 200,
  body: publicData(db.load()),
  headers: { "Content-Disposition": `attachment; filename="glass-finance-${today()}.json"` },
}));

route("POST", "/import", (req) => {
  const data = req.body;
  if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories))
    return fail(400, "Fayl formati noto'g'ri");
  db.reset({ ...db.emptyDb(), ...data, ...internal(db.load()) });
  return ok({ ok: true });
});

route("POST", "/demo", () => {
  db.reset({ ...seedDemo(db.emptyDb(), db.uid), ...internal(db.load()) });
  return ok({ ok: true });
});

route("POST", "/reset", () => {
  db.reset({ ...db.emptyDb(), ...internal(db.load()) });
  return ok({ ok: true });
});

// ---------- Bo'limlar (biznes / shaxsiy) ----------
const SCOPE_KINDS = ["business", "personal"];
const cleanScopeName = (s) => String(s || "").trim().slice(0, 40);

route("POST", "/scopes", (req) => {
  const d = db.load();
  const name = cleanScopeName(req.body?.name);
  if (!name) return fail(400, "Nomi kiritilmagan");
  if (d.scopes.some((x) => x.name.toLowerCase() === name.toLowerCase())) return fail(400, "Bunday bo'lim bor");
  const kind = SCOPE_KINDS.includes(req.body?.kind) ? req.body.kind : "business";
  const scope = { id: "s" + db.uid(), name, kind };
  d.scopes.push(scope);
  const mk = (type, label, color) => d.categories.push({ id: db.uid(), name: `${label} (${name})`, type, scope: scope.id, color });
  mk("income", "Daromad", "#34d399");
  mk("expense", "Xarajat", "#fb7185");
  db.save();
  return ok(scope);
});

route("PUT", "/scopes/:id", (req) => {
  const d = db.load();
  const sc = d.scopes.find((x) => x.id === req.params.id);
  if (!sc) return fail(404, "Topilmadi");
  const name = cleanScopeName(req.body?.name ?? sc.name);
  if (!name) return fail(400, "Nomi kiritilmagan");
  if (d.scopes.some((x) => x.id !== sc.id && x.name.toLowerCase() === name.toLowerCase())) return fail(400, "Bunday bo'lim bor");
  sc.name = name;
  if (SCOPE_KINDS.includes(req.body?.kind)) sc.kind = req.body.kind;
  db.save();
  return ok(sc);
});

// moveTo — ma'lumotlar ko'chiriladigan bo'lim id'si; bo'sh bo'lsa ma'lumotlar ham o'chiriladi
route("DELETE", "/scopes/:id", (req) => {
  const d = db.load();
  const idx = d.scopes.findIndex((x) => x.id === req.params.id);
  if (idx < 0) return fail(404, "Topilmadi");
  if (d.scopes.length < 2) return fail(400, "Kamida bitta bo'lim qolishi kerak");
  const id = d.scopes[idx].id;
  const moveTo = req.body?.moveTo;
  if (moveTo && (moveTo === id || !d.scopes.some((x) => x.id === moveTo))) return fail(400, "Ko'chirish bo'limi noto'g'ri");
  if (moveTo) {
    d.transactions.forEach((t) => t.scope === id && (t.scope = moveTo));
    d.categories.forEach((c) => c.scope === id && (c.scope = moveTo));
  } else {
    d.transactions = d.transactions.filter((t) => t.scope !== id);
    d.categories = d.categories.filter((c) => c.scope !== id);
  }
  d.scopes.splice(idx, 1);
  db.save();
  return ok({ ok: true });
});

// ---------- Foydalanuvchilar (faqat egasi) ----------
const ownerOnly = (req) => (req.user.owner ? null : fail(403, "Faqat ilova egasi"));

route("GET", "/users", (req) => {
  const denied = ownerOnly(req);
  if (denied) return denied;
  const u = db.load()._users || {};
  return ok(Object.entries(u).map(([name, v]) => ({ name, createdAt: v.createdAt })));
});

route("POST", "/users", async (req) => {
  const denied = ownerOnly(req);
  if (denied) return denied;
  const name = normUser(req.body?.username);
  const pw = String(req.body?.password || "");
  if (!validUser(name)) return fail(400, "Login 3-32 belgi: lotin harf, raqam, _ . -");
  if (pw.length < 6) return fail(400, "Parol kamida 6 belgi bo'lsin");
  const main = db.load();
  const known = !!main._users?.[name];
  const acct = newAcct(pw);
  await db.session(name, () => {
    db.load()._acct = acct;
    db.save();
  });
  main._users ??= {};
  main._users[name] ??= { createdAt: new Date().toISOString() };
  db.save();
  return ok({ ok: true, updated: known });
});

route("DELETE", "/users/:name", async (req) => {
  const denied = ownerOnly(req);
  if (denied) return denied;
  const name = normUser(req.params.name);
  const main = db.load();
  if (!main._users?.[name]) return fail(404, "Topilmadi");
  // Kirish o'chiriladi (ma'lumotlar saqlanadi — qayta ochilsa yana shu ma'lumot bilan)
  await db.session(name, () => {
    delete db.load()._acct;
    db.save();
  });
  delete main._users[name];
  db.save();
  return ok({ ok: true });
});

// path — "/api" dan keyingi qism, masalan "/state"
async function handle({ method, path, query = {}, body, headers = {} }) {
  const header = (k) => headers[k] ?? headers[k.toLowerCase()];
  const pass = process.env.APP_PASSWORD;

  // Kim so'rayapti: egasi (token yoki eski usul — xom parol), yoki qo'shilgan foydalanuvchi (token)
  let user = { id: "main", name: "egasi", owner: true, ver: null };
  if (pass && path !== "/auth") {
    const key = header("x-app-key") || "";
    const tok = readToken(key);
    if (tok) user = tok.u === "main" ? user : { id: tok.u, name: tok.u, owner: false, ver: tok.v };
    else if (!(key && eq(String(key), pass))) return fail(401, "auth");
  }

  const run = async () => {
    if (!user.owner && db.load()._acct?.ver !== user.ver) return fail(401, "auth");
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = path.match(r.re);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      try {
        return await r.fn({ params, query, body, headers, user });
      } catch (e) {
        console.error(e);
        return fail(500, e.message || "Server xatosi");
      }
    }
    return fail(404, "Topilmadi");
  };
  try {
    return path === "/auth" ? await run() : await db.session(user.id, run);
  } catch (e) {
    console.error(e);
    return fail(500, e.message || "Server xatosi");
  }
}

module.exports = { handle };

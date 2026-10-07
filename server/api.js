// API mantiqi — freymvorkdan mustaqil: Node (Express) va Supabase Edge Function bir xil ishlatadi.
// handle({ method, path, query, body, headers }) -> { status, body, headers? }
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
  employees: ["name", "role", "payType", "rate", "unitName", "startDate", "endDate", "active", "phone", "note"],
  workLogs: ["employeeId", "date", "qty", "rate", "projectId", "note"],
};

function clean(collection, body) {
  const out = {};
  for (const k of FIELDS[collection]) if (body[k] !== undefined) out[k] = body[k];
  for (const k of ["amount", "budget", "rate", "qty"]) if (out[k] != null && out[k] !== "") out[k] = Number(out[k]);
  for (const k of ["projectId", "employeeId", "categoryId"]) if (out[k] === "") out[k] = null;
  if (out.rate === "") delete out.rate;
  return out;
}

function validate(collection, item) {
  if (collection === "transactions") {
    if (!["income", "expense"].includes(item.type)) return "Turi noto'g'ri";
    if (!(item.amount > 0)) return "Summa 0 dan katta bo'lishi kerak";
    if (!["personal", "agency"].includes(item.scope)) return "Bo'lim noto'g'ri";
  }
  if (["categories", "projects", "employees"].includes(collection) && !String(item.name || "").trim())
    return "Nomi kiritilmagan";
  if (collection === "workLogs" && (!item.employeeId || !(item.qty > 0))) return "Xodim va miqdor kerak";
  return null;
}

// Ichki xizmat ma'lumotlari (bot holati) mijozga yuborilmaydi
function publicData(d) {
  const { _bot, ...rest } = d;
  return rest;
}

const routes = [];
const route = (method, pattern, fn) => {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
  routes.push({ method, re, keys, fn });
};

route("POST", "/auth", (req) => {
  const pass = process.env.APP_PASSWORD;
  return ok({ ok: !pass || req.body?.password === pass, required: !!pass });
});

route("GET", "/state", (req) => {
  const d = db.load();
  const month = req.query.month || today().slice(0, 7);
  return ok({
    ...publicData(d),
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
    d.categories.find((c) => c.type === "expense" && c.scope === "agency");
  const tx = {
    id: db.uid(),
    type: "expense",
    scope: "agency",
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
  db.reset({ ...db.emptyDb(), ...data, _bot: db.load()._bot });
  return ok({ ok: true });
});

route("POST", "/demo", () => {
  db.reset({ ...seedDemo(db.emptyDb(), db.uid), _bot: db.load()._bot });
  return ok({ ok: true });
});

route("POST", "/reset", () => {
  db.reset({ ...db.emptyDb(), _bot: db.load()._bot });
  return ok({ ok: true });
});

// path — "/api" dan keyingi qism, masalan "/state"
async function handle({ method, path, query = {}, body, headers = {} }) {
  const header = (k) => headers[k] ?? headers[k.toLowerCase()];
  const pass = process.env.APP_PASSWORD;
  if (pass && path !== "/auth" && header("x-app-key") !== pass) return fail(401, "auth");

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    try {
      return await r.fn({ params, query, body, headers });
    } catch (e) {
      console.error(e);
      return fail(500, e.message || "Server xatosi");
    }
  }
  return fail(404, "Topilmadi");
}

module.exports = { handle };

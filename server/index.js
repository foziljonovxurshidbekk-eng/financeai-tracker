require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const path = require("path");
const express = require("express");
const db = require("./db");
const ai = require("./ai");
const { projectStats, employeeStats, dashboard } = require("./finance");
const { seedDemo } = require("./demo");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/vendor/chart.js", express.static(path.join(__dirname, "..", "node_modules", "chart.js", "dist")));

// Oddiy parol himoyasi (APP_PASSWORD o'rnatilgan bo'lsa)
app.use("/api", (req, res, next) => {
  const pass = process.env.APP_PASSWORD;
  if (!pass || req.path === "/auth") return next();
  if (req.get("x-app-key") === pass) return next();
  res.status(401).json({ error: "auth" });
});
app.post("/api/auth", (req, res) => {
  const pass = process.env.APP_PASSWORD;
  res.json({ ok: !pass || req.body.password === pass, required: !!pass });
});

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(e);
    res.status(500).json({ error: e.message || "Server xatosi" });
  });

const today = () => new Date().toISOString().slice(0, 10);

// --- To'liq holat (frontend uchun) ---
app.get("/api/state", (req, res) => {
  const d = db.load();
  const month = req.query.month || today().slice(0, 7);
  res.json({
    ...d,
    aiEnabled: ai.hasKey(),
    projects: d.projects.map((p) => ({ ...p, stats: projectStats(d, p) })),
    employees: d.employees.map((e) => ({ ...e, stats: employeeStats(d, e, month) })),
  });
});

app.get("/api/dashboard", (req, res) => {
  res.json(dashboard(db.load(), req.query));
});

// --- Umumiy CRUD ---
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

for (const collection of Object.keys(FIELDS)) {
  app.post(`/api/${collection}`, (req, res) => {
    const d = db.load();
    const list = Array.isArray(req.body) ? req.body : [req.body];
    const created = [];
    for (const body of list) {
      const item = { id: db.uid(), ...clean(collection, body), createdAt: new Date().toISOString() };
      if (collection === "transactions" || collection === "workLogs") item.date ||= today();
      if (collection === "projects") item.items ||= [];
      const err = validate(collection, item);
      if (err) return res.status(400).json({ error: err });
      created.push(item);
    }
    d[collection].push(...created);
    db.save();
    res.json(Array.isArray(req.body) ? created : created[0]);
  });

  app.put(`/api/${collection}/:id`, (req, res) => {
    const d = db.load();
    const item = d[collection].find((x) => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Topilmadi" });
    const next = { ...item, ...clean(collection, req.body) };
    const err = validate(collection, next);
    if (err) return res.status(400).json({ error: err });
    Object.assign(item, next);
    db.save();
    res.json(item);
  });

  app.delete(`/api/${collection}/:id`, (req, res) => {
    const d = db.load();
    const idx = d[collection].findIndex((x) => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: "Topilmadi" });
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
    res.json({ ok: true });
  });
}

// Xodimga to'lov — avtomatik "Ish haqi" chiqimi sifatida yoziladi
app.post("/api/employees/:id/pay", (req, res) => {
  const d = db.load();
  const emp = d.employees.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: "Xodim topilmadi" });
  const amount = Number(req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ error: "Summa kiriting" });
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
  res.json(tx);
});

// --- AI ---
app.post(
  "/api/ai/parse",
  wrap(async (req, res) => {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Matn bo'sh" });
    res.json(await ai.parseTransactions(db.load(), text, req.body.scope));
  })
);

app.post(
  "/api/ai/chat",
  wrap(async (req, res) => {
    const history = Array.isArray(req.body.messages) ? req.body.messages.slice(-30) : [];
    if (!history.length || history.at(-1).role !== "user") return res.status(400).json({ error: "Xabar yo'q" });
    res.json(await ai.chat(db.load(), history, { uid: db.uid, save: db.save }));
  })
);

// --- Import / eksport / demo ---
app.get("/api/export", (req, res) => {
  res.setHeader("Content-Disposition", `attachment; filename="glass-finance-${today()}.json"`);
  res.json(db.load());
});
app.post("/api/import", (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories))
    return res.status(400).json({ error: "Fayl formati noto'g'ri" });
  db.reset({ ...db.emptyDb(), ...data });
  res.json({ ok: true });
});
app.post("/api/demo", (req, res) => {
  db.reset(seedDemo(db.emptyDb(), db.uid));
  res.json({ ok: true });
});
app.post("/api/reset", (req, res) => {
  db.reset();
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status === 400 ? "So'rov formati noto'g'ri" : "Server xatosi" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    console.log(`Glass Finance: http://localhost:${PORT}  (AI: ${ai.hasKey() ? "Claude yoqilgan" : "offline rejim"})`);
  });
  if (require("./bot").startBot()) console.log("Telegram bot ishga tushdi");
}
module.exports = app;

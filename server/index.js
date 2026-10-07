require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const path = require("path");
const express = require("express");
const db = require("./db");
const ai = require("./ai");
const api = require("./api");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/vendor/chart.js", express.static(path.join(__dirname, "..", "node_modules", "chart.js", "dist")));

// Uyg'otib turish (ping) va monitoring uchun
app.get("/health", (req, res) => res.json({ ok: true }));

// Barcha API so'rovlari umumiy api.js orqali (Supabase Edge Function bilan bir xil mantiq)
app.use("/api", async (req, res) => {
  const r = await api.handle({ method: req.method, path: req.path, query: req.query, body: req.body, headers: req.headers });
  if (r.headers) res.set(r.headers);
  res.status(r.status).json(r.body);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status === 400 ? "So'rov formati noto'g'ri" : "Server xatosi" });
});

const PORT = process.env.PORT || 3000;

async function main() {
  await db.init();
  await require("./bot").runBot(app);
  app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    console.log(`Glass Finance: http://localhost:${PORT}  (AI: ${ai.providerName() || "offline rejim"}, baza: ${db.storage()})`);
  });
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Ishga tushirib bo'lmadi:", e);
    process.exit(1);
  });
}
module.exports = app;

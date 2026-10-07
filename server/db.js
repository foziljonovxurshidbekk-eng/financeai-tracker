// Oddiy JSON-fayl ma'lumotlar bazasi (atomik yozish bilan).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_CATEGORIES = [
  // Agentlik — kirim
  ["Mijoz to'lovi", "income", "agency", "#34d399"],
  ["Avans / oldindan to'lov", "income", "agency", "#10b981"],
  ["Retainer (oylik xizmat)", "income", "agency", "#2dd4bf"],
  // Agentlik — chiqim
  ["Reklama byudjeti (Meta/Google)", "expense", "agency", "#f472b6"],
  ["Ish haqi / oylik", "expense", "agency", "#fb7185"],
  ["Dona ish haqi (frilans)", "expense", "agency", "#f43f5e"],
  ["Dasturlar va obunalar", "expense", "agency", "#a78bfa"],
  ["Ofis ijarasi", "expense", "agency", "#818cf8"],
  ["Kontent ishlab chiqarish", "expense", "agency", "#c084fc"],
  ["Uskunalar", "expense", "agency", "#60a5fa"],
  ["Soliq", "expense", "agency", "#f59e0b"],
  ["Transport (agentlik)", "expense", "agency", "#fbbf24"],
  ["Boshqa (agentlik)", "expense", "agency", "#94a3b8"],
  // Shaxsiy — kirim
  ["Agentlikdan foyda", "income", "personal", "#4ade80"],
  ["Boshqa daromad", "income", "personal", "#22c55e"],
  // Shaxsiy — chiqim
  ["Oziq-ovqat", "expense", "personal", "#fb923c"],
  ["Kafe va restoran", "expense", "personal", "#f97316"],
  ["Transport / taksi / benzin", "expense", "personal", "#facc15"],
  ["Uy-joy va kommunal", "expense", "personal", "#38bdf8"],
  ["Aloqa va internet", "expense", "personal", "#22d3ee"],
  ["Kiyim-kechak", "expense", "personal", "#e879f9"],
  ["Sog'liq", "expense", "personal", "#f87171"],
  ["Ta'lim", "expense", "personal", "#a3e635"],
  ["Ko'ngilochar", "expense", "personal", "#c084fc"],
  ["Oila va sovg'alar", "expense", "personal", "#fda4af"],
  ["Boshqa (shaxsiy)", "expense", "personal", "#94a3b8"],
];

const uid = () => crypto.randomBytes(6).toString("hex");

function emptyDb() {
  return {
    settings: { currency: "UZS", ownerName: "" },
    categories: DEFAULT_CATEGORIES.map(([name, type, scope, color]) => ({
      id: uid(),
      name,
      type,
      scope,
      color,
    })),
    transactions: [],
    projects: [],
    employees: [],
    workLogs: [],
  };
}

let cache = null;

// --- Saqlash joyi: DATABASE_URL bo'lsa Postgres (Render/Neon), aks holda JSON fayl ---
let pg = null; // { pool, chain }

async function init({ pool } = {}) {
  const url = process.env.DATABASE_URL;
  if (!pool && !url) return load();
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
      max: 3,
    });
  }
  await pool.query("CREATE TABLE IF NOT EXISTS glass_finance (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())");
  const r = await pool.query("SELECT data FROM glass_finance WHERE id = 'main'");
  pg = { pool, chain: Promise.resolve() };
  if (r.rows.length) {
    cache = typeof r.rows[0].data === "string" ? JSON.parse(r.rows[0].data) : r.rows[0].data;
  } else {
    cache = emptyDb();
    save();
  }
  await flush();
  return cache;
}

function load() {
  if (cache) return cache;
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    cache = emptyDb();
    save();
  } else {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return cache;
}

function save() {
  if (pg) {
    // Yozuvlar ketma-ket bajariladi; navbatda bir nechta bo'lsa ham har biri eng so'nggi holatni yozadi
    const json = JSON.stringify(cache);
    pg.chain = pg.chain
      .then(() =>
        pg.pool.query(
          "INSERT INTO glass_finance (id, data, updated_at) VALUES ('main', $1, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
          [json]
        )
      )
      .catch((e) => console.error("Bazaga yozib bo'lmadi:", e.message));
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

// Navbatdagi barcha yozuvlar tugashini kutish
const flush = () => (pg ? pg.chain : Promise.resolve());

function reset(data) {
  cache = data || emptyDb();
  save();
}

module.exports = { init, load, save, flush, reset, uid, emptyDb, storage: () => (pg ? "postgres" : "file") };

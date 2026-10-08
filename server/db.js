// Oddiy JSON-fayl ma'lumotlar bazasi (atomik yozish bilan).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { AsyncLocalStorage } = require("async_hooks");

const DATA_DIR = process.env.DATA_DIR || (typeof __dirname !== "undefined" ? path.join(__dirname, "..", "data") : "./data");
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

// Bo'limlar (biznes yoki shaxsiy) — foydalanuvchi o'zi qo'shadi/olib tashlaydi
const DEFAULT_SCOPES = [
  { id: "agency", name: "Agentlik", kind: "business" },
  { id: "personal", name: "Shaxsiy", kind: "personal" },
];

function emptyDb() {
  return {
    settings: { currency: "UZS", ownerName: "" },
    scopes: DEFAULT_SCOPES.map((x) => ({ ...x })),
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

// Eski/yangi ma'lumotni bir xil shaklga keltirish
function normalize(data) {
  const d = { ...emptyDb(), ...data };
  if (!Array.isArray(d.scopes) || !d.scopes.length) d.scopes = DEFAULT_SCOPES.map((x) => ({ ...x }));
  d.scopes = d.scopes.map((x) => ({ kind: x.id === "personal" ? "personal" : "business", ...x }));
  return d;
}

// --- Saqlash joyi ---
// Har bir foydalanuvchining ma'lumoti alohida qator (id: "main" — egasi, "u_<login>" — boshqalar).
// * storeFactory(rowId) berilsa — o'sha ishlatiladi (masalan Supabase Edge Function'dagi REST)
// * DATABASE_URL yoki pool berilsa — Postgres (Supabase/Neon)
// * aks holda — JSON fayllar
// store = { name, load(): Promise<data|null>, save(json): Promise<void> }
// Har so'rov o'z kontekstida (AsyncLocalStorage) ishlaydi, shuning uchun foydalanuvchilar aralashmaydi.
let storeFactory = null;
const ctxs = new Map();
const als = new AsyncLocalStorage();
const rowOf = (userId) => (userId === "main" ? "main" : "u_" + userId);
function ctxFor(userId) {
  let c = ctxs.get(userId);
  if (!c) ctxs.set(userId, (c = { userId, rowId: rowOf(userId), cache: null, chain: Promise.resolve(), inflight: 0, loading: null }));
  return c;
}
const cur = () => als.getStore() || ctxFor("main");

function pgStore(pool, rowId = "main") {
  return {
    name: "postgres",
    async setup() {
      await pool.query("CREATE TABLE IF NOT EXISTS glass_finance (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())");
      // Supabase: jadval REST API orqali ochilib qolmasin (siyosatsiz RLS = faqat server ulanishi o'qiy oladi)
      await pool.query("ALTER TABLE glass_finance ENABLE ROW LEVEL SECURITY");
      // Supabase bepul loyihalari 7 kun faolsiz qolsa pauza qilinadi — kuniga bir marta bazaga murojaat
      setInterval(() => pool.query("SELECT 1").catch(() => {}), 24 * 3600 * 1000).unref?.();
    },
    async load() {
      const r = await pool.query("SELECT data FROM glass_finance WHERE id = $1", [rowId]);
      if (!r.rows.length) return null;
      return typeof r.rows[0].data === "string" ? JSON.parse(r.rows[0].data) : r.rows[0].data;
    },
    save: (json) =>
      pool.query(
        "INSERT INTO glass_finance (id, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
        [rowId, json]
      ),
  };
}

function configure({ storeFactory: f }) {
  storeFactory = f;
}

async function init({ pool, store, storeFactory: f } = {}) {
  const url = process.env.DATABASE_URL;
  if (f) storeFactory = f;
  else if (store) storeFactory = () => store;
  else if (pool || url) {
    if (!pool) {
      const { Pool } = require("./deps").get("pg");
      pool = new Pool({
        connectionString: url,
        ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
        max: 3,
      });
    }
    await pgStore(pool).setup();
    storeFactory = (rowId) => pgStore(pool, rowId);
  }
  if (!storeFactory) return load();
  const c = ctxFor("main");
  await loadCtx(c);
  await c.chain;
  return c.cache;
}

async function loadCtx(c) {
  const store = storeFactory(c.rowId);
  const data = await store.load();
  if (data) c.cache = normalize(data);
  else {
    c.cache = emptyDb();
    saveCtx(c);
  }
}

// Foydalanuvchi qatori bormi (yaratmasdan tekshirish)
async function exists(userId) {
  if (storeFactory) return !!(await storeFactory(rowOf(userId)).load());
  return fs.existsSync(fileFor(ctxFor(userId)));
}

// fn ni foydalanuvchi ma'lumoti kontekstida bajaradi (kerak bo'lsa bazadan yangilab)
async function session(userId, fn) {
  const c = ctxFor(userId);
  c.inflight++;
  try {
    if (storeFactory) {
      // Bo'sh turgan izolyatda bazadan yangilanadi; parallel so'rovlar bitta yuklashni kutadi
      if (c.inflight === 1) c.loading = loadCtx(c);
      await c.loading;
    }
    return await als.run(c, fn);
  } finally {
    c.inflight--;
    await c.chain;
  }
}

const fileFor = (c) => (c.rowId === "main" ? DB_FILE : path.join(DATA_DIR, `db-${c.rowId.replace(/[^\w.-]/g, "_")}.json`));

function load() {
  const c = cur();
  if (c.cache) return c.cache;
  if (storeFactory) throw new Error("Baza yuklanmagan");
  const file = fileFor(c);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    c.cache = emptyDb();
    saveCtx(c);
  } else {
    c.cache = normalize(JSON.parse(fs.readFileSync(file, "utf8")));
  }
  return c.cache;
}

function saveCtx(c) {
  if (storeFactory) {
    // Yozuvlar ketma-ket bajariladi; har biri saqlash chaqirilgan paytdagi holatni yozadi
    const json = JSON.stringify(c.cache);
    const store = storeFactory(c.rowId);
    c.chain = c.chain.then(() => store.save(json)).catch((e) => console.error("Bazaga yozib bo'lmadi:", e.message));
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = fileFor(c);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(c.cache, null, 2));
  fs.renameSync(tmp, file);
}
const save = () => saveCtx(cur());

// Navbatdagi barcha yozuvlar tugashini kutish
const flush = () => cur().chain;

function reset(data) {
  const c = cur();
  c.cache = data ? normalize(data) : emptyDb();
  saveCtx(c);
}

module.exports = {
  init, configure, session, exists, load, save, flush, reset, uid, emptyDb,
  storage: () => (storeFactory ? storeFactory("main").name : "file"),
};

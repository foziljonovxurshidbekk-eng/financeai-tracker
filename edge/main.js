// Supabase Edge Function ilovasi (Deno).
// `npm run build:edge` buni server/ kodi bilan birga supabase/functions/glass/app.js ga yig'adi.
// Kirish nuqtasi (index.js) npm kutubxonalarini yuklab, start() ni chaqiradi.
//
//   https://<ref>.supabase.co/functions/v1/glass/api/...     — sayt API'si (parol: x-app-key)
//   https://<ref>.supabase.co/functions/v1/glass/telegram    — Telegram webhook
//   https://<ref>.supabase.co/functions/v1/glass/telegram/setup?key=<parol> — webhook'ni ulash
//
// Sozlamalar (GEMINI_API_KEY, BOT_TOKEN, APP_PASSWORD, ...) Edge Function secrets'dan
// yoki glass_finance jadvalidagi id='config' qatoridan olinadi (jadval faqat server kaliti bilan o'qiladi).
import deps from "../server/deps.js";
import db from "../server/db.js";
import api from "../server/api.js";
import bot from "../server/bot.js";

const FN = "glass";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
const CONFIG_KEYS = ["GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "AI_PROVIDER", "BOT_TOKEN", "APP_PASSWORD", "TELEGRAM_ALLOWED_IDS"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-app-key, authorization, apikey",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", ...headers } });

// --- Supabase REST orqali glass_finance jadvali ---
async function rest(method, query, body) {
  const headers = { apikey: SERVICE_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
  if (SERVICE_KEY?.startsWith("eyJ")) headers.Authorization = `Bearer ${SERVICE_KEY}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/glass_finance${query}`, { method, headers, body });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return method === "GET" ? res.json() : null;
}
const readRow = async (id) => (await rest("GET", `?id=eq.${id}&select=data`))[0]?.data ?? null;

const store = {
  name: "supabase",
  load: () => readRow("main"),
  save: (text) =>
    rest("POST", "?on_conflict=id", JSON.stringify([{ id: "main", data: JSON.parse(text), updated_at: new Date().toISOString() }])),
};

// --- Sozlamalar ---
let configAt = 0;
async function loadConfig() {
  if (Date.now() - configAt < 60_000) return;
  const cfg = (await readRow("config").catch(() => null)) || {};
  for (const k of CONFIG_KEYS) {
    const v = Deno.env.get(k) || cfg[k];
    if (v) process.env[k] = String(v);
    else delete process.env[k];
  }
  configAt = Date.now();
}

// Bir izolyatdagi parallel so'rovlar bitta keshdan foydalanadi; bo'sh paytda bazadan yangilanadi
let inflight = 0;
async function withData(fn) {
  if (inflight === 0) await db.init({ store });
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    await db.flush();
  }
}

// --- Telegram ---
let tg = null;
function getBot() {
  if (!process.env.BOT_TOKEN) return null;
  if (tg?.token !== process.env.BOT_TOKEN) {
    const apiRoot = Deno.env.get("TELEGRAM_API_ROOT"); // faqat sinov uchun
    tg = { token: process.env.BOT_TOKEN, bot: bot.startBot(apiRoot ? { telegram: { apiRoot } } : undefined) };
  }
  return tg.bot;
}
async function webhookSecret() {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("glass:" + process.env.BOT_TOKEN));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}
async function processUpdate(update) {
  const b = getBot();
  if (!b) return;
  b.botInfo ??= await b.telegram.getMe();
  await withData(() => b.handleUpdate(update));
}

// libs = { genai, Telegraf, Markup } — kirish faylida npm: orqali yuklanadi
export function start({ genai, Telegraf, Markup }) {
  deps.set("@google/genai", genai);
  deps.set("telegraf", { Telegraf, Markup });
  Deno.serve(handle);
}

async function handle(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname.replace(new RegExp(`^(/functions/v1)?/${FN}`), "") || "/";

  try {
    await loadConfig();

    if (path === "/" || path === "/health") return json({ ok: true, app: "Glass Finance API" });

    if (path.startsWith("/api/")) {
      let body;
      if (!["GET", "HEAD"].includes(req.method)) body = await req.json().catch(() => undefined);
      const r = await withData(() =>
        api.handle({
          method: req.method,
          path: path.slice(4),
          query: Object.fromEntries(url.searchParams),
          body,
          headers: Object.fromEntries(req.headers),
        })
      );
      return json(r.body, r.status, r.headers);
    }

    if (path === "/telegram" && req.method === "POST") {
      if (!process.env.BOT_TOKEN) return json({ error: "BOT_TOKEN yo'q" }, 503);
      if (req.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret())) return json({ error: "forbidden" }, 403);
      const update = await req.json();
      // Telegram'ga darhol javob qaytaramiz, AI ishlovi fonda davom etadi
      const work = processUpdate(update).catch((e) => console.error("Telegram:", e));
      if (globalThis.EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(work);
      else await work;
      return json({ ok: true });
    }

    if (path === "/telegram/setup") {
      if (!process.env.APP_PASSWORD || url.searchParams.get("key") !== process.env.APP_PASSWORD) return json({ error: "auth" }, 401);
      const b = getBot();
      if (!b) return json({ error: "BOT_TOKEN yo'q" }, 503);
      const hook = `${SUPABASE_URL}/functions/v1/${FN}/telegram`;
      await b.telegram.setWebhook(hook, {
        secret_token: await webhookSecret(),
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      });
      const me = await b.telegram.getMe();
      return json({ ok: true, bot: "@" + me.username, webhook: hook, info: await b.telegram.getWebhookInfo() });
    }

    return json({ error: "Topilmadi" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "Server xatosi" }, 500);
  }
}

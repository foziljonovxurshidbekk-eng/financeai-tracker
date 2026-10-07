// node --test test/
const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gf-"));
delete process.env.APP_PASSWORD;

const db = require("../server/db");
const { projectStats, employeeStats } = require("../server/finance");
const { fallbackParse } = require("../server/ai");

test("loyiha tannarxi va marjasi", () => {
  const d = db.emptyDb();
  const cat = d.categories.find((c) => c.type === "expense" && c.scope === "agency").id;
  const p = { id: "p1", name: "Test", budget: 10_000_000, items: [{ id: "i", name: "Reels", qty: 10, unitCost: 200_000, unitPrice: 500_000 }] };
  d.projects.push(p);
  d.transactions.push(
    { id: "1", type: "income", amount: 6_000_000, projectId: "p1", scope: "agency", date: "2026-01-01" },
    { id: "2", type: "expense", amount: 1_500_000, projectId: "p1", scope: "agency", date: "2026-01-02", categoryId: cat }
  );
  const s = projectStats(d, p);
  assert.equal(s.profit, 4_500_000);
  assert.equal(s.margin, 0.75);
  assert.equal(s.receivable, 4_000_000);
  assert.equal(s.plannedCost, 2_000_000);
  assert.equal(s.plannedPrice, 5_000_000);
  assert.equal(s.items[0].margin, 0.6);
});

test("dona va oylik xodim balansi", () => {
  const d = db.emptyDb();
  const piece = { id: "e1", name: "Dilshod", payType: "piece", rate: 250_000 };
  d.employees.push(piece);
  d.workLogs.push({ id: "w", employeeId: "e1", qty: 12, date: "2026-03-10" }, { id: "w2", employeeId: "e1", qty: 2, rate: 300_000, date: "2026-03-11" });
  d.transactions.push({ id: "t", type: "expense", amount: 2_000_000, employeeId: "e1", date: "2026-03-20" });
  const s = employeeStats(d, piece, "2026-03");
  assert.equal(s.monthAccrued, 12 * 250_000 + 2 * 300_000);
  assert.equal(s.balance, 3_600_000 - 2_000_000);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthly = { id: "e2", name: "Aziza", payType: "monthly", rate: 6_000_000, startDate: thisMonth + "-01" };
  assert.equal(employeeStats(d, monthly, thisMonth).monthAccrued, 6_000_000);
  assert.equal(employeeStats(d, monthly).accruedTotal, 6_000_000);
});

test("offline tahlilchi summalar va kategoriyalarni ajratadi", () => {
  const d = db.emptyDb();
  d.projects.push({ id: "p", name: "Oqtepa Lavash SMM", client: "Oqtepa" });
  const r = fallbackParse(d, "tushlikka 85 ming, Oqtepa reklamaga 2 mln, kecha taksiga 40 ming");
  assert.deepEqual(r.map((x) => x.amount), [85_000, 2_000_000, 40_000]);
  assert.equal(r[1].scope, "agency");
  assert.equal(r[1].projectId, "p");
  assert.equal(d.categories.find((c) => c.id === r[2].categoryId).name, "Transport / taksi / benzin");
});

test("Claude chat: tool orqali tranzaksiya qo'shadi (soxta API)", async () => {
  const calls = [];
  const fake = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = JSON.parse(body);
      calls.push({ url: req.url, headers: req.headers, json });
      const base = { id: "msg_" + calls.length, type: "message", role: "assistant", model: json.model, usage: { input_tokens: 1, output_tokens: 1 } };
      const out = calls.length === 1
        ? { ...base, stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu1", name: "add_transactions", input: { transactions: [{ type: "expense", amount: 200000, scope: "personal", category: "Transport / taksi / benzin", date: "2026-10-06", note: "benzin", project: "", employee: "" }] } }] }
        : { ...base, stop_reason: "end_turn", content: [{ type: "text", text: "Qo'shildi: benzin 200 000 so'm" }] };
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(out));
    });
  }).listen(0);
  process.env.ANTHROPIC_API_KEY = "test";
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fake.address().port}`;

  const app = require("../server/index");
  const srv = app.listen(0);
  const url = `http://127.0.0.1:${srv.address().port}/api`;
  try {
    const r = await fetch(url + "/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "benzinga 200 ming ketdi" }] }) }).then((r) => r.json());
    assert.equal(r.changed, true);
    assert.match(r.reply, /benzin/);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].json.model, "claude-opus-5-5");
    assert.equal(calls[0].json.fallbacks, "default");
    assert.match(calls[0].headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
    assert.equal(calls[1].json.messages.at(-1).content[0].type, "tool_result");
    const state = await fetch(url + "/state").then((r) => r.json());
    assert.equal(state.transactions.length, 1);
    assert.equal(state.transactions[0].amount, 200000);
  } finally {
    srv.closeAllConnections();
    srv.close();
    fake.closeAllConnections();
    fake.close();
  }
});

test("Telegram bot: savol va operatsiyani ajratadi, hisobot tuzadi", () => {
  const { isQuestion, monthReport } = require("../server/bot");
  assert.equal(isQuestion("tushlikka 85 ming"), false);
  assert.equal(isQuestion("Oqtepa reklamaga 2 mln"), false);
  assert.equal(isQuestion("? bu oy 2 mln dan ko'p nima ketdi"), true);
  assert.equal(isQuestion("qaysi loyiha eng foydali"), true);
  assert.equal(isQuestion("bu oy qancha ishladik"), true);
  const d = db.emptyDb();
  d.transactions.push({ id: "x", type: "expense", scope: "personal", amount: 85000, date: new Date().toISOString().slice(0, 10), categoryId: d.categories[15].id });
  assert.match(monthReport(d), /85 000 so'm/);
});

test("Telegram bot: xabar -> tasdiqlash -> saqlash (soxta Telegram API)", async () => {
  const sent = [];
  const tg = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const method = req.url.split("/").pop();
      sent.push({ method, body: body ? JSON.parse(body) : {} });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, result: method === "sendMessage" ? { message_id: 1, date: 0, chat: { id: 7, type: "private" }, text: "" } : true }));
    });
  }).listen(0);
  process.env.BOT_TOKEN = "123:abc";
  process.env.TELEGRAM_ALLOWED_IDS = "7";
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY; // offline tahlil
  const { startBot } = require("../server/bot");
  const bot = startBot({ telegram: { apiRoot: `http://127.0.0.1:${tg.address().port}` } });
  bot.botInfo = { id: 1, is_bot: true, first_name: "b", username: "b" };
  const from = { id: 7, is_bot: false, first_name: "U" };
  const chat = { id: 7, type: "private" };
  try {
    db.reset();
    await bot.handleUpdate({ update_id: 1, message: { message_id: 1, date: 0, from: { id: 99, is_bot: false, first_name: "X" }, chat: { id: 99, type: "private" }, text: "taksi 40 ming" } });
    assert.match(sent.at(-1).body.text, /Ruxsat yo'q/);

    await bot.handleUpdate({ update_id: 2, message: { message_id: 2, date: 0, from, chat, text: "taksiga 40 ming" } });
    const msg = sent.filter((s) => s.method === "sendMessage").at(-1).body;
    assert.match(msg.text, /40 000 so'm/);
    const data = msg.reply_markup.inline_keyboard[0][0].callback_data;
    assert.match(data, /^save:/);

    await bot.handleUpdate({ update_id: 3, callback_query: { id: "c", from, chat_instance: "x", data, message: { message_id: 1, date: 0, chat, text: "" } } });
    assert.equal(db.load().transactions.length, 1);
    assert.equal(db.load().transactions[0].source, "telegram");
    assert.ok(sent.some((s) => s.method === "editMessageText"));
  } finally {
    tg.closeAllConnections();
    tg.close();
    if (saved) process.env.ANTHROPIC_API_KEY = saved;
  }
});

test("Postgres rejimi: bazadan o'qiydi va yozadi (soxta pool)", async () => {
  const rows = new Map();
  const pool = {
    async query(sql, params) {
      if (/^SELECT/.test(sql)) return { rows: rows.has("main") ? [{ data: JSON.parse(rows.get("main")) }] : [] };
      if (/^INSERT/.test(sql)) rows.set("main", params[0]);
      return { rows: [] };
    },
  };
  const dbPg = require("../server/db");
  await dbPg.init({ pool });
  assert.equal(dbPg.storage(), "postgres");
  assert.ok(rows.has("main"), "bo'sh baza yaratildi");
  dbPg.load().transactions.push({ id: "pg1", type: "income", amount: 1, scope: "agency", date: "2026-01-01" });
  dbPg.save();
  await dbPg.flush();
  assert.equal(JSON.parse(rows.get("main")).transactions.at(-1).id, "pg1");
});

test("Gemini: tahlil (JSON) va chat (function calling), model 404 bo'lsa zaxira model (soxta API)", async () => {
  const calls = [];
  let step = 0;
  const fake = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = JSON.parse(body || "{}");
      calls.push({ url: req.url, json });
      res.setHeader("content-type", "application/json");
      if (req.url.includes("gemini-flash-latest")) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: { code: 404, message: "not found", status: "NOT_FOUND" } }));
      }
      step++;
      const cand = (parts) => JSON.stringify({ candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }] });
      if (json.generationConfig?.responseMimeType === "application/json") {
        return res.end(cand([{ text: JSON.stringify({ transactions: [{ type: "expense", amount: 85000, scope: "personal", category: "Kafe va restoran", date: "2026-10-07", note: "tushlik", project: "", employee: "" }] }) }]));
      }
      if (!json.contents.some((c) => c.parts.some((p) => p.functionResponse))) {
        return res.end(cand([{ functionCall: { name: "add_transactions", args: { transactions: [{ type: "expense", amount: 200000, scope: "personal", category: "Transport / taksi / benzin", date: "2026-10-07", note: "benzin", project: "", employee: "" }] } } }]));
      }
      return res.end(cand([{ text: "Qo'shildi: benzin 200 000 so'm" }]));
    });
  }).listen(0);
  process.env.GEMINI_API_KEY = "g-test";
  process.env.GEMINI_BASE_URL = `http://127.0.0.1:${fake.address().port}`;
  const ai = require("../server/ai");
  try {
    assert.equal(ai.provider(), "gemini");
    const d = db.emptyDb();
    const parsed = await ai.parseTransactions(d, "tushlikka 85 ming", "");
    assert.equal(parsed.engine, "gemini");
    assert.equal(parsed.drafts[0].amount, 85000);
    assert.equal(d.categories.find((c) => c.id === parsed.drafts[0].categoryId).name, "Kafe va restoran");
    const schemaSent = calls.find((c) => c.json.generationConfig?.responseJsonSchema).json.generationConfig.responseJsonSchema;
    assert.ok(!JSON.stringify(schemaSent).includes("additionalProperties"));
    assert.ok(calls.some((c) => c.url.includes("gemini-3.6-flash")), "zaxira modelga o'tdi");

    let saved = 0;
    const r = await ai.chat(d, [{ role: "user", content: "benzinga 200 ming ketdi" }], { uid: () => "x" + saved, save: () => saved++ });
    assert.equal(r.changed, true);
    assert.match(r.reply, /benzin/);
    assert.equal(d.transactions.at(-1).amount, 200000);
    const last = calls.at(-1).json;
    assert.ok(last.contents.at(-1).parts[0].functionResponse.response.result.added === 1);
    assert.ok(last.systemInstruction, "system prompt yuborildi");
  } finally {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_BASE_URL;
    fake.closeAllConnections();
    fake.close();
  }
});

test("aralash (oylik + dona) xodim: ikkalasi qo'shilib hisoblanadi", () => {
  const { employeeStats } = require("../server/finance");
  const d = db.emptyDb();
  const month = new Date().toISOString().slice(0, 7);
  const e = { id: "m1", name: "Kamola", payType: "mixed", rate: 3_000_000, pieceRate: 150_000, startDate: month + "-01" };
  d.workLogs.push({ id: "w", employeeId: "m1", qty: 10, date: month + "-05" });
  d.transactions.push({ id: "t", type: "expense", amount: 2_000_000, employeeId: "m1", date: month + "-06" });
  const s = employeeStats(d, e, month);
  assert.equal(s.monthAccrued, 3_000_000 + 10 * 150_000);
  assert.equal(s.salaryTotal, 3_000_000);
  assert.equal(s.pieceTotal, 1_500_000);
  assert.equal(s.balance, 4_500_000 - 2_000_000);
  // oylik xodimning dona ishlari hisobga kirmaydi
  const monthly = { id: "m1", payType: "monthly", rate: 3_000_000, startDate: month + "-01" };
  assert.equal(employeeStats(d, monthly, month).monthAccrued, 3_000_000);
});

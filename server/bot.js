// Telegram bot: sayt bilan bitta bazada ishlaydi.
// Matn yuborsangiz — AI operatsiyalarni ajratadi va tasdiqlash tugmalarini chiqaradi.
// Savol bersangiz — AI (Gemini yoki Claude) moliyaviy maslahatchi sifatida javob beradi.
const deps = require("./deps");
const db = require("./db");
const ai = require("./ai");
const { dashboard, employeeStats, projectStats } = require("./finance");

const money = (n) => Math.round(n || 0).toLocaleString("ru-RU").replace(/[\s,]/g, " ") + " so'm";
const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1).replace(".0", "") + "%" : "—");
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const scopeName = { agency: "Agentlik", personal: "Shaxsiy" };

// Matnda summa bo'lsa — bu operatsiya; "?" bilan boshlansa yoki savol so'zlari bo'lsa — chat.
function isQuestion(text) {
  if (/^[?？]/.test(text.trim())) return true;
  if (!/\d/.test(text)) return true;
  return /\?\s*$|qancha\b.*\?|qaysi|nega|tahlil|maslahat|hisobot|сколько|какой|почему/i.test(text);
}

function draftLine(d, data) {
  const cat = data.categories.find((c) => c.id === d.categoryId)?.name || "Kategoriyasiz";
  const proj = data.projects.find((p) => p.id === d.projectId)?.name;
  const emp = data.employees.find((e) => e.id === d.employeeId)?.name;
  return (
    `${d.type === "income" ? "🟢 +" : "🔴 −"}<b>${money(d.amount)}</b> · ${scopeName[d.scope]}\n` +
    `   ${esc(cat)} · ${d.date}${proj ? ` · 📁 ${esc(proj)}` : ""}${emp ? ` · 👤 ${esc(emp)}` : ""}\n` +
    `   <i>${esc(d.note)}</i>`
  );
}

function monthReport(data) {
  const month = new Date().toISOString().slice(0, 7);
  const d = dashboard(data, { from: month + "-01", to: month + "-31" });
  const top = d.categories.filter((c) => c.type === "expense").slice(0, 5);
  const debt = data.employees
    .filter((e) => e.active !== false)
    .map((e) => ({ e, s: employeeStats(data, e, month) }))
    .filter((x) => x.s.balance > 0);
  const projects = data.projects
    .filter((p) => p.status !== "done")
    .map((p) => ({ p, s: projectStats(data, p) }));
  return [
    `📊 <b>Bu oy (${month})</b>`,
    ``,
    `🟢 Kirim: <b>${money(d.income)}</b>`,
    `🔴 Chiqim: <b>${money(d.expense)}</b>`,
    `💰 Sof foyda: <b>${money(d.net)}</b> (${pct(d.savingsRate)})`,
    ``,
    `🏢 Agentlik: ${money(d.byScope.agency.net)}`,
    `🏠 Shaxsiy: ${money(d.byScope.personal.net)}`,
    top.length ? `\n<b>Eng katta chiqimlar:</b>\n` + top.map((c) => `• ${esc(c.name)} — ${money(c.total)}`).join("\n") : "",
    projects.length ? `\n<b>Faol loyihalar:</b>\n` + projects.map(({ p, s }) => `• ${esc(p.name)}: foyda ${money(s.profit)}, marja ${pct(s.margin)}`).join("\n") : "",
    debt.length ? `\n<b>Xodimlarga qarz:</b>\n` + debt.map(({ e, s }) => `• ${esc(e.name)} — ${money(s.balance)}`).join("\n") : "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function startBot({ telegram } = {}) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;
  const { Telegraf, Markup } = deps.get("telegraf");
  const allowedEnv = () =>
    String(process.env.TELEGRAM_ALLOWED_IDS || "")
      .split(/[,\s]+/)
      .filter(Boolean);

  const bot = new Telegraf(token, telegram ? { telegram } : {});

  // Bot holati bazada saqlanadi (Supabase Edge'da har so'rov alohida ishga tushadi)
  const state = () => {
    const d = db.load();
    d._bot ??= {};
    d._bot.pending ??= {}; // id -> { drafts, userId, ts }
    d._bot.histories ??= {}; // userId -> chat messages
    d._bot.owners ??= []; // birinchi /start yozgan foydalanuvchi
    return d._bot;
  };
  const PENDING_TTL = 24 * 3600 * 1000;

  // Faqat ruxsat berilgan foydalanuvchilar. Ro'yxat bo'sh bo'lsa — birinchi yozgan odam egasi bo'ladi.
  bot.use(async (ctx, next) => {
    const id = String(ctx.from?.id || "");
    if (!id) return;
    const st = state();
    const allowed = [...allowedEnv(), ...st.owners];
    if (allowed.includes(id)) return next();
    if (!allowed.length) {
      st.owners.push(id);
      db.save();
      await ctx.reply("🔐 Siz bot egasi sifatida ro'yxatdan o'tdingiz. Endi bot faqat sizga javob beradi.");
      return next();
    }
    return ctx.reply(`⛔ Ruxsat yo'q. Sizning Telegram ID: <code>${id}</code>`, { parse_mode: "HTML" });
  });

  bot.start((ctx) =>
    ctx.reply(
      `Salom! Men <b>Glass Finance</b> botiman 💎\n\n` +
        `🎙 Ovozli xabar ham yuborishingiz mumkin.\n\n` +
        `<b>Operatsiya qo'shish</b> — oddiy yozing:\n<i>tushlikka 85 ming, Oqtepa reklamaga 2 mln, Dilshodga 3 mln berdim</i>\n\n` +
        `<b>Savol berish</b> — savol yozing yoki boshiga ? qo'ying:\n<i>? qaysi loyiha eng foydali</i>\n\n` +
        `/hisobot — bu oygi qisqa hisobot\n/yangi — suhbatni yangidan boshlash`,
      { parse_mode: "HTML" }
    )
  );

  bot.command("hisobot", (ctx) => ctx.reply(monthReport(db.load()), { parse_mode: "HTML" }));
  bot.command("yangi", (ctx) => {
    delete state().histories[ctx.from.id];
    db.save();
    return ctx.reply("Suhbat tozalandi ✓");
  });

  bot.on("voice", async (ctx) => {
    if (ai.provider() !== "gemini") {
      return ctx.reply(
        "🎙 Ovozli xabarni tushunish uchun serverda GEMINI_API_KEY kerak. Hozircha matn qilib yuboring (klaviaturadagi mikrofon tugmasi)."
      );
    }
    try {
      await ctx.sendChatAction("typing");
      const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
      const audio = Buffer.from(await (await fetch(link)).arrayBuffer());
      const text = await ai.transcribe(audio, ctx.message.voice.mime_type || "audio/ogg");
      if (!text) return ctx.reply("Ovozni tushunolmadim, qaytadan yuboring.");
      await ctx.reply(`🎙 «${text}»`);
      return handleText(ctx, text);
    } catch (e) {
      console.error(e);
      return ctx.reply("⚠️ Ovozni o'qib bo'lmadi: " + e.message);
    }
  });

  bot.on("text", (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;
    return handleText(ctx, text);
  });

  async function handleText(ctx, text) {
    await ctx.sendChatAction("typing");
    const data = db.load();
    try {
      if (isQuestion(text)) {
        const history = state().histories[ctx.from.id] || [];
        history.push({ role: "user", content: text.replace(/^[?？]\s*/, "") });
        const r = await ai.chat(data, history, { uid: db.uid, save: db.save });
        history.push({ role: "assistant", content: r.reply });
        state().histories[ctx.from.id] = history.slice(-20);
        db.save();
        return ctx.reply(r.reply.slice(0, 4000));
      }

      const { drafts, engine } = await ai.parseTransactions(data, text, "");
      const valid = drafts.filter((d) => d.amount > 0);
      if (!valid.length) return ctx.reply("Summani topa olmadim. Masalan: «taksiga 40 ming».");
      const id = db.uid();
      const st = state();
      for (const [k, v] of Object.entries(st.pending)) if (Date.now() - v.ts > PENDING_TTL) delete st.pending[k];
      st.pending[id] = { drafts: valid, userId: ctx.from.id, ts: Date.now() };
      db.save();
      return ctx.reply(
        `${engine !== "offline" ? "✦ AI aniqladi" : "Aniqlandi (offline)"}:\n\n` +
          valid.map((d) => draftLine(d, data)).join("\n\n"),
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            Markup.button.callback(`✅ Saqlash (${valid.length})`, `save:${id}`),
            Markup.button.callback("❌ Bekor", `cancel:${id}`),
          ]),
        }
      );
    } catch (e) {
      console.error(e);
      return ctx.reply("⚠️ Xatolik: " + e.message);
    }
  }

  bot.action(/^save:(.+)$/, async (ctx) => {
    const st = state();
    const p = st.pending[ctx.match[1]];
    if (!p || p.userId !== ctx.from.id) return ctx.answerCbQuery("Muddati o'tgan");
    delete st.pending[ctx.match[1]];
    const data = db.load();
    const now = new Date().toISOString();
    for (const d of p.drafts) data.transactions.push({ id: db.uid(), ...d, source: "telegram", createdAt: now });
    db.save();
    await ctx.answerCbQuery("Saqlandi ✓");
    return ctx.editMessageText(
      "✅ Saqlandi:\n\n" + p.drafts.map((d) => draftLine(d, data)).join("\n\n"),
      { parse_mode: "HTML" }
    );
  });

  bot.action(/^cancel:(.+)$/, async (ctx) => {
    delete state().pending[ctx.match[1]];
    db.save();
    await ctx.answerCbQuery("Bekor qilindi");
    return ctx.editMessageText("❌ Bekor qilindi");
  });

  bot.catch((err) => console.error("Telegram bot xatosi:", err));
  return bot;
}

// Webhook (Render kabi uxlab qoladigan hostinglar uchun) yoki polling rejimida ishga tushirish.
// Webhook'da Telegram xabarni saytga yuboradi va uxlab yotgan servis uyg'onadi.
async function runBot(app) {
  const bot = startBot();
  if (!bot) return null;
  const base = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
  try {
    if (base && app) {
      const domain = base.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const secret = require("crypto").createHash("sha256").update(process.env.BOT_TOKEN).digest("hex");
      app.use(await bot.createWebhook({ domain, path: `/telegram/${secret.slice(0, 32)}`, secret_token: secret.slice(32) }));
      console.log(`Telegram bot webhook rejimida: https://${domain}`);
    } else {
      bot.launch().catch((e) => console.error("Botni ishga tushirib bo'lmadi:", e.message));
      process.once("SIGINT", () => bot.stop("SIGINT"));
      process.once("SIGTERM", () => bot.stop("SIGTERM"));
      console.log("Telegram bot polling rejimida ishga tushdi");
    }
  } catch (e) {
    console.error("Telegram botni ulab bo'lmadi:", e.message);
  }
  return bot;
}

module.exports = { startBot, runBot, isQuestion, monthReport };

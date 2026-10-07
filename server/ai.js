// AI integratsiyasi: matn/ovozdan tranzaksiya ajratish va moliyaviy chat.
// Provayder: Google Gemini (GEMINI_API_KEY, bepul tarifi bor) yoki Anthropic Claude (ANTHROPIC_API_KEY).
const { projectStats, employeeStats, dashboard } = require("./finance");

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
// Rad etilgan (refusal) so'rovlar server tomonida avtomatik boshqa modelda qayta ishlanadi.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
// "gemini-flash-latest" — Google'ning eng so'nggi Flash modeli. Band (503) yoki topilmasa (404) keyingisiga o'tiladi.
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
];
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25000;
let geminiPreferred = null; // oxirgi muvaffaqiyatli model — keyingi so'rovda birinchi sinaladi

function provider() {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasClaude = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const want = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (want === "claude" && hasClaude) return "claude";
  if (want === "gemini" && hasGemini) return "gemini";
  return hasGemini ? "gemini" : hasClaude ? "claude" : null;
}

let claudeClient = null;
function claude() {
  const Anthropic = require("@anthropic-ai/sdk");
  claudeClient ??= new Anthropic();
  return claudeClient;
}

let geminiClient = null;
function gemini() {
  const { GoogleGenAI } = require("@google/genai");
  geminiClient ??= new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      timeout: GEMINI_TIMEOUT_MS,
      ...(process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}),
    },
  });
  return geminiClient;
}

// Model band, topilmadi yoki vaqtincha xato bo'lsa — keyingi modelga o'tadi
async function geminiGenerate(params) {
  let lastErr;
  for (const model of [...new Set([geminiPreferred, ...GEMINI_MODELS].filter(Boolean))]) {
    try {
      const res = await gemini().models.generateContent({ ...params, model });
      geminiPreferred = model;
      return res;
    } catch (e) {
      lastErr = e;
      // 400/401/403 — kalit yoki so'rov xatosi, boshqa model ham yordam bermaydi
      if ([400, 401, 403].includes(e?.status)) break;
      if (geminiPreferred === model) geminiPreferred = null;
      console.warn(`Gemini ${model}: ${e?.status || e?.name || "xato"}, keyingi model sinab ko'rilmoqda`);
    }
  }
  if (lastErr?.status === 429) throw new Error("Gemini limiti tugadi, birozdan keyin urinib ko'ring");
  if ([400, 401, 403].includes(lastErr?.status)) throw new Error("Gemini kaliti noto'g'ri yoki ruxsat yo'q (GEMINI_API_KEY ni tekshiring)");
  throw new Error("Gemini hozir javob bermayapti, bir daqiqadan keyin urinib ko'ring");
}

// Gemini JSON Schema'ning kichik to'plamini qabul qiladi — ortiqcha kalitlarni olib tashlaymiz
function geminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "additionalProperties" || k === "strict") continue;
    out[k] = geminiSchema(v);
  }
  return out;
}

const today = () => new Date().toISOString().slice(0, 10);

function textOf(response) {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// ---------------------------------------------------------------------------
// 1) Erkin matn (yoki ovozdan olingan matn) -> tranzaksiyalar qoralamasi
// ---------------------------------------------------------------------------
const PARSE_SYSTEM =
  "Sen marketing agentligi egasining moliyaviy yordamchisisan. Foydalanuvchi o'zbek, rus yoki aralash tilda " +
  "(ko'pincha ovozdan yozilgan, xatoli matn) kirim-chiqimlarini aytadi. Matndan barcha alohida tranzaksiyalarni ajrat.\n" +
  "Qoidalar:\n" +
  "- Summalarni so'mga aylantir: 'ming'/'k'/'тыс' = 1000, 'mln'/'million'/'миллион' = 1 000 000. Dollar aytilsa, note'da yoz va summani 12 800 kurs bilan so'mga aylantir.\n" +
  "- scope: agentlik ishi (mijoz, reklama, xodim, loyiha, ofis) = agency; shaxsiy xarajat (ovqat, uy, oila, taksi) = personal. Aniq bo'lmasa defaultScope'dan foydalan.\n" +
  "- category: faqat ro'yxatdagi nomlardan, type va scope'ga mos kelganini tanla.\n" +
  "- Sana: 'bugun' = today, 'kecha' = today-1 va h.k. Aytilmasa today.\n" +
  "- Xodimga to'lov bo'lsa employee maydoniga ro'yxatdagi ismni yoz, kategoriya ish haqi bo'lsin.\n" +
  "- Loyiha/mijoz nomi tilga olinsa, ro'yxatdagi eng mos loyiha nomini project'ga yoz.\n" +
  "- note: qisqa, tushunarli izoh.";

async function parseTransactions(db, text, defaultScope) {
  const ai = provider();
  if (!ai) return { drafts: fallbackParse(db, text, defaultScope), engine: "offline" };

  const categoryNames = db.categories.map((c) => c.name);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["transactions"],
    properties: {
      transactions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "amount", "scope", "category", "date", "note", "project", "employee"],
          properties: {
            type: { type: "string", enum: ["income", "expense"] },
            amount: { type: "number", description: "So'mda, to'liq son (50 ming = 50000)" },
            scope: { type: "string", enum: ["personal", "agency"] },
            category: { type: "string", enum: categoryNames },
            date: { type: "string", description: "YYYY-MM-DD" },
            note: { type: "string" },
            project: { type: "string", description: "Mavjud loyiha nomi yoki bo'sh" },
            employee: { type: "string", description: "Mavjud xodim ismi yoki bo'sh" },
          },
        },
      },
    },
  };

  const context = {
    today: today(),
    defaultScope: defaultScope || "aniqlanmagan",
    categories: db.categories.map((c) => `${c.name} [${c.type}, ${c.scope}]`),
    projects: db.projects.map((p) => p.name),
    employees: db.employees.map((e) => `${e.name} (${e.role || ""}, ${e.payType === "piece" ? "dona" : "oylik"})`),
  };
  const prompt = `Kontekst:\n${JSON.stringify(context, null, 1)}\n\nMatn:\n"""${text}"""`;

  let json;
  if (ai === "gemini") {
    const res = await geminiGenerate({
      contents: prompt,
      config: {
        systemInstruction: PARSE_SYSTEM,
        responseMimeType: "application/json",
        responseJsonSchema: geminiSchema(schema),
        temperature: 0.1,
      },
    });
    json = res.text;
  } else {
    const response = await claude().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      ...FALLBACK,
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error("AI so'rovni rad etdi");
    json = textOf(response);
  }

  const parsed = JSON.parse(json || "{}");
  const drafts = (parsed.transactions || []).map((t) => resolveDraft(db, t));
  return { drafts, engine: ai };
}

// Nomlarni ID'larga bog'lash
function resolveDraft(db, t) {
  const norm = (s) => String(s || "").toLowerCase().trim();
  const cat =
    db.categories.find((c) => c.name === t.category) ||
    db.categories.find((c) => c.type === t.type && c.scope === t.scope);
  const proj = t.project
    ? db.projects.find((p) => norm(p.name) === norm(t.project)) ||
      db.projects.find((p) => norm(p.name).includes(norm(t.project)) || norm(t.project).includes(norm(p.name)))
    : null;
  const emp = t.employee
    ? db.employees.find((e) => norm(e.name) === norm(t.employee)) ||
      db.employees.find((e) => norm(e.name).split(" ")[0] === norm(t.employee).split(" ")[0])
    : null;
  return {
    type: t.type,
    amount: Math.round(Number(t.amount) || 0),
    scope: t.scope,
    categoryId: cat?.id || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : today(),
    note: t.note || "",
    projectId: proj?.id || null,
    employeeId: emp?.id || null,
  };
}

// ---------------------------------------------------------------------------
// API kalitsiz ishlaydigan oddiy (offline) tahlilchi
// ---------------------------------------------------------------------------
const KEYWORDS = [
  [/reklama|target|meta|facebook|instagram|google ads|таргет|реклам/i, "Reklama byudjeti (Meta/Google)"],
  [/oylik|maosh|ish haqi|зарплат|оклад/i, "Ish haqi / oylik"],
  [/dona|frilans|freelanc|сдельн/i, "Dona ish haqi (frilans)"],
  [/obuna|canva|adobe|figma|chatgpt|claude|notion|подписк/i, "Dasturlar va obunalar"],
  [/ijara|аренд/i, "Ofis ijarasi"],
  [/syomka|s'yomka|video|foto|kontent|montaj|съёмк|съемк|контент/i, "Kontent ishlab chiqarish"],
  [/soliq|налог/i, "Soliq"],
  [/mijoz|klient|to'lov qildi|to'ladi|оплат|клиент/i, "Mijoz to'lovi"],
  [/avans|аванс|предоплат/i, "Avans / oldindan to'lov"],
  [/non|go'sht|bozor|market|magazin|oziq|продукт|магазин/i, "Oziq-ovqat"],
  [/kafe|restoran|osh|tushlik|kofe|кафе|ресторан|обед/i, "Kafe va restoran"],
  [/taksi|yandex|benzin|metan|propan|такси|бензин/i, "Transport / taksi / benzin"],
  [/kommunal|svet|gaz|suv|uy|квартир|коммунал/i, "Uy-joy va kommunal"],
  [/telefon|internet|paynet|связь|интернет/i, "Aloqa va internet"],
  [/kiyim|oyoq kiyim|одежд/i, "Kiyim-kechak"],
  [/dori|shifokor|apteka|аптек|врач/i, "Sog'liq"],
  [/kurs|kitob|o'qish|курс|книг/i, "Ta'lim"],
  [/kino|o'yin|dam olish|кино/i, "Ko'ngilochar"],
  [/sovg'a|to'y|oila|подар/i, "Oila va sovg'alar"],
];

function parseAmount(s) {
  const m = s.match(/(\d+(?:[.,\s]\d+)*)\s*(mln|million|миллион|млн|ming|minga|k|тыс|тысяч|so'm|sum|сум|\$)?/i);
  if (!m) return 0;
  let n = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
  const unit = (m[2] || "").toLowerCase();
  if (/mln|million|миллион|млн/.test(unit)) n *= 1e6;
  else if (/ming|k|тыс/.test(unit)) n *= 1e3;
  else if (unit === "$") n *= 12800;
  return Math.round(n);
}

function fallbackParse(db, text, defaultScope) {
  const parts = text
    .split(/[\n;]|,(?!\d)|\bva\b|\bи\b/i)
    .map((s) => s.trim())
    .filter((s) => /\d/.test(s));
  return parts.map((part) => {
    const isIncome = /kirim|tushdi|oldim|to'ladi|to'lov qildi|keldi|avans|получил|приход|поступ/i.test(part);
    const type = isIncome ? "income" : "expense";
    let catName = KEYWORDS.find(([re]) => re.test(part))?.[1];
    let cat = db.categories.find((c) => c.name === catName && c.type === type);
    const agencyHint = /mijoz|reklama|loyiha|xodim|ofis|klient|target|kontent|syomka/i.test(part);
    const scope = cat?.scope || (agencyHint ? "agency" : defaultScope || "personal");
    cat ||= db.categories.find((c) => c.type === type && c.scope === scope);
    const lower = part.toLowerCase();
    const words = (s) => String(s || "").toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    const proj =
      db.projects.find((p) => lower.includes(p.name.toLowerCase())) ||
      db.projects.find((p) => [...words(p.name), ...words(p.client)].some((w) => lower.includes(w)));
    const emp = db.employees.find((e) => lower.includes(e.name.toLowerCase().split(" ")[0]));
    let date = today();
    if (/kecha|вчера/i.test(part)) date = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    return {
      type,
      amount: parseAmount(part),
      scope,
      categoryId: cat?.id || null,
      date,
      note: part,
      projectId: proj?.id || null,
      employeeId: emp?.id || null,
    };
  });
}

// ---------------------------------------------------------------------------
// 2) Moliyaviy chat — Claude barcha ma'lumotlarni ko'radi va tool'lar orqali ishlaydi
// ---------------------------------------------------------------------------
const CHAT_SYSTEM =
  "Sen 'Glass Finance' ilovasidagi moliyaviy maslahatchi va buxgaltersan. Foydalanuvchi — marketing agentligi egasi. " +
  "U shaxsiy va agentlik kirim-chiqimlarini, loyihalar tannarxi va marjasini, xodimlar oyliklarini (oylik yoki dona bo'yicha) shu ilovada yuritadi.\n" +
  "- Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (odatda o'zbekcha).\n" +
  "- Raqamlarni so'mda, minglarni bo'sh joy bilan ajratib yoz (masalan 12 500 000 so'm).\n" +
  "- Tahlil qilganda aniq raqamlar, foizlar, marja va tavsiyalar ber. Qisqa va lo'nda bo'l, kerak bo'lsa ro'yxat/jadval ishlat.\n" +
  "- Batafsil ma'lumot kerak bo'lsa query_transactions tool'idan foydalan.\n" +
  "- Foydalanuvchi yangi kirim/chiqim qo'shishni so'rasa, add_transactions tool'ini chaqir va nima qo'shilganini aytib ber.\n" +
  "- employees[].balance > 0 bo'lsa — agentlik shu xodimga qarz (unga to'lash kerak); < 0 bo'lsa — xodimga avans berilgan.\n" +
  "- Ma'lumotda yo'q narsani o'ylab topma.";

function snapshot(db) {
  const month = new Date().toISOString().slice(0, 7);
  const catName = (id) => db.categories.find((c) => c.id === id)?.name || "-";
  return {
    today: today(),
    currency: "UZS",
    overall: dashboard(db, {}),
    thisMonth: dashboard(db, { from: month + "-01", to: month + "-31" }),
    categories: db.categories.map((c) => ({ name: c.name, type: c.type, scope: c.scope })),
    projects: db.projects.map((p) => {
      const s = projectStats(db, p);
      return {
        name: p.name,
        client: p.client,
        status: p.status,
        contract: s.contract,
        revenue: s.revenue,
        cost: s.cost,
        profit: s.profit,
        marginPct: +(s.margin * 100).toFixed(1),
        plannedCost: s.plannedCost,
        plannedPrice: s.plannedPrice,
        plannedMarginPct: +(s.plannedMargin * 100).toFixed(1),
        receivable: s.receivable,
        costByCategory: s.byCategory,
        items: s.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          unitCost: i.unitCost,
          unitPrice: i.unitPrice,
          marginPct: +(i.margin * 100).toFixed(1),
        })),
      };
    }),
    employees: db.employees.map((e) => ({
      name: e.name,
      role: e.role,
      payType: e.payType === "piece" ? "dona" : "oylik",
      rate: e.rate,
      unit: e.unitName,
      active: e.active !== false,
      ...employeeStats(db, e, month),
    })),
    recentTransactions: db.transactions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 150)
      .map((t) => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        scope: t.scope,
        category: catName(t.categoryId),
        note: t.note,
        project: db.projects.find((p) => p.id === t.projectId)?.name,
        employee: db.employees.find((e) => e.id === t.employeeId)?.name,
      })),
  };
}

const CHAT_TOOLS = (db) => [
  {
    name: "query_transactions",
    description:
      "Tranzaksiyalarni filtr bo'yicha qidiradi va jami summalarni qaytaradi. Bo'sh qatorlar filtr qo'llanmasligini bildiradi.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["from", "to", "type", "scope", "category", "project", "employee", "text"],
      properties: {
        from: { type: "string", description: "YYYY-MM-DD yoki bo'sh" },
        to: { type: "string", description: "YYYY-MM-DD yoki bo'sh" },
        type: { type: "string", enum: ["", "income", "expense"] },
        scope: { type: "string", enum: ["", "personal", "agency"] },
        category: { type: "string" },
        project: { type: "string" },
        employee: { type: "string" },
        text: { type: "string", description: "Izoh ichidan qidirish" },
      },
    },
  },
  {
    name: "add_transactions",
    description: "Foydalanuvchi so'raganda yangi kirim/chiqimlarni bazaga qo'shadi.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["transactions"],
      properties: {
        transactions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "amount", "scope", "category", "date", "note", "project", "employee"],
            properties: {
              type: { type: "string", enum: ["income", "expense"] },
              amount: { type: "number" },
              scope: { type: "string", enum: ["personal", "agency"] },
              category: { type: "string", enum: db.categories.map((c) => c.name) },
              date: { type: "string" },
              note: { type: "string" },
              project: { type: "string" },
              employee: { type: "string" },
            },
          },
        },
      },
    },
  },
];

function runTool(db, name, input, uid, save) {
  const lc = (s) => String(s || "").toLowerCase();
  if (name === "query_transactions") {
    const rows = db.transactions.filter((t) => {
      const cat = db.categories.find((c) => c.id === t.categoryId)?.name || "";
      const proj = db.projects.find((p) => p.id === t.projectId)?.name || "";
      const emp = db.employees.find((e) => e.id === t.employeeId)?.name || "";
      return (
        (!input.from || t.date >= input.from) &&
        (!input.to || t.date <= input.to) &&
        (!input.type || t.type === input.type) &&
        (!input.scope || t.scope === input.scope) &&
        (!input.category || lc(cat).includes(lc(input.category))) &&
        (!input.project || lc(proj).includes(lc(input.project))) &&
        (!input.employee || lc(emp).includes(lc(input.employee))) &&
        (!input.text || lc(t.note).includes(lc(input.text)))
      );
    });
    const total = (type) => rows.filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount), 0);
    return {
      count: rows.length,
      incomeTotal: total("income"),
      expenseTotal: total("expense"),
      rows: rows.slice(0, 300).map((t) => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        scope: t.scope,
        category: db.categories.find((c) => c.id === t.categoryId)?.name,
        note: t.note,
      })),
    };
  }
  if (name === "add_transactions") {
    const added = input.transactions.map((t) => {
      const tx = { id: uid(), ...resolveDraft(db, t), source: "ai-chat", createdAt: new Date().toISOString() };
      db.transactions.push(tx);
      return tx;
    });
    save();
    return { added: added.length, ids: added.map((t) => t.id) };
  }
  return { error: "Noma'lum tool" };
}

async function chat(db, history, opts) {
  const ai = provider();
  if (!ai) {
    return {
      reply:
        "AI chat ishlashi uchun serverda GEMINI_API_KEY (bepul, aistudio.google.com) yoki ANTHROPIC_API_KEY o'rnatilishi kerak.",
      changed: false,
    };
  }
  const msgs = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: String(m.content) }));
  // Joriy ma'lumotlar holati — oxirgi foydalanuvchi xabaridan oldin kontekst sifatida.
  const context = "<moliyaviy_malumotlar>\n" + JSON.stringify(snapshot(db)) + "\n</moliyaviy_malumotlar>";
  return ai === "gemini" ? chatGemini(db, msgs, context, opts) : chatClaude(db, msgs, context, opts);
}

async function chatGemini(db, msgs, context, { uid, save }) {
  const last = msgs.pop();
  const contents = msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  contents.push({ role: "user", parts: [{ text: context }, { text: last.content }] });
  const tools = [
    {
      functionDeclarations: CHAT_TOOLS(db).map((t) => ({
        name: t.name,
        description: t.description,
        parametersJsonSchema: geminiSchema(t.input_schema),
      })),
    },
  ];

  let changed = false;
  for (let i = 0; i < 8; i++) {
    const res = await geminiGenerate({ contents, config: { systemInstruction: CHAT_SYSTEM, tools } });
    const calls = res.functionCalls || [];
    if (!calls.length) return { reply: (res.text || "").trim() || "Javob olinmadi, savolni boshqacha yozib ko'ring.", changed };

    contents.push(res.candidates[0].content);
    contents.push({
      role: "user",
      parts: calls.map((c) => {
        let response;
        try {
          response = { result: runTool(db, c.name, c.args || {}, uid, save) };
          if (c.name === "add_transactions") changed = true;
        } catch (e) {
          response = { error: String(e.message) };
        }
        return { functionResponse: { ...(c.id ? { id: c.id } : {}), name: c.name, response } };
      }),
    });
  }
  return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed };
}

async function chatClaude(db, msgs, context, { uid, save }) {
  const messages = msgs;
  const last = messages.pop();
  messages.push({
    role: "user",
    content: [
      { type: "text", text: context },
      { type: "text", text: last.content },
    ],
  });

  const tools = CHAT_TOOLS(db);
  let changed = false;
  for (let i = 0; i < 8; i++) {
    const response = await claude().beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: "medium" },
      system: CHAT_SYSTEM,
      tools,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { reply: "Kechirasiz, bu so'rovga javob bera olmayman.", changed };
    }
    if (response.stop_reason !== "tool_use") {
      return { reply: textOf(response) || "…", changed };
    }

    messages.push({ role: "assistant", content: response.content });
    const results = response.content
      .filter((b) => b.type === "tool_use")
      .map((b) => {
        let content;
        try {
          const out = runTool(db, b.name, b.input, uid, save);
          if (b.name === "add_transactions") changed = true;
          content = JSON.stringify(out);
        } catch (e) {
          return { type: "tool_result", tool_use_id: b.id, content: String(e.message), is_error: true };
        }
        return { type: "tool_result", tool_use_id: b.id, content };
      });
    messages.push({ role: "user", content: results });
  }
  return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed };
}

// Ovozli xabarni matnga aylantirish (faqat Gemini — audio qabul qiladi)
async function transcribe(buffer, mimeType = "audio/ogg") {
  if (provider() !== "gemini") return null;
  const res = await geminiGenerate({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: Buffer.from(buffer).toString("base64") } },
          { text: "Bu ovozli xabarni so'zma-so'z matnga aylantir (o'zbek, rus yoki aralash til bo'lishi mumkin). Raqamlarni raqam bilan yoz. Faqat matnni qaytar." },
        ],
      },
    ],
    config: { temperature: 0 },
  });
  return (res.text || "").trim();
}

const PROVIDER_NAMES = { gemini: "Gemini", claude: "Claude" };
module.exports = {
  parseTransactions,
  chat,
  provider,
  providerName: () => PROVIDER_NAMES[provider()] || null,
  hasKey: () => !!provider(),
  transcribe,
  fallbackParse,
};

// Avtomatik yaratilgan fayl — tahrirlamang. Manba: edge/main.js va server/. Qayta yig'ish: npm run build:edge
import { createRequire as __createRequire } from "node:module";
import __nodeProcess from "node:process";
import { Buffer } from "node:buffer";
const require = __createRequire(import.meta.url);
// process.env ni o'zgartirib bo'ladigan nusxa (sozlamalar bazadan yuklanadi)
const __env = { ...__nodeProcess.env };
const process = new Proxy(__nodeProcess, { get: (t, k) => (k === "env" ? __env : Reflect.get(t, k)) });
var pt = Object.create;
var ce = Object.defineProperty;
var mt = Object.getOwnPropertyDescriptor;
var ut = Object.getOwnPropertyNames;
var yt = Object.getPrototypeOf, gt = Object.prototype.hasOwnProperty;
var M = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, {
get: (t, a) => (typeof require < "u" ? require : t)[a]
}) : e)(function(e) {
if (typeof require < "u") return require.apply(this, arguments);
throw Error('Dynamic require of "' + e + '" is not supported');
});
var D = (e, t) => () => {
try {
return t || e((t = { exports: {} }).exports, t), t.exports;
} catch (a) {
throw t = 0, a;
}
};
var ft = (e, t, a, n) => {
if (t && typeof t == "object" || typeof t == "function")
for (let o of ut(t))
!gt.call(e, o) && o !== a && ce(e, o, { get: () => t[o], enumerable: !(n = mt(t, o)) || n.enumerable });
return e;
};
var $ = (e, t, a) => (a = e != null ? pt(yt(e)) : {}, ft(
// If the importer is in node compatibility mode or this is not an ESM
// file that has been converted to a CommonJS file using a Babel-
// compatible transform (i.e. "__esModule" has not been set), then set
// "default" to the CommonJS "module.exports" for node compatibility.
t || !e || !e.__esModule ? ce(a, "default", { value: e, enumerable: !0 }) : a,
e
));

// server/deps.js
var z = D((ia, de) => {
var le = {};
de.exports = {
get(e) {
return le[e] ??= M(e);
},
set(e, t) {
le[e] = t;
}
};
});

// server/db.js
var G = D((ra, ge) => {
var P = M("fs"), pe = M("path"), ht = M("crypto"), ee = process.env.DATA_DIR || (typeof __dirname < "u" ? pe.join(__dirname, "..", "data") : "./data"), K = pe.join(ee, "db.json"), bt = [
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
["Boshqa (shaxsiy)", "expense", "personal", "#94a3b8"]
], me = () => ht.randomBytes(6).toString("hex");
function C() {
return {
settings: { currency: "UZS", ownerName: "" },
categories: bt.map(([e, t, a, n]) => ({
id: me(),
name: e,
type: t,
scope: a,
color: n
})),
transactions: [],
projects: [],
employees: [],
workLogs: []
};
}
var j = null, w = null;
function kt(e) {
return {
name: "postgres",
async setup() {
await e.query("CREATE TABLE IF NOT EXISTS glass_finance (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())"), await e.query("ALTER TABLE glass_finance ENABLE ROW LEVEL SECURITY"), setInterval(() => e.query("SELECT 1").catch(() => {
}), 24 * 3600 * 1e3).unref?.();
},
async load() {
let t = await e.query("SELECT data FROM glass_finance WHERE id = 'main'");
return t.rows.length ? typeof t.rows[0].data == "string" ? JSON.parse(t.rows[0].data) : t.rows[0].data : null;
},
save: (t) => e.query(
"INSERT INTO glass_finance (id, data, updated_at) VALUES ('main', $1, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
[t]
)
};
}
async function vt({ pool: e, store: t } = {}) {
let a = process.env.DATABASE_URL;
if (!t && !e && !a) return ue();
if (!t) {
if (!e) {
let { Pool: o } = z().get("pg");
e = new o({
connectionString: a,
ssl: /localhost|127\.0\.0\.1/.test(a) ? !1 : { rejectUnauthorized: !1 },
max: 3
});
}
t = kt(e), await t.setup();
}
w = { store: t, chain: Promise.resolve() };
let n = await t.load();
return n ? j = { ...C(), ...n } : (j = C(), B()), await ye(), j;
}
function ue() {
return j || (P.existsSync(K) ? j = JSON.parse(P.readFileSync(K, "utf8")) : (P.mkdirSync(ee, { recursive: !0 }), j = C(), B()), j);
}
function B() {
if (w) {
let t = JSON.stringify(j);
w.chain = w.chain.then(() => w.store.save(t)).catch((a) => console.error("Bazaga yozib bo'lmadi:", a.message));
return;
}
P.mkdirSync(ee, { recursive: !0 });
let e = K + ".tmp";
P.writeFileSync(e, JSON.stringify(j, null, 2)), P.renameSync(e, K);
}
var ye = () => w ? w.chain : Promise.resolve();
function St(e) {
j = e || C(), B();
}
ge.exports = { init: vt, load: ue, save: B, flush: ye, reset: St, uid: me, emptyDb: C, storage: () => w ? w.store.name : "file" };
});

// server/finance.js
var Y = D((ca, ve) => {
var U = (e) => String(e).slice(0, 7);
function he(e, t, a) {
return !(t && e < t || a && e > a);
}
function be(e, t) {
let a = e.transactions.filter((s) => s.projectId === t.id), n = A(a.filter((s) => s.type === "income")), o = A(a.filter((s) => s.type === "expense")), r = (t.items || []).map((s) => {
let g = Number(s.qty) || 0, h = g * (Number(s.unitCost) || 0), p = g * (Number(s.unitPrice) || 0), f = p - h;
return {
...s,
costTotal: h,
priceTotal: p,
profit: f,
margin: p ? f / p : 0,
markup: h ? f / h : 0
};
}), i = r.reduce((s, g) => s + g.costTotal, 0), d = r.reduce((s, g) => s + g.priceTotal, 0), u = e.workLogs.filter((s) => s.projectId === t.id).reduce((s, g) => {
let h = e.employees.find((f) => f.id === g.employeeId), p = g.rate != null ? Number(g.rate) : Number(h?.rate) || 0;
return s + (Number(g.qty) || 0) * p;
}, 0), c = Number(t.budget) || d, y = n - o, m = {};
for (let s of a.filter((g) => g.type === "expense")) {
let h = e.categories.find((p) => p.id === s.categoryId)?.name || "Kategoriyasiz";
m[h] = (m[h] || 0) + Number(s.amount);
}
return {
revenue: n,
cost: o,
profit: y,
margin: n ? y / n : 0,
markup: o ? y / o : 0,
contract: c,
receivable: Math.max(0, c - n),
plannedCost: i,
plannedPrice: d,
plannedProfit: d - i,
plannedMargin: d ? (d - i) / d : 0,
accruedLabor: u,
budgetUsed: i ? o / i : 0,
items: r,
byCategory: m,
txCount: a.length
};
}
function It(e, t) {
let [a, n] = e.slice(0, 7).split("-").map(Number), [o, r] = t.slice(0, 7).split("-").map(Number);
return Math.max(0, (o - a) * 12 + (r - n) + 1);
}
function ke(e, t, a) {
let n = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), o = e.workLogs.filter((s) => s.employeeId === t.id), r = e.transactions.filter(
(s) => s.employeeId === t.id && s.type === "expense"
), i = (s) => (Number(s.qty) || 0) * (s.rate != null ? Number(s.rate) : Number(t.rate) || 0), d;
if (t.payType === "monthly") {
let s = t.startDate || n, g = t.active === !1 && t.endDate ? t.endDate : n;
d = It(s, g) * (Number(t.rate) || 0);
} else
d = o.reduce((s, g) => s + i(g), 0);
let u = A(r), c = 0, y = 0, m = 0;
if (a) {
if (t.payType === "monthly")
c = (!t.startDate || t.startDate.slice(0, 7) <= a) && Number(t.rate) || 0;
else {
let s = o.filter((g) => U(g.date) === a);
c = s.reduce((g, h) => g + i(h), 0), m = s.reduce((g, h) => g + (Number(h.qty) || 0), 0);
}
y = A(r.filter((s) => U(s.date) === a));
}
return {
accruedTotal: d,
paidTotal: u,
balance: d - u,
// + => xodimga qarzmiz, - => avans berilgan
monthAccrued: c,
monthPaid: y,
monthBalance: c - y,
monthUnits: m,
unitsTotal: o.reduce((s, g) => s + (Number(g.qty) || 0), 0),
paymentsCount: r.length
};
}
function A(e) {
return e.reduce((t, a) => t + (Number(a.amount) || 0), 0);
}
function Tt(e, { scope: t = "all", from: a, to: n } = {}) {
let o = e.transactions.filter(
(p) => (t === "all" || p.scope === t) && he(p.date, a, n)
), r = A(o.filter((p) => p.type === "income")), i = A(o.filter((p) => p.type === "expense")), d = {};
for (let p of o) {
let f = U(p.date);
d[f] ??= { month: f, income: 0, expense: 0 }, d[f][p.type] += Number(p.amount);
}
let u = Object.values(d).sort((p, f) => p.month.localeCompare(f.month)), c = {};
for (let p of o) {
let f = e.categories.find((k) => k.id === p.categoryId), l = p.categoryId || "none";
c[l] ??= {
id: l,
name: f?.name || "Kategoriyasiz",
color: f?.color || "#94a3b8",
type: p.type,
total: 0,
count: 0
}, c[l].total += Number(p.amount), c[l].count++;
}
let y = Object.values(c).sort((p, f) => f.total - p.total), m = {};
for (let p of o)
m[p.date] ??= { date: p.date, income: 0, expense: 0 }, m[p.date][p.type] += Number(p.amount);
let s = e.projects.map((p) => ({
id: p.id,
name: p.name,
status: p.status,
...jt(be(e, p), ["revenue", "cost", "profit", "margin", "receivable"])
})), g = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), h = e.employees.filter((p) => p.active !== !1).reduce(
(p, f) => {
let l = ke(e, f, g);
return p.accrued += l.monthAccrued, p.paid += l.monthPaid, p.debt += Math.max(0, l.balance), p;
},
{ accrued: 0, paid: 0, debt: 0 }
);
return {
income: r,
expense: i,
net: r - i,
savingsRate: r ? (r - i) / r : 0,
count: o.length,
monthly: u,
daily: Object.values(m).sort((p, f) => p.date.localeCompare(f.date)),
categories: y,
projects: s,
payroll: h,
byScope: {
agency: fe(e.transactions, "agency", a, n),
personal: fe(e.transactions, "personal", a, n)
}
};
}
function fe(e, t, a, n) {
let o = e.filter((d) => d.scope === t && he(d.date, a, n)), r = A(o.filter((d) => d.type === "income")), i = A(o.filter((d) => d.type === "expense"));
return { income: r, expense: i, net: r - i };
}
function jt(e, t) {
return Object.fromEntries(t.map((a) => [a, e[a]]));
}
ve.exports = { projectStats: be, employeeStats: ke, dashboard: Tt, monthKey: U };
});

// server/ai.js
var ae = D((la, Pe) => {
var { projectStats: Et, employeeStats: qt, dashboard: Se } = Y(), Ee = z(), qe = process.env.CLAUDE_MODEL || "claude-opus-5-5", _e = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, _t = [
process.env.GEMINI_MODEL || "gemini-flash-latest",
"gemini-3.6-flash",
"gemini-3-flash-preview",
"gemini-flash-lite-latest"
], wt = Number(process.env.GEMINI_TIMEOUT_MS) || 25e3, F = null;
function R() {
let e = !!process.env.GEMINI_API_KEY, t = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN), a = String(process.env.AI_PROVIDER || "").toLowerCase();
return a === "claude" && t ? "claude" : a === "gemini" && e || e ? "gemini" : t ? "claude" : null;
}
var Ie = null;
function we() {
let e = Ee.get("@anthropic-ai/sdk");
return Ie ??= new e(), Ie;
}
var Te = null;
function Ot() {
let { GoogleGenAI: e } = Ee.get("@google/genai");
return Te ??= new e({
apiKey: process.env.GEMINI_API_KEY,
httpOptions: {
timeout: wt,
...process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}
}
}), Te;
}
async function te(e) {
let t;
for (let a of [...new Set([F, ..._t].filter(Boolean))])
try {
let n = await Ot().models.generateContent({ ...e, model: a });
return F = a, n;
} catch (n) {
if (t = n, [400, 401, 403].includes(n?.status)) break;
F === a && (F = null), console.warn("Gemini ".concat(a, ": ").concat(n?.status || n?.name || "xato", ", keyingi model sinab ko'rilmoqda"));
}
throw t?.status === 429 ? new Error("Gemini limiti tugadi, birozdan keyin urinib ko'ring") : [400, 401, 403].includes(t?.status) ? new Error("Gemini kaliti noto'g'ri yoki ruxsat yo'q (GEMINI_API_KEY ni tekshiring)") : new Error("Gemini hozir javob bermayapti, bir daqiqadan keyin urinib ko'ring");
}
function H(e) {
if (Array.isArray(e)) return e.map(H);
if (!e || typeof e != "object") return e;
let t = {};
for (let [a, n] of Object.entries(e))
a === "additionalProperties" || a === "strict" || (t[a] = H(n));
return t;
}
var J = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function Oe(e) {
return e.content.filter((t) => t.type === "text").map((t) => t.text).join("\n").trim();
}
var je = "Sen marketing agentligi egasining moliyaviy yordamchisisan. Foydalanuvchi o'zbek, rus yoki aralash tilda (ko'pincha ovozdan yozilgan, xatoli matn) kirim-chiqimlarini aytadi. Matndan barcha alohida tranzaksiyalarni ajrat.\nQoidalar:\n- Summalarni so'mga aylantir: 'ming'/'k'/'\u0442\u044B\u0441' = 1000, 'mln'/'million'/'\u043C\u0438\u043B\u043B\u0438\u043E\u043D' = 1 000 000. Dollar aytilsa, note'da yoz va summani 12 800 kurs bilan so'mga aylantir.\n- scope: agentlik ishi (mijoz, reklama, xodim, loyiha, ofis) = agency; shaxsiy xarajat (ovqat, uy, oila, taksi) = personal. Aniq bo'lmasa defaultScope'dan foydalan.\n- category: faqat ro'yxatdagi nomlardan, type va scope'ga mos kelganini tanla.\n- Sana: 'bugun' = today, 'kecha' = today-1 va h.k. Aytilmasa today.\n- Xodimga to'lov bo'lsa employee maydoniga ro'yxatdagi ismni yoz, kategoriya ish haqi bo'lsin.\n- Loyiha/mijoz nomi tilga olinsa, ro'yxatdagi eng mos loyiha nomini project'ga yoz.\n- note: qisqa, tushunarli izoh.";
async function xt(e, t, a) {
let n = R();
if (!n) return { drafts: Ae(e, t, a), engine: "offline" };
let o = e.categories.map((m) => m.name), r = {
type: "object",
additionalProperties: !1,
required: ["transactions"],
properties: {
transactions: {
type: "array",
items: {
type: "object",
additionalProperties: !1,
required: ["type", "amount", "scope", "category", "date", "note", "project", "employee"],
properties: {
type: { type: "string", enum: ["income", "expense"] },
amount: { type: "number", description: "So'mda, to'liq son (50 ming = 50000)" },
scope: { type: "string", enum: ["personal", "agency"] },
category: { type: "string", enum: o },
date: { type: "string", description: "YYYY-MM-DD" },
note: { type: "string" },
project: { type: "string", description: "Mavjud loyiha nomi yoki bo'sh" },
employee: { type: "string", description: "Mavjud xodim ismi yoki bo'sh" }
}
}
}
}
}, i = {
today: J(),
defaultScope: a || "aniqlanmagan",
categories: e.categories.map((m) => "".concat(m.name, " [").concat(m.type, ", ").concat(m.scope, "]")),
projects: e.projects.map((m) => m.name),
employees: e.employees.map((m) => "".concat(m.name, " (").concat(m.role || "", ", ").concat(m.payType === "piece" ? "dona" : "oylik", ")"))
}, d = "Kontekst:\n".concat(JSON.stringify(i, null, 1), '\n\nMatn:\n"""').concat(t, '"""'), u;
if (n === "gemini")
u = (await te({
contents: d,
config: {
systemInstruction: je,
responseMimeType: "application/json",
responseJsonSchema: H(r),
temperature: 0.1
}
})).text;
else {
let m = await we().beta.messages.create({
model: qe,
max_tokens: 4e3,
..._e,
output_config: { effort: "low", format: { type: "json_schema", schema: r } },
system: je,
messages: [{ role: "user", content: d }]
});
if (m.stop_reason === "refusal") throw new Error("AI so'rovni rad etdi");
u = Oe(m);
}
return { drafts: (JSON.parse(u || "{}").transactions || []).map((m) => xe(e, m)), engine: n };
}
function xe(e, t) {
let a = (i) => String(i || "").toLowerCase().trim(), n = e.categories.find((i) => i.name === t.category) || e.categories.find((i) => i.type === t.type && i.scope === t.scope), o = t.project ? e.projects.find((i) => a(i.name) === a(t.project)) || e.projects.find((i) => a(i.name).includes(a(t.project)) || a(t.project).includes(a(i.name))) : null, r = t.employee ? e.employees.find((i) => a(i.name) === a(t.employee)) || e.employees.find((i) => a(i.name).split(" ")[0] === a(t.employee).split(" ")[0]) : null;
return {
type: t.type,
amount: Math.round(Number(t.amount) || 0),
scope: t.scope,
categoryId: n?.id || null,
date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : J(),
note: t.note || "",
projectId: o?.id || null,
employeeId: r?.id || null
};
}
var At = [
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
[/sovg'a|to'y|oila|подар/i, "Oila va sovg'alar"]
];
function Dt(e) {
let t = e.match(/(\d+(?:[.,\s]\d+)*)\s*(mln|million|миллион|млн|ming|minga|k|тыс|тысяч|so'm|sum|сум|\$)?/i);
if (!t) return 0;
let a = parseFloat(t[1].replace(/\s/g, "").replace(",", ".")), n = (t[2] || "").toLowerCase();
return /mln|million|миллион|млн/.test(n) ? a *= 1e6 : /ming|k|тыс/.test(n) ? a *= 1e3 : n === "$" && (a *= 12800), Math.round(a);
}
function Ae(e, t, a) {
return t.split(/[\n;]|,(?!\d)|\bva\b|\bи\b/i).map((o) => o.trim()).filter((o) => /\d/.test(o)).map((o) => {
let i = /kirim|tushdi|oldim|to'ladi|to'lov qildi|keldi|avans|получил|приход|поступ/i.test(o) ? "income" : "expense", d = At.find(([f]) => f.test(o))?.[1], u = e.categories.find((f) => f.name === d && f.type === i), c = /mijoz|reklama|loyiha|xodim|ofis|klient|target|kontent|syomka/i.test(o), y = u?.scope || (c ? "agency" : a || "personal");
u ||= e.categories.find((f) => f.type === i && f.scope === y);
let m = o.toLowerCase(), s = (f) => String(f || "").toLowerCase().split(/\s+/).filter((l) => l.length >= 4), g = e.projects.find((f) => m.includes(f.name.toLowerCase())) || e.projects.find((f) => [...s(f.name), ...s(f.client)].some((l) => m.includes(l))), h = e.employees.find((f) => m.includes(f.name.toLowerCase().split(" ")[0])), p = J();
return /kecha|вчера/i.test(o) && (p = new Date(Date.now() - 864e5).toISOString().slice(0, 10)), {
type: i,
amount: Dt(o),
scope: y,
categoryId: u?.id || null,
date: p,
note: o,
projectId: g?.id || null,
employeeId: h?.id || null
};
});
}
var De = "Sen 'Glass Finance' ilovasidagi moliyaviy maslahatchi va buxgaltersan. Foydalanuvchi \u2014 marketing agentligi egasi. U shaxsiy va agentlik kirim-chiqimlarini, loyihalar tannarxi va marjasini, xodimlar oyliklarini (oylik yoki dona bo'yicha) shu ilovada yuritadi.\n- Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (odatda o'zbekcha).\n- Raqamlarni so'mda, minglarni bo'sh joy bilan ajratib yoz (masalan 12 500 000 so'm).\n- Tahlil qilganda aniq raqamlar, foizlar, marja va tavsiyalar ber. Qisqa va lo'nda bo'l, kerak bo'lsa ro'yxat/jadval ishlat.\n- Batafsil ma'lumot kerak bo'lsa query_transactions tool'idan foydalan.\n- Foydalanuvchi yangi kirim/chiqim qo'shishni so'rasa, add_transactions tool'ini chaqir va nima qo'shilganini aytib ber.\n- employees[].balance > 0 bo'lsa \u2014 agentlik shu xodimga qarz (unga to'lash kerak); < 0 bo'lsa \u2014 xodimga avans berilgan.\n- Ma'lumotda yo'q narsani o'ylab topma.";
function Nt(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), a = (n) => e.categories.find((o) => o.id === n)?.name || "-";
return {
today: J(),
currency: "UZS",
overall: Se(e, {}),
thisMonth: Se(e, { from: t + "-01", to: t + "-31" }),
categories: e.categories.map((n) => ({ name: n.name, type: n.type, scope: n.scope })),
projects: e.projects.map((n) => {
let o = Et(e, n);
return {
name: n.name,
client: n.client,
status: n.status,
contract: o.contract,
revenue: o.revenue,
cost: o.cost,
profit: o.profit,
marginPct: +(o.margin * 100).toFixed(1),
plannedCost: o.plannedCost,
plannedPrice: o.plannedPrice,
plannedMarginPct: +(o.plannedMargin * 100).toFixed(1),
receivable: o.receivable,
costByCategory: o.byCategory,
items: o.items.map((r) => ({
name: r.name,
qty: r.qty,
unitCost: r.unitCost,
unitPrice: r.unitPrice,
marginPct: +(r.margin * 100).toFixed(1)
}))
};
}),
employees: e.employees.map((n) => ({
name: n.name,
role: n.role,
payType: n.payType === "piece" ? "dona" : "oylik",
rate: n.rate,
unit: n.unitName,
active: n.active !== !1,
...qt(e, n, t)
})),
recentTransactions: e.transactions.slice().sort((n, o) => o.date.localeCompare(n.date)).slice(0, 150).map((n) => ({
date: n.date,
type: n.type,
amount: n.amount,
scope: n.scope,
category: a(n.categoryId),
note: n.note,
project: e.projects.find((o) => o.id === n.projectId)?.name,
employee: e.employees.find((o) => o.id === n.employeeId)?.name
}))
};
}
var Ne = (e) => [
{
name: "query_transactions",
description: "Tranzaksiyalarni filtr bo'yicha qidiradi va jami summalarni qaytaradi. Bo'sh qatorlar filtr qo'llanmasligini bildiradi.",
strict: !0,
input_schema: {
type: "object",
additionalProperties: !1,
required: ["from", "to", "type", "scope", "category", "project", "employee", "text"],
properties: {
from: { type: "string", description: "YYYY-MM-DD yoki bo'sh" },
to: { type: "string", description: "YYYY-MM-DD yoki bo'sh" },
type: { type: "string", enum: ["", "income", "expense"] },
scope: { type: "string", enum: ["", "personal", "agency"] },
category: { type: "string" },
project: { type: "string" },
employee: { type: "string" },
text: { type: "string", description: "Izoh ichidan qidirish" }
}
}
},
{
name: "add_transactions",
description: "Foydalanuvchi so'raganda yangi kirim/chiqimlarni bazaga qo'shadi.",
strict: !0,
input_schema: {
type: "object",
additionalProperties: !1,
required: ["transactions"],
properties: {
transactions: {
type: "array",
items: {
type: "object",
additionalProperties: !1,
required: ["type", "amount", "scope", "category", "date", "note", "project", "employee"],
properties: {
type: { type: "string", enum: ["income", "expense"] },
amount: { type: "number" },
scope: { type: "string", enum: ["personal", "agency"] },
category: { type: "string", enum: e.categories.map((t) => t.name) },
date: { type: "string" },
note: { type: "string" },
project: { type: "string" },
employee: { type: "string" }
}
}
}
}
}
}
];
function Me(e, t, a, n, o) {
let r = (i) => String(i || "").toLowerCase();
if (t === "query_transactions") {
let i = e.transactions.filter((u) => {
let c = e.categories.find((s) => s.id === u.categoryId)?.name || "", y = e.projects.find((s) => s.id === u.projectId)?.name || "", m = e.employees.find((s) => s.id === u.employeeId)?.name || "";
return (!a.from || u.date >= a.from) && (!a.to || u.date <= a.to) && (!a.type || u.type === a.type) && (!a.scope || u.scope === a.scope) && (!a.category || r(c).includes(r(a.category))) && (!a.project || r(y).includes(r(a.project))) && (!a.employee || r(m).includes(r(a.employee))) && (!a.text || r(u.note).includes(r(a.text)));
}), d = (u) => i.filter((c) => c.type === u).reduce((c, y) => c + Number(y.amount), 0);
return {
count: i.length,
incomeTotal: d("income"),
expenseTotal: d("expense"),
rows: i.slice(0, 300).map((u) => ({
date: u.date,
type: u.type,
amount: u.amount,
scope: u.scope,
category: e.categories.find((c) => c.id === u.categoryId)?.name,
note: u.note
}))
};
}
if (t === "add_transactions") {
let i = a.transactions.map((d) => {
let u = { id: n(), ...xe(e, d), source: "ai-chat", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
return e.transactions.push(u), u;
});
return o(), { added: i.length, ids: i.map((d) => d.id) };
}
return { error: "Noma'lum tool" };
}
async function Mt(e, t, a) {
let n = R();
if (!n)
return {
reply: "AI chat ishlashi uchun serverda GEMINI_API_KEY (bepul, aistudio.google.com) yoki ANTHROPIC_API_KEY o'rnatilishi kerak.",
changed: !1
};
let o = t.filter((i) => i.role === "user" || i.role === "assistant").map((i) => ({ role: i.role, content: String(i.content) })), r = "<moliyaviy_malumotlar>\n" + JSON.stringify(Nt(e)) + "\n</moliyaviy_malumotlar>";
return n === "gemini" ? Pt(e, o, r, a) : Rt(e, o, r, a);
}
async function Pt(e, t, a, { uid: n, save: o }) {
let r = t.pop(), i = t.map((c) => ({ role: c.role === "assistant" ? "model" : "user", parts: [{ text: c.content }] }));
i.push({ role: "user", parts: [{ text: a }, { text: r.content }] });
let d = [
{
functionDeclarations: Ne(e).map((c) => ({
name: c.name,
description: c.description,
parametersJsonSchema: H(c.input_schema)
}))
}
], u = !1;
for (let c = 0; c < 8; c++) {
let y = await te({ contents: i, config: { systemInstruction: De, tools: d } }), m = y.functionCalls || [];
if (!m.length) return { reply: (y.text || "").trim() || "Javob olinmadi, savolni boshqacha yozib ko'ring.", changed: u };
i.push(y.candidates[0].content), i.push({
role: "user",
parts: m.map((s) => {
let g;
try {
g = { result: Me(e, s.name, s.args || {}, n, o) }, s.name === "add_transactions" && (u = !0);
} catch (h) {
g = { error: String(h.message) };
}
return { functionResponse: { ...s.id ? { id: s.id } : {}, name: s.name, response: g } };
})
});
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
async function Rt(e, t, a, { uid: n, save: o }) {
let r = t, i = r.pop();
r.push({
role: "user",
content: [
{ type: "text", text: a },
{ type: "text", text: i.content }
]
});
let d = Ne(e), u = !1;
for (let c = 0; c < 8; c++) {
let y = await we().beta.messages.create({
model: qe,
max_tokens: 16e3,
..._e,
output_config: { effort: "medium" },
system: De,
tools: d,
messages: r
});
if (y.stop_reason === "refusal")
return { reply: "Kechirasiz, bu so'rovga javob bera olmayman.", changed: u };
if (y.stop_reason !== "tool_use")
return { reply: Oe(y) || "\u2026", changed: u };
r.push({ role: "assistant", content: y.content });
let m = y.content.filter((s) => s.type === "tool_use").map((s) => {
let g;
try {
let h = Me(e, s.name, s.input, n, o);
s.name === "add_transactions" && (u = !0), g = JSON.stringify(h);
} catch (h) {
return { type: "tool_result", tool_use_id: s.id, content: String(h.message), is_error: !0 };
}
return { type: "tool_result", tool_use_id: s.id, content: g };
});
r.push({ role: "user", content: m });
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
async function Lt(e, t = "audio/ogg") {
return R() !== "gemini" ? null : ((await te({
contents: [
{
role: "user",
parts: [
{ inlineData: { mimeType: t, data: Buffer.from(e).toString("base64") } },
{ text: "Bu ovozli xabarni so'zma-so'z matnga aylantir (o'zbek, rus yoki aralash til bo'lishi mumkin). Raqamlarni raqam bilan yoz. Faqat matnni qaytar." }
]
}
],
config: { temperature: 0 }
})).text || "").trim();
}
var zt = { gemini: "Gemini", claude: "Claude" };
Pe.exports = {
parseTransactions: xt,
chat: Mt,
provider: R,
providerName: () => zt[R()] || null,
hasKey: () => !!R(),
transcribe: Lt,
fallbackParse: Ae
};
});

// server/demo.js
var Le = D((da, Re) => {
function Ct(e, t) {
let a = (l) => e.categories.find((k) => k.name === l).id, n = /* @__PURE__ */ new Date(), o = (l, k) => {
let q = new Date(Date.UTC(n.getFullYear(), n.getMonth() - l, Math.min(k, 28))).toISOString().slice(0, 10), x = n.toISOString().slice(0, 10);
return q > x ? x : q;
}, r = (l, k, E, q, x, L) => ({
id: t(),
name: l,
role: k,
payType: E,
rate: q,
unitName: x,
startDate: o(L, 1),
active: !0
}), i = [
r("Aziza Karimova", "SMM menejer", "monthly", 6e6, "", 5),
r("Jasur Toshmatov", "Targetolog", "monthly", 8e6, "", 5),
r("Dilshod Rahimov", "Mobilograf", "piece", 25e4, "reels", 5),
r("Madina Yusupova", "Dizayner", "piece", 8e4, "post dizayn", 5),
r("Sardor Aliyev", "Copywriter", "piece", 5e4, "matn", 3)
];
e.employees = i;
let d = (l, k, E, q, x, L) => ({
id: t(),
name: l,
client: k,
status: E,
budget: q,
startDate: o(x, 3),
items: L.map(([Q, Z, lt, dt]) => ({ id: t(), name: Q, qty: Z, unitCost: lt, unitPrice: dt }))
});
e.projects = [
d("Oqtepa Lavash SMM", "Oqtepa Lavash", "active", 12e7, 5, [
["Reels (oyiga 12 ta)", 12, 3e5, 9e5],
["Post dizayn", 20, 9e4, 35e4],
["Target boshqaruvi", 1, 4e6, 12e6],
["Kontent reja", 1, 5e5, 2e6]
]),
d("Texnomart kampaniya", "Texnomart", "active", 14e7, 3, [
["Reklama byudjeti", 1, 3e7, 33e6],
["Video \u0440\u043E\u043B\u0438\u043A", 4, 15e5, 4e6],
["Bannerlar", 30, 7e4, 25e4]
]),
d("Kafe Rayhon brending", "Rayhon", "done", 18e6, 4, [
["Logo va brandbook", 1, 3e6, 1e7],
["Menyu dizayn", 1, 8e5, 3e6],
["Fotosessiya", 1, 15e5, 5e6]
])
];
let [u, c, y] = e.projects, m = [], s = (l, k, E, q, x, L, Q, Z = {}) => m.push({
id: t(),
type: E,
scope: q,
amount: L,
date: o(l, k),
categoryId: a(x),
note: Q,
projectId: null,
employeeId: null,
source: "demo",
...Z
});
for (let l = 5; l >= 0; l--) {
let k = 1 + l * 37 % 11 / 30;
s(l, 5, "income", "agency", "Retainer (oylik xizmat)", 18e6, "Oqtepa \u2014 oylik to'lov", { projectId: u.id }), l <= 3 && s(l, 10, "income", "agency", "Mijoz to'lovi", 3e7, "Texnomart \u2014 bosqich to'lovi", { projectId: c.id }), l === 4 && s(l, 6, "income", "agency", "Avans / oldindan to'lov", 9e6, "Rayhon \u2014 avans 50%", { projectId: y.id }), l === 3 && s(l, 20, "income", "agency", "Mijoz to'lovi", 9e6, "Rayhon \u2014 yakuniy to'lov", { projectId: y.id }), s(l, 7, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(35e5 * k), "Oqtepa \u2014 Meta reklama", { projectId: u.id }), l <= 3 && s(l, 12, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(9e6 * k), "Texnomart \u2014 Google Ads", { projectId: c.id }), s(l, 1, "expense", "agency", "Ofis ijarasi", 5e6, "Ofis ijarasi"), s(l, 3, "expense", "agency", "Dasturlar va obunalar", 115e4, "Canva, Adobe, ChatGPT, Notion"), s(l, 15, "expense", "agency", "Transport (agentlik)", Math.round(4e5 * k), "Syomkaga taksi"), s(l, 25, "expense", "agency", "Soliq", 21e5, "Aylanma soliq"), l === 4 && s(l, 18, "expense", "agency", "Kontent ishlab chiqarish", 15e5, "Rayhon fotosessiya studiya", { projectId: y.id }), l === 2 && s(l, 9, "expense", "agency", "Uskunalar", 75e5, "Yangi mikrofon va svet");
for (let E of i.filter((q) => q.payType === "monthly"))
s(l, 28, "expense", "agency", "Ish haqi / oylik", E.rate, "".concat(E.name, " \u2014 oylik"), { employeeId: E.id });
s(l, 2, "income", "personal", "Agentlikdan foyda", 12e6, "Agentlikdan olingan foyda"), s(l, 4, "expense", "personal", "Uy-joy va kommunal", Math.round(18e5 * k), "Kvartira + kommunal"), s(l, 8, "expense", "personal", "Oziq-ovqat", Math.round(26e5 * k), "Bozor va market"), s(l, 11, "expense", "personal", "Kafe va restoran", Math.round(11e5 * k), "Kafelar"), s(l, 14, "expense", "personal", "Transport / taksi / benzin", Math.round(9e5 * k), "Benzin va taksi"), s(l, 16, "expense", "personal", "Aloqa va internet", 25e4, "Telefon va internet"), s(l, 22, "expense", "personal", "Ko'ngilochar", Math.round(5e5 * k), "Kino, dam olish"), l % 2 === 0 && s(l, 19, "expense", "personal", "Kiyim-kechak", Math.round(12e5 * k), "Kiyim"), l === 1 && s(l, 21, "expense", "personal", "Oila va sovg'alar", 2e6, "To'yga sovg'a");
}
let g = [], [, , h, p, f] = i;
for (let l = 4; l >= 0; l--)
g.push({ id: t(), employeeId: h.id, date: o(l, 10), qty: 12, projectId: u.id, note: "Oqtepa reels" }), g.push({ id: t(), employeeId: p.id, date: o(l, 12), qty: 20, projectId: u.id, note: "Oqtepa postlar" }), l <= 3 && g.push({ id: t(), employeeId: p.id, date: o(l, 14), qty: 8, projectId: c.id, note: "Texnomart bannerlar" }), l <= 2 && g.push({ id: t(), employeeId: f.id, date: o(l, 13), qty: 25, projectId: u.id, note: "Post matnlari" }), l >= 1 && (s(l, 27, "expense", "agency", "Dona ish haqi (frilans)", 12 * h.rate, "".concat(h.name, " \u2014 reels"), { employeeId: h.id, projectId: u.id }), s(l, 27, "expense", "agency", "Dona ish haqi (frilans)", 20 * p.rate, "".concat(p.name, " \u2014 postlar"), { employeeId: p.id, projectId: u.id }));
return e.workLogs = g, e.transactions = m, e;
}
Re.exports = { seedDemo: Ct };
});

// server/api.js
var Ue = D((pa, Ge) => {
var b = G(), W = ae(), { projectStats: $t, employeeStats: Kt, dashboard: Bt } = Y(), { seedDemo: Gt } = Le(), X = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), T = (e) => ({ status: 200, body: e }), I = (e, t) => ({ status: e, body: { error: t } }), $e = {
transactions: ["type", "amount", "scope", "categoryId", "date", "note", "projectId", "employeeId", "source"],
categories: ["name", "type", "scope", "color"],
projects: ["name", "client", "status", "budget", "startDate", "endDate", "items", "note"],
employees: ["name", "role", "payType", "rate", "unitName", "startDate", "endDate", "active", "phone", "note"],
workLogs: ["employeeId", "date", "qty", "rate", "projectId", "note"]
};
function ze(e, t) {
let a = {};
for (let n of $e[e]) t[n] !== void 0 && (a[n] = t[n]);
for (let n of ["amount", "budget", "rate", "qty"]) a[n] != null && a[n] !== "" && (a[n] = Number(a[n]));
for (let n of ["projectId", "employeeId", "categoryId"]) a[n] === "" && (a[n] = null);
return a.rate === "" && delete a.rate, a;
}
function Ce(e, t) {
if (e === "transactions") {
if (!["income", "expense"].includes(t.type)) return "Turi noto'g'ri";
if (!(t.amount > 0)) return "Summa 0 dan katta bo'lishi kerak";
if (!["personal", "agency"].includes(t.scope)) return "Bo'lim noto'g'ri";
}
return ["categories", "projects", "employees"].includes(e) && !String(t.name || "").trim() ? "Nomi kiritilmagan" : e === "workLogs" && (!t.employeeId || !(t.qty > 0)) ? "Xodim va miqdor kerak" : null;
}
function Ke(e) {
let { _bot: t, ...a } = e;
return a;
}
var Be = [], S = (e, t, a) => {
let n = [], o = new RegExp("^" + t.replace(/:(\w+)/g, (r, i) => (n.push(i), "([^/]+)")) + "/?$");
Be.push({ method: e, re: o, keys: n, fn: a });
};
S("POST", "/auth", (e) => {
let t = process.env.APP_PASSWORD;
return T({ ok: !t || e.body?.password === t, required: !!t });
});
S("GET", "/state", (e) => {
let t = b.load(), a = e.query.month || X().slice(0, 7);
return T({
...Ke(t),
aiEnabled: W.hasKey(),
aiProvider: W.providerName(),
projects: t.projects.map((n) => ({ ...n, stats: $t(t, n) })),
employees: t.employees.map((n) => ({ ...n, stats: Kt(t, n, a) }))
});
});
S("GET", "/dashboard", (e) => T(Bt(b.load(), e.query)));
for (let e of Object.keys($e))
S("POST", "/".concat(e), (t) => {
let a = b.load(), n = Array.isArray(t.body) ? t.body : [t.body || {}], o = [];
for (let r of n) {
let i = { id: b.uid(), ...ze(e, r), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
(e === "transactions" || e === "workLogs") && (i.date ||= X()), e === "projects" && (i.items ||= []);
let d = Ce(e, i);
if (d) return I(400, d);
o.push(i);
}
return a[e].push(...o), b.save(), T(Array.isArray(t.body) ? o : o[0]);
}), S("PUT", "/".concat(e, "/:id"), (t) => {
let n = b.load()[e].find((i) => i.id === t.params.id);
if (!n) return I(404, "Topilmadi");
let o = { ...n, ...ze(e, t.body || {}) }, r = Ce(e, o);
return r ? I(400, r) : (Object.assign(n, o), b.save(), T(n));
}), S("DELETE", "/".concat(e, "/:id"), (t) => {
let a = b.load(), n = a[e].findIndex((r) => r.id === t.params.id);
if (n < 0) return I(404, "Topilmadi");
let [o] = a[e].splice(n, 1);
return e === "categories" && a.transactions.forEach((r) => r.categoryId === o.id && (r.categoryId = null)), e === "projects" && (a.transactions.forEach((r) => r.projectId === o.id && (r.projectId = null)), a.workLogs.forEach((r) => r.projectId === o.id && (r.projectId = null))), e === "employees" && (a.transactions.forEach((r) => r.employeeId === o.id && (r.employeeId = null)), a.workLogs = a.workLogs.filter((r) => r.employeeId !== o.id)), b.save(), T({ ok: !0 });
});
S("POST", "/employees/:id/pay", (e) => {
let t = b.load(), a = t.employees.find((d) => d.id === e.params.id);
if (!a) return I(404, "Xodim topilmadi");
let n = Number(e.body?.amount);
if (!(n > 0)) return I(400, "Summa kiriting");
let o = a.payType === "piece" ? "Dona ish haqi (frilans)" : "Ish haqi / oylik", r = t.categories.find((d) => d.name === o) || t.categories.find((d) => d.type === "expense" && d.scope === "agency"), i = {
id: b.uid(),
type: "expense",
scope: "agency",
amount: n,
date: e.body.date || X(),
categoryId: r?.id || null,
employeeId: a.id,
projectId: e.body.projectId || null,
note: e.body.note || "".concat(a.name, " \u2014 to'lov"),
source: "payroll",
createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
return t.transactions.push(i), b.save(), T(i);
});
S("POST", "/ai/parse", async (e) => {
let t = String(e.body?.text || "").trim();
return t ? T(await W.parseTransactions(b.load(), t, e.body.scope)) : I(400, "Matn bo'sh");
});
S("POST", "/ai/chat", async (e) => {
let t = Array.isArray(e.body?.messages) ? e.body.messages.slice(-30) : [];
return !t.length || t.at(-1).role !== "user" ? I(400, "Xabar yo'q") : T(await W.chat(b.load(), t, { uid: b.uid, save: b.save }));
});
S("GET", "/export", () => ({
status: 200,
body: Ke(b.load()),
headers: { "Content-Disposition": 'attachment; filename="glass-finance-'.concat(X(), '.json"') }
}));
S("POST", "/import", (e) => {
let t = e.body;
return !t || !Array.isArray(t.transactions) || !Array.isArray(t.categories) ? I(400, "Fayl formati noto'g'ri") : (b.reset({ ...b.emptyDb(), ...t, _bot: b.load()._bot }), T({ ok: !0 }));
});
S("POST", "/demo", () => (b.reset({ ...Gt(b.emptyDb(), b.uid), _bot: b.load()._bot }), T({ ok: !0 })));
S("POST", "/reset", () => (b.reset({ ...b.emptyDb(), _bot: b.load()._bot }), T({ ok: !0 })));
async function Ut({ method: e, path: t, query: a = {}, body: n, headers: o = {} }) {
let r = (d) => o[d] ?? o[d.toLowerCase()], i = process.env.APP_PASSWORD;
if (i && t !== "/auth" && r("x-app-key") !== i) return I(401, "auth");
for (let d of Be) {
if (d.method !== e) continue;
let u = t.match(d.re);
if (!u) continue;
let c = Object.fromEntries(d.keys.map((y, m) => [y, decodeURIComponent(u[m + 1])]));
try {
return await d.fn({ params: c, query: a, body: n, headers: o });
} catch (y) {
return console.error(y), I(500, y.message || "Server xatosi");
}
}
return I(404, "Topilmadi");
}
Ge.exports = { handle: Ut };
});

// server/bot.js
var Ve = D((ma, Xe) => {
var Yt = z(), v = G(), V = ae(), { dashboard: Ft, employeeStats: Ht, projectStats: Jt } = Y(), O = (e) => Math.round(e || 0).toLocaleString("ru-RU").replace(/[\s,]/g, " ") + " so'm", Ye = (e) => isFinite(e) ? (e * 100).toFixed(1).replace(".0", "") + "%" : "\u2014", N = (e) => String(e ?? "").replace(/[&<>]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[t]), Wt = { agency: "Agentlik", personal: "Shaxsiy" };
function He(e) {
return /^[?？]/.test(e.trim()) || !/\d/.test(e) ? !0 : /\?\s*$|qancha\b.*\?|qaysi|nega|tahlil|maslahat|hisobot|сколько|какой|почему/i.test(e);
}
function Fe(e, t) {
let a = t.categories.find((r) => r.id === e.categoryId)?.name || "Kategoriyasiz", n = t.projects.find((r) => r.id === e.projectId)?.name, o = t.employees.find((r) => r.id === e.employeeId)?.name;
return "".concat(e.type === "income" ? "\u{1F7E2} +" : "\u{1F534} \u2212", "<b>").concat(O(e.amount), "</b> \xB7 ").concat(Wt[e.scope], "\n") + "   ".concat(N(a), " \xB7 ").concat(e.date).concat(n ? " \xB7 \u{1F4C1} ".concat(N(n)) : "").concat(o ? " \xB7 \u{1F464} ".concat(N(o)) : "", "\n") + "   <i>".concat(N(e.note), "</i>");
}
function Je(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), a = Ft(e, { from: t + "-01", to: t + "-31" }), n = a.categories.filter((i) => i.type === "expense").slice(0, 5), o = e.employees.filter((i) => i.active !== !1).map((i) => ({ e: i, s: Ht(e, i, t) })).filter((i) => i.s.balance > 0), r = e.projects.filter((i) => i.status !== "done").map((i) => ({ p: i, s: Jt(e, i) }));
return [
"\u{1F4CA} <b>Bu oy (".concat(t, ")</b>"),
"",
"\u{1F7E2} Kirim: <b>".concat(O(a.income), "</b>"),
"\u{1F534} Chiqim: <b>".concat(O(a.expense), "</b>"),
"\u{1F4B0} Sof foyda: <b>".concat(O(a.net), "</b> (").concat(Ye(a.savingsRate), ")"),
"",
"\u{1F3E2} Agentlik: ".concat(O(a.byScope.agency.net)),
"\u{1F3E0} Shaxsiy: ".concat(O(a.byScope.personal.net)),
n.length ? "\n<b>Eng katta chiqimlar:</b>\n" + n.map((i) => "\u2022 ".concat(N(i.name), " \u2014 ").concat(O(i.total))).join("\n") : "",
r.length ? "\n<b>Faol loyihalar:</b>\n" + r.map(({ p: i, s: d }) => "\u2022 ".concat(N(i.name), ": foyda ").concat(O(d.profit), ", marja ").concat(Ye(d.margin))).join("\n") : "",
o.length ? "\n<b>Xodimlarga qarz:</b>\n" + o.map(({ e: i, s: d }) => "\u2022 ".concat(N(i.name), " \u2014 ").concat(O(d.balance))).join("\n") : ""
].filter((i) => i !== "").join("\n");
}
function We({ telegram: e } = {}) {
let t = process.env.BOT_TOKEN;
if (!t) return null;
let { Telegraf: a, Markup: n } = Yt.get("telegraf"), o = () => String(process.env.TELEGRAM_ALLOWED_IDS || "").split(/[,\s]+/).filter(Boolean), r = new a(t, e ? { telegram: e } : {}), i = () => {
let c = v.load();
return c._bot ??= {}, c._bot.pending ??= {}, c._bot.histories ??= {}, c._bot.owners ??= [], c._bot;
}, d = 24 * 3600 * 1e3;
r.use(async (c, y) => {
let m = String(c.from?.id || "");
if (!m) return;
let s = i(), g = [...o(), ...s.owners];
return g.includes(m) ? y() : g.length ? c.reply("\u26D4 Ruxsat yo'q. Sizning Telegram ID: <code>".concat(m, "</code>"), { parse_mode: "HTML" }) : (s.owners.push(m), v.save(), await c.reply("\u{1F510} Siz bot egasi sifatida ro'yxatdan o'tdingiz. Endi bot faqat sizga javob beradi."), y());
}), r.start(
(c) => c.reply(
"Salom! Men <b>Glass Finance</b> botiman \u{1F48E}\n\n\u{1F399} Ovozli xabar ham yuborishingiz mumkin.\n\n<b>Operatsiya qo'shish</b> \u2014 oddiy yozing:\n<i>tushlikka 85 ming, Oqtepa reklamaga 2 mln, Dilshodga 3 mln berdim</i>\n\n<b>Savol berish</b> \u2014 savol yozing yoki boshiga ? qo'ying:\n<i>? qaysi loyiha eng foydali</i>\n\n/hisobot \u2014 bu oygi qisqa hisobot\n/yangi \u2014 suhbatni yangidan boshlash",
{ parse_mode: "HTML" }
)
), r.command("hisobot", (c) => c.reply(Je(v.load()), { parse_mode: "HTML" })), r.command("yangi", (c) => (delete i().histories[c.from.id], v.save(), c.reply("Suhbat tozalandi \u2713"))), r.on("voice", async (c) => {
if (V.provider() !== "gemini")
return c.reply(
"\u{1F399} Ovozli xabarni tushunish uchun serverda GEMINI_API_KEY kerak. Hozircha matn qilib yuboring (klaviaturadagi mikrofon tugmasi)."
);
try {
await c.sendChatAction("typing");
let y = await c.telegram.getFileLink(c.message.voice.file_id), m = Buffer.from(await (await fetch(y)).arrayBuffer()), s = await V.transcribe(m, c.message.voice.mime_type || "audio/ogg");
return s ? (await c.reply("\u{1F399} \xAB".concat(s, "\xBB")), u(c, s)) : c.reply("Ovozni tushunolmadim, qaytadan yuboring.");
} catch (y) {
return console.error(y), c.reply("\u26A0\uFE0F Ovozni o'qib bo'lmadi: " + y.message);
}
}), r.on("text", (c) => {
let y = c.message.text.trim();
if (!y.startsWith("/"))
return u(c, y);
});
async function u(c, y) {
await c.sendChatAction("typing");
let m = v.load();
try {
if (He(y)) {
let l = i().histories[c.from.id] || [];
l.push({ role: "user", content: y.replace(/^[?？]\s*/, "") });
let k = await V.chat(m, l, { uid: v.uid, save: v.save });
return l.push({ role: "assistant", content: k.reply }), i().histories[c.from.id] = l.slice(-20), v.save(), c.reply(k.reply.slice(0, 4e3));
}
let { drafts: s, engine: g } = await V.parseTransactions(m, y, ""), h = s.filter((l) => l.amount > 0);
if (!h.length) return c.reply("Summani topa olmadim. Masalan: \xABtaksiga 40 ming\xBB.");
let p = v.uid(), f = i();
for (let [l, k] of Object.entries(f.pending)) Date.now() - k.ts > d && delete f.pending[l];
return f.pending[p] = { drafts: h, userId: c.from.id, ts: Date.now() }, v.save(), c.reply(
"".concat(g !== "offline" ? "\u2726 AI aniqladi" : "Aniqlandi (offline)", ":\n\n") + h.map((l) => Fe(l, m)).join("\n\n"),
{
parse_mode: "HTML",
...n.inlineKeyboard([
n.button.callback("\u2705 Saqlash (".concat(h.length, ")"), "save:".concat(p)),
n.button.callback("\u274C Bekor", "cancel:".concat(p))
])
}
);
} catch (s) {
return console.error(s), c.reply("\u26A0\uFE0F Xatolik: " + s.message);
}
}
return r.action(/^save:(.+)$/, async (c) => {
let y = i(), m = y.pending[c.match[1]];
if (!m || m.userId !== c.from.id) return c.answerCbQuery("Muddati o'tgan");
delete y.pending[c.match[1]];
let s = v.load(), g = (/* @__PURE__ */ new Date()).toISOString();
for (let h of m.drafts) s.transactions.push({ id: v.uid(), ...h, source: "telegram", createdAt: g });
return v.save(), await c.answerCbQuery("Saqlandi \u2713"), c.editMessageText(
"\u2705 Saqlandi:\n\n" + m.drafts.map((h) => Fe(h, s)).join("\n\n"),
{ parse_mode: "HTML" }
);
}), r.action(/^cancel:(.+)$/, async (c) => (delete i().pending[c.match[1]], v.save(), await c.answerCbQuery("Bekor qilindi"), c.editMessageText("\u274C Bekor qilindi"))), r.catch((c) => console.error("Telegram bot xatosi:", c)), r;
}
async function Xt(e) {
let t = We();
if (!t) return null;
let a = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
try {
if (a && e) {
let n = a.replace(/^https?:\/\//, "").replace(/\/+$/, ""), o = M("crypto").createHash("sha256").update(process.env.BOT_TOKEN).digest("hex");
e.use(await t.createWebhook({ domain: n, path: "/telegram/".concat(o.slice(0, 32)), secret_token: o.slice(32) })), console.log("Telegram bot webhook rejimida: https://".concat(n));
} else
t.launch().catch((n) => console.error("Botni ishga tushirib bo'lmadi:", n.message)), process.once("SIGINT", () => t.stop("SIGINT")), process.once("SIGTERM", () => t.stop("SIGTERM")), console.log("Telegram bot polling rejimida ishga tushdi");
} catch (n) {
console.error("Telegram botni ulab bo'lmadi:", n.message);
}
return t;
}
Xe.exports = { startBot: We, runBot: Xt, isQuestion: He, monthReport: Je };
});

// edge/main.js
var re = $(z()), se = $(G()), tt = $(Ue()), at = $(Ve());
import * as Vt from "npm:@google/genai@2.27.0";
import { Telegraf as Qt, Markup as Zt } from "npm:telegraf@4.16.3";
re.default.set("@google/genai", Vt);
re.default.set("telegraf", { Telegraf: Qt, Markup: Zt });
var Qe = "glass", nt = Deno.env.get("SUPABASE_URL"), ne = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default, ea = ["GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "AI_PROVIDER", "BOT_TOKEN", "APP_PASSWORD", "TELEGRAM_ALLOWED_IDS"], ot = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "content-type, x-app-key, authorization, apikey",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
}, _ = (e, t = 200, a = {}) => new Response(JSON.stringify(e), { status: t, headers: { ...ot, "Content-Type": "application/json", ...a } });
async function it(e, t, a) {
let n = { apikey: ne, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
ne?.startsWith("eyJ") && (n.Authorization = "Bearer ".concat(ne));
let o = await fetch("".concat(nt, "/rest/v1/glass_finance").concat(t), { method: e, headers: n, body: a });
if (!o.ok) throw new Error("Supabase ".concat(o.status, ": ").concat((await o.text()).slice(0, 200)));
return e === "GET" ? o.json() : null;
}
var st = async (e) => (await it("GET", "?id=eq.".concat(e, "&select=data")))[0]?.data ?? null, ta = {
name: "supabase",
load: () => st("main"),
save: (e) => it("POST", "?on_conflict=id", JSON.stringify([{ id: "main", data: JSON.parse(e), updated_at: (/* @__PURE__ */ new Date()).toISOString() }]))
}, Ze = 0;
async function aa() {
if (Date.now() - Ze < 6e4) return;
let e = await st("config").catch(() => null) || {};
for (let t of ea) {
let a = Deno.env.get(t) || e[t];
a ? process.env[t] = String(a) : delete process.env[t];
}
Ze = Date.now();
}
var oe = 0;
async function rt(e) {
oe === 0 && await se.default.init({ store: ta }), oe++;
try {
return await e();
} finally {
oe--, await se.default.flush();
}
}
var ie = null;
function ct() {
if (!process.env.BOT_TOKEN) return null;
if (ie?.token !== process.env.BOT_TOKEN) {
let e = Deno.env.get("TELEGRAM_API_ROOT");
ie = { token: process.env.BOT_TOKEN, bot: at.default.startBot(e ? { telegram: { apiRoot: e } } : void 0) };
}
return ie.bot;
}
async function et() {
let e = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("glass:" + process.env.BOT_TOKEN));
return [...new Uint8Array(e)].map((t) => t.toString(16).padStart(2, "0")).join("").slice(0, 48);
}
async function na(e) {
let t = ct();
t && (t.botInfo ??= await t.telegram.getMe(), await rt(() => t.handleUpdate(e)));
}
Deno.serve(async (e) => {
if (e.method === "OPTIONS") return new Response(null, { status: 204, headers: ot });
let t = new URL(e.url), a = t.pathname.replace(new RegExp("^(/functions/v1)?/".concat(Qe)), "") || "/";
try {
if (await aa(), a === "/" || a === "/health") return _({ ok: !0, app: "Glass Finance API" });
if (a.startsWith("/api/")) {
let n;
["GET", "HEAD"].includes(e.method) || (n = await e.json().catch(() => {
}));
let o = await rt(
() => tt.default.handle({
method: e.method,
path: a.slice(4),
query: Object.fromEntries(t.searchParams),
body: n,
headers: Object.fromEntries(e.headers)
})
);
return _(o.body, o.status, o.headers);
}
if (a === "/telegram" && e.method === "POST") {
if (!process.env.BOT_TOKEN) return _({ error: "BOT_TOKEN yo'q" }, 503);
if (e.headers.get("x-telegram-bot-api-secret-token") !== await et()) return _({ error: "forbidden" }, 403);
let n = await e.json(), o = na(n).catch((r) => console.error("Telegram:", r));
return globalThis.EdgeRuntime?.waitUntil ? EdgeRuntime.waitUntil(o) : await o, _({ ok: !0 });
}
if (a === "/telegram/setup") {
if (!process.env.APP_PASSWORD || t.searchParams.get("key") !== process.env.APP_PASSWORD) return _({ error: "auth" }, 401);
let n = ct();
if (!n) return _({ error: "BOT_TOKEN yo'q" }, 503);
let o = "".concat(nt, "/functions/v1/").concat(Qe, "/telegram");
await n.telegram.setWebhook(o, {
secret_token: await et(),
allowed_updates: ["message", "callback_query"],
drop_pending_updates: !0
});
let r = await n.telegram.getMe();
return _({ ok: !0, bot: "@" + r.username, webhook: o, info: await n.telegram.getWebhookInfo() });
}
return _({ error: "Topilmadi" }, 404);
} catch (n) {
return console.error(n), _({ error: n.message || "Server xatosi" }, 500);
}
});

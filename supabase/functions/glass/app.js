// Avtomatik yaratilgan fayl — tahrirlamang. Manba: edge/main.js va server/. Qayta yig'ish: npm run build:edge
import * as __fs from "node:fs";
import * as __path from "node:path";
import * as __crypto from "node:crypto";
import __nodeProcess from "node:process";
import { Buffer } from "node:buffer";
const __builtins = { fs: __fs, path: __path, crypto: __crypto };
const require = (name) => {
const m = __builtins[String(name).replace(/^node:/, "")];
if (!m) throw new Error("Edge muhitida mavjud emas: " + name);
return m;
};
// process.env ni o'zgartirib bo'ladigan nusxa (sozlamalar bazadan yuklanadi)
const __env = { ...__nodeProcess.env };
const process = new Proxy(__nodeProcess, { get: (t, k) => (k === "env" ? __env : Reflect.get(t, k)) });
var ht = Object.create;
var pe = Object.defineProperty;
var bt = Object.getOwnPropertyDescriptor;
var kt = Object.getOwnPropertyNames;
var vt = Object.getPrototypeOf, St = Object.prototype.hasOwnProperty;
var R = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, {
get: (t, a) => (typeof require < "u" ? require : t)[a]
}) : e)(function(e) {
if (typeof require < "u") return require.apply(this, arguments);
throw Error('Dynamic require of "' + e + '" is not supported');
});
var N = (e, t) => () => {
try {
return t || e((t = { exports: {} }).exports, t), t.exports;
} catch (a) {
throw t = 0, a;
}
};
var It = (e, t, a, n) => {
if (t && typeof t == "object" || typeof t == "function")
for (let o of kt(t))
!St.call(e, o) && o !== a && pe(e, o, { get: () => t[o], enumerable: !(n = bt(t, o)) || n.enumerable });
return e;
};
var K = (e, t, a) => (a = e != null ? ht(vt(e)) : {}, It(
// If the importer is in node compatibility mode or this is not an ESM
// file that has been converted to a CommonJS file using a Babel-
// compatible transform (i.e. "__esModule" has not been set), then set
// "default" to the CommonJS "module.exports" for node compatibility.
t || !e || !e.__esModule ? pe(a, "default", { value: e, enumerable: !0 }) : a,
e
));

// server/deps.js
var C = N((la, ue) => {
var me = {};
ue.exports = {
get(e) {
return me[e] ??= R(e);
},
set(e, t) {
me[e] = t;
}
};
});

// server/db.js
var U = N((pa, be) => {
var P = R("fs"), ye = R("path"), Tt = R("crypto"), ae = process.env.DATA_DIR || (typeof __dirname < "u" ? ye.join(__dirname, "..", "data") : "./data"), B = ye.join(ae, "db.json"), jt = [
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
], ge = () => Tt.randomBytes(6).toString("hex");
function $() {
return {
settings: { currency: "UZS", ownerName: "" },
categories: jt.map(([e, t, a, n]) => ({
id: ge(),
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
var E = null, x = null;
function Et(e) {
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
async function qt({ pool: e, store: t } = {}) {
let a = process.env.DATABASE_URL;
if (!t && !e && !a) return fe();
if (!t) {
if (!e) {
let { Pool: o } = C().get("pg");
e = new o({
connectionString: a,
ssl: /localhost|127\.0\.0\.1/.test(a) ? !1 : { rejectUnauthorized: !1 },
max: 3
});
}
t = Et(e), await t.setup();
}
x = { store: t, chain: Promise.resolve() };
let n = await t.load();
return n ? E = { ...$(), ...n } : (E = $(), G()), await he(), E;
}
function fe() {
return E || (P.existsSync(B) ? E = JSON.parse(P.readFileSync(B, "utf8")) : (P.mkdirSync(ae, { recursive: !0 }), E = $(), G()), E);
}
function G() {
if (x) {
let t = JSON.stringify(E);
x.chain = x.chain.then(() => x.store.save(t)).catch((a) => console.error("Bazaga yozib bo'lmadi:", a.message));
return;
}
P.mkdirSync(ae, { recursive: !0 });
let e = B + ".tmp";
P.writeFileSync(e, JSON.stringify(E, null, 2)), P.renameSync(e, B);
}
var he = () => x ? x.chain : Promise.resolve();
function _t(e) {
E = e || $(), G();
}
be.exports = { init: qt, load: fe, save: G, flush: he, reset: _t, uid: ge, emptyDb: $, storage: () => x ? x.store.name : "file" };
});

// server/finance.js
var H = N((ma, Ee) => {
var Y = (e) => String(e).slice(0, 7);
function Se(e, t, a) {
return !(t && e < t || a && e > a);
}
function Ie(e, t) {
let a = e.transactions.filter((c) => c.projectId === t.id), n = D(a.filter((c) => c.type === "income")), o = D(a.filter((c) => c.type === "expense")), s = (t.items || []).map((c) => {
let h = Number(c.qty) || 0, g = h * (Number(c.unitCost) || 0), l = h * (Number(c.unitPrice) || 0), f = l - g;
return {
...c,
costTotal: g,
priceTotal: l,
profit: f,
margin: l ? f / l : 0,
markup: g ? f / g : 0
};
}), i = s.reduce((c, h) => c + h.costTotal, 0), d = s.reduce((c, h) => c + h.priceTotal, 0), u = e.workLogs.filter((c) => c.projectId === t.id).reduce((c, h) => {
let g = e.employees.find((f) => f.id === h.employeeId), l = h.rate != null ? Number(h.rate) : ne(g);
return c + (Number(h.qty) || 0) * l;
}, 0), r = Number(t.budget) || d, y = n - o, m = {};
for (let c of a.filter((h) => h.type === "expense")) {
let g = e.categories.find((l) => l.id === c.categoryId)?.name || "Kategoriyasiz";
m[g] = (m[g] || 0) + Number(c.amount);
}
return {
revenue: n,
cost: o,
profit: y,
margin: n ? y / n : 0,
markup: o ? y / o : 0,
contract: r,
receivable: Math.max(0, r - n),
plannedCost: i,
plannedPrice: d,
plannedProfit: d - i,
plannedMargin: d ? (d - i) / d : 0,
accruedLabor: u,
budgetUsed: i ? o / i : 0,
items: s,
byCategory: m,
txCount: a.length
};
}
function wt(e, t) {
let [a, n] = e.slice(0, 7).split("-").map(Number), [o, s] = t.slice(0, 7).split("-").map(Number);
return Math.max(0, (o - a) * 12 + (s - n) + 1);
}
var F = (e) => e.payType === "monthly" || e.payType === "mixed", Te = (e) => e.payType === "piece" || e.payType === "mixed", ne = (e) => Number(e?.payType === "mixed" ? e.pieceRate : e?.rate) || 0, ke = (e) => F(e) && Number(e.rate) || 0;
function je(e, t, a) {
let n = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), o = Te(t) ? e.workLogs.filter((g) => g.employeeId === t.id) : [], s = e.transactions.filter(
(g) => g.employeeId === t.id && g.type === "expense"
), i = (g) => (Number(g.qty) || 0) * (g.rate != null ? Number(g.rate) : ne(t)), d = 0;
if (F(t)) {
let g = t.startDate || n, l = t.active === !1 && t.endDate ? t.endDate : n;
d = wt(g, l) * ke(t);
}
let u = o.reduce((g, l) => g + i(l), 0), r = d + u, y = D(s), m = 0, c = 0, h = 0;
if (a) {
if (F(t)) {
let l = !t.startDate || t.startDate.slice(0, 7) <= a;
m += l ? ke(t) : 0;
}
let g = o.filter((l) => Y(l.date) === a);
m += g.reduce((l, f) => l + i(f), 0), h = g.reduce((l, f) => l + (Number(f.qty) || 0), 0), c = D(s.filter((l) => Y(l.date) === a));
}
return {
accruedTotal: r,
salaryTotal: d,
pieceTotal: u,
paidTotal: y,
balance: r - y,
// + => xodimga qarzmiz, - => avans berilgan
monthAccrued: m,
monthPaid: c,
monthBalance: m - c,
monthUnits: h,
unitsTotal: o.reduce((g, l) => g + (Number(l.qty) || 0), 0),
paymentsCount: s.length
};
}
function D(e) {
return e.reduce((t, a) => t + (Number(a.amount) || 0), 0);
}
function xt(e, { scope: t = "all", from: a, to: n } = {}) {
let o = e.transactions.filter(
(l) => (t === "all" || l.scope === t) && Se(l.date, a, n)
), s = D(o.filter((l) => l.type === "income")), i = D(o.filter((l) => l.type === "expense")), d = {};
for (let l of o) {
let f = Y(l.date);
d[f] ??= { month: f, income: 0, expense: 0 }, d[f][l.type] += Number(l.amount);
}
let u = Object.values(d).sort((l, f) => l.month.localeCompare(f.month)), r = {};
for (let l of o) {
let f = e.categories.find((p) => p.id === l.categoryId), k = l.categoryId || "none";
r[k] ??= {
id: k,
name: f?.name || "Kategoriyasiz",
color: f?.color || "#94a3b8",
type: l.type,
total: 0,
count: 0
}, r[k].total += Number(l.amount), r[k].count++;
}
let y = Object.values(r).sort((l, f) => f.total - l.total), m = {};
for (let l of o)
m[l.date] ??= { date: l.date, income: 0, expense: 0 }, m[l.date][l.type] += Number(l.amount);
let c = e.projects.map((l) => ({
id: l.id,
name: l.name,
status: l.status,
...Ot(Ie(e, l), ["revenue", "cost", "profit", "margin", "receivable"])
})), h = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), g = e.employees.filter((l) => l.active !== !1).reduce(
(l, f) => {
let k = je(e, f, h);
return l.accrued += k.monthAccrued, l.paid += k.monthPaid, l.debt += Math.max(0, k.balance), l;
},
{ accrued: 0, paid: 0, debt: 0 }
);
return {
income: s,
expense: i,
net: s - i,
savingsRate: s ? (s - i) / s : 0,
count: o.length,
monthly: u,
daily: Object.values(m).sort((l, f) => l.date.localeCompare(f.date)),
categories: y,
projects: c,
payroll: g,
byScope: {
agency: ve(e.transactions, "agency", a, n),
personal: ve(e.transactions, "personal", a, n)
}
};
}
function ve(e, t, a, n) {
let o = e.filter((d) => d.scope === t && Se(d.date, a, n)), s = D(o.filter((d) => d.type === "income")), i = D(o.filter((d) => d.type === "expense"));
return { income: s, expense: i, net: s - i };
}
function Ot(e, t) {
return Object.fromEntries(t.map((a) => [a, e[a]]));
}
Ee.exports = { projectStats: Ie, employeeStats: je, dashboard: xt, monthKey: Y, hasSalary: F, hasPiece: Te, unitRate: ne };
});

// server/ai.js
var ie = N((ua, Ke) => {
var { projectStats: At, employeeStats: Dt, dashboard: qe } = H(), Oe = C(), Ae = { monthly: "oylik", piece: "dona", mixed: "oylik + dona" }, De = process.env.CLAUDE_MODEL || "claude-opus-5-5", Ne = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, Nt = [
process.env.GEMINI_MODEL || "gemini-flash-latest",
"gemini-3.6-flash",
"gemini-3-flash-preview",
"gemini-flash-lite-latest"
], Mt = Number(process.env.GEMINI_TIMEOUT_MS) || 25e3, J = null;
function L() {
let e = !!process.env.GEMINI_API_KEY, t = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN), a = String(process.env.AI_PROVIDER || "").toLowerCase();
return a === "claude" && t ? "claude" : a === "gemini" && e || e ? "gemini" : t ? "claude" : null;
}
var _e = null;
function Me() {
let e = Oe.get("@anthropic-ai/sdk");
return _e ??= new e(), _e;
}
var we = null;
function Rt() {
let { GoogleGenAI: e } = Oe.get("@google/genai");
return we ??= new e({
apiKey: process.env.GEMINI_API_KEY,
httpOptions: {
timeout: Mt,
...process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}
}
}), we;
}
async function oe(e) {
let t;
for (let a of [...new Set([J, ...Nt].filter(Boolean))])
try {
let n = await Rt().models.generateContent({ ...e, model: a });
return J = a, n;
} catch (n) {
if (t = n, [400, 401, 403].includes(n?.status)) break;
J === a && (J = null), console.warn("Gemini ".concat(a, ": ").concat(n?.status || n?.name || "xato", ", keyingi model sinab ko'rilmoqda"));
}
throw t?.status === 429 ? new Error("Gemini limiti tugadi, birozdan keyin urinib ko'ring") : [400, 401, 403].includes(t?.status) ? new Error("Gemini kaliti noto'g'ri yoki ruxsat yo'q (GEMINI_API_KEY ni tekshiring)") : new Error("Gemini hozir javob bermayapti, bir daqiqadan keyin urinib ko'ring");
}
function W(e) {
if (Array.isArray(e)) return e.map(W);
if (!e || typeof e != "object") return e;
let t = {};
for (let [a, n] of Object.entries(e))
a === "additionalProperties" || a === "strict" || (t[a] = W(n));
return t;
}
var X = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function Re(e) {
return e.content.filter((t) => t.type === "text").map((t) => t.text).join("\n").trim();
}
var xe = "Sen marketing agentligi egasining moliyaviy yordamchisisan. Foydalanuvchi o'zbek, rus yoki aralash tilda (ko'pincha ovozdan yozilgan, xatoli matn) kirim-chiqimlarini aytadi. Matndan barcha alohida tranzaksiyalarni ajrat.\nQoidalar:\n- Summalarni so'mga aylantir: 'ming'/'k'/'\u0442\u044B\u0441' = 1000, 'mln'/'million'/'\u043C\u0438\u043B\u043B\u0438\u043E\u043D' = 1 000 000. Dollar aytilsa, note'da yoz va summani 12 800 kurs bilan so'mga aylantir.\n- scope: agentlik ishi (mijoz, reklama, xodim, loyiha, ofis) = agency; shaxsiy xarajat (ovqat, uy, oila, taksi) = personal. Aniq bo'lmasa defaultScope'dan foydalan.\n- category: faqat ro'yxatdagi nomlardan, type va scope'ga mos kelganini tanla.\n- Sana: 'bugun' = today, 'kecha' = today-1 va h.k. Aytilmasa today.\n- Xodimga to'lov bo'lsa employee maydoniga ro'yxatdagi ismni yoz, kategoriya ish haqi bo'lsin.\n- Loyiha/mijoz nomi tilga olinsa, ro'yxatdagi eng mos loyiha nomini project'ga yoz.\n- note: qisqa, tushunarli izoh.";
async function Pt(e, t, a) {
let n = L();
if (!n) return { drafts: Le(e, t, a), engine: "offline" };
let o = e.categories.map((m) => m.name), s = {
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
today: X(),
defaultScope: a || "aniqlanmagan",
categories: e.categories.map((m) => "".concat(m.name, " [").concat(m.type, ", ").concat(m.scope, "]")),
projects: e.projects.map((m) => m.name),
employees: e.employees.map((m) => "".concat(m.name, " (").concat(m.role || "", ", ").concat(Ae[m.payType] || "oylik", ")"))
}, d = "Kontekst:\n".concat(JSON.stringify(i, null, 1), '\n\nMatn:\n"""').concat(t, '"""'), u;
if (n === "gemini")
u = (await oe({
contents: d,
config: {
systemInstruction: xe,
responseMimeType: "application/json",
responseJsonSchema: W(s),
temperature: 0.1
}
})).text;
else {
let m = await Me().beta.messages.create({
model: De,
max_tokens: 4e3,
...Ne,
output_config: { effort: "low", format: { type: "json_schema", schema: s } },
system: xe,
messages: [{ role: "user", content: d }]
});
if (m.stop_reason === "refusal") throw new Error("AI so'rovni rad etdi");
u = Re(m);
}
return { drafts: (JSON.parse(u || "{}").transactions || []).map((m) => Pe(e, m)), engine: n };
}
function Pe(e, t) {
let a = (i) => String(i || "").toLowerCase().trim(), n = e.categories.find((i) => i.name === t.category) || e.categories.find((i) => i.type === t.type && i.scope === t.scope), o = t.project ? e.projects.find((i) => a(i.name) === a(t.project)) || e.projects.find((i) => a(i.name).includes(a(t.project)) || a(t.project).includes(a(i.name))) : null, s = t.employee ? e.employees.find((i) => a(i.name) === a(t.employee)) || e.employees.find((i) => a(i.name).split(" ")[0] === a(t.employee).split(" ")[0]) : null;
return {
type: t.type,
amount: Math.round(Number(t.amount) || 0),
scope: t.scope,
categoryId: n?.id || null,
date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : X(),
note: t.note || "",
projectId: o?.id || null,
employeeId: s?.id || null
};
}
var Lt = [
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
function zt(e) {
let t = e.match(/(\d+(?:[.,\s]\d+)*)\s*(mln|million|миллион|млн|ming|minga|k|тыс|тысяч|so'm|sum|сум|\$)?/i);
if (!t) return 0;
let a = parseFloat(t[1].replace(/\s/g, "").replace(",", ".")), n = (t[2] || "").toLowerCase();
return /mln|million|миллион|млн/.test(n) ? a *= 1e6 : /ming|k|тыс/.test(n) ? a *= 1e3 : n === "$" && (a *= 12800), Math.round(a);
}
function Le(e, t, a) {
return t.split(/[\n;]|,(?!\d)|\bva\b|\bи\b/i).map((o) => o.trim()).filter((o) => /\d/.test(o)).map((o) => {
let i = /kirim|tushdi|oldim|to'ladi|to'lov qildi|keldi|avans|получил|приход|поступ/i.test(o) ? "income" : "expense", d = Lt.find(([f]) => f.test(o))?.[1], u = e.categories.find((f) => f.name === d && f.type === i), r = /mijoz|reklama|loyiha|xodim|ofis|klient|target|kontent|syomka/i.test(o), y = u?.scope || (r ? "agency" : a || "personal");
u ||= e.categories.find((f) => f.type === i && f.scope === y);
let m = o.toLowerCase(), c = (f) => String(f || "").toLowerCase().split(/\s+/).filter((k) => k.length >= 4), h = e.projects.find((f) => m.includes(f.name.toLowerCase())) || e.projects.find((f) => [...c(f.name), ...c(f.client)].some((k) => m.includes(k))), g = e.employees.find((f) => m.includes(f.name.toLowerCase().split(" ")[0])), l = X();
return /kecha|вчера/i.test(o) && (l = new Date(Date.now() - 864e5).toISOString().slice(0, 10)), {
type: i,
amount: zt(o),
scope: y,
categoryId: u?.id || null,
date: l,
note: o,
projectId: h?.id || null,
employeeId: g?.id || null
};
});
}
var ze = "Sen 'Glass Finance' ilovasidagi moliyaviy maslahatchi va buxgaltersan. Foydalanuvchi \u2014 marketing agentligi egasi. U shaxsiy va agentlik kirim-chiqimlarini, loyihalar tannarxi va marjasini, xodimlar oyliklarini (oylik yoki dona bo'yicha) shu ilovada yuritadi.\n- Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (odatda o'zbekcha).\n- Raqamlarni so'mda, minglarni bo'sh joy bilan ajratib yoz (masalan 12 500 000 so'm).\n- Tahlil qilganda aniq raqamlar, foizlar, marja va tavsiyalar ber. Qisqa va lo'nda bo'l, kerak bo'lsa ro'yxat/jadval ishlat.\n- Batafsil ma'lumot kerak bo'lsa query_transactions tool'idan foydalan.\n- Foydalanuvchi yangi kirim/chiqim qo'shishni so'rasa, add_transactions tool'ini chaqir va nima qo'shilganini aytib ber.\n- employees[].balance > 0 bo'lsa \u2014 agentlik shu xodimga qarz (unga to'lash kerak); < 0 bo'lsa \u2014 xodimga avans berilgan.\n- Ma'lumotda yo'q narsani o'ylab topma.";
function Ct(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), a = (n) => e.categories.find((o) => o.id === n)?.name || "-";
return {
today: X(),
currency: "UZS",
overall: qe(e, {}),
thisMonth: qe(e, { from: t + "-01", to: t + "-31" }),
categories: e.categories.map((n) => ({ name: n.name, type: n.type, scope: n.scope })),
projects: e.projects.map((n) => {
let o = At(e, n);
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
items: o.items.map((s) => ({
name: s.name,
qty: s.qty,
unitCost: s.unitCost,
unitPrice: s.unitPrice,
marginPct: +(s.margin * 100).toFixed(1)
}))
};
}),
employees: e.employees.map((n) => ({
name: n.name,
role: n.role,
payType: Ae[n.payType] || "oylik",
monthlySalary: n.payType === "piece" ? 0 : n.rate,
pieceRate: n.payType === "piece" ? n.rate : n.payType === "mixed" ? n.pieceRate : 0,
unit: n.unitName,
active: n.active !== !1,
...Dt(e, n, t)
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
var Ce = (e) => [
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
function $e(e, t, a, n, o) {
let s = (i) => String(i || "").toLowerCase();
if (t === "query_transactions") {
let i = e.transactions.filter((u) => {
let r = e.categories.find((c) => c.id === u.categoryId)?.name || "", y = e.projects.find((c) => c.id === u.projectId)?.name || "", m = e.employees.find((c) => c.id === u.employeeId)?.name || "";
return (!a.from || u.date >= a.from) && (!a.to || u.date <= a.to) && (!a.type || u.type === a.type) && (!a.scope || u.scope === a.scope) && (!a.category || s(r).includes(s(a.category))) && (!a.project || s(y).includes(s(a.project))) && (!a.employee || s(m).includes(s(a.employee))) && (!a.text || s(u.note).includes(s(a.text)));
}), d = (u) => i.filter((r) => r.type === u).reduce((r, y) => r + Number(y.amount), 0);
return {
count: i.length,
incomeTotal: d("income"),
expenseTotal: d("expense"),
rows: i.slice(0, 300).map((u) => ({
date: u.date,
type: u.type,
amount: u.amount,
scope: u.scope,
category: e.categories.find((r) => r.id === u.categoryId)?.name,
note: u.note
}))
};
}
if (t === "add_transactions") {
let i = a.transactions.map((d) => {
let u = { id: n(), ...Pe(e, d), source: "ai-chat", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
return e.transactions.push(u), u;
});
return o(), { added: i.length, ids: i.map((d) => d.id) };
}
return { error: "Noma'lum tool" };
}
async function $t(e, t, a) {
let n = L();
if (!n)
return {
reply: "AI chat ishlashi uchun serverda GEMINI_API_KEY (bepul, aistudio.google.com) yoki ANTHROPIC_API_KEY o'rnatilishi kerak.",
changed: !1
};
let o = t.filter((i) => i.role === "user" || i.role === "assistant").map((i) => ({ role: i.role, content: String(i.content) })), s = "<moliyaviy_malumotlar>\n" + JSON.stringify(Ct(e)) + "\n</moliyaviy_malumotlar>";
return n === "gemini" ? Kt(e, o, s, a) : Bt(e, o, s, a);
}
async function Kt(e, t, a, { uid: n, save: o }) {
let s = t.pop(), i = t.map((r) => ({ role: r.role === "assistant" ? "model" : "user", parts: [{ text: r.content }] }));
i.push({ role: "user", parts: [{ text: a }, { text: s.content }] });
let d = [
{
functionDeclarations: Ce(e).map((r) => ({
name: r.name,
description: r.description,
parametersJsonSchema: W(r.input_schema)
}))
}
], u = !1;
for (let r = 0; r < 8; r++) {
let y = await oe({ contents: i, config: { systemInstruction: ze, tools: d } }), m = y.functionCalls || [];
if (!m.length) return { reply: (y.text || "").trim() || "Javob olinmadi, savolni boshqacha yozib ko'ring.", changed: u };
i.push(y.candidates[0].content), i.push({
role: "user",
parts: m.map((c) => {
let h;
try {
h = { result: $e(e, c.name, c.args || {}, n, o) }, c.name === "add_transactions" && (u = !0);
} catch (g) {
h = { error: String(g.message) };
}
return { functionResponse: { ...c.id ? { id: c.id } : {}, name: c.name, response: h } };
})
});
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
async function Bt(e, t, a, { uid: n, save: o }) {
let s = t, i = s.pop();
s.push({
role: "user",
content: [
{ type: "text", text: a },
{ type: "text", text: i.content }
]
});
let d = Ce(e), u = !1;
for (let r = 0; r < 8; r++) {
let y = await Me().beta.messages.create({
model: De,
max_tokens: 16e3,
...Ne,
output_config: { effort: "medium" },
system: ze,
tools: d,
messages: s
});
if (y.stop_reason === "refusal")
return { reply: "Kechirasiz, bu so'rovga javob bera olmayman.", changed: u };
if (y.stop_reason !== "tool_use")
return { reply: Re(y) || "\u2026", changed: u };
s.push({ role: "assistant", content: y.content });
let m = y.content.filter((c) => c.type === "tool_use").map((c) => {
let h;
try {
let g = $e(e, c.name, c.input, n, o);
c.name === "add_transactions" && (u = !0), h = JSON.stringify(g);
} catch (g) {
return { type: "tool_result", tool_use_id: c.id, content: String(g.message), is_error: !0 };
}
return { type: "tool_result", tool_use_id: c.id, content: h };
});
s.push({ role: "user", content: m });
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
async function Gt(e, t = "audio/ogg") {
return L() !== "gemini" ? null : ((await oe({
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
var Ut = { gemini: "Gemini", claude: "Claude" };
Ke.exports = {
parseTransactions: Pt,
chat: $t,
provider: L,
providerName: () => Ut[L()] || null,
hasKey: () => !!L(),
transcribe: Gt,
fallbackParse: Le
};
});

// server/demo.js
var Ge = N((ya, Be) => {
function Yt(e, t) {
let a = (p) => e.categories.find((v) => v.name === p).id, n = /* @__PURE__ */ new Date(), o = (p, v) => {
let _ = new Date(Date.UTC(n.getFullYear(), n.getMonth() - p, Math.min(v, 28))).toISOString().slice(0, 10), A = n.toISOString().slice(0, 10);
return _ > A ? A : _;
}, s = (p, v, q, _, A, z) => ({
id: t(),
name: p,
role: v,
payType: q,
rate: _,
unitName: A,
startDate: o(z, 1),
active: !0
}), i = [
s("Aziza Karimova", "SMM menejer", "monthly", 6e6, "", 5),
s("Jasur Toshmatov", "Targetolog", "monthly", 8e6, "", 5),
s("Dilshod Rahimov", "Mobilograf", "piece", 25e4, "reels", 5),
s("Madina Yusupova", "Dizayner", "piece", 8e4, "post dizayn", 5),
s("Sardor Aliyev", "Copywriter", "piece", 5e4, "matn", 3),
// Aralash: oylik maosh + har bir montaj qilingan video uchun alohida haq
{ ...s("Kamola Nazarova", "Montajchi", "mixed", 3e6, "video", 2), pieceRate: 15e4 }
];
e.employees = i;
let d = (p, v, q, _, A, z) => ({
id: t(),
name: p,
client: v,
status: q,
budget: _,
startDate: o(A, 3),
items: z.map(([ee, te, gt, ft]) => ({ id: t(), name: ee, qty: te, unitCost: gt, unitPrice: ft }))
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
let [u, r, y] = e.projects, m = [], c = (p, v, q, _, A, z, ee, te = {}) => m.push({
id: t(),
type: q,
scope: _,
amount: z,
date: o(p, v),
categoryId: a(A),
note: ee,
projectId: null,
employeeId: null,
source: "demo",
...te
});
for (let p = 5; p >= 0; p--) {
let v = 1 + p * 37 % 11 / 30;
c(p, 5, "income", "agency", "Retainer (oylik xizmat)", 18e6, "Oqtepa \u2014 oylik to'lov", { projectId: u.id }), p <= 3 && c(p, 10, "income", "agency", "Mijoz to'lovi", 3e7, "Texnomart \u2014 bosqich to'lovi", { projectId: r.id }), p === 4 && c(p, 6, "income", "agency", "Avans / oldindan to'lov", 9e6, "Rayhon \u2014 avans 50%", { projectId: y.id }), p === 3 && c(p, 20, "income", "agency", "Mijoz to'lovi", 9e6, "Rayhon \u2014 yakuniy to'lov", { projectId: y.id }), c(p, 7, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(35e5 * v), "Oqtepa \u2014 Meta reklama", { projectId: u.id }), p <= 3 && c(p, 12, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(9e6 * v), "Texnomart \u2014 Google Ads", { projectId: r.id }), c(p, 1, "expense", "agency", "Ofis ijarasi", 5e6, "Ofis ijarasi"), c(p, 3, "expense", "agency", "Dasturlar va obunalar", 115e4, "Canva, Adobe, ChatGPT, Notion"), c(p, 15, "expense", "agency", "Transport (agentlik)", Math.round(4e5 * v), "Syomkaga taksi"), c(p, 25, "expense", "agency", "Soliq", 21e5, "Aylanma soliq"), p === 4 && c(p, 18, "expense", "agency", "Kontent ishlab chiqarish", 15e5, "Rayhon fotosessiya studiya", { projectId: y.id }), p === 2 && c(p, 9, "expense", "agency", "Uskunalar", 75e5, "Yangi mikrofon va svet");
for (let q of i.filter((_) => _.payType === "monthly"))
c(p, 28, "expense", "agency", "Ish haqi / oylik", q.rate, "".concat(q.name, " \u2014 oylik"), { employeeId: q.id });
c(p, 2, "income", "personal", "Agentlikdan foyda", 12e6, "Agentlikdan olingan foyda"), c(p, 4, "expense", "personal", "Uy-joy va kommunal", Math.round(18e5 * v), "Kvartira + kommunal"), c(p, 8, "expense", "personal", "Oziq-ovqat", Math.round(26e5 * v), "Bozor va market"), c(p, 11, "expense", "personal", "Kafe va restoran", Math.round(11e5 * v), "Kafelar"), c(p, 14, "expense", "personal", "Transport / taksi / benzin", Math.round(9e5 * v), "Benzin va taksi"), c(p, 16, "expense", "personal", "Aloqa va internet", 25e4, "Telefon va internet"), c(p, 22, "expense", "personal", "Ko'ngilochar", Math.round(5e5 * v), "Kino, dam olish"), p % 2 === 0 && c(p, 19, "expense", "personal", "Kiyim-kechak", Math.round(12e5 * v), "Kiyim"), p === 1 && c(p, 21, "expense", "personal", "Oila va sovg'alar", 2e6, "To'yga sovg'a");
}
let h = [], [, , g, l, f, k] = i;
for (let p = 4; p >= 0; p--)
h.push({ id: t(), employeeId: g.id, date: o(p, 10), qty: 12, projectId: u.id, note: "Oqtepa reels" }), h.push({ id: t(), employeeId: l.id, date: o(p, 12), qty: 20, projectId: u.id, note: "Oqtepa postlar" }), p <= 3 && h.push({ id: t(), employeeId: l.id, date: o(p, 14), qty: 8, projectId: r.id, note: "Texnomart bannerlar" }), p <= 2 && h.push({ id: t(), employeeId: f.id, date: o(p, 13), qty: 25, projectId: u.id, note: "Post matnlari" }), p <= 2 && h.push({ id: t(), employeeId: k.id, date: o(p, 16), qty: 10, projectId: r.id, note: "Texnomart videolari montaji" }), p >= 1 && (c(p, 27, "expense", "agency", "Dona ish haqi (frilans)", 12 * g.rate, "".concat(g.name, " \u2014 reels"), { employeeId: g.id, projectId: u.id }), c(p, 27, "expense", "agency", "Dona ish haqi (frilans)", 20 * l.rate, "".concat(l.name, " \u2014 postlar"), { employeeId: l.id, projectId: u.id }));
return e.workLogs = h, e.transactions = m, e;
}
Be.exports = { seedDemo: Yt };
});

// server/api.js
var Xe = N((ga, We) => {
var b = U(), V = ie(), { projectStats: Ft, employeeStats: Ht, dashboard: Jt } = H(), { seedDemo: Wt } = Ge(), Q = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), j = (e) => ({ status: 200, body: e }), T = (e, t) => ({ status: e, body: { error: t } }), Fe = {
transactions: ["type", "amount", "scope", "categoryId", "date", "note", "projectId", "employeeId", "source"],
categories: ["name", "type", "scope", "color"],
projects: ["name", "client", "status", "budget", "startDate", "endDate", "items", "note"],
employees: ["name", "role", "payType", "rate", "pieceRate", "unitName", "startDate", "endDate", "active", "phone", "note"],
workLogs: ["employeeId", "date", "qty", "rate", "projectId", "note"]
};
function Ue(e, t) {
let a = {};
for (let n of Fe[e]) t[n] !== void 0 && (a[n] = t[n]);
for (let n of ["amount", "budget", "rate", "pieceRate", "qty"]) a[n] != null && a[n] !== "" && (a[n] = Number(a[n]));
for (let n of ["projectId", "employeeId", "categoryId"]) a[n] === "" && (a[n] = null);
return a.rate === "" && delete a.rate, a;
}
function Ye(e, t) {
if (e === "transactions") {
if (!["income", "expense"].includes(t.type)) return "Turi noto'g'ri";
if (!(t.amount > 0)) return "Summa 0 dan katta bo'lishi kerak";
if (!["personal", "agency"].includes(t.scope)) return "Bo'lim noto'g'ri";
}
return ["categories", "projects", "employees"].includes(e) && !String(t.name || "").trim() ? "Nomi kiritilmagan" : e === "workLogs" && (!t.employeeId || !(t.qty > 0)) ? "Xodim va miqdor kerak" : null;
}
function He(e) {
let { _bot: t, ...a } = e;
return a;
}
var Je = [], I = (e, t, a) => {
let n = [], o = new RegExp("^" + t.replace(/:(\w+)/g, (s, i) => (n.push(i), "([^/]+)")) + "/?$");
Je.push({ method: e, re: o, keys: n, fn: a });
};
I("POST", "/auth", (e) => {
let t = process.env.APP_PASSWORD;
return j({ ok: !t || e.body?.password === t, required: !!t });
});
I("GET", "/state", (e) => {
let t = b.load(), a = e.query.month || Q().slice(0, 7);
return j({
...He(t),
aiEnabled: V.hasKey(),
aiProvider: V.providerName(),
projects: t.projects.map((n) => ({ ...n, stats: Ft(t, n) })),
employees: t.employees.map((n) => ({ ...n, stats: Ht(t, n, a) }))
});
});
I("GET", "/dashboard", (e) => j(Jt(b.load(), e.query)));
for (let e of Object.keys(Fe))
I("POST", "/".concat(e), (t) => {
let a = b.load(), n = Array.isArray(t.body) ? t.body : [t.body || {}], o = [];
for (let s of n) {
let i = { id: b.uid(), ...Ue(e, s), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
(e === "transactions" || e === "workLogs") && (i.date ||= Q()), e === "projects" && (i.items ||= []);
let d = Ye(e, i);
if (d) return T(400, d);
o.push(i);
}
return a[e].push(...o), b.save(), j(Array.isArray(t.body) ? o : o[0]);
}), I("PUT", "/".concat(e, "/:id"), (t) => {
let n = b.load()[e].find((i) => i.id === t.params.id);
if (!n) return T(404, "Topilmadi");
let o = { ...n, ...Ue(e, t.body || {}) }, s = Ye(e, o);
return s ? T(400, s) : (Object.assign(n, o), b.save(), j(n));
}), I("DELETE", "/".concat(e, "/:id"), (t) => {
let a = b.load(), n = a[e].findIndex((s) => s.id === t.params.id);
if (n < 0) return T(404, "Topilmadi");
let [o] = a[e].splice(n, 1);
return e === "categories" && a.transactions.forEach((s) => s.categoryId === o.id && (s.categoryId = null)), e === "projects" && (a.transactions.forEach((s) => s.projectId === o.id && (s.projectId = null)), a.workLogs.forEach((s) => s.projectId === o.id && (s.projectId = null))), e === "employees" && (a.transactions.forEach((s) => s.employeeId === o.id && (s.employeeId = null)), a.workLogs = a.workLogs.filter((s) => s.employeeId !== o.id)), b.save(), j({ ok: !0 });
});
I("POST", "/employees/:id/pay", (e) => {
let t = b.load(), a = t.employees.find((d) => d.id === e.params.id);
if (!a) return T(404, "Xodim topilmadi");
let n = Number(e.body?.amount);
if (!(n > 0)) return T(400, "Summa kiriting");
let o = a.payType === "piece" ? "Dona ish haqi (frilans)" : "Ish haqi / oylik", s = t.categories.find((d) => d.name === o) || t.categories.find((d) => d.type === "expense" && d.scope === "agency"), i = {
id: b.uid(),
type: "expense",
scope: "agency",
amount: n,
date: e.body.date || Q(),
categoryId: s?.id || null,
employeeId: a.id,
projectId: e.body.projectId || null,
note: e.body.note || "".concat(a.name, " \u2014 to'lov"),
source: "payroll",
createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
return t.transactions.push(i), b.save(), j(i);
});
I("POST", "/ai/parse", async (e) => {
let t = String(e.body?.text || "").trim();
return t ? j(await V.parseTransactions(b.load(), t, e.body.scope)) : T(400, "Matn bo'sh");
});
I("POST", "/ai/chat", async (e) => {
let t = Array.isArray(e.body?.messages) ? e.body.messages.slice(-30) : [];
return !t.length || t.at(-1).role !== "user" ? T(400, "Xabar yo'q") : j(await V.chat(b.load(), t, { uid: b.uid, save: b.save }));
});
I("GET", "/export", () => ({
status: 200,
body: He(b.load()),
headers: { "Content-Disposition": 'attachment; filename="glass-finance-'.concat(Q(), '.json"') }
}));
I("POST", "/import", (e) => {
let t = e.body;
return !t || !Array.isArray(t.transactions) || !Array.isArray(t.categories) ? T(400, "Fayl formati noto'g'ri") : (b.reset({ ...b.emptyDb(), ...t, _bot: b.load()._bot }), j({ ok: !0 }));
});
I("POST", "/demo", () => (b.reset({ ...Wt(b.emptyDb(), b.uid), _bot: b.load()._bot }), j({ ok: !0 })));
I("POST", "/reset", () => (b.reset({ ...b.emptyDb(), _bot: b.load()._bot }), j({ ok: !0 })));
async function Xt({ method: e, path: t, query: a = {}, body: n, headers: o = {} }) {
let s = (d) => o[d] ?? o[d.toLowerCase()], i = process.env.APP_PASSWORD;
if (i && t !== "/auth" && s("x-app-key") !== i) return T(401, "auth");
for (let d of Je) {
if (d.method !== e) continue;
let u = t.match(d.re);
if (!u) continue;
let r = Object.fromEntries(d.keys.map((y, m) => [y, decodeURIComponent(u[m + 1])]));
try {
return await d.fn({ params: r, query: a, body: n, headers: o });
} catch (y) {
return console.error(y), T(500, y.message || "Server xatosi");
}
}
return T(404, "Topilmadi");
}
We.exports = { handle: Xt };
});

// server/bot.js
var nt = N((fa, at) => {
var Vt = C(), S = U(), Z = ie(), { dashboard: Qt, employeeStats: Zt, projectStats: ea } = H(), O = (e) => Math.round(e || 0).toLocaleString("ru-RU").replace(/[\s,]/g, " ") + " so'm", Ve = (e) => isFinite(e) ? (e * 100).toFixed(1).replace(".0", "") + "%" : "\u2014", M = (e) => String(e ?? "").replace(/[&<>]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[t]), ta = { agency: "Agentlik", personal: "Shaxsiy" };
function Ze(e) {
return /^[?？]/.test(e.trim()) || !/\d/.test(e) ? !0 : /\?\s*$|qancha\b.*\?|qaysi|nega|tahlil|maslahat|hisobot|сколько|какой|почему/i.test(e);
}
function Qe(e, t) {
let a = t.categories.find((s) => s.id === e.categoryId)?.name || "Kategoriyasiz", n = t.projects.find((s) => s.id === e.projectId)?.name, o = t.employees.find((s) => s.id === e.employeeId)?.name;
return "".concat(e.type === "income" ? "\u{1F7E2} +" : "\u{1F534} \u2212", "<b>").concat(O(e.amount), "</b> \xB7 ").concat(ta[e.scope], "\n") + "   ".concat(M(a), " \xB7 ").concat(e.date).concat(n ? " \xB7 \u{1F4C1} ".concat(M(n)) : "").concat(o ? " \xB7 \u{1F464} ".concat(M(o)) : "", "\n") + "   <i>".concat(M(e.note), "</i>");
}
function et(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), a = Qt(e, { from: t + "-01", to: t + "-31" }), n = a.categories.filter((i) => i.type === "expense").slice(0, 5), o = e.employees.filter((i) => i.active !== !1).map((i) => ({ e: i, s: Zt(e, i, t) })).filter((i) => i.s.balance > 0), s = e.projects.filter((i) => i.status !== "done").map((i) => ({ p: i, s: ea(e, i) }));
return [
"\u{1F4CA} <b>Bu oy (".concat(t, ")</b>"),
"",
"\u{1F7E2} Kirim: <b>".concat(O(a.income), "</b>"),
"\u{1F534} Chiqim: <b>".concat(O(a.expense), "</b>"),
"\u{1F4B0} Sof foyda: <b>".concat(O(a.net), "</b> (").concat(Ve(a.savingsRate), ")"),
"",
"\u{1F3E2} Agentlik: ".concat(O(a.byScope.agency.net)),
"\u{1F3E0} Shaxsiy: ".concat(O(a.byScope.personal.net)),
n.length ? "\n<b>Eng katta chiqimlar:</b>\n" + n.map((i) => "\u2022 ".concat(M(i.name), " \u2014 ").concat(O(i.total))).join("\n") : "",
s.length ? "\n<b>Faol loyihalar:</b>\n" + s.map(({ p: i, s: d }) => "\u2022 ".concat(M(i.name), ": foyda ").concat(O(d.profit), ", marja ").concat(Ve(d.margin))).join("\n") : "",
o.length ? "\n<b>Xodimlarga qarz:</b>\n" + o.map(({ e: i, s: d }) => "\u2022 ".concat(M(i.name), " \u2014 ").concat(O(d.balance))).join("\n") : ""
].filter((i) => i !== "").join("\n");
}
function tt({ telegram: e } = {}) {
let t = process.env.BOT_TOKEN;
if (!t) return null;
let { Telegraf: a, Markup: n } = Vt.get("telegraf"), o = () => String(process.env.TELEGRAM_ALLOWED_IDS || "").split(/[,\s]+/).filter(Boolean), s = new a(t, e ? { telegram: e } : {}), i = () => {
let r = S.load();
return r._bot ??= {}, r._bot.pending ??= {}, r._bot.histories ??= {}, r._bot.owners ??= [], r._bot;
}, d = 24 * 3600 * 1e3;
s.use(async (r, y) => {
let m = String(r.from?.id || "");
if (!m) return;
let c = i(), h = [...o(), ...c.owners];
return h.includes(m) ? y() : h.length ? r.reply("\u26D4 Ruxsat yo'q. Sizning Telegram ID: <code>".concat(m, "</code>"), { parse_mode: "HTML" }) : (c.owners.push(m), S.save(), await r.reply("\u{1F510} Siz bot egasi sifatida ro'yxatdan o'tdingiz. Endi bot faqat sizga javob beradi."), y());
}), s.start(
(r) => r.reply(
"Salom! Men <b>Glass Finance</b> botiman \u{1F48E}\n\n\u{1F399} Ovozli xabar ham yuborishingiz mumkin.\n\n<b>Operatsiya qo'shish</b> \u2014 oddiy yozing:\n<i>tushlikka 85 ming, Oqtepa reklamaga 2 mln, Dilshodga 3 mln berdim</i>\n\n<b>Savol berish</b> \u2014 savol yozing yoki boshiga ? qo'ying:\n<i>? qaysi loyiha eng foydali</i>\n\n/hisobot \u2014 bu oygi qisqa hisobot\n/yangi \u2014 suhbatni yangidan boshlash",
{ parse_mode: "HTML" }
)
), s.command("hisobot", (r) => r.reply(et(S.load()), { parse_mode: "HTML" })), s.command("yangi", (r) => (delete i().histories[r.from.id], S.save(), r.reply("Suhbat tozalandi \u2713"))), s.on("voice", async (r) => {
if (Z.provider() !== "gemini")
return r.reply(
"\u{1F399} Ovozli xabarni tushunish uchun serverda GEMINI_API_KEY kerak. Hozircha matn qilib yuboring (klaviaturadagi mikrofon tugmasi)."
);
try {
await r.sendChatAction("typing");
let y = await r.telegram.getFileLink(r.message.voice.file_id), m = Buffer.from(await (await fetch(y)).arrayBuffer()), c = await Z.transcribe(m, r.message.voice.mime_type || "audio/ogg");
return c ? (await r.reply("\u{1F399} \xAB".concat(c, "\xBB")), u(r, c)) : r.reply("Ovozni tushunolmadim, qaytadan yuboring.");
} catch (y) {
return console.error(y), r.reply("\u26A0\uFE0F Ovozni o'qib bo'lmadi: " + y.message);
}
}), s.on("text", (r) => {
let y = r.message.text.trim();
if (!y.startsWith("/"))
return u(r, y);
});
async function u(r, y) {
await r.sendChatAction("typing");
let m = S.load();
try {
if (Ze(y)) {
let k = i().histories[r.from.id] || [];
k.push({ role: "user", content: y.replace(/^[?？]\s*/, "") });
let p = await Z.chat(m, k, { uid: S.uid, save: S.save });
return k.push({ role: "assistant", content: p.reply }), i().histories[r.from.id] = k.slice(-20), S.save(), r.reply(p.reply.slice(0, 4e3));
}
let { drafts: c, engine: h } = await Z.parseTransactions(m, y, ""), g = c.filter((k) => k.amount > 0);
if (!g.length) return r.reply("Summani topa olmadim. Masalan: \xABtaksiga 40 ming\xBB.");
let l = S.uid(), f = i();
for (let [k, p] of Object.entries(f.pending)) Date.now() - p.ts > d && delete f.pending[k];
return f.pending[l] = { drafts: g, userId: r.from.id, ts: Date.now() }, S.save(), r.reply(
"".concat(h !== "offline" ? "\u2726 AI aniqladi" : "Aniqlandi (offline)", ":\n\n") + g.map((k) => Qe(k, m)).join("\n\n"),
{
parse_mode: "HTML",
...n.inlineKeyboard([
n.button.callback("\u2705 Saqlash (".concat(g.length, ")"), "save:".concat(l)),
n.button.callback("\u274C Bekor", "cancel:".concat(l))
])
}
);
} catch (c) {
return console.error(c), r.reply("\u26A0\uFE0F Xatolik: " + c.message);
}
}
return s.action(/^save:(.+)$/, async (r) => {
let y = i(), m = y.pending[r.match[1]];
if (!m || m.userId !== r.from.id) return r.answerCbQuery("Muddati o'tgan");
delete y.pending[r.match[1]];
let c = S.load(), h = (/* @__PURE__ */ new Date()).toISOString();
for (let g of m.drafts) c.transactions.push({ id: S.uid(), ...g, source: "telegram", createdAt: h });
return S.save(), await r.answerCbQuery("Saqlandi \u2713"), r.editMessageText(
"\u2705 Saqlandi:\n\n" + m.drafts.map((g) => Qe(g, c)).join("\n\n"),
{ parse_mode: "HTML" }
);
}), s.action(/^cancel:(.+)$/, async (r) => (delete i().pending[r.match[1]], S.save(), await r.answerCbQuery("Bekor qilindi"), r.editMessageText("\u274C Bekor qilindi"))), s.catch((r) => console.error("Telegram bot xatosi:", r)), s;
}
async function aa(e) {
let t = tt();
if (!t) return null;
let a = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
try {
if (a && e) {
let n = a.replace(/^https?:\/\//, "").replace(/\/+$/, ""), o = R("crypto").createHash("sha256").update(process.env.BOT_TOKEN).digest("hex");
e.use(await t.createWebhook({ domain: n, path: "/telegram/".concat(o.slice(0, 32)), secret_token: o.slice(32) })), console.log("Telegram bot webhook rejimida: https://".concat(n));
} else
t.launch().catch((n) => console.error("Botni ishga tushirib bo'lmadi:", n.message)), process.once("SIGINT", () => t.stop("SIGINT")), process.once("SIGTERM", () => t.stop("SIGTERM")), console.log("Telegram bot polling rejimida ishga tushdi");
} catch (n) {
console.error("Telegram botni ulab bo'lmadi:", n.message);
}
return t;
}
at.exports = { startBot: tt, runBot: aa, isQuestion: Ze, monthReport: et };
});

// edge/main.js
var le = K(C()), de = K(U()), rt = K(Xe()), ct = K(nt()), ot = "glass", lt = Deno.env.get("SUPABASE_URL"), se = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default, na = ["GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "AI_PROVIDER", "BOT_TOKEN", "APP_PASSWORD", "TELEGRAM_ALLOWED_IDS"], dt = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "content-type, x-app-key, authorization, apikey",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
}, w = (e, t = 200, a = {}) => new Response(JSON.stringify(e), { status: t, headers: { ...dt, "Content-Type": "application/json", ...a } });
async function pt(e, t, a) {
let n = { apikey: se, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
se?.startsWith("eyJ") && (n.Authorization = "Bearer ".concat(se));
let o = await fetch("".concat(lt, "/rest/v1/glass_finance").concat(t), { method: e, headers: n, body: a });
if (!o.ok) throw new Error("Supabase ".concat(o.status, ": ").concat((await o.text()).slice(0, 200)));
return e === "GET" ? o.json() : null;
}
var mt = async (e) => (await pt("GET", "?id=eq.".concat(e, "&select=data")))[0]?.data ?? null, oa = {
name: "supabase",
load: () => mt("main"),
save: (e) => pt("POST", "?on_conflict=id", JSON.stringify([{ id: "main", data: JSON.parse(e), updated_at: (/* @__PURE__ */ new Date()).toISOString() }]))
}, it = 0;
async function ia() {
if (Date.now() - it < 6e4) return;
let e = await mt("config").catch(() => null) || {};
for (let t of na) {
let a = Deno.env.get(t) || e[t];
a ? process.env[t] = String(a) : delete process.env[t];
}
it = Date.now();
}
var re = 0;
async function ut(e) {
re === 0 && await de.default.init({ store: oa }), re++;
try {
return await e();
} finally {
re--, await de.default.flush();
}
}
var ce = null;
function yt() {
if (!process.env.BOT_TOKEN) return null;
if (ce?.token !== process.env.BOT_TOKEN) {
let e = Deno.env.get("TELEGRAM_API_ROOT");
ce = { token: process.env.BOT_TOKEN, bot: ct.default.startBot(e ? { telegram: { apiRoot: e } } : void 0) };
}
return ce.bot;
}
async function st() {
let e = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("glass:" + process.env.BOT_TOKEN));
return [...new Uint8Array(e)].map((t) => t.toString(16).padStart(2, "0")).join("").slice(0, 48);
}
async function sa(e) {
let t = yt();
t && (t.botInfo ??= await t.telegram.getMe(), await ut(() => t.handleUpdate(e)));
}
function ha({ genai: e, Telegraf: t, Markup: a }) {
le.default.set("@google/genai", e), le.default.set("telegraf", { Telegraf: t, Markup: a }), Deno.serve(ra);
}
async function ra(e) {
if (e.method === "OPTIONS") return new Response(null, { status: 204, headers: dt });
let t = new URL(e.url), a = t.pathname.replace(new RegExp("^(/functions/v1)?/".concat(ot)), "") || "/";
try {
if (await ia(), a === "/" || a === "/health") return w({ ok: !0, app: "Glass Finance API" });
if (a.startsWith("/api/")) {
let n;
["GET", "HEAD"].includes(e.method) || (n = await e.json().catch(() => {
}));
let o = await ut(
() => rt.default.handle({
method: e.method,
path: a.slice(4),
query: Object.fromEntries(t.searchParams),
body: n,
headers: Object.fromEntries(e.headers)
})
);
return w(o.body, o.status, o.headers);
}
if (a === "/telegram" && e.method === "POST") {
if (!process.env.BOT_TOKEN) return w({ error: "BOT_TOKEN yo'q" }, 503);
if (e.headers.get("x-telegram-bot-api-secret-token") !== await st()) return w({ error: "forbidden" }, 403);
let n = await e.json(), o = sa(n).catch((s) => console.error("Telegram:", s));
return globalThis.EdgeRuntime?.waitUntil ? EdgeRuntime.waitUntil(o) : await o, w({ ok: !0 });
}
if (a === "/telegram/setup") {
if (!process.env.APP_PASSWORD || t.searchParams.get("key") !== process.env.APP_PASSWORD) return w({ error: "auth" }, 401);
let n = yt();
if (!n) return w({ error: "BOT_TOKEN yo'q" }, 503);
let o = "".concat(lt, "/functions/v1/").concat(ot, "/telegram");
await n.telegram.setWebhook(o, {
secret_token: await st(),
allowed_updates: ["message", "callback_query"],
drop_pending_updates: !0
});
let s = await n.telegram.getMe();
return w({ ok: !0, bot: "@" + s.username, webhook: o, info: await n.telegram.getWebhookInfo() });
}
return w({ error: "Topilmadi" }, 404);
} catch (n) {
return console.error(n), w({ error: n.message || "Server xatosi" }, 500);
}
}
export {
ha as start
};

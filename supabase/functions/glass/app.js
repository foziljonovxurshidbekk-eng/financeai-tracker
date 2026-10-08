// Avtomatik yaratilgan fayl — tahrirlamang. Manba: edge/main.js va server/. Qayta yig'ish: npm run build:edge
import * as __fs from "node:fs";
import * as __path from "node:path";
import * as __crypto from "node:crypto";
import * as __ah from "node:async_hooks";
import __nodeProcess from "node:process";
import { Buffer } from "node:buffer";
const __builtins = { fs: __fs, path: __path, crypto: __crypto, async_hooks: __ah };
const require = (name) => {
const m = __builtins[String(name).replace(/^node:/, "")];
if (!m) throw new Error("Edge muhitida mavjud emas: " + name);
return m;
};
// process.env ni o'zgartirib bo'ladigan nusxa (sozlamalar bazadan yuklanadi)
const __env = { ...__nodeProcess.env };
const process = new Proxy(__nodeProcess, { get: (t, k) => (k === "env" ? __env : Reflect.get(t, k)) });
var Lt = Object.create;
var ke = Object.defineProperty;
var Rt = Object.getOwnPropertyDescriptor;
var zt = Object.getOwnPropertyNames;
var $t = Object.getPrototypeOf, Ct = Object.prototype.hasOwnProperty;
var M = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, {
get: (t, n) => (typeof require < "u" ? require : t)[n]
}) : e)(function(e) {
if (typeof require < "u") return require.apply(this, arguments);
throw Error('Dynamic require of "' + e + '" is not supported');
});
var R = (e, t) => () => {
try {
return t || e((t = { exports: {} }).exports, t), t.exports;
} catch (n) {
throw t = 0, n;
}
};
var Bt = (e, t, n, a) => {
if (t && typeof t == "object" || typeof t == "function")
for (let o of zt(t))
!Ct.call(e, o) && o !== n && ke(e, o, { get: () => t[o], enumerable: !(a = Rt(t, o)) || a.enumerable });
return e;
};
var U = (e, t, n) => (n = e != null ? Lt($t(e)) : {}, Bt(
// If the importer is in node compatibility mode or this is not an ESM
// file that has been converted to a CommonJS file using a Babel-
// compatible transform (i.e. "__esModule" has not been set), then set
// "default" to the CommonJS "module.exports" for node compatibility.
t || !e || !e.__esModule ? ke(n, "default", { value: e, enumerable: !0 }) : n,
e
));

// server/deps.js
var B = R((Kn, Se) => {
var ve = {};
Se.exports = {
get(e) {
return ve[e] ??= M(e);
},
set(e, t) {
ve[e] = t;
}
};
});

// server/db.js
var J = R((Gn, Ae) => {
var z = M("fs"), oe = M("path"), Kt = M("crypto"), { AsyncLocalStorage: Ut } = M("async_hooks"), G = process.env.DATA_DIR || (typeof __dirname < "u" ? oe.join(__dirname, "..", "data") : "./data"), Gt = oe.join(G, "db.json"), Yt = [
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
], Ie = () => Kt.randomBytes(6).toString("hex"), Ee = [
{ id: "agency", name: "Agentlik", kind: "business" },
{ id: "personal", name: "Shaxsiy", kind: "personal" }
];
function K() {
return {
settings: { currency: "UZS", ownerName: "" },
scopes: Ee.map((e) => ({ ...e })),
categories: Yt.map(([e, t, n, a]) => ({
id: Ie(),
name: e,
type: t,
scope: n,
color: a
})),
transactions: [],
projects: [],
employees: [],
workLogs: []
};
}
function se(e) {
let t = { ...K(), ...e };
return (!Array.isArray(t.scopes) || !t.scopes.length) && (t.scopes = Ee.map((n) => ({ ...n }))), t.scopes = t.scopes.map((n) => ({ kind: n.id === "personal" ? "personal" : "business", ...n })), t;
}
var j = null, we = /* @__PURE__ */ new Map(), _e = new Ut(), qe = (e) => e === "main" ? "main" : "u_" + e;
function Y(e) {
let t = we.get(e);
return t || we.set(e, t = { userId: e, rowId: qe(e), cache: null, chain: Promise.resolve(), inflight: 0, loading: null }), t;
}
var F = () => _e.getStore() || Y("main");
function Te(e, t = "main") {
return {
name: "postgres",
async setup() {
await e.query("CREATE TABLE IF NOT EXISTS glass_finance (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())"), await e.query("ALTER TABLE glass_finance ENABLE ROW LEVEL SECURITY"), setInterval(() => e.query("SELECT 1").catch(() => {
}), 24 * 3600 * 1e3).unref?.();
},
async load() {
let n = await e.query("SELECT data FROM glass_finance WHERE id = $1", [t]);
return n.rows.length ? typeof n.rows[0].data == "string" ? JSON.parse(n.rows[0].data) : n.rows[0].data : null;
},
save: (n) => e.query(
"INSERT INTO glass_finance (id, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
[t, n]
)
};
}
function Ft({ storeFactory: e }) {
j = e;
}
async function Ht({ pool: e, store: t, storeFactory: n } = {}) {
let a = process.env.DATABASE_URL;
if (n) j = n;
else if (t) j = () => t;
else if (e || a) {
if (!e) {
let { Pool: s } = B().get("pg");
e = new s({
connectionString: a,
ssl: /localhost|127\.0\.0\.1/.test(a) ? !1 : { rejectUnauthorized: !1 },
max: 3
});
}
await Te(e).setup(), j = (s) => Te(e, s);
}
if (!j) return Oe();
let o = Y("main");
return await je(o), await o.chain, o.cache;
}
async function je(e) {
let n = await j(e.rowId).load();
n ? e.cache = se(n) : (e.cache = K(), H(e));
}
async function Jt(e) {
return j ? !!await j(qe(e)).load() : z.existsSync(ie(Y(e)));
}
async function Wt(e, t) {
let n = Y(e);
n.inflight++;
try {
return j && (n.inflight === 1 && (n.loading = je(n)), await n.loading), await _e.run(n, t);
} finally {
n.inflight--, await n.chain;
}
}
var ie = (e) => e.rowId === "main" ? Gt : oe.join(G, "db-".concat(e.rowId.replace(/[^\w.-]/g, "_"), ".json"));
function Oe() {
let e = F();
if (e.cache) return e.cache;
if (j) throw new Error("Baza yuklanmagan");
let t = ie(e);
return z.existsSync(t) ? e.cache = se(JSON.parse(z.readFileSync(t, "utf8"))) : (z.mkdirSync(G, { recursive: !0 }), e.cache = K(), H(e)), e.cache;
}
function H(e) {
if (j) {
let a = JSON.stringify(e.cache), o = j(e.rowId);
e.chain = e.chain.then(() => o.save(a)).catch((s) => console.error("Bazaga yozib bo'lmadi:", s.message));
return;
}
z.mkdirSync(G, { recursive: !0 });
let t = ie(e), n = t + ".tmp";
z.writeFileSync(n, JSON.stringify(e.cache, null, 2)), z.renameSync(n, t);
}
var Xt = () => H(F()), Vt = () => F().chain;
function Qt(e) {
let t = F();
t.cache = e ? se(e) : K(), H(t);
}
Ae.exports = {
init: Ht,
configure: Ft,
session: Wt,
exists: Jt,
load: Oe,
save: Xt,
flush: Vt,
reset: Qt,
uid: Ie,
emptyDb: K,
storage: () => j ? j("main").name : "file"
};
});

// server/finance.js
var V = R((Yn, Re) => {
var W = (e) => String(e).slice(0, 7);
function Ne(e, t, n) {
return !(t && e < t || n && e > n);
}
function Me(e, t) {
let n = e.transactions.filter((r) => r.projectId === t.id), a = P(n.filter((r) => r.type === "income")), o = P(n.filter((r) => r.type === "expense")), s = (t.items || []).map((r) => {
let p = Number(r.qty) || 0, f = p * (Number(r.unitCost) || 0), c = p * (Number(r.unitPrice) || 0), k = c - f;
return {
...r,
costTotal: f,
priceTotal: c,
profit: k,
margin: c ? k / c : 0,
markup: f ? k / f : 0
};
}), i = s.reduce((r, p) => r + p.costTotal, 0), m = s.reduce((r, p) => r + p.priceTotal, 0), u = e.workLogs.filter((r) => r.projectId === t.id).reduce((r, p) => {
let f = e.employees.find((k) => k.id === p.employeeId), c = p.rate != null ? Number(p.rate) : re(f);
return r + (Number(p.qty) || 0) * c;
}, 0), y = Number(t.budget) || m, b = a - o, l = {};
for (let r of n.filter((p) => p.type === "expense")) {
let f = e.categories.find((c) => c.id === r.categoryId)?.name || "Kategoriyasiz";
l[f] = (l[f] || 0) + Number(r.amount);
}
return {
revenue: a,
cost: o,
profit: b,
margin: a ? b / a : 0,
markup: o ? b / o : 0,
contract: y,
receivable: Math.max(0, y - a),
plannedCost: i,
plannedPrice: m,
plannedProfit: m - i,
plannedMargin: m ? (m - i) / m : 0,
accruedLabor: u,
budgetUsed: i ? o / i : 0,
items: s,
byCategory: l,
txCount: n.length
};
}
function Zt(e, t) {
let [n, a] = e.slice(0, 7).split("-").map(Number), [o, s] = t.slice(0, 7).split("-").map(Number);
return Math.max(0, (o - n) * 12 + (s - a) + 1);
}
var X = (e) => e.payType === "monthly" || e.payType === "mixed", Pe = (e) => e.payType === "piece" || e.payType === "mixed", re = (e) => Number(e?.payType === "mixed" ? e.pieceRate : e?.rate) || 0, xe = (e) => X(e) && Number(e.rate) || 0;
function Le(e, t, n) {
let a = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), o = Pe(t) ? e.workLogs.filter((f) => f.employeeId === t.id) : [], s = e.transactions.filter(
(f) => f.employeeId === t.id && f.type === "expense"
), i = (f) => (Number(f.qty) || 0) * (f.rate != null ? Number(f.rate) : re(t)), m = 0;
if (X(t)) {
let f = t.startDate || a, c = t.active === !1 && t.endDate ? t.endDate : a;
m = Zt(f, c) * xe(t);
}
let u = o.reduce((f, c) => f + i(c), 0), y = m + u, b = P(s), l = 0, r = 0, p = 0;
if (n) {
if (X(t)) {
let c = !t.startDate || t.startDate.slice(0, 7) <= n;
l += c ? xe(t) : 0;
}
let f = o.filter((c) => W(c.date) === n);
l += f.reduce((c, k) => c + i(k), 0), p = f.reduce((c, k) => c + (Number(k.qty) || 0), 0), r = P(s.filter((c) => W(c.date) === n));
}
return {
accruedTotal: y,
salaryTotal: m,
pieceTotal: u,
paidTotal: b,
balance: y - b,
// + => xodimga qarzmiz, - => avans berilgan
monthAccrued: l,
monthPaid: r,
monthBalance: l - r,
monthUnits: p,
unitsTotal: o.reduce((f, c) => f + (Number(c.qty) || 0), 0),
paymentsCount: s.length
};
}
function P(e) {
return e.reduce((t, n) => t + (Number(n.amount) || 0), 0);
}
function en(e, { scope: t = "all", from: n, to: a } = {}) {
let o = e.transactions.filter(
(c) => (t === "all" || c.scope === t) && Ne(c.date, n, a)
), s = P(o.filter((c) => c.type === "income")), i = P(o.filter((c) => c.type === "expense")), m = {};
for (let c of o) {
let k = W(c.date);
m[k] ??= { month: k, income: 0, expense: 0 }, m[k][c.type] += Number(c.amount);
}
let u = Object.values(m).sort((c, k) => c.month.localeCompare(k.month)), y = {};
for (let c of o) {
let k = e.categories.find((d) => d.id === c.categoryId), S = c.categoryId || "none";
y[S] ??= {
id: S,
name: k?.name || "Kategoriyasiz",
color: k?.color || "#94a3b8",
type: c.type,
total: 0,
count: 0
}, y[S].total += Number(c.amount), y[S].count++;
}
let b = Object.values(y).sort((c, k) => k.total - c.total), l = {};
for (let c of o)
l[c.date] ??= { date: c.date, income: 0, expense: 0 }, l[c.date][c.type] += Number(c.amount);
let r = e.projects.map((c) => ({
id: c.id,
name: c.name,
status: c.status,
...tn(Me(e, c), ["revenue", "cost", "profit", "margin", "receivable"])
})), p = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), f = e.employees.filter((c) => c.active !== !1).reduce(
(c, k) => {
let S = Le(e, k, p);
return c.accrued += S.monthAccrued, c.paid += S.monthPaid, c.debt += Math.max(0, S.balance), c;
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
daily: Object.values(l).sort((c, k) => c.date.localeCompare(k.date)),
categories: b,
projects: r,
payroll: f,
scopes: e.scopes.map((c) => ({ id: c.id, name: c.name, kind: c.kind, ...De(e.transactions, c.id, n, a) })),
byScope: Object.fromEntries(e.scopes.map((c) => [c.id, De(e.transactions, c.id, n, a)]))
};
}
function De(e, t, n, a) {
let o = e.filter((m) => m.scope === t && Ne(m.date, n, a)), s = P(o.filter((m) => m.type === "income")), i = P(o.filter((m) => m.type === "expense"));
return { income: s, expense: i, net: s - i };
}
function tn(e, t) {
return Object.fromEntries(t.map((n) => [n, e[n]]));
}
Re.exports = { projectStats: Me, employeeStats: Le, dashboard: en, monthKey: W, hasSalary: X, hasPiece: Pe, unitRate: re };
});

// server/ai.js
var le = R((Fn, et) => {
var { projectStats: nn, employeeStats: an, dashboard: ze } = V(), Ke = B(), Ue = { monthly: "oylik", piece: "dona", mixed: "oylik + dona" }, Ge = process.env.CLAUDE_MODEL || "claude-opus-5-5", Ye = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, on = [
process.env.GEMINI_MODEL || "gemini-flash-latest",
"gemini-3.6-flash",
"gemini-3-flash-preview",
"gemini-flash-lite-latest"
], sn = Number(process.env.GEMINI_TIMEOUT_MS) || 25e3, Q = null;
function C() {
let e = !!process.env.GEMINI_API_KEY, t = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN), n = String(process.env.AI_PROVIDER || "").toLowerCase();
return n === "claude" && t ? "claude" : n === "gemini" && e || e ? "gemini" : t ? "claude" : null;
}
var $e = null;
function Fe() {
let e = Ke.get("@anthropic-ai/sdk");
return $e ??= new e(), $e;
}
var Ce = null;
function rn() {
let { GoogleGenAI: e } = Ke.get("@google/genai");
return Ce ??= new e({
apiKey: process.env.GEMINI_API_KEY,
httpOptions: {
timeout: sn,
...process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}
}
}), Ce;
}
async function ce(e) {
let t;
for (let n of [...new Set([Q, ...on].filter(Boolean))])
try {
let a = await rn().models.generateContent({ ...e, model: n });
return Q = n, a;
} catch (a) {
if (t = a, [400, 401, 403].includes(a?.status)) break;
Q === n && (Q = null), console.warn("Gemini ".concat(n, ": ").concat(a?.status || a?.name || "xato", ", keyingi model sinab ko'rilmoqda"));
}
throw t?.status === 429 ? new Error("Gemini limiti tugadi, birozdan keyin urinib ko'ring") : [400, 401, 403].includes(t?.status) ? new Error("Gemini kaliti noto'g'ri yoki ruxsat yo'q (GEMINI_API_KEY ni tekshiring)") : new Error("Gemini hozir javob bermayapti, bir daqiqadan keyin urinib ko'ring");
}
function Z(e) {
if (Array.isArray(e)) return e.map(Z);
if (!e || typeof e != "object") return e;
let t = {};
for (let [n, a] of Object.entries(e))
n === "additionalProperties" || n === "strict" || (t[n] = Z(a));
return t;
}
var ee = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function He(e) {
return e.content.filter((t) => t.type === "text").map((t) => t.text).join("\n").trim();
}
var Be = "Sen tadbirkor (masalan marketing agentligi egasi)ning moliyaviy yordamchisisan. Foydalanuvchi o'zbek, rus yoki aralash tilda (ko'pincha ovozdan yozilgan, xatoli matn) kirim-chiqimlarini aytadi. Matndan barcha alohida tranzaksiyalarni ajrat.\nQoidalar:\n- Summalarni so'mga aylantir: 'ming'/'k'/'\u0442\u044B\u0441' = 1000, 'mln'/'million'/'\u043C\u0438\u043B\u043B\u0438\u043E\u043D' = 1 000 000. Dollar aytilsa, note'da yoz va summani 12 800 kurs bilan so'mga aylantir.\n- scope: kontekstdagi scopes ro'yxatidan bo'lim id'sini tanla. Biznes bo'limlar (kind=business) \u2014 mijoz, reklama, xodim, loyiha, ofis, savdo kabi ish xarajatlari; shaxsiy bo'lim (kind=personal) \u2014 ovqat, uy, oila, taksi. Bir nechta biznes bo'lsa, matndagi nomga qarab tanla. Aniq bo'lmasa defaultScope'dan foydalan.\n- category: faqat ro'yxatdagi nomlardan, type va scope'ga mos kelganini tanla.\n- Sana: 'bugun' = today, 'kecha' = today-1 va h.k. Aytilmasa today.\n- Xodimga to'lov bo'lsa employee maydoniga ro'yxatdagi ismni yoz, kategoriya ish haqi bo'lsin.\n- Loyiha/mijoz nomi tilga olinsa, ro'yxatdagi eng mos loyiha nomini project'ga yoz.\n- note: qisqa, tushunarli izoh.";
async function cn(e, t, n) {
let a = C();
if (!a) return { drafts: We(e, t, n), engine: "offline" };
let o = [...new Set(e.categories.map((r) => r.name))], s = e.scopes.map((r) => r.id), i = {
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
scope: { type: "string", enum: s },
category: { type: "string", enum: o },
date: { type: "string", description: "YYYY-MM-DD" },
note: { type: "string" },
project: { type: "string", description: "Mavjud loyiha nomi yoki bo'sh" },
employee: { type: "string", description: "Mavjud xodim ismi yoki bo'sh" }
}
}
}
}
}, m = {
today: ee(),
defaultScope: n || "aniqlanmagan",
scopes: e.scopes.map((r) => ({ id: r.id, name: r.name, kind: r.kind })),
categories: e.categories.map((r) => "".concat(r.name, " [").concat(r.type, ", ").concat(r.scope, "]")),
projects: e.projects.map((r) => r.name),
employees: e.employees.map((r) => "".concat(r.name, " (").concat(r.role || "", ", ").concat(Ue[r.payType] || "oylik", ")"))
}, u = "Kontekst:\n".concat(JSON.stringify(m, null, 1), '\n\nMatn:\n"""').concat(t, '"""'), y;
if (a === "gemini")
y = (await ce({
contents: u,
config: {
systemInstruction: Be,
responseMimeType: "application/json",
responseJsonSchema: Z(i),
temperature: 0.1
}
})).text;
else {
let r = await Fe().beta.messages.create({
model: Ge,
max_tokens: 4e3,
...Ye,
output_config: { effort: "low", format: { type: "json_schema", schema: i } },
system: Be,
messages: [{ role: "user", content: u }]
});
if (r.stop_reason === "refusal") throw new Error("AI so'rovni rad etdi");
y = He(r);
}
return { drafts: (JSON.parse(y || "{}").transactions || []).map((r) => Je(e, r)), engine: a };
}
function Je(e, t) {
let n = (i) => String(i || "").toLowerCase().trim();
e.scopes.some((i) => i.id === t.scope) || (t = { ...t, scope: e.scopes[0].id });
let a = e.categories.find((i) => i.name === t.category && i.scope === t.scope && i.type === t.type) || e.categories.find((i) => i.name === t.category && i.type === t.type) || e.categories.find((i) => i.type === t.type && i.scope === t.scope), o = t.project ? e.projects.find((i) => n(i.name) === n(t.project)) || e.projects.find((i) => n(i.name).includes(n(t.project)) || n(t.project).includes(n(i.name))) : null, s = t.employee ? e.employees.find((i) => n(i.name) === n(t.employee)) || e.employees.find((i) => n(i.name).split(" ")[0] === n(t.employee).split(" ")[0]) : null;
return {
type: t.type,
amount: Math.round(Number(t.amount) || 0),
scope: t.scope,
categoryId: a?.id || null,
date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : ee(),
note: t.note || "",
projectId: o?.id || null,
employeeId: s?.id || null
};
}
var ln = [
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
function dn(e) {
let t = e.match(/(\d+(?:[.,\s]\d+)*)\s*(mln|million|миллион|млн|ming|minga|k|тыс|тысяч|so'm|sum|сум|\$)?/i);
if (!t) return 0;
let n = parseFloat(t[1].replace(/\s/g, "").replace(",", ".")), a = (t[2] || "").toLowerCase();
return /mln|million|миллион|млн/.test(a) ? n *= 1e6 : /ming|k|тыс/.test(a) ? n *= 1e3 : a === "$" && (n *= 12800), Math.round(n);
}
function We(e, t, n) {
return t.split(/[\n;]|,(?!\d)|\bva\b|\bи\b/i).map((o) => o.trim()).filter((o) => /\d/.test(o)).map((o) => {
let i = /kirim|tushdi|oldim|to'ladi|to'lov qildi|keldi|avans|получил|приход|поступ/i.test(o) ? "income" : "expense", m = ln.find(([h]) => h.test(o))?.[1], u = e.categories.find((h) => h.name === m && h.type === i), y = /mijoz|reklama|loyiha|xodim|ofis|klient|target|kontent|syomka/i.test(o), b = e.scopes.find((h) => h.kind !== "personal") || e.scopes[0], l = e.scopes.find((h) => h.kind === "personal") || e.scopes[0], p = e.scopes.find((h) => o.toLowerCase().includes(h.name.toLowerCase()))?.id || u?.scope || (y ? b.id : n || l.id);
u ||= e.categories.find((h) => h.type === i && h.scope === p);
let f = o.toLowerCase(), c = (h) => String(h || "").toLowerCase().split(/\s+/).filter((I) => I.length >= 4), k = e.projects.find((h) => f.includes(h.name.toLowerCase())) || e.projects.find((h) => [...c(h.name), ...c(h.client)].some((I) => f.includes(I))), S = e.employees.find((h) => f.includes(h.name.toLowerCase().split(" ")[0])), d = ee();
return /kecha|вчера/i.test(o) && (d = new Date(Date.now() - 864e5).toISOString().slice(0, 10)), {
type: i,
amount: dn(o),
scope: p,
categoryId: u?.id || null,
date: d,
note: o,
projectId: k?.id || null,
employeeId: S?.id || null
};
});
}
var Xe = "Sen 'Glass Finance' ilovasidagi moliyaviy maslahatchi va buxgaltersan. Foydalanuvchi \u2014 tadbirkor (masalan marketing agentligi egasi). U bir nechta bo'limda (biznes va shaxsiy; scopes ro'yxatiga qarang) kirim-chiqimlarini, loyihalar tannarxi va marjasini, xodimlar oyliklarini (oylik yoki dona bo'yicha) shu ilovada yuritadi.\n- Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob ber (odatda o'zbekcha).\n- Raqamlarni so'mda, minglarni bo'sh joy bilan ajratib yoz (masalan 12 500 000 so'm).\n- Tahlil qilganda aniq raqamlar, foizlar, marja va tavsiyalar ber. Qisqa va lo'nda bo'l, kerak bo'lsa ro'yxat/jadval ishlat.\n- Batafsil ma'lumot kerak bo'lsa query_transactions tool'idan foydalan.\n- Foydalanuvchi yangi kirim/chiqim qo'shishni so'rasa, add_transactions tool'ini chaqir va nima qo'shilganini aytib ber.\n- employees[].balance > 0 bo'lsa \u2014 agentlik shu xodimga qarz (unga to'lash kerak); < 0 bo'lsa \u2014 xodimga avans berilgan.\n- Ma'lumotda yo'q narsani o'ylab topma.";
function mn(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), n = (a) => e.categories.find((o) => o.id === a)?.name || "-";
return {
today: ee(),
currency: "UZS",
overall: ze(e, {}),
thisMonth: ze(e, { from: t + "-01", to: t + "-31" }),
scopes: e.scopes,
categories: e.categories.map((a) => ({ name: a.name, type: a.type, scope: a.scope })),
projects: e.projects.map((a) => {
let o = nn(e, a);
return {
name: a.name,
client: a.client,
status: a.status,
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
employees: e.employees.map((a) => ({
name: a.name,
role: a.role,
payType: Ue[a.payType] || "oylik",
monthlySalary: a.payType === "piece" ? 0 : a.rate,
pieceRate: a.payType === "piece" ? a.rate : a.payType === "mixed" ? a.pieceRate : 0,
unit: a.unitName,
active: a.active !== !1,
...an(e, a, t)
})),
recentTransactions: e.transactions.slice().sort((a, o) => o.date.localeCompare(a.date)).slice(0, 150).map((a) => ({
date: a.date,
type: a.type,
amount: a.amount,
scope: a.scope,
category: n(a.categoryId),
note: a.note,
project: e.projects.find((o) => o.id === a.projectId)?.name,
employee: e.employees.find((o) => o.id === a.employeeId)?.name
}))
};
}
var Ve = (e) => [
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
scope: { type: "string", enum: ["", ...e.scopes.map((t) => t.id)] },
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
scope: { type: "string", enum: e.scopes.map((t) => t.id) },
category: { type: "string", enum: [...new Set(e.categories.map((t) => t.name))] },
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
function Qe(e, t, n, a, o) {
let s = (i) => String(i || "").toLowerCase();
if (t === "query_transactions") {
let i = e.transactions.filter((u) => {
let y = e.categories.find((r) => r.id === u.categoryId)?.name || "", b = e.projects.find((r) => r.id === u.projectId)?.name || "", l = e.employees.find((r) => r.id === u.employeeId)?.name || "";
return (!n.from || u.date >= n.from) && (!n.to || u.date <= n.to) && (!n.type || u.type === n.type) && (!n.scope || u.scope === n.scope) && (!n.category || s(y).includes(s(n.category))) && (!n.project || s(b).includes(s(n.project))) && (!n.employee || s(l).includes(s(n.employee))) && (!n.text || s(u.note).includes(s(n.text)));
}), m = (u) => i.filter((y) => y.type === u).reduce((y, b) => y + Number(b.amount), 0);
return {
count: i.length,
incomeTotal: m("income"),
expenseTotal: m("expense"),
rows: i.slice(0, 300).map((u) => ({
date: u.date,
type: u.type,
amount: u.amount,
scope: u.scope,
category: e.categories.find((y) => y.id === u.categoryId)?.name,
note: u.note
}))
};
}
if (t === "add_transactions") {
let i = n.transactions.map((m) => {
let u = { id: a(), ...Je(e, m), source: "ai-chat", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
return e.transactions.push(u), u;
});
return o(), { added: i.length, ids: i.map((m) => m.id) };
}
return { error: "Noma'lum tool" };
}
async function pn(e, t, n) {
let a = C();
if (!a)
return {
reply: "AI chat ishlashi uchun serverda GEMINI_API_KEY (bepul, aistudio.google.com) yoki ANTHROPIC_API_KEY o'rnatilishi kerak.",
changed: !1
};
let o = t.filter((i) => i.role === "user" || i.role === "assistant").map((i) => ({ role: i.role, content: String(i.content) })), s = "<moliyaviy_malumotlar>\n" + JSON.stringify(mn(e)) + "\n</moliyaviy_malumotlar>";
return a === "gemini" ? un(e, o, s, n) : yn(e, o, s, n);
}
async function un(e, t, n, { uid: a, save: o }) {
let s = t.pop(), i = t.map((y) => ({ role: y.role === "assistant" ? "model" : "user", parts: [{ text: y.content }] }));
i.push({ role: "user", parts: [{ text: n }, { text: s.content }] });
let m = [
{
functionDeclarations: Ve(e).map((y) => ({
name: y.name,
description: y.description,
parametersJsonSchema: Z(y.input_schema)
}))
}
], u = !1;
for (let y = 0; y < 8; y++) {
let b = await ce({ contents: i, config: { systemInstruction: Xe, tools: m } }), l = b.functionCalls || [];
if (!l.length) return { reply: (b.text || "").trim() || "Javob olinmadi, savolni boshqacha yozib ko'ring.", changed: u };
i.push(b.candidates[0].content), i.push({
role: "user",
parts: l.map((r) => {
let p;
try {
p = { result: Qe(e, r.name, r.args || {}, a, o) }, r.name === "add_transactions" && (u = !0);
} catch (f) {
p = { error: String(f.message) };
}
return { functionResponse: { ...r.id ? { id: r.id } : {}, name: r.name, response: p } };
})
});
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
async function yn(e, t, n, { uid: a, save: o }) {
let s = t, i = s.pop();
s.push({
role: "user",
content: [
{ type: "text", text: n },
{ type: "text", text: i.content }
]
});
let m = Ve(e), u = !1;
for (let y = 0; y < 8; y++) {
let b = await Fe().beta.messages.create({
model: Ge,
max_tokens: 16e3,
...Ye,
output_config: { effort: "medium" },
system: Xe,
tools: m,
messages: s
});
if (b.stop_reason === "refusal")
return { reply: "Kechirasiz, bu so'rovga javob bera olmayman.", changed: u };
if (b.stop_reason !== "tool_use")
return { reply: He(b) || "\u2026", changed: u };
s.push({ role: "assistant", content: b.content });
let l = b.content.filter((r) => r.type === "tool_use").map((r) => {
let p;
try {
let f = Qe(e, r.name, r.input, a, o);
r.name === "add_transactions" && (u = !0), p = JSON.stringify(f);
} catch (f) {
return { type: "tool_result", tool_use_id: r.id, content: String(f.message), is_error: !0 };
}
return { type: "tool_result", tool_use_id: r.id, content: p };
});
s.push({ role: "user", content: l });
}
return { reply: "Juda ko'p qadam talab qilindi, savolni soddaroq qilib bering.", changed: u };
}
var fn = "Sen ovozli xabarni matnga o'giruvchisan. Faqat odam aniq gapirgan so'zlarni so'zma-so'z yoz (o'zbek, rus yoki aralash til). Yo'tal, nafas, shovqin, musiqa, fon ovozlari va tushunarsiz tovushlarni YOZMA. Eshitilmagan yoki tushunarsiz narsani o'ylab topma, raqam uydirma. Raqamni faqat odam aniq summa yoki miqdor aytgandagina raqam bilan yoz. Agar aniq tushunarli nutq bo'lmasa, aynan shu so'zni qaytar: EMPTY. Faqat matnni qaytar, izoh yozma.";
function Ze(e) {
let t = String(e || "").replace(/^["«“]+|["»”]+$/g, "").trim();
if (!t || /^(EMPTY|NONE|BO'?SH|N\/A)\.?$/i.test(t)) return "";
let n = (t.match(/\p{L}/gu) || []).length, a = t.split(/\s+/);
return n < 3 || a.every((s) => s.replace(/[^\p{L}\d]/gu, "").length <= 2) || a.some((s) => s.length >= 7 && /\d/.test(s) && /\p{L}/u.test(s) && !/^\d+[.,]?\d*\p{L}{1,6}$/u.test(s)) || (t.match(/\d/g) || []).length > n * 2 ? "" : t;
}
async function gn(e, t = "audio/ogg", n = []) {
if (C() !== "gemini") return null;
let a = n.filter(Boolean).slice(0, 40).join(", "), o = await ce({
contents: [
{
role: "user",
parts: [
{ inlineData: { mimeType: t, data: Buffer.from(e).toString("base64") } },
{ text: "Shu ovozli xabarni matnga aylantir." + (a ? " Tilga olinishi mumkin bo'lgan ismlar va nomlar: ".concat(a, ".") : "") }
]
}
],
config: { systemInstruction: fn, temperature: 0 }
});
return Ze(o.text);
}
var hn = { gemini: "Gemini", claude: "Claude" };
et.exports = {
parseTransactions: cn,
chat: pn,
provider: C,
providerName: () => hn[C()] || null,
hasKey: () => !!C(),
transcribe: gn,
cleanTranscript: Ze,
fallbackParse: We
};
});

// server/demo.js
var nt = R((Hn, tt) => {
function bn(e, t) {
let n = (d) => e.categories.find((h) => h.name === d).id, a = /* @__PURE__ */ new Date(), o = (d, h) => {
let E = new Date(Date.UTC(a.getFullYear(), a.getMonth() - d, Math.min(h, 28))).toISOString().slice(0, 10), O = a.toISOString().slice(0, 10);
return E > O ? O : E;
}, s = (d, h, I, E, O, D) => ({
id: t(),
name: d,
role: h,
payType: I,
rate: E,
unitName: O,
startDate: o(D, 1),
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
let m = (d, h, I, E, O, D) => ({
id: t(),
name: d,
client: h,
status: I,
budget: E,
startDate: o(O, 3),
items: D.map(([q, N, Mt, Pt]) => ({ id: t(), name: q, qty: N, unitCost: Mt, unitPrice: Pt }))
});
e.projects = [
m("Oqtepa Lavash SMM", "Oqtepa Lavash", "active", 12e7, 5, [
["Reels (oyiga 12 ta)", 12, 3e5, 9e5],
["Post dizayn", 20, 9e4, 35e4],
["Target boshqaruvi", 1, 4e6, 12e6],
["Kontent reja", 1, 5e5, 2e6]
]),
m("Texnomart kampaniya", "Texnomart", "active", 14e7, 3, [
["Reklama byudjeti", 1, 3e7, 33e6],
["Video \u0440\u043E\u043B\u0438\u043A", 4, 15e5, 4e6],
["Bannerlar", 30, 7e4, 25e4]
]),
m("Kafe Rayhon brending", "Rayhon", "done", 18e6, 4, [
["Logo va brandbook", 1, 3e6, 1e7],
["Menyu dizayn", 1, 8e5, 3e6],
["Fotosessiya", 1, 15e5, 5e6]
])
];
let [u, y, b] = e.projects, l = [], r = (d, h, I, E, O, D, q, N = {}) => l.push({
id: t(),
type: I,
scope: E,
amount: D,
date: o(d, h),
categoryId: n(O),
note: q,
projectId: null,
employeeId: null,
source: "demo",
...N
});
for (let d = 5; d >= 0; d--) {
let h = 1 + d * 37 % 11 / 30;
r(d, 5, "income", "agency", "Retainer (oylik xizmat)", 18e6, "Oqtepa \u2014 oylik to'lov", { projectId: u.id }), d <= 3 && r(d, 10, "income", "agency", "Mijoz to'lovi", 3e7, "Texnomart \u2014 bosqich to'lovi", { projectId: y.id }), d === 4 && r(d, 6, "income", "agency", "Avans / oldindan to'lov", 9e6, "Rayhon \u2014 avans 50%", { projectId: b.id }), d === 3 && r(d, 20, "income", "agency", "Mijoz to'lovi", 9e6, "Rayhon \u2014 yakuniy to'lov", { projectId: b.id }), r(d, 7, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(35e5 * h), "Oqtepa \u2014 Meta reklama", { projectId: u.id }), d <= 3 && r(d, 12, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(9e6 * h), "Texnomart \u2014 Google Ads", { projectId: y.id }), r(d, 1, "expense", "agency", "Ofis ijarasi", 5e6, "Ofis ijarasi"), r(d, 3, "expense", "agency", "Dasturlar va obunalar", 115e4, "Canva, Adobe, ChatGPT, Notion"), r(d, 15, "expense", "agency", "Transport (agentlik)", Math.round(4e5 * h), "Syomkaga taksi"), r(d, 25, "expense", "agency", "Soliq", 21e5, "Aylanma soliq"), d === 4 && r(d, 18, "expense", "agency", "Kontent ishlab chiqarish", 15e5, "Rayhon fotosessiya studiya", { projectId: b.id }), d === 2 && r(d, 9, "expense", "agency", "Uskunalar", 75e5, "Yangi mikrofon va svet");
for (let I of i.filter((E) => E.payType === "monthly"))
r(d, 28, "expense", "agency", "Ish haqi / oylik", I.rate, "".concat(I.name, " \u2014 oylik"), { employeeId: I.id });
r(d, 2, "income", "personal", "Agentlikdan foyda", 12e6, "Agentlikdan olingan foyda"), r(d, 4, "expense", "personal", "Uy-joy va kommunal", Math.round(18e5 * h), "Kvartira + kommunal"), r(d, 8, "expense", "personal", "Oziq-ovqat", Math.round(26e5 * h), "Bozor va market"), r(d, 11, "expense", "personal", "Kafe va restoran", Math.round(11e5 * h), "Kafelar"), r(d, 14, "expense", "personal", "Transport / taksi / benzin", Math.round(9e5 * h), "Benzin va taksi"), r(d, 16, "expense", "personal", "Aloqa va internet", 25e4, "Telefon va internet"), r(d, 22, "expense", "personal", "Ko'ngilochar", Math.round(5e5 * h), "Kino, dam olish"), d % 2 === 0 && r(d, 19, "expense", "personal", "Kiyim-kechak", Math.round(12e5 * h), "Kiyim"), d === 1 && r(d, 21, "expense", "personal", "Oila va sovg'alar", 2e6, "To'yga sovg'a");
}
let p = [], [, , f, c, k, S] = i;
for (let d = 4; d >= 0; d--)
p.push({ id: t(), employeeId: f.id, date: o(d, 10), qty: 12, projectId: u.id, note: "Oqtepa reels" }), p.push({ id: t(), employeeId: c.id, date: o(d, 12), qty: 20, projectId: u.id, note: "Oqtepa postlar" }), d <= 3 && p.push({ id: t(), employeeId: c.id, date: o(d, 14), qty: 8, projectId: y.id, note: "Texnomart bannerlar" }), d <= 2 && p.push({ id: t(), employeeId: k.id, date: o(d, 13), qty: 25, projectId: u.id, note: "Post matnlari" }), d <= 2 && p.push({ id: t(), employeeId: S.id, date: o(d, 16), qty: 10, projectId: y.id, note: "Texnomart videolari montaji" }), d >= 1 && (r(d, 27, "expense", "agency", "Dona ish haqi (frilans)", 12 * f.rate, "".concat(f.name, " \u2014 reels"), { employeeId: f.id, projectId: u.id }), r(d, 27, "expense", "agency", "Dona ish haqi (frilans)", 20 * c.rate, "".concat(c.name, " \u2014 postlar"), { employeeId: c.id, projectId: u.id }));
return e.workLogs = p, e.transactions = l, e;
}
tt.exports = { seedDemo: bn };
});

// server/api.js
var gt = R((Jn, ft) => {
var $ = M("crypto"), g = J(), te = le(), { projectStats: kn, employeeStats: vn, dashboard: Sn } = V(), { seedDemo: wn } = nt(), ne = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), w = (e) => ({ status: 200, body: e }), v = (e, t) => ({ status: e, body: { error: t } }), it = {
transactions: ["type", "amount", "scope", "categoryId", "date", "note", "projectId", "employeeId", "source"],
categories: ["name", "type", "scope", "color"],
projects: ["name", "client", "status", "budget", "startDate", "endDate", "items", "note"],
employees: ["name", "role", "payType", "rate", "pieceRate", "unitName", "startDate", "endDate", "active", "phone", "note"],
workLogs: ["employeeId", "date", "qty", "rate", "projectId", "note"]
};
function at(e, t) {
let n = {};
for (let a of it[e]) t[a] !== void 0 && (n[a] = t[a]);
for (let a of ["amount", "budget", "rate", "pieceRate", "qty"]) n[a] != null && n[a] !== "" && (n[a] = Number(n[a]));
for (let a of ["projectId", "employeeId", "categoryId"]) n[a] === "" && (n[a] = null);
return n.rate === "" && delete n.rate, n;
}
function ot(e, t) {
if (e === "transactions") {
if (!["income", "expense"].includes(t.type)) return "Turi noto'g'ri";
if (!(t.amount > 0)) return "Summa 0 dan katta bo'lishi kerak";
if (!g.load().scopes.some((n) => n.id === t.scope)) return "Bo'lim noto'g'ri";
}
return ["categories", "projects", "employees"].includes(e) && !String(t.name || "").trim() ? "Nomi kiritilmagan" : e === "workLogs" && (!t.employeeId || !(t.qty > 0)) ? "Xodim va miqdor kerak" : null;
}
function rt(e) {
let { _bot: t, _users: n, _acct: a, ...o } = e;
return o;
}
var pe = (e) => ({ _bot: e._bot, _users: e._users, _acct: e._acct }), ct = ["", "egasi", "owner", "admin", "main"], ue = (e) => String(e || "").trim().toLowerCase(), lt = (e) => /^[a-z0-9_.-]{3,32}$/.test(e) && !ct.includes(e), Tn = (e) => Buffer.from(e).toString("base64url"), In = () => $.createHash("sha256").update("glass-token:" + (process.env.APP_PASSWORD || "")).digest(), dt = (e) => $.createHmac("sha256", In()).update(e).digest("hex"), En = 60;
function st(e, t) {
let n = Tn(JSON.stringify({ u: e, v: t || "", exp: Date.now() + En * 864e5 }));
return "v1.".concat(n, ".").concat(dt(n));
}
function _n(e) {
let [t, n, a] = String(e || "").split(".");
if (t !== "v1" || !n || !a) return null;
let o = dt(n);
if (a.length !== o.length || !$.timingSafeEqual(Buffer.from(a), Buffer.from(o))) return null;
try {
let s = JSON.parse(Buffer.from(n, "base64url").toString());
return s.exp > Date.now() ? s : null;
} catch {
return null;
}
}
var mt = (e, t) => $.pbkdf2Sync(String(e), t, 1e5, 32, "sha256").toString("hex"), de = (e, t) => e.length === t.length && $.timingSafeEqual(Buffer.from(e), Buffer.from(t));
function qn(e) {
let t = $.randomBytes(12).toString("hex");
return { salt: t, hash: mt(e, t), ver: $.randomBytes(4).toString("hex") };
}
var me = /* @__PURE__ */ new Map();
function jn(e) {
let t = me.get(e);
return t && t.n >= 8 && Date.now() - t.t < 600 * 1e3;
}
var On = (e) => me.set(e, { n: (me.get(e)?.n || 0) + 1, t: Date.now() }), pt = [], T = (e, t, n) => {
let a = [], o = new RegExp("^" + t.replace(/:(\w+)/g, (s, i) => (a.push(i), "([^/]+)")) + "/?$");
pt.push({ method: e, re: o, keys: a, fn: n });
};
T("POST", "/auth", async (e) => {
let t = process.env.APP_PASSWORD;
if (!t) return w({ ok: !0, required: !1, user: { name: "", owner: !0 } });
let n = ue(e.body?.username), a = String(e.body?.password || ""), o = n || "main";
if (jn(o)) return v(429, "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring");
if (ct.includes(n)) {
if (de(a, t)) return w({ ok: !0, required: !0, token: st("main"), user: { name: "egasi", owner: !0 } });
} else if (lt(n) && await g.exists(n)) {
let s = await g.session(n, () => g.load()._acct);
if (s && s.hash && de(mt(a, s.salt), s.hash))
return w({ ok: !0, required: !0, token: st(n, s.ver), user: { name: n, owner: !1 } });
}
return On(o), w({ ok: !1, required: !0 });
});
T("GET", "/state", (e) => {
let t = g.load(), n = e.query.month || ne().slice(0, 7);
return w({
...rt(t),
me: { name: e.user.name, owner: e.user.owner },
aiEnabled: te.hasKey(),
aiProvider: te.providerName(),
projects: t.projects.map((a) => ({ ...a, stats: kn(t, a) })),
employees: t.employees.map((a) => ({ ...a, stats: vn(t, a, n) }))
});
});
T("GET", "/dashboard", (e) => w(Sn(g.load(), e.query)));
for (let e of Object.keys(it))
T("POST", "/".concat(e), (t) => {
let n = g.load(), a = Array.isArray(t.body) ? t.body : [t.body || {}], o = [];
for (let s of a) {
let i = { id: g.uid(), ...at(e, s), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
(e === "transactions" || e === "workLogs") && (i.date ||= ne()), e === "projects" && (i.items ||= []);
let m = ot(e, i);
if (m) return v(400, m);
o.push(i);
}
return n[e].push(...o), g.save(), w(Array.isArray(t.body) ? o : o[0]);
}), T("PUT", "/".concat(e, "/:id"), (t) => {
let a = g.load()[e].find((i) => i.id === t.params.id);
if (!a) return v(404, "Topilmadi");
let o = { ...a, ...at(e, t.body || {}) }, s = ot(e, o);
return s ? v(400, s) : (Object.assign(a, o), g.save(), w(a));
}), T("DELETE", "/".concat(e, "/:id"), (t) => {
let n = g.load(), a = n[e].findIndex((s) => s.id === t.params.id);
if (a < 0) return v(404, "Topilmadi");
let [o] = n[e].splice(a, 1);
return e === "categories" && n.transactions.forEach((s) => s.categoryId === o.id && (s.categoryId = null)), e === "projects" && (n.transactions.forEach((s) => s.projectId === o.id && (s.projectId = null)), n.workLogs.forEach((s) => s.projectId === o.id && (s.projectId = null))), e === "employees" && (n.transactions.forEach((s) => s.employeeId === o.id && (s.employeeId = null)), n.workLogs = n.workLogs.filter((s) => s.employeeId !== o.id)), g.save(), w({ ok: !0 });
});
T("POST", "/employees/:id/pay", (e) => {
let t = g.load(), n = t.employees.find((m) => m.id === e.params.id);
if (!n) return v(404, "Xodim topilmadi");
let a = Number(e.body?.amount);
if (!(a > 0)) return v(400, "Summa kiriting");
let o = n.payType === "piece" ? "Dona ish haqi (frilans)" : "Ish haqi / oylik", s = t.categories.find((m) => m.name === o) || t.categories.find((m) => m.type === "expense" && m.scope !== "personal"), i = {
id: g.uid(),
type: "expense",
scope: t.scopes.find((m) => m.id === e.body?.scope)?.id || (t.scopes.find((m) => m.kind !== "personal") || t.scopes[0]).id,
amount: a,
date: e.body.date || ne(),
categoryId: s?.id || null,
employeeId: n.id,
projectId: e.body.projectId || null,
note: e.body.note || "".concat(n.name, " \u2014 to'lov"),
source: "payroll",
createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
return t.transactions.push(i), g.save(), w(i);
});
T("POST", "/ai/parse", async (e) => {
let t = String(e.body?.text || "").trim();
return t ? w(await te.parseTransactions(g.load(), t, e.body.scope)) : v(400, "Matn bo'sh");
});
T("POST", "/ai/chat", async (e) => {
let t = Array.isArray(e.body?.messages) ? e.body.messages.slice(-30) : [];
return !t.length || t.at(-1).role !== "user" ? v(400, "Xabar yo'q") : w(await te.chat(g.load(), t, { uid: g.uid, save: g.save }));
});
T("GET", "/export", () => ({
status: 200,
body: rt(g.load()),
headers: { "Content-Disposition": 'attachment; filename="glass-finance-'.concat(ne(), '.json"') }
}));
T("POST", "/import", (e) => {
let t = e.body;
return !t || !Array.isArray(t.transactions) || !Array.isArray(t.categories) ? v(400, "Fayl formati noto'g'ri") : (g.reset({ ...g.emptyDb(), ...t, ...pe(g.load()) }), w({ ok: !0 }));
});
T("POST", "/demo", () => (g.reset({ ...wn(g.emptyDb(), g.uid), ...pe(g.load()) }), w({ ok: !0 })));
T("POST", "/reset", () => (g.reset({ ...g.emptyDb(), ...pe(g.load()) }), w({ ok: !0 })));
var ut = ["business", "personal"], yt = (e) => String(e || "").trim().slice(0, 40);
T("POST", "/scopes", (e) => {
let t = g.load(), n = yt(e.body?.name);
if (!n) return v(400, "Nomi kiritilmagan");
if (t.scopes.some((i) => i.name.toLowerCase() === n.toLowerCase())) return v(400, "Bunday bo'lim bor");
let a = ut.includes(e.body?.kind) ? e.body.kind : "business", o = { id: "s" + g.uid(), name: n, kind: a };
t.scopes.push(o);
let s = (i, m, u) => t.categories.push({ id: g.uid(), name: "".concat(m, " (").concat(n, ")"), type: i, scope: o.id, color: u });
return s("income", "Daromad", "#34d399"), s("expense", "Xarajat", "#fb7185"), g.save(), w(o);
});
T("PUT", "/scopes/:id", (e) => {
let t = g.load(), n = t.scopes.find((o) => o.id === e.params.id);
if (!n) return v(404, "Topilmadi");
let a = yt(e.body?.name ?? n.name);
return a ? t.scopes.some((o) => o.id !== n.id && o.name.toLowerCase() === a.toLowerCase()) ? v(400, "Bunday bo'lim bor") : (n.name = a, ut.includes(e.body?.kind) && (n.kind = e.body.kind), g.save(), w(n)) : v(400, "Nomi kiritilmagan");
});
T("DELETE", "/scopes/:id", (e) => {
let t = g.load(), n = t.scopes.findIndex((s) => s.id === e.params.id);
if (n < 0) return v(404, "Topilmadi");
if (t.scopes.length < 2) return v(400, "Kamida bitta bo'lim qolishi kerak");
let a = t.scopes[n].id, o = e.body?.moveTo;
return o && (o === a || !t.scopes.some((s) => s.id === o)) ? v(400, "Ko'chirish bo'limi noto'g'ri") : (o ? (t.transactions.forEach((s) => s.scope === a && (s.scope = o)), t.categories.forEach((s) => s.scope === a && (s.scope = o))) : (t.transactions = t.transactions.filter((s) => s.scope !== a), t.categories = t.categories.filter((s) => s.scope !== a)), t.scopes.splice(n, 1), g.save(), w({ ok: !0 }));
});
var ye = (e) => e.user.owner ? null : v(403, "Faqat ilova egasi");
T("GET", "/users", (e) => {
let t = ye(e);
if (t) return t;
let n = g.load()._users || {};
return w(Object.entries(n).map(([a, o]) => ({ name: a, createdAt: o.createdAt })));
});
T("POST", "/users", async (e) => {
let t = ye(e);
if (t) return t;
let n = ue(e.body?.username), a = String(e.body?.password || "");
if (!lt(n)) return v(400, "Login 3-32 belgi: lotin harf, raqam, _ . -");
if (a.length < 6) return v(400, "Parol kamida 6 belgi bo'lsin");
let o = g.load(), s = !!o._users?.[n], i = qn(a);
return await g.session(n, () => {
g.load()._acct = i, g.save();
}), o._users ??= {}, o._users[n] ??= { createdAt: (/* @__PURE__ */ new Date()).toISOString() }, g.save(), w({ ok: !0, updated: s });
});
T("DELETE", "/users/:name", async (e) => {
let t = ye(e);
if (t) return t;
let n = ue(e.params.name), a = g.load();
return a._users?.[n] ? (await g.session(n, () => {
delete g.load()._acct, g.save();
}), delete a._users[n], g.save(), w({ ok: !0 })) : v(404, "Topilmadi");
});
async function An({ method: e, path: t, query: n = {}, body: a, headers: o = {} }) {
let s = (y) => o[y] ?? o[y.toLowerCase()], i = process.env.APP_PASSWORD, m = { id: "main", name: "egasi", owner: !0, ver: null };
if (i && t !== "/auth") {
let y = s("x-app-key") || "", b = _n(y);
if (b) m = b.u === "main" ? m : { id: b.u, name: b.u, owner: !1, ver: b.v };
else if (!(y && de(String(y), i))) return v(401, "auth");
}
let u = async () => {
if (!m.owner && g.load()._acct?.ver !== m.ver) return v(401, "auth");
for (let y of pt) {
if (y.method !== e) continue;
let b = t.match(y.re);
if (!b) continue;
let l = Object.fromEntries(y.keys.map((r, p) => [r, decodeURIComponent(b[p + 1])]));
try {
return await y.fn({ params: l, query: n, body: a, headers: o, user: m });
} catch (r) {
return console.error(r), v(500, r.message || "Server xatosi");
}
}
return v(404, "Topilmadi");
};
try {
return t === "/auth" ? await u() : await g.session(m.id, u);
} catch (y) {
return console.error(y), v(500, y.message || "Server xatosi");
}
}
ft.exports = { handle: An };
});

// server/bot.js
var Tt = R((Wn, wt) => {
var xn = B(), _ = J(), ae = le(), { dashboard: Dn, employeeStats: Nn, projectStats: Mn } = V(), L = (e) => Math.round(e || 0).toLocaleString("ru-RU").replace(/[\s,]/g, " ") + " so'm", ht = (e) => isFinite(e) ? (e * 100).toFixed(1).replace(".0", "") + "%" : "\u2014", A = (e) => String(e ?? "").replace(/[&<>]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[t]), Pn = (e, t) => e.scopes.find((n) => n.id === t)?.name || t;
function kt(e) {
return /^[?？]/.test(e.trim()) || !/\d/.test(e) ? !0 : /\?\s*$|qancha\b.*\?|qaysi|nega|tahlil|maslahat|hisobot|сколько|какой|почему/i.test(e);
}
function bt(e, t) {
let n = t.categories.find((s) => s.id === e.categoryId)?.name || "Kategoriyasiz", a = t.projects.find((s) => s.id === e.projectId)?.name, o = t.employees.find((s) => s.id === e.employeeId)?.name;
return "".concat(e.type === "income" ? "\u{1F7E2} +" : "\u{1F534} \u2212", "<b>").concat(L(e.amount), "</b> \xB7 ").concat(A(Pn(t, e.scope)), "\n") + "   ".concat(A(n), " \xB7 ").concat(e.date).concat(a ? " \xB7 \u{1F4C1} ".concat(A(a)) : "").concat(o ? " \xB7 \u{1F464} ".concat(A(o)) : "", "\n") + "   <i>".concat(A(e.note), "</i>");
}
function vt(e) {
let t = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), n = Dn(e, { from: t + "-01", to: t + "-31" }), a = n.categories.filter((i) => i.type === "expense").slice(0, 5), o = e.employees.filter((i) => i.active !== !1).map((i) => ({ e: i, s: Nn(e, i, t) })).filter((i) => i.s.balance > 0), s = e.projects.filter((i) => i.status !== "done").map((i) => ({ p: i, s: Mn(e, i) }));
return [
"\u{1F4CA} <b>Bu oy (".concat(t, ")</b>"),
"",
"\u{1F7E2} Kirim: <b>".concat(L(n.income), "</b>"),
"\u{1F534} Chiqim: <b>".concat(L(n.expense), "</b>"),
"\u{1F4B0} Sof foyda: <b>".concat(L(n.net), "</b> (").concat(ht(n.savingsRate), ")"),
"",
...n.scopes.map((i) => "".concat(i.kind === "personal" ? "\u{1F3E0}" : "\u{1F3E2}", " ").concat(A(i.name), ": ").concat(L(i.net))),
a.length ? "\n<b>Eng katta chiqimlar:</b>\n" + a.map((i) => "\u2022 ".concat(A(i.name), " \u2014 ").concat(L(i.total))).join("\n") : "",
s.length ? "\n<b>Faol loyihalar:</b>\n" + s.map(({ p: i, s: m }) => "\u2022 ".concat(A(i.name), ": foyda ").concat(L(m.profit), ", marja ").concat(ht(m.margin))).join("\n") : "",
o.length ? "\n<b>Xodimlarga qarz:</b>\n" + o.map(({ e: i, s: m }) => "\u2022 ".concat(A(i.name), " \u2014 ").concat(L(m.balance))).join("\n") : ""
].filter((i) => i !== "").join("\n");
}
function St({ telegram: e } = {}) {
let t = process.env.BOT_TOKEN;
if (!t) return null;
let { Telegraf: n, Markup: a } = xn.get("telegraf"), o = () => String(process.env.TELEGRAM_ALLOWED_IDS || "").split(/[,\s]+/).filter(Boolean), s = new n(t, e ? { telegram: e } : {}), i = () => {
let l = _.load();
return l._bot ??= {}, l._bot.pending ??= {}, l._bot.histories ??= {}, l._bot.owners ??= [], l._bot;
}, m = 24 * 3600 * 1e3;
s.use(async (l, r) => {
let p = String(l.from?.id || "");
if (!p) return;
let f = i(), c = [...o(), ...f.owners];
return c.includes(p) ? r() : c.length ? l.reply("\u26D4 Ruxsat yo'q. Sizning Telegram ID: <code>".concat(p, "</code>"), { parse_mode: "HTML" }) : (f.owners.push(p), _.save(), await l.reply("\u{1F510} Siz bot egasi sifatida ro'yxatdan o'tdingiz. Endi bot faqat sizga javob beradi."), r());
}), s.start(
(l) => l.reply(
"Salom! Men <b>Glass Finance</b> botiman \u{1F48E}\n\n\u{1F399} Ovozli xabar ham yuborishingiz mumkin.\n\n<b>Operatsiya qo'shish</b> \u2014 oddiy yozing:\n<i>tushlikka 85 ming, Oqtepa reklamaga 2 mln, Dilshodga 3 mln berdim</i>\n\n<b>Savol berish</b> \u2014 savol yozing yoki boshiga ? qo'ying:\n<i>? qaysi loyiha eng foydali</i>\n\n/hisobot \u2014 bu oygi qisqa hisobot\n/yangi \u2014 suhbatni yangidan boshlash",
{ parse_mode: "HTML" }
)
), s.command("hisobot", (l) => l.reply(vt(_.load()), { parse_mode: "HTML" })), s.command("yangi", (l) => (delete i().histories[l.from.id], _.save(), l.reply("Suhbat tozalandi \u2713")));
let u = (l, r) => l.react(r).catch(() => {
});
async function y(l, r) {
let p = null;
try {
p = await l.reply(r);
} catch {
}
return {
async set(f) {
p && await l.telegram.editMessageText(l.chat.id, p.message_id, void 0, f).catch(() => {
});
},
// Yakuniy javob: holat xabarini tahrirlaydi, bo'lmasa yangi xabar yuboradi
async done(f, c = {}) {
if (p)
try {
await l.telegram.editMessageText(l.chat.id, p.message_id, void 0, f, c);
return;
} catch {
await l.telegram.deleteMessage(l.chat.id, p.message_id).catch(() => {
});
}
await l.reply(f, c);
}
};
}
s.on("voice", async (l) => {
if (await u(l, "\u{1F440}"), ae.provider() !== "gemini")
return l.reply(
"\u{1F399} Ovozli xabarni tushunish uchun serverda GEMINI_API_KEY kerak. Hozircha matn qilib yuboring (klaviaturadagi mikrofon tugmasi)."
);
let r = await y(l, "\u{1F3A7} Eshityapman\u2026");
try {
let p = await l.telegram.getFileLink(l.message.voice.file_id), f = Buffer.from(await (await fetch(p)).arrayBuffer()), c = _.load(), k = [...c.employees.map((d) => d.name), ...c.projects.map((d) => d.name), ...c.scopes.map((d) => d.name)], S = await ae.transcribe(f, l.message.voice.mime_type || "audio/ogg", k);
return S ? (await r.set("\u{1F399} \xAB".concat(S, "\xBB\n\n\u{1F914} Tahlil qilyapman\u2026")), b(l, S, { status: r, heard: S })) : (await u(l, "\u{1F937}"), r.done("\u{1F649} Aniq gap eshitilmadi (shovqin yoki yo'tal bo'lishi mumkin). Iltimos, sekinroq va aniqroq qilib qaytadan yuboring."));
} catch (p) {
return console.error(p), r.done("\u26A0\uFE0F Ovozni o'qib bo'lmadi: " + p.message);
}
}), s.on("text", async (l) => {
let r = l.message.text.trim();
if (!r.startsWith("/"))
return await u(l, "\u{1F440}"), b(l, r);
});
async function b(l, r, p = {}) {
await l.sendChatAction("typing").catch(() => {
});
let f = kt(r), c = p.status || await y(l, f ? "\u{1F914} O'ylayapman\u2026" : "\u270D\uFE0F Yozib olyapman\u2026"), k = p.heard ? "\u{1F399} \xAB".concat(A(p.heard), "\xBB\n\n") : "", S = _.load();
try {
if (f) {
let q = i().histories[l.from.id] || [];
q.push({ role: "user", content: r.replace(/^[?？]\s*/, "") });
let N = await ae.chat(S, q, { uid: _.uid, save: _.save });
return q.push({ role: "assistant", content: N.reply }), i().histories[l.from.id] = q.slice(-20), _.save(), await u(l, "\u{1F44C}"), c.done((p.heard ? "\u{1F399} \xAB".concat(p.heard, "\xBB\n\n") : "") + N.reply.slice(0, 3800));
}
let d = "", { drafts: h, engine: I } = await ae.parseTransactions(S, r, d), E = h.filter((q) => q.amount > 0);
if (!E.length)
return await u(l, "\u{1F937}"), c.done("".concat(p.heard ? "\u{1F399} \xAB".concat(p.heard, "\xBB\n\n") : "", "Summani topa olmadim. Masalan: \xABtaksiga 40 ming\xBB."));
let O = _.uid(), D = i();
for (let [q, N] of Object.entries(D.pending)) Date.now() - N.ts > m && delete D.pending[q];
return D.pending[O] = { drafts: E, userId: l.from.id, ts: Date.now() }, _.save(), await u(l, "\u270D"), c.done(
"".concat(k).concat(I !== "offline" ? "\u2726 AI aniqladi" : "Aniqlandi (offline)", ":\n\n") + E.map((q) => bt(q, S)).join("\n\n"),
{
parse_mode: "HTML",
...a.inlineKeyboard([
a.button.callback("\u2705 Saqlash (".concat(E.length, ")"), "save:".concat(O)),
a.button.callback("\u274C Bekor", "cancel:".concat(O))
])
}
);
} catch (d) {
return console.error(d), c.done("\u26A0\uFE0F Xatolik: " + d.message);
}
}
return s.action(/^save:(.+)$/, async (l) => {
let r = i(), p = r.pending[l.match[1]];
if (!p || p.userId !== l.from.id) return l.answerCbQuery("Muddati o'tgan");
delete r.pending[l.match[1]];
let f = _.load(), c = (/* @__PURE__ */ new Date()).toISOString();
for (let k of p.drafts) f.transactions.push({ id: _.uid(), ...k, source: "telegram", createdAt: c });
return _.save(), await l.answerCbQuery("Saqlandi \u2713"), l.editMessageText(
"\u2705 Saqlandi:\n\n" + p.drafts.map((k) => bt(k, f)).join("\n\n"),
{ parse_mode: "HTML" }
);
}), s.action(/^cancel:(.+)$/, async (l) => (delete i().pending[l.match[1]], _.save(), await l.answerCbQuery("Bekor qilindi"), l.editMessageText("\u274C Bekor qilindi"))), s.catch((l) => console.error("Telegram bot xatosi:", l)), s;
}
async function Ln(e) {
let t = St();
if (!t) return null;
let n = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
try {
if (n && e) {
let a = n.replace(/^https?:\/\//, "").replace(/\/+$/, ""), o = M("crypto").createHash("sha256").update(process.env.BOT_TOKEN).digest("hex");
e.use(await t.createWebhook({ domain: a, path: "/telegram/".concat(o.slice(0, 32)), secret_token: o.slice(32) })), console.log("Telegram bot webhook rejimida: https://".concat(a));
} else
t.launch().catch((a) => console.error("Botni ishga tushirib bo'lmadi:", a.message)), process.once("SIGINT", () => t.stop("SIGINT")), process.once("SIGTERM", () => t.stop("SIGTERM")), console.log("Telegram bot polling rejimida ishga tushdi");
} catch (a) {
console.error("Telegram botni ulab bo'lmadi:", a.message);
}
return t;
}
wt.exports = { startBot: St, runBot: Ln, isQuestion: kt, monthReport: vt };
});

// edge/main.js
var he = U(B()), be = U(J()), qt = U(gt()), jt = U(Tt()), It = "glass", Ot = Deno.env.get("SUPABASE_URL"), fe = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default, Rn = ["GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "AI_PROVIDER", "BOT_TOKEN", "APP_PASSWORD", "TELEGRAM_ALLOWED_IDS"], At = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "content-type, x-app-key, authorization, apikey",
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
}, x = (e, t = 200, n = {}) => new Response(JSON.stringify(e), { status: t, headers: { ...At, "Content-Type": "application/json", ...n } });
async function xt(e, t, n) {
let a = { apikey: fe, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
fe?.startsWith("eyJ") && (a.Authorization = "Bearer ".concat(fe));
let o = await fetch("".concat(Ot, "/rest/v1/glass_finance").concat(t), { method: e, headers: a, body: n });
if (!o.ok) throw new Error("Supabase ".concat(o.status, ": ").concat((await o.text()).slice(0, 200)));
return e === "GET" ? o.json() : null;
}
var Dt = async (e) => (await xt("GET", "?id=eq.".concat(encodeURIComponent(e), "&select=data")))[0]?.data ?? null;
be.default.configure({
storeFactory: (e) => ({
name: "supabase",
load: () => Dt(e),
save: (t) => xt("POST", "?on_conflict=id", JSON.stringify([{ id: e, data: JSON.parse(t), updated_at: (/* @__PURE__ */ new Date()).toISOString() }]))
})
});
var Et = 0;
async function zn() {
if (Date.now() - Et < 6e4) return;
let e = await Dt("config").catch(() => null) || {};
for (let t of Rn) {
let n = Deno.env.get(t) || e[t];
n ? process.env[t] = String(n) : delete process.env[t];
}
Et = Date.now();
}
var ge = null;
function Nt() {
if (!process.env.BOT_TOKEN) return null;
if (ge?.token !== process.env.BOT_TOKEN) {
let e = Deno.env.get("TELEGRAM_API_ROOT");
ge = { token: process.env.BOT_TOKEN, bot: jt.default.startBot(e ? { telegram: { apiRoot: e } } : void 0) };
}
return ge.bot;
}
async function _t() {
let e = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("glass:" + process.env.BOT_TOKEN));
return [...new Uint8Array(e)].map((t) => t.toString(16).padStart(2, "0")).join("").slice(0, 48);
}
async function $n(e) {
let t = Nt();
t && (t.botInfo ??= await t.telegram.getMe(), await be.default.session("main", () => t.handleUpdate(e)));
}
function Xn({ genai: e, Telegraf: t, Markup: n }) {
he.default.set("@google/genai", e), he.default.set("telegraf", { Telegraf: t, Markup: n }), Deno.serve(Cn);
}
async function Cn(e) {
if (e.method === "OPTIONS") return new Response(null, { status: 204, headers: At });
let t = new URL(e.url), n = t.pathname.replace(new RegExp("^(/functions/v1)?/".concat(It)), "") || "/";
try {
if (await zn(), n === "/" || n === "/health") return x({ ok: !0, app: "Glass Finance API" });
if (n.startsWith("/api/")) {
let a;
["GET", "HEAD"].includes(e.method) || (a = await e.json().catch(() => {
}));
let o = await qt.default.handle({
method: e.method,
path: n.slice(4),
query: Object.fromEntries(t.searchParams),
body: a,
headers: Object.fromEntries(e.headers)
});
return x(o.body, o.status, o.headers);
}
if (n === "/telegram" && e.method === "POST") {
if (!process.env.BOT_TOKEN) return x({ error: "BOT_TOKEN yo'q" }, 503);
if (e.headers.get("x-telegram-bot-api-secret-token") !== await _t()) return x({ error: "forbidden" }, 403);
let a = await e.json(), o = $n(a).catch((s) => console.error("Telegram:", s));
return globalThis.EdgeRuntime?.waitUntil ? EdgeRuntime.waitUntil(o) : await o, x({ ok: !0 });
}
if (n === "/telegram/setup") {
if (!process.env.APP_PASSWORD || t.searchParams.get("key") !== process.env.APP_PASSWORD) return x({ error: "auth" }, 401);
let a = Nt();
if (!a) return x({ error: "BOT_TOKEN yo'q" }, 503);
let o = "".concat(Ot, "/functions/v1/").concat(It, "/telegram");
await a.telegram.setWebhook(o, {
secret_token: await _t(),
allowed_updates: ["message", "callback_query"],
drop_pending_updates: !0
});
let s = await a.telegram.getMe();
return x({ ok: !0, bot: "@" + s.username, webhook: o, info: await a.telegram.getWebhookInfo() });
}
return x({ error: "Topilmadi" }, 404);
} catch (a) {
return console.error(a), x({ error: a.message || "Server xatosi" }, 500);
}
}
export {
Xn as start
};

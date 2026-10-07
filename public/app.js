/* ============ Glass Finance — frontend ============ */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

const S = {
  data: null,
  scope: localGet("scope", "all"),
  period: localGet("period", "6m"),
  txFilter: { q: "", type: "", scope: "", category: "", project: "" },
  teamMonth: thisMonth(),
  chat: JSON.parse(localGet("chat", "[]")),
  voiceLang: localGet("voiceLang", "uz-UZ"),
};
const charts = [];

function localGet(k, d) {
  try { return localStorage.getItem("gf." + k) ?? d; } catch { return d; }
}
function localSet(k, v) {
  try { localStorage.setItem("gf." + k, v); } catch {}
}

// ---------- Formatlash ----------
const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const money = (n) => nf.format(Math.round(n || 0)).replace(/,/g, " ") + " so'm";
const num = (n) => nf.format(Math.round(n || 0));
function compact(n) {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace(".0", "") + " mlrd";
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + " mln";
  if (a >= 1e3) return Math.round(n / 1e3) + " ming";
  return String(Math.round(n));
}
const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1).replace(".0", "") + "%" : "—");
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
  return `${+day} ${months[+m - 1]} ${y !== String(new Date().getFullYear()) ? y : ""}`.trim();
};
const monthLabel = (k) => {
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const [y, m] = k.split("-");
  return `${months[+m - 1]} ${y.slice(2)}`;
};
const scopeName = { personal: "Shaxsiy", agency: "Agentlik", all: "Hammasi" };
const statusName = { active: "Jarayonda", done: "Yakunlangan", paused: "To'xtatilgan", lead: "Muzokarada" };

// ---------- API ----------
async function api(path, opts = {}) {
  const res = await fetch("/api" + path, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", "x-app-key": localGet("key", "") },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    renderLogin();
    throw new Error("Parol kerak");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Xatolik");
  return json;
}

async function refresh() {
  S.data = await api("/state?month=" + S.teamMonth);
  const badge = $("#aiBadge");
  badge.textContent = S.data.aiEnabled ? `✦ ${S.data.aiProvider} ulangan` : "AI offline";
  badge.className = "pill " + (S.data.aiEnabled ? "ok" : "warn");
  const navAi = $('#nav a[data-page="ai"] span');
  if (navAi) navAi.textContent = S.data.aiProvider ? `${S.data.aiProvider} AI` : "AI yordamchi";
}

function toast(msg, err) {
  const el = document.createElement("div");
  el.className = "toast glass" + (err ? " err" : "");
  el.textContent = msg;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 3500);
}

const cat = (id) => S.data.categories.find((c) => c.id === id);
const proj = (id) => S.data.projects.find((p) => p.id === id);
const emp = (id) => S.data.employees.find((e) => e.id === id);

// ---------- Davr filtri ----------
function periodRange(p) {
  const now = new Date();
  const back = (m) => new Date(now.getFullYear(), now.getMonth() - m, 1).toISOString().slice(0, 10);
  switch (p) {
    case "month": return { from: back(0), to: today() };
    case "3m": return { from: back(2), to: today() };
    case "6m": return { from: back(5), to: today() };
    case "year": return { from: `${now.getFullYear()}-01-01`, to: today() };
    default: return {};
  }
}
const PERIODS = [["month", "Bu oy"], ["3m", "3 oy"], ["6m", "6 oy"], ["year", "Yil"], ["all", "Hammasi"]];

function seg(name, options, current) {
  return `<div class="seg" data-seg="${name}">${options
    .map(([v, l]) => `<button data-v="${v}" class="${v === current ? "on" : ""}">${l}</button>`)
    .join("")}</div>`;
}
function bindSeg(root, name, fn) {
  $$(`[data-seg="${name}"] button`, root).forEach((b) =>
    b.addEventListener("click", () => fn(b.dataset.v))
  );
}

// ---------- Chart.js umumiy sozlamalar ----------
function cssVar(n) {
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
}
function chartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.color = cssVar("--text-2");
  Chart.defaults.borderColor = cssVar("--grid");
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15,20,40,.92)";
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 12;
  Chart.defaults.plugins.tooltip.titleColor = "#fff";
  Chart.defaults.plugins.tooltip.bodyColor = "#e6e9f5";
}
function mkChart(canvas, cfg) {
  if (!window.Chart || !canvas) return;
  const c = new Chart(canvas, cfg);
  charts.push(c);
  return c;
}
function destroyCharts() {
  while (charts.length) charts.pop().destroy();
}
const moneyTick = (v) => compact(v);
const moneyTip = (ctx) => ` ${ctx.dataset.label || ctx.label}: ${money(ctx.parsed.y ?? ctx.parsed)}`;

// ================= ROUTER =================
const pages = { dashboard, transactions, projects, team, ai: aiPage, settings };

async function route() {
  const name = (location.hash.slice(1) || "dashboard").split("/")[0];
  const fn = pages[name] || dashboard;
  $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.page === name));
  destroyCharts();
  const page = $("#page");
  page.style.animation = "none";
  page.offsetHeight;
  page.style.animation = "";
  try {
    if (!S.data) await refresh();
    await fn(page);
  } catch (e) {
    if (e.message !== "Parol kerak") page.innerHTML = `<div class="card glass empty">${esc(e.message)}</div>`;
  }
}

// ================= DASHBOARD =================
async function dashboard(page) {
  const range = periodRange(S.period);
  const q = new URLSearchParams({ scope: S.scope, ...range });
  const d = await api("/dashboard?" + q);

  const expCats = d.categories.filter((c) => c.type === "expense");
  const incCats = d.categories.filter((c) => c.type === "income");
  const recent = S.data.transactions
    .filter((t) => S.scope === "all" || t.scope === S.scope)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
    .slice(0, 7);

  page.innerHTML = `
    <div class="page-head">
      <div><h1>Moliyaviy holat</h1><p>${scopeName[S.scope]} · ${PERIODS.find((p) => p[0] === S.period)[1]}</p></div>
      <div class="toolbar">
        ${seg("scope", [["all", "Hammasi"], ["agency", "Agentlik"], ["personal", "Shaxsiy"]], S.scope)}
        ${seg("period", PERIODS, S.period)}
      </div>
    </div>

    <div class="grid kpis">
      ${kpi("Kirim", money(d.income), `${d.count} ta operatsiya`, "var(--income)")}
      ${kpi("Chiqim", money(d.expense), expCats[0] ? `Eng katta: ${esc(expCats[0].name)}` : "—", "var(--expense)")}
      ${kpi("Sof foyda", `<span class="${d.net >= 0 ? "up" : "down"}">${money(d.net)}</span>`, `Rentabellik ${pct(d.savingsRate)}`, "var(--accent)")}
      ${S.scope === "personal"
        ? kpi("Tejash darajasi", pct(d.savingsRate), "Kirimdan qolgan ulush", "var(--accent-2)")
        : kpi("Bu oy oyliklar", money(d.payroll.accrued), `To'langan ${compact(d.payroll.paid)} · qarz ${compact(d.payroll.debt)}`, "var(--accent-2)")}
    </div>

    ${aiAdviceCard()}

    <div class="grid cols-2" style="margin-top:18px">
      <div class="card glass">
        <div class="card-head"><div><h3>Oylar bo'yicha kirim va chiqim</h3><p class="sub">Har oy qancha kirdi va qancha sarflandi</p></div></div>
        <div class="chart-box"><canvas id="cMonthly"></canvas></div>
      </div>
      <div class="card glass">
        <div class="card-head"><div><h3>Chiqimlar tarkibi</h3><p class="sub">Kategoriyalar bo'yicha ulush</p></div></div>
        <div class="chart-box"><canvas id="cCats"></canvas></div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-top:18px">
      <div class="card glass">
        <div class="card-head"><div><h3>Sof foyda dinamikasi</h3><p class="sub">Kirim − chiqim, oyma-oy</p></div></div>
        <div class="chart-box sm"><canvas id="cNet"></canvas></div>
      </div>
      <div class="card glass">
        <div class="card-head"><div><h3>Agentlik va shaxsiy</h3><p class="sub">Tanlangan davr uchun</p></div></div>
        ${scopeSplit(d.byScope)}
      </div>
    </div>

    <div class="grid cols-2e" style="margin-top:18px">
      <div class="card glass">
        <div class="card-head"><div><h3>Loyihalar marjasi</h3><p class="sub">Barcha davr: daromad, tannarx va foyda</p></div><a class="btn sm" href="#projects">Barchasi →</a></div>
        ${d.projects.length ? `<div class="chart-box sm"><canvas id="cProj"></canvas></div>` : `<div class="empty">Hali loyiha yo'q</div>`}
      </div>
      <div class="card glass">
        <div class="card-head"><div><h3>So'nggi operatsiyalar</h3></div><a class="btn sm" href="#transactions">Barchasi →</a></div>
        ${recent.length ? recent.map(txRow).join("") : `<div class="empty">Hali kirim-chiqim yo'q.<br><br><button class="btn primary" data-act="add">+ Qo'shish</button> <button class="btn" data-act="demo">Demo ma'lumot</button></div>`}
      </div>
    </div>

    ${incCats.length || expCats.length ? `
    <div class="card glass" style="margin-top:18px">
      <div class="card-head"><div><h3>Kategoriyalar jadvali</h3><p class="sub">Tanlangan davr bo'yicha jami</p></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Kategoriya</th><th>Turi</th><th class="r">Operatsiyalar</th><th class="r">Summa</th><th class="r hide-sm">Ulush</th></tr></thead>
        <tbody>${d.categories.map((c) => {
          const base = c.type === "income" ? d.income : d.expense;
          return `<tr><td><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</td>
            <td>${c.type === "income" ? '<span class="up">Kirim</span>' : '<span class="down">Chiqim</span>'}</td>
            <td class="r num">${c.count}</td><td class="r num"><b>${money(c.total)}</b></td>
            <td class="r num hide-sm">${pct(base ? c.total / base : 0)}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </div>` : ""}
  `;

  bindSeg(page, "scope", (v) => { S.scope = v; localSet("scope", v); route(); });
  bindSeg(page, "period", (v) => { S.period = v; localSet("period", v); route(); });
  $$("[data-act=add]", page).forEach((b) => b.addEventListener("click", () => txModal()));
  $$("[data-act=demo]", page).forEach((b) => b.addEventListener("click", loadDemo));
  bindTxRows(page);
  bindAiAdvice(page, range);

  // Diagrammalar
  const income = cssVar("--income"), expense = cssVar("--expense"), accent = cssVar("--accent");
  const labels = d.monthly.map((m) => monthLabel(m.month));
  mkChart($("#cMonthly"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Kirim", data: d.monthly.map((m) => m.income), backgroundColor: income, borderRadius: 6, maxBarThickness: 26 },
        { label: "Chiqim", data: d.monthly.map((m) => m.expense), backgroundColor: expense, borderRadius: 6, maxBarThickness: 26 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: { y: { ticks: { callback: moneyTick }, grid: { color: cssVar("--grid") } }, x: { grid: { display: false } } },
      plugins: { tooltip: { callbacks: { label: moneyTip } }, legend: { position: "top", align: "end" } },
    },
  });

  // Top 7 + "Boshqa"
  const top = expCats.slice(0, 7);
  const rest = expCats.slice(7).reduce((s, c) => s + c.total, 0);
  const donut = rest ? [...top, { name: "Boshqa", total: rest, color: "#8a90a6" }] : top;
  mkChart($("#cCats"), {
    type: "doughnut",
    data: {
      labels: donut.map((c) => c.name),
      datasets: [{ data: donut.map((c) => c.total), backgroundColor: donut.map((c) => c.color), borderColor: "rgba(0,0,0,0)", borderWidth: 2, spacing: 2, borderRadius: 4 }],
    },
    options: {
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { position: "right", labels: { font: { size: 11.5 }, boxWidth: 8 } },
        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${money(c.parsed)} (${pct(c.parsed / d.expense)})` } },
      },
    },
  });

  mkChart($("#cNet"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Sof foyda",
          data: d.monthly.map((m) => m.income - m.expense),
          borderColor: accent,
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
            g.addColorStop(0, "rgba(124,156,255,.35)");
            g.addColorStop(1, "rgba(124,156,255,0)");
            return g;
          },
          fill: true, cubicInterpolationMode: "monotone", borderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: { y: { ticks: { callback: moneyTick }, grid: { color: cssVar("--grid") } }, x: { grid: { display: false } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: moneyTip } } },
    },
  });

  if (d.projects.length) {
    mkChart($("#cProj"), {
      type: "bar",
      data: {
        labels: d.projects.map((p) => p.name),
        datasets: [
          { label: "Daromad", data: d.projects.map((p) => p.revenue), backgroundColor: income, borderRadius: 6, maxBarThickness: 18 },
          { label: "Tannarx", data: d.projects.map((p) => p.cost), backgroundColor: expense, borderRadius: 6, maxBarThickness: 18 },
        ],
      },
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: { x: { ticks: { callback: moneyTick }, grid: { color: cssVar("--grid") } }, y: { grid: { display: false } } },
        plugins: {
          legend: { position: "top", align: "end" },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.dataset.label}: ${money(c.parsed.x)}`,
              footer: (items) => {
                const p = d.projects[items[0].dataIndex];
                return `Foyda: ${money(p.profit)} · Marja: ${pct(p.margin)}`;
              },
            },
          },
        },
      },
    });
  }
}

// ---------- Dashboard: AI tahlil kartasi ----------
function aiAdviceCard() {
  const name = S.data.aiProvider || "AI";
  const saved = localGet("advice." + S.scope + "." + S.period, "");
  return `<div class="card glass" style="margin-top:18px" id="aiCard">
    <div class="card-head">
      <div><h3>✦ ${esc(name)} tahlili va maslahatlari</h3>
        <p class="sub">${S.data.aiEnabled
          ? "Loyihalar, kirim-chiqimlar, oyliklar va diagrammalardagi raqamlar asosida qisqa xulosa"
          : "AI ulanmagan — Sozlamalar sahifasidagi ko'rsatmaga qarang"}</p></div>
      <button class="btn primary" id="aiRun" ${S.data.aiEnabled ? "" : "disabled"}>${saved ? "↻ Yangilash" : "✦ Tahlil qilish"}</button>
    </div>
    <div id="aiOut" class="msg assistant" style="max-width:none;${saved ? "" : "display:none"}">${saved ? md(saved) : ""}</div>
  </div>`;
}

function bindAiAdvice(page, range) {
  const btn = $("#aiRun", page);
  if (!btn) return;
  btn.onclick = async () => {
    const out = $("#aiOut", page);
    out.style.display = "";
    out.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    btn.disabled = true;
    const period = PERIODS.find((p) => p[0] === S.period)[1];
    const prompt =
      `Dashboard tahlili. Bo'lim: ${scopeName[S.scope]}, davr: ${period}` +
      (range.from ? ` (${range.from} — ${range.to})` : "") +
      `. Qisqa va aniq yoz (raqamlar bilan): 1) umumiy holat va trend, 2) eng katta xarajatlar va g'ayrioddiy o'zgarishlar, ` +
      `3) loyihalar marjasi — qaysi biri foydali, qaysi biri xavfli, 4) xodimlar va oyliklar bo'yicha qarzlar, 5) 3-5 ta amaliy maslahat.`;
    try {
      const r = await api("/ai/chat", { method: "POST", body: { messages: [{ role: "user", content: prompt }] } });
      out.innerHTML = md(r.reply);
      localSet("advice." + S.scope + "." + S.period, r.reply);
      btn.textContent = "↻ Yangilash";
    } catch (e) {
      out.innerHTML = `<p class="down">⚠️ ${esc(e.message)}</p>`;
    }
    btn.disabled = false;
  };
}

function kpi(label, value, hint, color) {
  return `<div class="kpi glass"><div class="label"><span class="dot" style="background:${color}"></span>${label}</div>
    <div class="value num">${value}</div><div class="hint">${hint}</div></div>`;
}

function scopeSplit(b) {
  const row = (name, s) => {
    const max = Math.max(s.income, s.expense, 1);
    return `<div style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${name}</b>
        <span class="num ${s.net >= 0 ? "up" : "down"}">${s.net >= 0 ? "+" : ""}${money(s.net)}</span></div>
      <div style="display:grid;grid-template-columns:70px 1fr 110px;gap:8px;align-items:center;font-size:13px">
        <span class="sub" style="margin:0">Kirim</span><div class="bar"><span style="width:${(s.income / max) * 100}%;background:var(--income)"></span></div><span class="num" style="text-align:right">${compact(s.income)}</span>
        <span class="sub" style="margin:0">Chiqim</span><div class="bar"><span style="width:${(s.expense / max) * 100}%;background:var(--expense)"></span></div><span class="num" style="text-align:right">${compact(s.expense)}</span>
      </div></div>`;
  };
  return row("Agentlik", b.agency) + row("Shaxsiy", b.personal);
}

function txRow(t) {
  const c = cat(t.categoryId);
  const color = c?.color || "#8a90a6";
  const tags = [
    `<span class="tag">${scopeName[t.scope]}</span>`,
    t.projectId && proj(t.projectId) ? `<span class="tag">◈ ${esc(proj(t.projectId).name)}</span>` : "",
    t.employeeId && emp(t.employeeId) ? `<span class="tag">☺ ${esc(emp(t.employeeId).name)}</span>` : "",
    t.source === "ai" || t.source === "voice" || t.source === "ai-chat" ? `<span class="tag">✦ AI</span>` : "",
  ].join("");
  return `<div class="tx-row" data-tx="${t.id}" style="cursor:pointer">
    <div class="tx-ico" style="background:${color}33;color:${color}">${esc((c?.name || "?")[0])}</div>
    <div class="tx-main"><b>${esc(t.note || c?.name || "Operatsiya")}</b><small>${esc(c?.name || "Kategoriyasiz")} · ${fmtDate(t.date)} ${tags}</small></div>
    <div class="tx-amt num ${t.type === "income" ? "up" : "down"}">${t.type === "income" ? "+" : "−"}${money(t.amount)}</div>
  </div>`;
}
function bindTxRows(root) {
  $$("[data-tx]", root).forEach((r) =>
    r.addEventListener("click", () => txModal(S.data.transactions.find((t) => t.id === r.dataset.tx)))
  );
}

// ================= KIRIM-CHIQIM =================
async function transactions(page) {
  const f = S.txFilter;
  const list = S.data.transactions
    .filter((t) =>
      (!f.type || t.type === f.type) &&
      (!f.scope || t.scope === f.scope) &&
      (!f.category || t.categoryId === f.category) &&
      (!f.project || t.projectId === f.project) &&
      (!f.q || (t.note + " " + (cat(t.categoryId)?.name || "")).toLowerCase().includes(f.q.toLowerCase()))
    )
    .sort((a, b) => (b.date + (b.createdAt || "")).localeCompare(a.date + (a.createdAt || "")));
  const inc = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const exp = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  page.innerHTML = `
    <div class="page-head">
      <div><h1>Kirim-chiqim</h1><p>Shaxsiy va agentlik operatsiyalari</p></div>
      <div class="toolbar"><button class="btn" id="voiceBtn">🎙 Ovoz / AI bilan</button><button class="btn primary" id="addBtn">+ Qo'shish</button></div>
    </div>

    <div class="card glass" style="margin-bottom:18px">
      <div class="card-head"><div><h3>✦ Tezkor kiritish</h3><p class="sub">Yozing yoki gapiring: "bugun tushlikka 85 ming, Oqtepa reklamaga 2 mln, Aziza oylik 6 mln berdim"</p></div></div>
      ${quickInputHtml("q")}
    </div>

    <div class="card glass">
      <div class="toolbar" style="margin-bottom:14px">
        <input id="fq" placeholder="Qidirish…" value="${esc(f.q)}" style="max-width:220px" />
        <select id="ftype" style="max-width:140px"><option value="">Turi: hammasi</option><option value="income" ${f.type === "income" ? "selected" : ""}>Kirim</option><option value="expense" ${f.type === "expense" ? "selected" : ""}>Chiqim</option></select>
        <select id="fscope" style="max-width:150px"><option value="">Bo'lim: hammasi</option><option value="agency" ${f.scope === "agency" ? "selected" : ""}>Agentlik</option><option value="personal" ${f.scope === "personal" ? "selected" : ""}>Shaxsiy</option></select>
        <select id="fcat" style="max-width:220px"><option value="">Kategoriya: hammasi</option>${S.data.categories.map((c) => `<option value="${c.id}" ${f.category === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
        <select id="fproj" style="max-width:200px"><option value="">Loyiha: hammasi</option>${S.data.projects.map((p) => `<option value="${p.id}" ${f.project === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
        <span class="pill ok num">+${compact(inc)}</span><span class="pill bad num">−${compact(exp)}</span><span class="pill num">${list.length} ta</span>
      </div>
      ${list.length ? list.slice(0, 400).map(txRow).join("") : `<div class="empty">Hech narsa topilmadi</div>`}
    </div>`;

  $("#addBtn").onclick = () => txModal();
  $("#voiceBtn").onclick = () => quickModal(true);
  bindQuickInput(page, "q");
  bindTxRows(page);
  const upd = (k, v) => { S.txFilter[k] = v; route(); };
  $("#fq").addEventListener("change", (e) => upd("q", e.target.value));
  $("#ftype").onchange = (e) => upd("type", e.target.value);
  $("#fscope").onchange = (e) => upd("scope", e.target.value);
  $("#fcat").onchange = (e) => upd("category", e.target.value);
  $("#fproj").onchange = (e) => upd("project", e.target.value);
}

function catOptions(type, scope, selected) {
  const list = S.data.categories.filter((c) => (!type || c.type === type) && (!scope || c.scope === scope));
  return `<option value="">— tanlang —</option>` + list.map((c) => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`).join("");
}
const projOptions = (sel) => `<option value="">— yo'q —</option>` + S.data.projects.map((p) => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.name)}</option>`).join("");
const empOptions = (sel) => `<option value="">— yo'q —</option>` + S.data.employees.map((e) => `<option value="${e.id}" ${e.id === sel ? "selected" : ""}>${esc(e.name)}</option>`).join("");

function txModal(t, preset = {}) {
  const x = t || { type: "expense", scope: S.scope === "personal" ? "personal" : "agency", date: today(), ...preset };
  const m = openModal(`
    <h2>${t ? "Operatsiyani tahrirlash" : "Yangi operatsiya"}</h2>
    <p class="sub">Kirim yoki chiqimni qo'lda kiriting</p>
    <div class="form-grid">
      <label class="f">Turi ${seg("ttype", [["expense", "Chiqim"], ["income", "Kirim"]], x.type)}</label>
      <label class="f">Bo'lim ${seg("tscope", [["agency", "Agentlik"], ["personal", "Shaxsiy"]], x.scope)}</label>
      <label class="f">Summa (so'm)<input id="tamount" type="number" min="0" step="1000" value="${x.amount || ""}" placeholder="0" /></label>
      <label class="f">Sana<input id="tdate" type="date" value="${x.date}" /></label>
      <label class="f full">Kategoriya<select id="tcat">${catOptions(x.type, x.scope, x.categoryId)}</select></label>
      <label class="f">Loyiha<select id="tproj">${projOptions(x.projectId)}</select></label>
      <label class="f">Xodim<select id="temp">${empOptions(x.employeeId)}</select></label>
      <label class="f full">Izoh<input id="tnote" value="${esc(x.note || "")}" placeholder="Masalan: Oqtepa uchun reels syomka" /></label>
    </div>
    <div class="modal-foot">
      ${t ? `<button class="btn danger" id="tdel" style="margin-right:auto">O'chirish</button>` : ""}
      <button class="btn" data-close>Bekor</button><button class="btn primary" id="tsave">Saqlash</button>
    </div>`);
  const refreshCats = () => ($("#tcat", m).innerHTML = catOptions(x.type, x.scope, x.categoryId));
  bindSeg(m, "ttype", (v) => { x.type = v; $$('[data-seg="ttype"] button', m).forEach((b) => b.classList.toggle("on", b.dataset.v === v)); refreshCats(); });
  bindSeg(m, "tscope", (v) => { x.scope = v; $$('[data-seg="tscope"] button', m).forEach((b) => b.classList.toggle("on", b.dataset.v === v)); refreshCats(); });
  $("#tcat", m).onchange = (e) => (x.categoryId = e.target.value);
  $("#tamount", m).focus();
  $("#tsave", m).onclick = async () => {
    const body = {
      type: x.type, scope: x.scope,
      amount: Number($("#tamount", m).value), date: $("#tdate", m).value,
      categoryId: $("#tcat", m).value, projectId: $("#tproj", m).value, employeeId: $("#temp", m).value,
      note: $("#tnote", m).value.trim(), source: t?.source || "manual",
    };
    try {
      await api(t ? "/transactions/" + t.id : "/transactions", { method: t ? "PUT" : "POST", body });
      closeModal(); toast("Saqlandi ✓"); await refresh(); route();
    } catch (e) { toast(e.message, true); }
  };
  if (t) $("#tdel", m).onclick = async () => {
    if (!confirm("O'chirilsinmi?")) return;
    await api("/transactions/" + t.id, { method: "DELETE" });
    closeModal(); toast("O'chirildi"); await refresh(); route();
  };
}

// ---------- Tezkor AI kiritish (matn + ovoz) ----------
function quickInputHtml(id) {
  return `
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
      <textarea id="${id}Text" placeholder="Masalan: Kecha taksiga 45 ming, Texnomart 20 mln to'ladi, Dilshodga 12 ta reels uchun 3 mln berdim" style="flex:1;min-width:240px;min-height:70px"></textarea>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:8px">
          <button class="btn mic" id="${id}Mic" title="Gapirish">🎙</button>
          <select id="${id}Lang" style="width:auto;padding:8px">${[["uz-UZ", "O'zb"], ["ru-RU", "Рус"], ["en-US", "Eng"]].map(([v, l]) => `<option value="${v}" ${v === S.voiceLang ? "selected" : ""}>${l}</option>`).join("")}</select>
        </div>
        <button class="btn primary" id="${id}Go">✦ Tahlil qilish</button>
      </div>
    </div>
    <div id="${id}Drafts" style="margin-top:14px"></div>`;
}

function bindQuickInput(root, id, autoMic) {
  const text = $(`#${id}Text`, root), micBtn = $(`#${id}Mic`, root), go = $(`#${id}Go`, root), langSel = $(`#${id}Lang`, root);
  let usedVoice = false;
  langSel.onchange = () => { S.voiceLang = langSel.value; localSet("voiceLang", langSel.value); };
  const rec = makeRecognizer({
    onText: (t) => { text.value = t; usedVoice = true; },
    onState: (on) => micBtn.classList.toggle("rec", on),
    onEnd: () => { if (text.value.trim()) go.click(); },
  });
  micBtn.onclick = () => {
    if (!rec) return toast("Brauzeringiz ovozli yozishni qo'llamaydi (Chrome/Edge/Safari'dan foydalaning)", true);
    rec.toggle(langSel.value, text.value);
  };
  if (autoMic && rec) setTimeout(() => rec.toggle(langSel.value, ""), 250);
  go.onclick = async () => {
    const value = text.value.trim();
    if (!value) return text.focus();
    go.disabled = true; go.textContent = "Tahlil qilinmoqda…";
    try {
      const scope = S.scope === "all" ? "" : S.scope;
      const r = await api("/ai/parse", { method: "POST", body: { text: value, scope } });
      renderDrafts($(`#${id}Drafts`, root), r.drafts, r.engine, usedVoice ? "voice" : "ai", () => { text.value = ""; usedVoice = false; });
    } catch (e) { toast(e.message, true); }
    go.disabled = false; go.textContent = "✦ Tahlil qilish";
  };
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) go.click(); });
}

function renderDrafts(box, drafts, engine, source, onSaved) {
  if (!drafts.length) { box.innerHTML = `<div class="empty">Summa topilmadi. Aniqroq yozib ko'ring.</div>`; return; }
  const draw = () => {
    box.innerHTML = `
      <p class="sub" style="margin:0 0 10px">${engine !== "offline" ? `✦ ${S.data.aiProvider || "AI"} aniqladi` : "Offline tahlil (aniqroq natija uchun GEMINI_API_KEY qo'shing)"} — tekshirib saqlang:</p>
      ${drafts.map((d, i) => `
        <div class="draft" data-i="${i}">
          <select data-k="type"><option value="expense" ${d.type === "expense" ? "selected" : ""}>Chiqim</option><option value="income" ${d.type === "income" ? "selected" : ""}>Kirim</option></select>
          <input data-k="amount" type="number" value="${d.amount}" />
          <select data-k="scope"><option value="agency" ${d.scope === "agency" ? "selected" : ""}>Agentlik</option><option value="personal" ${d.scope === "personal" ? "selected" : ""}>Shaxsiy</option></select>
          <select data-k="categoryId">${catOptions(d.type, d.scope, d.categoryId)}</select>
          <input data-k="date" type="date" value="${d.date}" />
          <input data-k="note" class="wide" value="${esc(d.note)}" placeholder="Izoh" />
          <select data-k="projectId">${projOptions(d.projectId)}</select>
          <select data-k="employeeId">${empOptions(d.employeeId)}</select>
          <button class="btn sm danger rm" data-rm="${i}">✕</button>
        </div>`).join("")}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="sub num" style="margin:0">Jami: <b class="up">+${money(drafts.filter((d) => d.type === "income").reduce((s, d) => s + Number(d.amount), 0))}</b> · <b class="down">−${money(drafts.filter((d) => d.type === "expense").reduce((s, d) => s + Number(d.amount), 0))}</b></span>
        <button class="btn primary" data-saveall>✓ Hammasini saqlash (${drafts.length})</button>
      </div>`;
    $$(".draft", box).forEach((row) => {
      const d = drafts[row.dataset.i];
      $$("[data-k]", row).forEach((el) =>
        el.addEventListener("change", () => {
          d[el.dataset.k] = el.dataset.k === "amount" ? Number(el.value) : el.value;
          if (el.dataset.k === "type" || el.dataset.k === "scope") { d.categoryId = ""; draw(); }
        })
      );
    });
    $$("[data-rm]", box).forEach((b) => (b.onclick = () => { drafts.splice(+b.dataset.rm, 1); draw(); }));
    $("[data-saveall]", box).onclick = async () => {
      try {
        await api("/transactions", { method: "POST", body: drafts.map((d) => ({ ...d, source })) });
        toast(`${drafts.length} ta operatsiya saqlandi ✓`);
        box.innerHTML = "";
        onSaved?.();
        if ($(".modal")) closeModal();
        await refresh(); route();
      } catch (e) { toast(e.message, true); }
    };
  };
  draw();
}

function quickModal(autoMic) {
  const m = openModal(`<h2>✦ Ovoz yoki matn bilan qo'shish</h2>
    <p class="sub">Bir nechta xarajatni birdaniga ayting — AI summani, kategoriyani, bo'limni, loyiha va xodimni o'zi aniqlaydi.</p>
    ${quickInputHtml("m")}`, true);
  bindQuickInput(m, "m", autoMic);
}

// Web Speech API
function makeRecognizer({ onText, onState, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let r = null, base = "", on = false;
  return {
    toggle(lang, existing) {
      if (on) { r.stop(); return; }
      r = new SR();
      r.lang = lang; r.continuous = true; r.interimResults = true;
      base = existing ? existing.trim() + " " : "";
      r.onresult = (e) => {
        let txt = "";
        for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
        onText(base + txt);
      };
      r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") toast("Mikrofon: " + e.error, true); };
      r.onend = () => { on = false; onState(false); onEnd?.(); };
      r.start(); on = true; onState(true);
    },
  };
}

// ================= LOYIHALAR =================
async function projects(page) {
  const [, id] = location.hash.slice(1).split("/");
  if (id && proj(id)) return projectDetail(page, proj(id));
  const ps = S.data.projects;
  const tot = ps.reduce((a, p) => ({ r: a.r + p.stats.revenue, c: a.c + p.stats.cost, rec: a.rec + p.stats.receivable }), { r: 0, c: 0, rec: 0 });
  page.innerHTML = `
    <div class="page-head">
      <div><h1>Loyihalar</h1><p>Har bir loyiha: smeta, tannarx, daromad va marja</p></div>
      <button class="btn primary" id="addProj">+ Yangi loyiha</button>
    </div>
    <div class="grid kpis" style="margin-bottom:18px">
      ${kpi("Jami daromad", money(tot.r), `${ps.length} ta loyiha`, "var(--income)")}
      ${kpi("Jami tannarx", money(tot.c), "Loyihalarga bog'langan chiqimlar", "var(--expense)")}
      ${kpi("Jami foyda", `<span class="${tot.r - tot.c >= 0 ? "up" : "down"}">${money(tot.r - tot.c)}</span>`, `O'rtacha marja ${pct(tot.r ? (tot.r - tot.c) / tot.r : 0)}`, "var(--accent)")}
      ${kpi("Debitorlik", money(tot.rec), "Mijozlar hali to'lashi kerak", "var(--warn)")}
    </div>
    <div class="grid proj-grid">
      ${ps.length ? ps.map(projCard).join("") : `<div class="card glass empty">Hali loyiha yo'q. "Yangi loyiha" tugmasini bosing.</div>`}
    </div>`;
  $("#addProj").onclick = () => projectModal();
  $$("[data-proj]", page).forEach((c) => (c.onclick = () => (location.hash = "projects/" + c.dataset.proj)));
}

function marginClass(m) { return m >= 0.3 ? "ok" : m >= 0.1 ? "warn" : "bad"; }

function projCard(p) {
  const s = p.stats;
  const paidShare = s.contract ? Math.min(1, s.revenue / s.contract) : 0;
  return `<div class="proj glass" data-proj="${p.id}">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div><h3>${esc(p.name)}</h3><div class="client">${esc(p.client || "—")}</div></div>
      <span class="pill">${statusName[p.status] || "Jarayonda"}</span>
    </div>
    <div class="stats num">
      <div><small>Daromad</small><b class="up">${compact(s.revenue)}</b></div>
      <div><small>Tannarx</small><b class="down">${compact(s.cost)}</b></div>
      <div><small>Foyda</small><b>${compact(s.profit)}</b></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span class="sub" style="margin:0">Marja</span><span class="pill ${marginClass(s.margin)}">${pct(s.margin)}</span>
    </div>
    <div class="bar"><span style="width:${paidShare * 100}%"></span></div>
    <div class="sub num" style="margin:6px 0 0;font-size:12px">Shartnoma ${compact(s.contract)} · to'langan ${pct(paidShare)}</div>
  </div>`;
}

function projectDetail(page, p) {
  const s = p.stats;
  const tx = S.data.transactions.filter((t) => t.projectId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const logs = S.data.workLogs.filter((w) => w.projectId === p.id);
  page.innerHTML = `
    <div class="page-head">
      <div><a href="#projects" class="sub">← Loyihalar</a><h1>${esc(p.name)}</h1><p>${esc(p.client || "")} · ${statusName[p.status] || ""}</p></div>
      <div class="toolbar">
        <button class="btn" id="pInc">+ Kirim</button><button class="btn" id="pExp">+ Chiqim</button>
        <button class="btn" id="pEdit">Tahrirlash</button>
      </div>
    </div>
    <div class="grid kpis">
      ${kpi("Daromad (fakt)", money(s.revenue), `Shartnoma: ${money(s.contract)}`, "var(--income)")}
      ${kpi("Tannarx (fakt)", money(s.cost), `Smeta bo'yicha: ${money(s.plannedCost)}`, "var(--expense)")}
      ${kpi("Foyda / marja", `<span class="${s.profit >= 0 ? "up" : "down"}">${money(s.profit)}</span>`, `Marja ${pct(s.margin)} · ustama ${pct(s.markup)}`, "var(--accent)")}
      ${kpi("Mijoz qarzi", money(s.receivable), `Reja marjasi ${pct(s.plannedMargin)}`, "var(--warn)")}
    </div>

    <div class="card glass" style="margin-top:18px">
      <div class="card-head"><div><h3>Smeta: har bir ish/xizmat tannarxi va marjasi</h3><p class="sub">Tannarx = sizga qanchaga tushadi, narx = mijozga qanchaga sotasiz</p></div>
        <button class="btn sm primary" id="addItem">+ Qator</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Ish / xizmat</th><th class="r">Soni</th><th class="r">Tannarx (dona)</th><th class="r">Narx (dona)</th><th class="r">Jami tannarx</th><th class="r">Jami narx</th><th class="r">Foyda</th><th class="r">Marja</th><th></th></tr></thead>
        <tbody id="items">
          ${s.items.map((it) => `<tr data-item="${it.id}">
            <td><input data-k="name" value="${esc(it.name)}" style="min-width:160px"/></td>
            <td class="r"><input data-k="qty" type="number" value="${it.qty}" style="width:70px;text-align:right"/></td>
            <td class="r"><input data-k="unitCost" type="number" value="${it.unitCost}" style="width:120px;text-align:right"/></td>
            <td class="r"><input data-k="unitPrice" type="number" value="${it.unitPrice}" style="width:120px;text-align:right"/></td>
            <td class="r num">${num(it.costTotal)}</td><td class="r num">${num(it.priceTotal)}</td>
            <td class="r num ${it.profit >= 0 ? "up" : "down"}">${num(it.profit)}</td>
            <td class="r"><span class="pill ${marginClass(it.margin)}">${pct(it.margin)}</span></td>
            <td><button class="btn sm danger" data-del-item="${it.id}">✕</button></td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td><b>Jami</b></td><td></td><td></td><td></td>
          <td class="r num"><b>${num(s.plannedCost)}</b></td><td class="r num"><b>${num(s.plannedPrice)}</b></td>
          <td class="r num"><b>${num(s.plannedProfit)}</b></td><td class="r"><span class="pill ${marginClass(s.plannedMargin)}">${pct(s.plannedMargin)}</span></td><td></td></tr></tfoot>
      </table></div>
    </div>

    <div class="grid cols-2e" style="margin-top:18px">
      <div class="card glass">
        <h3>Reja va fakt</h3><p class="sub">Smeta bilan haqiqiy natijani solishtirish</p>
        <div class="chart-box sm"><canvas id="cPlan"></canvas></div>
      </div>
      <div class="card glass">
        <h3>Tannarx tarkibi</h3><p class="sub">Loyihaga sarflangan pullar kategoriyalar bo'yicha${s.accruedLabor ? ` · dona ishlar bo'yicha hisoblangan mehnat: <b>${money(s.accruedLabor)}</b>` : ""}</p>
        ${Object.keys(s.byCategory).length ? `<div class="chart-box sm"><canvas id="cPCat"></canvas></div>` : `<div class="empty">Hali chiqim yo'q</div>`}
      </div>
    </div>

    <div class="grid cols-2e" style="margin-top:18px">
      <div class="card glass"><h3>Loyiha operatsiyalari</h3><p class="sub">${tx.length} ta</p>
        ${tx.length ? tx.map(txRow).join("") : `<div class="empty">Operatsiya yo'q</div>`}</div>
      <div class="card glass"><h3>Dona ishlar</h3><p class="sub">Xodimlar shu loyiha uchun bajargan ishlar</p>
        ${logs.length ? `<table><thead><tr><th>Sana</th><th>Xodim</th><th class="r">Soni</th><th class="r">Summa</th></tr></thead><tbody>
          ${logs.map((w) => { const e = emp(w.employeeId); return `<tr><td>${fmtDate(w.date)}</td><td>${esc(e?.name || "—")}<br><small class="sub">${esc(w.note || "")}</small></td><td class="r num">${w.qty} ${esc(e?.unitName || "")}</td><td class="r num">${num(w.qty * (w.rate ?? e?.rate ?? 0))}</td></tr>`; }).join("")}
        </tbody></table>` : `<div class="empty">Yo'q</div>`}
      </div>
    </div>`;

  $("#pEdit").onclick = () => projectModal(p);
  $("#pInc").onclick = () => txModal(null, { type: "income", scope: "agency", projectId: p.id });
  $("#pExp").onclick = () => txModal(null, { type: "expense", scope: "agency", projectId: p.id });
  bindTxRows(page);

  const saveItems = async (items) => {
    await api("/projects/" + p.id, { method: "PUT", body: { items } });
    await refresh(); route();
  };
  $("#addItem").onclick = () => saveItems([...(p.items || []), { id: Math.random().toString(36).slice(2, 10), name: "Yangi ish", qty: 1, unitCost: 0, unitPrice: 0 }]);
  $$("#items input").forEach((inp) =>
    inp.addEventListener("change", () => {
      const id = inp.closest("tr").dataset.item;
      const items = p.items.map((it) => (it.id === id ? { ...it, [inp.dataset.k]: inp.dataset.k === "name" ? inp.value : Number(inp.value) } : it));
      saveItems(items);
    })
  );
  $$("[data-del-item]").forEach((b) => (b.onclick = () => saveItems(p.items.filter((it) => it.id !== b.dataset.delItem))));

  const income = cssVar("--income"), expense = cssVar("--expense");
  mkChart($("#cPlan"), {
    type: "bar",
    data: {
      labels: ["Daromad", "Tannarx", "Foyda"],
      datasets: [
        { label: "Reja (smeta)", data: [s.plannedPrice, s.plannedCost, s.plannedProfit], backgroundColor: "rgba(124,156,255,.45)", borderRadius: 6, maxBarThickness: 34 },
        { label: "Fakt", data: [s.revenue, s.cost, s.profit], backgroundColor: [income, expense, cssVar("--accent")], borderRadius: 6, maxBarThickness: 34 },
      ],
    },
    options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { y: { ticks: { callback: moneyTick } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: moneyTip } } } },
  });
  const entries = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]);
  mkChart($("#cPCat"), {
    type: "doughnut",
    data: { labels: entries.map((e) => e[0]), datasets: [{ data: entries.map((e) => e[1]), backgroundColor: entries.map((e) => S.data.categories.find((c) => c.name === e[0])?.color || "#8a90a6"), borderWidth: 0, spacing: 2, borderRadius: 4 }] },
    options: { maintainAspectRatio: false, cutout: "65%", plugins: { legend: { position: "right" }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${money(c.parsed)} (${pct(c.parsed / s.cost)})` } } } },
  });
}

function projectModal(p) {
  const x = p || { status: "active", startDate: today() };
  const m = openModal(`
    <h2>${p ? "Loyihani tahrirlash" : "Yangi loyiha"}</h2><p class="sub">Shartnoma summasi — mijoz to'lashi kerak bo'lgan umumiy narx</p>
    <div class="form-grid">
      <label class="f">Loyiha nomi<input id="pn" value="${esc(x.name || "")}" placeholder="Masalan: Oqtepa SMM" /></label>
      <label class="f">Mijoz<input id="pc" value="${esc(x.client || "")}" /></label>
      <label class="f">Shartnoma summasi (so'm)<input id="pb" type="number" value="${x.budget || ""}" placeholder="Bo'sh qolsa smetadan olinadi" /></label>
      <label class="f">Holati<select id="ps">${Object.entries(statusName).map(([k, v]) => `<option value="${k}" ${x.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="f">Boshlanish<input id="pd" type="date" value="${x.startDate || ""}" /></label>
      <label class="f">Tugash<input id="pe" type="date" value="${x.endDate || ""}" /></label>
      <label class="f full">Izoh<input id="pnote" value="${esc(x.note || "")}" /></label>
    </div>
    <div class="modal-foot">${p ? `<button class="btn danger" id="pdel" style="margin-right:auto">O'chirish</button>` : ""}<button class="btn" data-close>Bekor</button><button class="btn primary" id="psave">Saqlash</button></div>`);
  $("#pn", m).focus();
  $("#psave", m).onclick = async () => {
    const body = { name: $("#pn", m).value.trim(), client: $("#pc", m).value.trim(), budget: $("#pb", m).value, status: $("#ps", m).value, startDate: $("#pd", m).value, endDate: $("#pe", m).value, note: $("#pnote", m).value };
    try {
      const r = await api(p ? "/projects/" + p.id : "/projects", { method: p ? "PUT" : "POST", body });
      closeModal(); toast("Saqlandi ✓"); await refresh();
      if (!p) location.hash = "projects/" + r.id; else route();
    } catch (e) { toast(e.message, true); }
  };
  if (p) $("#pdel", m).onclick = async () => {
    if (!confirm("Loyiha o'chirilsinmi? Operatsiyalar saqlanib qoladi.")) return;
    await api("/projects/" + p.id, { method: "DELETE" });
    closeModal(); await refresh(); location.hash = "projects";
  };
}

// ================= JAMOA =================
async function team(page) {
  const list = S.data.employees;
  const active = list.filter((e) => e.active !== false);
  const t = active.reduce((a, e) => ({ acc: a.acc + e.stats.monthAccrued, paid: a.paid + e.stats.monthPaid, debt: a.debt + Math.max(0, e.stats.balance) }), { acc: 0, paid: 0, debt: 0 });
  page.innerHTML = `
    <div class="page-head">
      <div><h1>Jamoa va oyliklar</h1><p>Oylik yoki dona bo'yicha ishlaydigan xodimlar, hisoblangan va to'langan pullar</p></div>
      <div class="toolbar"><input type="month" id="tm" value="${S.teamMonth}" style="width:auto" /><button class="btn primary" id="addEmp">+ Xodim</button></div>
    </div>
    <div class="grid kpis" style="margin-bottom:18px">
      ${kpi("Xodimlar", active.length + " ta", `${active.filter((e) => e.payType === "monthly").length} oylik · ${active.filter((e) => e.payType === "piece").length} dona`, "var(--accent)")}
      ${kpi("Shu oy hisoblangan", money(t.acc), "Oylik + bajarilgan dona ishlar", "var(--accent-2)")}
      ${kpi("Shu oy to'langan", money(t.paid), "Ish haqi chiqimlari", "var(--income)")}
      ${kpi("Jami qarzimiz", money(t.debt), "Hisoblangan − to'langan (barcha davr)", "var(--expense)")}
    </div>
    <div class="card glass">
      <div class="table-wrap"><table>
        <thead><tr><th>Xodim</th><th>To'lov turi</th><th class="r">Stavka</th><th class="r">Oy: hisoblangan</th><th class="r">Oy: to'langan</th><th class="r">Umumiy qoldiq</th><th></th></tr></thead>
        <tbody>${list.length ? list.map((e) => {
          const s = e.stats;
          return `<tr style="${e.active === false ? "opacity:.5" : ""}">
            <td><b style="cursor:pointer" data-emp="${e.id}">${esc(e.name)}</b><br><small class="sub">${esc(e.role || "")}</small></td>
            <td>${e.payType === "piece" ? `<span class="tag">Dona · ${esc(e.unitName || "dona")}</span>` : `<span class="tag">Oylik</span>`}</td>
            <td class="r num">${money(e.rate)}${e.payType === "piece" ? `<br><small class="sub">1 ${esc(e.unitName || "dona")} uchun</small>` : ""}</td>
            <td class="r num">${money(s.monthAccrued)}${e.payType === "piece" ? `<br><small class="sub">${s.monthUnits} ${esc(e.unitName || "dona")}</small>` : ""}</td>
            <td class="r num">${money(s.monthPaid)}</td>
            <td class="r num"><b class="${s.balance > 0 ? "down" : "up"}">${money(Math.abs(s.balance))}</b><br><small class="sub">${s.balance > 0 ? "qarzmiz" : s.balance < 0 ? "avans berilgan" : "hisob-kitob teng"}</small></td>
            <td><div class="row-actions">
              ${e.payType === "piece" ? `<button class="btn sm" data-log="${e.id}">+ Ish</button>` : ""}
              <button class="btn sm primary" data-pay="${e.id}">To'lash</button>
              <button class="btn sm" data-emp="${e.id}">⋯</button>
            </div></td></tr>`;
        }).join("") : `<tr><td colspan="7" class="empty">Hali xodim yo'q</td></tr>`}</tbody>
      </table></div>
    </div>
    ${list.length ? `<div class="card glass" style="margin-top:18px"><h3>Xodimlar bo'yicha xarajat (shu oy)</h3><p class="sub">Hisoblangan va to'langan summalar</p><div class="chart-box sm"><canvas id="cTeam"></canvas></div></div>` : ""}`;

  $("#tm").onchange = async (e) => { S.teamMonth = e.target.value || thisMonth(); await refresh(); route(); };
  $("#addEmp").onclick = () => empModal();
  $$("[data-pay]", page).forEach((b) => (b.onclick = () => payModal(emp(b.dataset.pay))));
  $$("[data-log]", page).forEach((b) => (b.onclick = () => logModal(emp(b.dataset.log))));
  $$("[data-emp]", page).forEach((b) => (b.onclick = () => empDetail(emp(b.dataset.emp))));

  if (list.length) mkChart($("#cTeam"), {
    type: "bar",
    data: { labels: active.map((e) => e.name), datasets: [
      { label: "Hisoblangan", data: active.map((e) => e.stats.monthAccrued), backgroundColor: cssVar("--accent-2"), borderRadius: 6, maxBarThickness: 26 },
      { label: "To'langan", data: active.map((e) => e.stats.monthPaid), backgroundColor: cssVar("--income"), borderRadius: 6, maxBarThickness: 26 },
    ] },
    options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { y: { ticks: { callback: moneyTick } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: moneyTip } }, legend: { position: "top", align: "end" } } },
  });
}

function empModal(e) {
  const x = e || { payType: "monthly", startDate: today(), active: true };
  const m = openModal(`
    <h2>${e ? "Xodimni tahrirlash" : "Yangi xodim"}</h2><p class="sub">Oylik — har oy belgilangan summa; dona — bajarilgan ish soni × dona narxi</p>
    <div class="form-grid">
      <label class="f">Ism familiya<input id="en" value="${esc(x.name || "")}" /></label>
      <label class="f">Lavozim<input id="er" value="${esc(x.role || "")}" placeholder="SMM, dizayner, mobilograf…" /></label>
      <label class="f">To'lov turi ${seg("ept", [["monthly", "Oylik"], ["piece", "Dona bo'yicha"]], x.payType)}</label>
      <label class="f"><span id="rateLbl">${x.payType === "piece" ? "1 dona narxi (so'm)" : "Oylik maosh (so'm)"}</span><input id="erate" type="number" value="${x.rate || ""}" /></label>
      <label class="f" id="unitWrap" style="${x.payType === "piece" ? "" : "display:none"}">Birlik nomi<input id="eu" value="${esc(x.unitName || "")}" placeholder="reels, post, video, matn…" /></label>
      <label class="f">Ishga kirgan sana<input id="es" type="date" value="${x.startDate || ""}" /></label>
      <label class="f">Telefon<input id="ep" value="${esc(x.phone || "")}" /></label>
      <label class="f">Holati<select id="ea"><option value="1" ${x.active !== false ? "selected" : ""}>Ishlayapti</option><option value="0" ${x.active === false ? "selected" : ""}>Ketgan</option></select></label>
    </div>
    <div class="modal-foot">${e ? `<button class="btn danger" id="edel" style="margin-right:auto">O'chirish</button>` : ""}<button class="btn" data-close>Bekor</button><button class="btn primary" id="esave">Saqlash</button></div>`);
  bindSeg(m, "ept", (v) => {
    x.payType = v;
    $$('[data-seg="ept"] button', m).forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    $("#rateLbl", m).textContent = v === "piece" ? "1 dona narxi (so'm)" : "Oylik maosh (so'm)";
    $("#unitWrap", m).style.display = v === "piece" ? "" : "none";
  });
  $("#en", m).focus();
  $("#esave", m).onclick = async () => {
    const active = $("#ea", m).value === "1";
    const body = { name: $("#en", m).value.trim(), role: $("#er", m).value.trim(), payType: x.payType, rate: $("#erate", m).value, unitName: $("#eu", m).value.trim(), startDate: $("#es", m).value, phone: $("#ep", m).value, active, endDate: active ? "" : x.endDate || today() };
    try {
      await api(e ? "/employees/" + e.id : "/employees", { method: e ? "PUT" : "POST", body });
      closeModal(); toast("Saqlandi ✓"); await refresh(); route();
    } catch (err) { toast(err.message, true); }
  };
  if (e) $("#edel", m).onclick = async () => {
    if (!confirm("Xodim va uning dona ishlari o'chirilsinmi? To'lovlar chiqim sifatida qoladi.")) return;
    await api("/employees/" + e.id, { method: "DELETE" });
    closeModal(); await refresh(); route();
  };
}

function payModal(e) {
  const s = e.stats;
  const suggested = Math.max(0, s.monthBalance) || Math.max(0, s.balance);
  const m = openModal(`
    <h2>${esc(e.name)} — to'lov</h2>
    <p class="sub">Shu oy hisoblangan: <b>${money(s.monthAccrued)}</b> · to'langan: <b>${money(s.monthPaid)}</b> · umumiy qoldiq: <b>${money(s.balance)}</b></p>
    <div class="form-grid">
      <label class="f">Summa (so'm)<input id="pa" type="number" value="${suggested || ""}" /></label>
      <label class="f">Sana<input id="pdt" type="date" value="${today()}" /></label>
      <label class="f">Loyiha (tannarxga qo'shiladi)<select id="pp">${projOptions("")}</select></label>
      <label class="f">Izoh<input id="pnt" value="${esc(e.name)} — ${e.payType === "piece" ? "dona ishlar uchun" : "oylik"}" /></label>
    </div>
    <p class="sub" style="margin-top:12px">To'lov avtomatik ravishda agentlikning "${e.payType === "piece" ? "Dona ish haqi" : "Ish haqi / oylik"}" chiqimi sifatida yoziladi.</p>
    <div class="modal-foot"><button class="btn" data-close>Bekor</button><button class="btn primary" id="psv">To'lovni saqlash</button></div>`);
  $("#pa", m).focus();
  $("#psv", m).onclick = async () => {
    try {
      await api(`/employees/${e.id}/pay`, { method: "POST", body: { amount: $("#pa", m).value, date: $("#pdt", m).value, projectId: $("#pp", m).value, note: $("#pnt", m).value } });
      closeModal(); toast("To'lov yozildi ✓"); await refresh(); route();
    } catch (err) { toast(err.message, true); }
  };
}

function logModal(e) {
  const m = openModal(`
    <h2>${esc(e.name)} — bajarilgan ish</h2><p class="sub">1 ${esc(e.unitName || "dona")} = ${money(e.rate)}</p>
    <div class="form-grid">
      <label class="f">Soni (${esc(e.unitName || "dona")})<input id="lq" type="number" min="0" value="1" /></label>
      <label class="f">Sana<input id="ld" type="date" value="${today()}" /></label>
      <label class="f">Loyiha<select id="lp">${projOptions("")}</select></label>
      <label class="f">Dona narxi (boshqacha bo'lsa)<input id="lr" type="number" placeholder="${e.rate}" /></label>
      <label class="f full">Izoh<input id="ln" /></label>
    </div>
    <p class="sub" id="lsum" style="margin-top:12px"></p>
    <div class="modal-foot"><button class="btn" data-close>Bekor</button><button class="btn primary" id="lsv">Saqlash</button></div>`);
  const upd = () => ($("#lsum", m).innerHTML = `Hisoblanadi: <b>${money(Number($("#lq", m).value) * (Number($("#lr", m).value) || e.rate))}</b>`);
  $("#lq", m).oninput = upd; $("#lr", m).oninput = upd; upd();
  $("#lsv", m).onclick = async () => {
    try {
      const rate = $("#lr", m).value;
      await api("/workLogs", { method: "POST", body: { employeeId: e.id, qty: $("#lq", m).value, date: $("#ld", m).value, projectId: $("#lp", m).value || null, note: $("#ln", m).value, ...(rate ? { rate } : {}) } });
      closeModal(); toast("Ish qo'shildi ✓"); await refresh(); route();
    } catch (err) { toast(err.message, true); }
  };
}

function empDetail(e) {
  const pays = S.data.transactions.filter((t) => t.employeeId === e.id).sort((a, b) => b.date.localeCompare(a.date));
  const logs = S.data.workLogs.filter((w) => w.employeeId === e.id).sort((a, b) => b.date.localeCompare(a.date));
  const m = openModal(`
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div><h2>${esc(e.name)}</h2><p class="sub">${esc(e.role || "")} · ${e.payType === "piece" ? `dona: ${money(e.rate)} / ${esc(e.unitName || "dona")}` : `oylik: ${money(e.rate)}`} · ${e.startDate ? "ishga kirgan " + fmtDate(e.startDate) : ""}</p></div>
      <div class="toolbar"><button class="btn sm" id="dEdit">Tahrirlash</button>${e.payType === "piece" ? `<button class="btn sm" id="dLog">+ Ish</button>` : ""}<button class="btn sm primary" id="dPay">To'lash</button></div>
    </div>
    <div class="grid kpis" style="grid-template-columns:repeat(3,1fr)">
      ${kpi("Jami hisoblangan", money(e.stats.accruedTotal), e.payType === "piece" ? `${e.stats.unitsTotal} ${esc(e.unitName || "dona")}` : "Oylar × maosh", "var(--accent-2)")}
      ${kpi("Jami to'langan", money(e.stats.paidTotal), `${e.stats.paymentsCount} ta to'lov`, "var(--income)")}
      ${kpi("Qoldiq", money(e.stats.balance), e.stats.balance > 0 ? "Xodimga qarzmiz" : "Qarz yo'q", "var(--expense)")}
    </div>
    <div class="grid cols-2e" style="margin-top:16px">
      <div><h3>To'lovlar tarixi</h3>${pays.length ? pays.map(txRow).join("") : `<div class="empty">To'lov yo'q</div>`}</div>
      <div><h3>Bajarilgan ishlar</h3>${logs.length ? `<table><tbody>${logs.map((w) => `<tr><td>${fmtDate(w.date)}<br><small class="sub">${esc(proj(w.projectId)?.name || "")} ${esc(w.note || "")}</small></td><td class="r num">${w.qty} ${esc(e.unitName || "")}</td><td class="r num">${num(w.qty * (w.rate ?? e.rate))}</td><td><button class="btn sm danger" data-dlog="${w.id}">✕</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">${e.payType === "piece" ? "Ish kiritilmagan" : "Oylik xodim"}</div>`}</div>
    </div>`, true);
  $("#dEdit", m).onclick = () => { closeModal(); empModal(e); };
  $("#dPay", m).onclick = () => { closeModal(); payModal(e); };
  if ($("#dLog", m)) $("#dLog", m).onclick = () => { closeModal(); logModal(e); };
  $$("[data-dlog]", m).forEach((b) => (b.onclick = async () => { await api("/workLogs/" + b.dataset.dlog, { method: "DELETE" }); closeModal(); await refresh(); route(); }));
  $$("[data-tx]", m).forEach((r) => (r.onclick = () => { closeModal(); txModal(S.data.transactions.find((t) => t.id === r.dataset.tx)); }));
}

// ================= CLAUDE AI CHAT =================
const SUGGESTIONS = [
  "Bu oy qayerga eng ko'p pul ketdi?",
  "Qaysi loyiha eng marjinal va qaysi biri zarar?",
  "Xodimlarga qancha qarzimiz bor?",
  "Shaxsiy xarajatlarimni qanday kamaytirsam bo'ladi?",
  "Keyingi oy uchun pul oqimi prognozini ber",
  "Diagrammalardagi trendlarni tushuntirib ber",
];

async function aiPage(page) {
  page.innerHTML = `
    <div class="page-head"><div><h1>✦ AI bilan suhbat${S.data.aiProvider ? ` <span class="pill">${S.data.aiProvider}</span>` : ""}</h1><p>Barcha kirim-chiqim, loyihalar va oyliklar bo'yicha savol bering yoki yangi operatsiya qo'shtiring</p></div>
      <button class="btn sm" id="clearChat">Tozalash</button></div>
    <div class="chat glass">
      <div class="chat-log" id="log"></div>
      <div class="suggest" id="sugg">${SUGGESTIONS.map((s) => `<button class="btn sm">${esc(s)}</button>`).join("")}</div>
      <div class="chat-input">
        <button class="btn mic" id="cMic" title="Gapirish">🎙</button>
        <textarea id="cIn" rows="1" placeholder="Savol yozing… (Enter — yuborish, Shift+Enter — yangi qator)"></textarea>
        <button class="btn primary" id="cSend">Yuborish</button>
      </div>
    </div>`;
  const log = $("#log"), input = $("#cIn"), send = $("#cSend");
  const draw = (typing) => {
    log.innerHTML = (S.chat.length ? "" : `<div class="msg assistant">${md("Salom! Men sizning moliyaviy yordamchingizman. Kirim-chiqimlar, loyihalar marjasi, xodimlar oyliklari bo'yicha istalgan savolni bering. Masalan: **\"Oqtepa loyihasida qancha foyda qildik?\"** yoki **\"bugun benzinga 200 ming ketdi, qo'shib qo'y\"**.")}</div>`) +
      S.chat.map((m) => `<div class="msg ${m.role}">${m.role === "assistant" ? md(m.content) : esc(m.content)}</div>`).join("") +
      (typing ? `<div class="msg assistant typing"><span></span><span></span><span></span></div>` : "");
    log.scrollTop = log.scrollHeight;
    $("#sugg").style.display = S.chat.length ? "none" : "";
  };
  const ask = async (text) => {
    if (!text.trim()) return;
    S.chat.push({ role: "user", content: text.trim() });
    input.value = "";
    draw(true);
    send.disabled = true;
    try {
      const r = await api("/ai/chat", { method: "POST", body: { messages: S.chat } });
      S.chat.push({ role: "assistant", content: r.reply });
      if (r.changed) { await refresh(); toast("Ma'lumotlar yangilandi ✓"); }
    } catch (e) {
      S.chat.push({ role: "assistant", content: "⚠️ " + e.message });
    }
    localSet("chat", JSON.stringify(S.chat.slice(-40)));
    send.disabled = false;
    draw();
  };
  draw();
  send.onclick = () => ask(input.value);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  $$("#sugg button").forEach((b) => (b.onclick = () => ask(b.textContent)));
  $("#clearChat").onclick = () => { S.chat = []; localSet("chat", "[]"); draw(); };
  const rec = makeRecognizer({
    onText: (t) => (input.value = t),
    onState: (on) => $("#cMic").classList.toggle("rec", on),
    onEnd: () => { if (input.value.trim()) ask(input.value); },
  });
  $("#cMic").onclick = () => (rec ? rec.toggle(S.voiceLang, input.value) : toast("Brauzer ovozni qo'llamaydi", true));
  input.focus();
}

// Minimal markdown (xavfsiz: avval escape)
function md(src) {
  const lines = esc(src).split("\n");
  let html = "", list = null, table = [];
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/(^|\s)\*(\S[^*]*?)\*/g, "$1<i>$2</i>");
  const flushList = () => { if (list) { html += `</${list}>`; list = null; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => !/^\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim())));
    html += `<div class="table-wrap"><table><thead><tr>${rows[0].map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    table = [];
  };
  for (const raw of lines) {
    const l = raw.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(l)) { flushList(); table.push(l.trim()); continue; }
    flushTable();
    let m;
    if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== "ul") { flushList(); html += "<ul>"; list = "ul"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { flushList(); html += "<ol>"; list = "ol"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^#{1,4}\s+(.*)/))) { flushList(); html += `<p><b>${inline(m[1])}</b></p>`; }
    else if (!l.trim()) flushList();
    else { flushList(); html += `<p>${inline(l)}</p>`; }
  }
  flushList(); flushTable();
  return html;
}

// ================= SOZLAMALAR =================
async function settings(page) {
  const groups = [["agency", "expense", "Agentlik — chiqim"], ["agency", "income", "Agentlik — kirim"], ["personal", "expense", "Shaxsiy — chiqim"], ["personal", "income", "Shaxsiy — kirim"]];
  page.innerHTML = `
    <div class="page-head"><div><h1>Sozlamalar</h1><p>Kategoriyalar, ma'lumotlarni eksport/import</p></div></div>
    <div class="grid cols-2e">
      ${groups.map(([scope, type, title]) => `
        <div class="card glass"><div class="card-head"><h3>${title}</h3><button class="btn sm" data-addcat="${scope}|${type}">+ Kategoriya</button></div>
          ${S.data.categories.filter((c) => c.scope === scope && c.type === type).map((c) => `
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <input type="color" value="${c.color}" data-ccolor="${c.id}" style="width:42px;height:38px;padding:3px" />
              <input value="${esc(c.name)}" data-cname="${c.id}" />
              <button class="btn sm danger" data-cdel="${c.id}">✕</button>
            </div>`).join("")}
        </div>`).join("")}
    </div>
    <div class="card glass" style="margin-top:18px">
      <h3>Ma'lumotlar</h3><p class="sub">Zaxira nusxa oling yoki demo ma'lumot bilan sinab ko'ring</p>
      <div class="toolbar">
        <button class="btn" id="exp">⬇ Eksport (JSON)</button>
        <label class="btn">⬆ Import<input type="file" id="imp" accept=".json" hidden /></label>
        <button class="btn" id="exCsv">⬇ CSV (Excel uchun)</button>
        <button class="btn" id="demo">Demo ma'lumot yuklash</button>
        <button class="btn danger" id="reset">Hammasini o'chirish</button>
      </div>
    </div>
    <div class="card glass" style="margin-top:18px">
      <h3>AI yordamchi</h3>
      <p class="sub">${S.data.aiEnabled ? `✓ ${S.data.aiProvider} ulangan. Ovozli/matnli kiritish va chat to'liq AI rejimida ishlaydi.` : "AI hozir offline rejimda (oddiy kalit so'zlar bo'yicha tahlil). To'liq imkoniyat uchun serverdagi <code>.env</code> fayliga (yoki Render'da Environment bo'limiga) bepul <code>GEMINI_API_KEY</code> qo'shing (aistudio.google.com/apikey) va qayta ishga tushiring."}</p>
    </div>`;

  $$("[data-addcat]", page).forEach((b) => (b.onclick = async () => {
    const [scope, type] = b.dataset.addcat.split("|");
    const name = prompt("Kategoriya nomi:");
    if (!name) return;
    await api("/categories", { method: "POST", body: { name, scope, type, color: "#7c9cff" } });
    await refresh(); route();
  }));
  $$("[data-cname]", page).forEach((i) => i.addEventListener("change", async () => { await api("/categories/" + i.dataset.cname, { method: "PUT", body: { name: i.value } }); await refresh(); toast("Saqlandi ✓"); }));
  $$("[data-ccolor]", page).forEach((i) => i.addEventListener("change", async () => { await api("/categories/" + i.dataset.ccolor, { method: "PUT", body: { color: i.value } }); await refresh(); }));
  $$("[data-cdel]", page).forEach((b) => (b.onclick = async () => {
    if (!confirm("Kategoriya o'chirilsinmi? Operatsiyalar 'Kategoriyasiz' bo'lib qoladi.")) return;
    await api("/categories/" + b.dataset.cdel, { method: "DELETE" }); await refresh(); route();
  }));
  $("#exp").onclick = () => download(`glass-finance-${today()}.json`, JSON.stringify(stripStats(S.data), null, 2), "application/json");
  $("#exCsv").onclick = () => {
    const rows = [["Sana", "Turi", "Bo'lim", "Kategoriya", "Summa", "Loyiha", "Xodim", "Izoh"]].concat(
      S.data.transactions.slice().sort((a, b) => a.date.localeCompare(b.date)).map((t) => [t.date, t.type === "income" ? "Kirim" : "Chiqim", scopeName[t.scope], cat(t.categoryId)?.name || "", t.amount, proj(t.projectId)?.name || "", emp(t.employeeId)?.name || "", t.note || ""])
    );
    download(`kirim-chiqim-${today()}.csv`, "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n"), "text/csv");
  };
  $("#imp").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { await api("/import", { method: "POST", body: JSON.parse(await file.text()) }); await refresh(); toast("Import qilindi ✓"); route(); }
    catch (err) { toast(err.message, true); }
  };
  $("#demo").onclick = loadDemo;
  $("#reset").onclick = async () => {
    if (!confirm("Barcha ma'lumotlar o'chiriladi. Davom etasizmi?")) return;
    await api("/reset", { method: "POST" }); await refresh(); toast("Tozalandi"); route();
  };
}

function stripStats(d) {
  return {
    settings: d.settings, categories: d.categories, transactions: d.transactions, workLogs: d.workLogs,
    projects: d.projects.map(({ stats, ...p }) => p), employees: d.employees.map(({ stats, ...e }) => e),
  };
}
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function loadDemo() {
  if (S.data.transactions.length && !confirm("Joriy ma'lumotlar demo bilan almashtiriladi. Davom etasizmi?")) return;
  await api("/demo", { method: "POST" }); await refresh(); toast("Demo ma'lumot yuklandi ✓"); route();
}

// ================= MODAL =================
function openModal(html, wide) {
  closeModal();
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal glass ${wide ? "wide" : ""}" role="dialog">${html}</div>`;
  bg.addEventListener("mousedown", (e) => { if (e.target === bg) closeModal(); });
  $$("[data-close]", bg).forEach((b) => (b.onclick = closeModal));
  $("#modalRoot").append(bg);
  return $(".modal", bg);
}
function closeModal() { $("#modalRoot").innerHTML = ""; }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ================= LOGIN =================
function renderLogin() {
  $("#page").innerHTML = `<div class="login glass"><div class="logo" style="margin:0 auto 16px;width:56px;height:56px;border-radius:18px"></div>
    <h2 style="margin:0 0 6px">Glass Finance</h2><p class="sub">Kirish uchun parolni kiriting</p>
    <input type="password" id="pw" placeholder="Parol" style="margin:14px 0" /><button class="btn primary" id="pwGo" style="width:100%;justify-content:center">Kirish</button></div>`;
  const go = async () => {
    const pw = $("#pw").value;
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) }).then((r) => r.json());
    if (r.ok) { localSet("key", pw); S.data = null; route(); } else toast("Parol noto'g'ri", true);
  };
  $("#pwGo").onclick = go;
  $("#pw").onkeydown = (e) => e.key === "Enter" && go();
}

// ================= INIT =================
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localSet("theme", t);
  chartDefaults();
}
(function init() {
  const saved = localGet("theme", null);
  applyTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  $("#themeBtn").onclick = () => { applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"); route(); };
  $("#fab").onclick = () => quickModal(true);
  $("#fab").classList.add("liquid");
  window.addEventListener("hashchange", route);
  route();
})();

// Moliyaviy hisob-kitoblar: loyiha tannarxi/marjasi, xodim balanslari, dashboard.

const monthKey = (d) => String(d).slice(0, 7); // "YYYY-MM"

function inRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

// Loyiha bo'yicha: reja (smeta) va fakt
function projectStats(db, project) {
  const tx = db.transactions.filter((t) => t.projectId === project.id);
  const revenue = sum(tx.filter((t) => t.type === "income"));
  const cost = sum(tx.filter((t) => t.type === "expense"));

  const items = (project.items || []).map((it) => {
    const qty = Number(it.qty) || 0;
    const costTotal = qty * (Number(it.unitCost) || 0);
    const priceTotal = qty * (Number(it.unitPrice) || 0);
    const profit = priceTotal - costTotal;
    return {
      ...it,
      costTotal,
      priceTotal,
      profit,
      margin: priceTotal ? profit / priceTotal : 0,
      markup: costTotal ? profit / costTotal : 0,
    };
  });
  const plannedCost = items.reduce((s, i) => s + i.costTotal, 0);
  const plannedPrice = items.reduce((s, i) => s + i.priceTotal, 0);

  // Dona ishlar orqali hisoblangan (lekin hali to'lanmagan bo'lishi mumkin) mehnat
  const accruedLabor = db.workLogs
    .filter((w) => w.projectId === project.id)
    .reduce((s, w) => {
      const emp = db.employees.find((e) => e.id === w.employeeId);
      const rate = w.rate != null ? Number(w.rate) : unitRate(emp);
      return s + (Number(w.qty) || 0) * rate;
    }, 0);

  const contract = Number(project.budget) || plannedPrice;
  const profit = revenue - cost;

  const byCategory = {};
  for (const t of tx.filter((t) => t.type === "expense")) {
    const c = db.categories.find((c) => c.id === t.categoryId);
    const key = c?.name || "Kategoriyasiz";
    byCategory[key] = (byCategory[key] || 0) + Number(t.amount);
  }

  return {
    revenue,
    cost,
    profit,
    margin: revenue ? profit / revenue : 0,
    markup: cost ? profit / cost : 0,
    contract,
    receivable: Math.max(0, contract - revenue),
    plannedCost,
    plannedPrice,
    plannedProfit: plannedPrice - plannedCost,
    plannedMargin: plannedPrice ? (plannedPrice - plannedCost) / plannedPrice : 0,
    accruedLabor,
    budgetUsed: plannedCost ? cost / plannedCost : 0,
    items,
    byCategory,
    txCount: tx.length,
  };
}

function monthsBetween(startDate, endDate) {
  const [y1, m1] = startDate.slice(0, 7).split("-").map(Number);
  const [y2, m2] = endDate.slice(0, 7).split("-").map(Number);
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) + 1);
}

// Xodim bo'yicha: hisoblangan, to'langan, qarz (oy bo'yicha yoki jami)
// To'lov turlari: "monthly" — oylik maosh, "piece" — dona bo'yicha, "mixed" — oylik + dona
const hasSalary = (e) => e.payType === "monthly" || e.payType === "mixed";
const hasPiece = (e) => e.payType === "piece" || e.payType === "mixed";
const unitRate = (e) => Number(e?.payType === "mixed" ? e.pieceRate : e?.rate) || 0;
const salary = (e) => (hasSalary(e) ? Number(e.rate) || 0 : 0);

function employeeStats(db, emp, month) {
  const today = new Date().toISOString().slice(0, 10);
  const logs = hasPiece(emp) ? db.workLogs.filter((w) => w.employeeId === emp.id) : [];
  const payments = db.transactions.filter(
    (t) => t.employeeId === emp.id && t.type === "expense"
  );
  const logAmount = (w) => (Number(w.qty) || 0) * (w.rate != null ? Number(w.rate) : unitRate(emp));

  let salaryTotal = 0;
  if (hasSalary(emp)) {
    const start = emp.startDate || today;
    const end = emp.active === false && emp.endDate ? emp.endDate : today;
    salaryTotal = monthsBetween(start, end) * salary(emp);
  }
  const pieceTotal = logs.reduce((s, w) => s + logAmount(w), 0);
  const accruedTotal = salaryTotal + pieceTotal;
  const paidTotal = sum(payments);

  let monthAccrued = 0;
  let monthPaid = 0;
  let monthUnits = 0;
  if (month) {
    if (hasSalary(emp)) {
      const started = !emp.startDate || emp.startDate.slice(0, 7) <= month;
      monthAccrued += started ? salary(emp) : 0;
    }
    const ml = logs.filter((w) => monthKey(w.date) === month);
    monthAccrued += ml.reduce((s, w) => s + logAmount(w), 0);
    monthUnits = ml.reduce((s, w) => s + (Number(w.qty) || 0), 0);
    monthPaid = sum(payments.filter((t) => monthKey(t.date) === month));
  }

  return {
    accruedTotal,
    salaryTotal,
    pieceTotal,
    paidTotal,
    balance: accruedTotal - paidTotal, // + => xodimga qarzmiz, - => avans berilgan
    monthAccrued,
    monthPaid,
    monthBalance: monthAccrued - monthPaid,
    monthUnits,
    unitsTotal: logs.reduce((s, w) => s + (Number(w.qty) || 0), 0),
    paymentsCount: payments.length,
  };
}

function sum(list) {
  return list.reduce((s, t) => s + (Number(t.amount) || 0), 0);
}

function dashboard(db, { scope = "all", from, to } = {}) {
  const tx = db.transactions.filter(
    (t) => (scope === "all" || t.scope === scope) && inRange(t.date, from, to)
  );
  const income = sum(tx.filter((t) => t.type === "income"));
  const expense = sum(tx.filter((t) => t.type === "expense"));

  // Oylar kesimida
  const months = {};
  for (const t of tx) {
    const k = monthKey(t.date);
    months[k] ??= { month: k, income: 0, expense: 0 };
    months[k][t.type] += Number(t.amount);
  }
  const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));

  // Kategoriyalar kesimida
  const cats = {};
  for (const t of tx) {
    const c = db.categories.find((c) => c.id === t.categoryId);
    const key = t.categoryId || "none";
    cats[key] ??= {
      id: key,
      name: c?.name || "Kategoriyasiz",
      color: c?.color || "#94a3b8",
      type: t.type,
      total: 0,
      count: 0,
    };
    cats[key].total += Number(t.amount);
    cats[key].count++;
  }
  const categories = Object.values(cats).sort((a, b) => b.total - a.total);

  // Kunlik (oxirgi 30 kun) trend
  const daily = {};
  for (const t of tx) {
    daily[t.date] ??= { date: t.date, income: 0, expense: 0 };
    daily[t.date][t.type] += Number(t.amount);
  }

  const projects = db.projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    ...pick(projectStats(db, p), ["revenue", "cost", "profit", "margin", "receivable"]),
  }));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const payroll = db.employees
    .filter((e) => e.active !== false)
    .reduce(
      (acc, e) => {
        const s = employeeStats(db, e, thisMonth);
        acc.accrued += s.monthAccrued;
        acc.paid += s.monthPaid;
        acc.debt += Math.max(0, s.balance);
        return acc;
      },
      { accrued: 0, paid: 0, debt: 0 }
    );

  return {
    income,
    expense,
    net: income - expense,
    savingsRate: income ? (income - expense) / income : 0,
    count: tx.length,
    monthly,
    daily: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
    categories,
    projects,
    payroll,
    scopes: db.scopes.map((x) => ({ id: x.id, name: x.name, kind: x.kind, ...scopeTotals(db.transactions, x.id, from, to) })),
    byScope: Object.fromEntries(db.scopes.map((x) => [x.id, scopeTotals(db.transactions, x.id, from, to)])),
  };
}

function scopeTotals(all, scope, from, to) {
  const tx = all.filter((t) => t.scope === scope && inRange(t.date, from, to));
  const income = sum(tx.filter((t) => t.type === "income"));
  const expense = sum(tx.filter((t) => t.type === "expense"));
  return { income, expense, net: income - expense };
}

function pick(o, keys) {
  return Object.fromEntries(keys.map((k) => [k, o[k]]));
}

module.exports = { projectStats, employeeStats, dashboard, monthKey, hasSalary, hasPiece, unitRate };

// Ilovani sinab ko'rish uchun namunaviy ma'lumotlar (6 oy).
function seedDemo(d, uid) {
  const cat = (name) => d.categories.find((c) => c.name === name).id;
  const now = new Date();
  const dateAgo = (months, day) => {
    const dt = new Date(Date.UTC(now.getFullYear(), now.getMonth() - months, Math.min(day, 28)));
    const iso = dt.toISOString().slice(0, 10);
    const todayIso = now.toISOString().slice(0, 10);
    return iso > todayIso ? todayIso : iso; // kelajakdagi sanalar bo'lmasin
  };

  const emp = (name, role, payType, rate, unitName, startMonthsAgo) => ({
    id: uid(),
    name,
    role,
    payType,
    rate,
    unitName,
    startDate: dateAgo(startMonthsAgo, 1),
    active: true,
  });
  const employees = [
    emp("Aziza Karimova", "SMM menejer", "monthly", 6000000, "", 5),
    emp("Jasur Toshmatov", "Targetolog", "monthly", 8000000, "", 5),
    emp("Dilshod Rahimov", "Mobilograf", "piece", 250000, "reels", 5),
    emp("Madina Yusupova", "Dizayner", "piece", 80000, "post dizayn", 5),
    emp("Sardor Aliyev", "Copywriter", "piece", 50000, "matn", 3),
    // Aralash: oylik maosh + har bir montaj qilingan video uchun alohida haq
    { ...emp("Kamola Nazarova", "Montajchi", "mixed", 3000000, "video", 2), pieceRate: 150000 },
  ];
  d.employees = employees;

  const project = (name, client, status, budget, monthsAgo, items) => ({
    id: uid(),
    name,
    client,
    status,
    budget,
    startDate: dateAgo(monthsAgo, 3),
    items: items.map(([n, qty, unitCost, unitPrice]) => ({ id: uid(), name: n, qty, unitCost, unitPrice })),
  });
  d.projects = [
    project("Oqtepa Lavash SMM", "Oqtepa Lavash", "active", 120000000, 5, [
      ["Reels (oyiga 12 ta)", 12, 300000, 900000],
      ["Post dizayn", 20, 90000, 350000],
      ["Target boshqaruvi", 1, 4000000, 12000000],
      ["Kontent reja", 1, 500000, 2000000],
    ]),
    project("Texnomart kampaniya", "Texnomart", "active", 140000000, 3, [
      ["Reklama byudjeti", 1, 30000000, 33000000],
      ["Video ролик", 4, 1500000, 4000000],
      ["Bannerlar", 30, 70000, 250000],
    ]),
    project("Kafe Rayhon brending", "Rayhon", "done", 18000000, 4, [
      ["Logo va brandbook", 1, 3000000, 10000000],
      ["Menyu dizayn", 1, 800000, 3000000],
      ["Fotosessiya", 1, 1500000, 5000000],
    ]),
  ];
  const [p1, p2, p3] = d.projects;

  const tx = [];
  const add = (months, day, type, scope, category, amount, note, extra = {}) =>
    tx.push({
      id: uid(),
      type,
      scope,
      amount,
      date: dateAgo(months, day),
      categoryId: cat(category),
      note,
      projectId: null,
      employeeId: null,
      source: "demo",
      ...extra,
    });

  for (let m = 5; m >= 0; m--) {
    const r = 1 + ((m * 37) % 11) / 30;
    // Agentlik kirimlari
    add(m, 5, "income", "agency", "Retainer (oylik xizmat)", 18000000, "Oqtepa — oylik to'lov", { projectId: p1.id });
    if (m <= 3) add(m, 10, "income", "agency", "Mijoz to'lovi", 30000000, "Texnomart — bosqich to'lovi", { projectId: p2.id });
    if (m === 4) add(m, 6, "income", "agency", "Avans / oldindan to'lov", 9000000, "Rayhon — avans 50%", { projectId: p3.id });
    if (m === 3) add(m, 20, "income", "agency", "Mijoz to'lovi", 9000000, "Rayhon — yakuniy to'lov", { projectId: p3.id });

    // Agentlik chiqimlari
    add(m, 7, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(3500000 * r), "Oqtepa — Meta reklama", { projectId: p1.id });
    if (m <= 3) add(m, 12, "expense", "agency", "Reklama byudjeti (Meta/Google)", Math.round(9000000 * r), "Texnomart — Google Ads", { projectId: p2.id });
    add(m, 1, "expense", "agency", "Ofis ijarasi", 5000000, "Ofis ijarasi");
    add(m, 3, "expense", "agency", "Dasturlar va obunalar", 1150000, "Canva, Adobe, ChatGPT, Notion");
    add(m, 15, "expense", "agency", "Transport (agentlik)", Math.round(400000 * r), "Syomkaga taksi");
    add(m, 25, "expense", "agency", "Soliq", 2100000, "Aylanma soliq");
    if (m === 4) add(m, 18, "expense", "agency", "Kontent ishlab chiqarish", 1500000, "Rayhon fotosessiya studiya", { projectId: p3.id });
    if (m === 2) add(m, 9, "expense", "agency", "Uskunalar", 7500000, "Yangi mikrofon va svet");

    // Oyliklar
    for (const e of employees.filter((e) => e.payType === "monthly")) {
      add(m, 28, "expense", "agency", "Ish haqi / oylik", e.rate, `${e.name} — oylik`, { employeeId: e.id });
    }

    // Shaxsiy
    add(m, 2, "income", "personal", "Agentlikdan foyda", 12000000, "Agentlikdan olingan foyda");
    add(m, 4, "expense", "personal", "Uy-joy va kommunal", Math.round(1800000 * r), "Kvartira + kommunal");
    add(m, 8, "expense", "personal", "Oziq-ovqat", Math.round(2600000 * r), "Bozor va market");
    add(m, 11, "expense", "personal", "Kafe va restoran", Math.round(1100000 * r), "Kafelar");
    add(m, 14, "expense", "personal", "Transport / taksi / benzin", Math.round(900000 * r), "Benzin va taksi");
    add(m, 16, "expense", "personal", "Aloqa va internet", 250000, "Telefon va internet");
    add(m, 22, "expense", "personal", "Ko'ngilochar", Math.round(500000 * r), "Kino, dam olish");
    if (m % 2 === 0) add(m, 19, "expense", "personal", "Kiyim-kechak", Math.round(1200000 * r), "Kiyim");
    if (m === 1) add(m, 21, "expense", "personal", "Oila va sovg'alar", 2000000, "To'yga sovg'a");
  }

  // Dona ishlar va ularga to'lovlar
  const logs = [];
  const [, , dilshod, madina, sardor, kamola] = employees;
  for (let m = 4; m >= 0; m--) {
    logs.push({ id: uid(), employeeId: dilshod.id, date: dateAgo(m, 10), qty: 12, projectId: p1.id, note: "Oqtepa reels" });
    logs.push({ id: uid(), employeeId: madina.id, date: dateAgo(m, 12), qty: 20, projectId: p1.id, note: "Oqtepa postlar" });
    if (m <= 3) logs.push({ id: uid(), employeeId: madina.id, date: dateAgo(m, 14), qty: 8, projectId: p2.id, note: "Texnomart bannerlar" });
    if (m <= 2) logs.push({ id: uid(), employeeId: sardor.id, date: dateAgo(m, 13), qty: 25, projectId: p1.id, note: "Post matnlari" });
    if (m <= 2) logs.push({ id: uid(), employeeId: kamola.id, date: dateAgo(m, 16), qty: 10, projectId: p2.id, note: "Texnomart videolari montaji" });
    if (m >= 1) {
      add(m, 27, "expense", "agency", "Dona ish haqi (frilans)", 12 * dilshod.rate, `${dilshod.name} — reels`, { employeeId: dilshod.id, projectId: p1.id });
      add(m, 27, "expense", "agency", "Dona ish haqi (frilans)", 20 * madina.rate, `${madina.name} — postlar`, { employeeId: madina.id, projectId: p1.id });
    }
  }
  d.workLogs = logs;
  d.transactions = tx;
  return d;
}

module.exports = { seedDemo };

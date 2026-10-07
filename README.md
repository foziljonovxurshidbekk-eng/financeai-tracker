# Glass Finance

![Dashboard](docs/dashboard.png)

Marketing agentligi egasi uchun moliya paneli: shaxsiy va agentlik kirim-chiqimlari, loyihalar tannarxi va marjasi, xodimlarning oyligi (oylik yoki dona bo'yicha) hamda AI (Gemini yoki Claude) bilan suhbat. Dizayni liquid glass uslubida, tungi va kunduzgi rejim bor, telefonda ham ishlaydi.

## Imkoniyatlar

| Bo'lim | Nima qiladi |
|---|---|
| **Dashboard** | Kirim, chiqim, sof foyda, rentabellik. Oylar bo'yicha diagramma, chiqimlar tarkibi (donut), foyda dinamikasi, agentlik va shaxsiy moliya alohida, loyihalar marjasi, kategoriyalar jadvali. Filtrlar: Hammasi / Agentlik / Shaxsiy va davr (bu oy, 3 oy, 6 oy, yil). |
| **Kirim-chiqim** | Qo'lda kiritish, qidiruv va filtrlar. **Tezkor AI kiritish**: matn yozasiz yoki 🎙 orqali gapirasiz (o'zbek/rus/ingliz), AI bitta gapdagi bir nechta operatsiyani ajratib oladi. Har biri uchun summa, kirim/chiqim, bo'lim, kategoriya, sana, loyiha va xodimni o'zi aniqlaydi. Saqlashdan oldin hammasini tekshirib, tuzatishingiz mumkin. |
| **Loyihalar** | Har bir loyiha uchun smeta: har bir ish yoki xizmatning soni, tannarxi, sotuv narxi, foydasi va marjasi. Fakt bo'yicha: daromad, tannarx (loyihaga bog'langan barcha chiqimlar), foyda, marja, ustama, mijozning qarzi. "Reja va fakt" va tannarx tarkibi diagrammalari. |
| **Jamoa** | Xodimlar **oylik** yoki **dona** bo'yicha (masalan, 1 reels = 250 000 so'm). Dona ishlarni kiritib borasiz, dastur hisoblangan summani o'zi chiqaradi. "To'lash" tugmasi to'lovni agentlikning ish haqi chiqimi sifatida yozadi va kerak bo'lsa loyiha tannarxiga qo'shadi. Har bir xodim bo'yicha: shu oyda hisoblangan, to'langan va umumiy qoldiq (qarzimiz yoki berilgan avans). |
| **AI yordamchi** | Barcha ma'lumotlar bo'yicha erkin suhbat: "Qaysi loyiha eng marjinal?", "Bu oy qayerga ko'p pul ketdi?", "Xodimlarga qancha qarzmiz?". Chat orqali yangi operatsiya ham qo'shsa bo'ladi: "benzinga 200 ming ketdi, qo'shib qo'y". Ovoz bilan ham yozish mumkin. |
| **Sozlamalar** | Kategoriyalarni qo'shish, nomini va rangini o'zgartirish. JSON zaxira nusxa (eksport/import), Excel uchun CSV, demo ma'lumotlar. |

O'ng pastdagi 🎙 tugmasi istalgan sahifadan ovoz bilan operatsiya qo'shish oynasini ochadi.

### Telegram bot

Bot sayt bilan bitta bazada ishlaydi:
- **Oddiy matn** yozsangiz (masalan, *tushlikka 85 ming, Oqtepa reklamaga 2 mln*), AI operatsiyalarni ajratib ko'rsatadi. "✅ Saqlash" tugmasini bossangiz, ular saytga tushadi.
- **Savol** yozsangiz (yoki boshiga `?` qo'ysangiz), AI barcha ma'lumotlar asosida javob beradi.
- `/hisobot` buyrug'i bu oyning qisqa hisobotini beradi: kirim, chiqim, foyda, eng katta xarajatlar, loyihalar marjasi, xodimlarga qarz.

Sozlash tartibi: @BotFather'da bot yarating va tokenni `.env` fayliga `BOT_TOKEN` qilib yozing. Serverni ishga tushirib, botga `/start` yuboring. Bot sizning ID'ingizni ko'rsatadi, uni `TELEGRAM_ALLOWED_IDS` ga yozib, serverni qayta ishga tushiring.

Telegram'ning ovozli xabarlari (audio) hozircha qo'llab-quvvatlanmaydi. Ovoz bilan kiritish uchun telefon klaviaturasidagi mikrofon tugmasidan (diktovka) yoki saytdagi 🎙 tugmasidan foydalaning.

## Ishga tushirish

```bash
cd finance-app
npm install
cp .env.example .env      # GEMINI_API_KEY ni yozing (bepul)
npm start                 # http://localhost:3000
```

Birinchi marta ochganda **Sozlamalar → Demo ma'lumot yuklash** tugmasini bosing: dastur 6 oylik namunaviy agentlik ma'lumotlari bilan to'ladi. Keyin **Hammasini o'chirish** tugmasi bilan tozalab, o'z ma'lumotlaringizni kiritishni boshlaysiz.

- **AI:** `GEMINI_API_KEY` (bepul, https://aistudio.google.com/apikey) yoki `ANTHROPIC_API_KEY` (pullik) bo'lsa, AI to'liq ishlaydi: Gemini'da standart model `gemini-flash-latest`, Claude'da `claude-opus-5-5`. Kalit bo'lmasa, ovozli kiritish oddiy kalit so'zlar asosida ishlaydi, chat esa o'chiq turadi.
- **Ovoz:** brauzerning Web Speech API'si orqali ishlaydi (Chrome, Edge, Safari). Mikrofon faqat `localhost` yoki `https` manzilda ishlaydi.
- **Ma'lumotlar:** `data/db.json` faylida saqlanadi. Vaqti-vaqti bilan eksport qilib, zaxira nusxa olib turing.
- **Himoya:** saytni internetga chiqarsangiz, `.env` faylida `APP_PASSWORD` ni albatta o'rnating.

## Serverga joylash (bepul, karta kerak emas): Render + Neon

Render'ning bepul tarifida disk saqlanmaydi va servis uxlab qoladi. Shuning uchun ilova bu tarifga moslashtirilgan:
- `DATABASE_URL` berilsa, ma'lumotlar bepul **Neon Postgres** bazasida saqlanadi va servis qayta ishga tushganda ham yo'qolmaydi;
- Render'da Telegram bot **webhook** rejimida ishlaydi: kelgan xabar uxlab yotgan servisni o'zi uyg'otadi.

**1. Baza.** Supabase yoki Neon'dan birini tanlang (ikkalasi ham bepul).
- **Supabase:** loyihangizda **Connect** tugmasini bosing, **Session pooler** bo'limidagi `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-...pooler.supabase.com:5432/postgres` manzilni nusxalang va `[YOUR-PASSWORD]` o'rniga baza parolini yozing. Parol esingizda bo'lmasa, *Project Settings → Database → Reset database password* orqali yangisini o'rnating. Ilova jadvalni o'zi yaratadi va unga RLS yoqadi, shuning uchun jadval Supabase'ning ochiq REST API'si orqali ko'rinmaydi.
- **Neon:** https://neon.tech saytida GitHub orqali ro'yxatdan o'ting va **Create project** tugmasini bosing. Keyin **Connect** oynasidagi `postgresql://...` bilan boshlanadigan ulanish manzilini nusxalab oling.

**2. Sayt (Render).** https://render.com saytida **New → Blueprint** ni tanlang va `financeai-tracker` repozitoriysini ko'rsating. Render `render.yaml` faylini o'qiydi va quyidagi qiymatlarni so'raydi:

| Kalit | Qiymat |
|---|---|
| `DATABASE_URL` | Supabase (Session pooler) yoki Neon'dan olingan `postgresql://...` manzil |
| `APP_PASSWORD` | Saytga kirish paroli (o'zingiz o'ylab toping) |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey dan bepul kalit (**Create API key**). Bo'sh qolsa, AI offline rejimda ishlaydi |
| `BOT_TOKEN` | @BotFather bergan token |
| `TELEGRAM_ALLOWED_IDS` | Telegram ID'ingiz. Bilmasangiz, avval bo'sh qoldiring, botga `/start` yozing, bot ID'ni ko'rsatadi, keyin shu yerga yozasiz |

**Apply** tugmasini bosgandan bir necha daqiqa o'tib, sayt `https://glass-finance-xxxx.onrender.com` manzilida ochiladi.

**3. Uxlab qolmasligi uchun (ixtiyoriy).** https://cron-job.org saytida bepul vazifa yarating: har 10 daqiqada `https://<sizning-manzil>.onrender.com/health` manzilini ochib tursin. Render bepul tarifida oyiga 750 soat beriladi, bu bitta servisning butun oy uzluksiz ishlashiga yetadi.

### Muqobil: o'z virtual serveringiz (Oracle Cloud / VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/foziljonovxurshidbekk-eng/financeai-tracker/main/deploy/setup.sh | sudo bash
```

Bu skript Node.js'ni o'rnatadi, `.env` faylini yaratadi va ilovani systemd xizmati sifatida ishga tushiradi. Bundan tashqari, `https://<IP>.sslip.io` manzilida HTTPS sozlaydi va har kuni zaxira nusxa oladi.

## Testlar

```bash
npm test
```

Testlar quyidagilarni tekshiradi: marja va tannarx hisob-kitoblari, oylik va dona bo'yicha xodimlar balansi, offline tahlilchi, Gemini va Claude chatidagi tool-use sikli (soxta API serverlar orqali).

## Tuzilishi

```
server/index.js    Express API (CRUD, to'lovlar, eksport/import, demo)
server/finance.js  Hisob-kitoblar: loyiha marjasi, xodimlar balansi, dashboard
server/bot.js      Telegram bot (operatsiya qo'shish, savol-javob, /hisobot)
server/ai.js       AI (Gemini yoki Claude): matn yoki ovozdan operatsiyalarni ajratish, tool'lar bilan chat
server/db.js       Baza: JSON fayl yoki Postgres (DATABASE_URL)
public/            Frontend (vanilla JS + Chart.js, liquid glass CSS)
```

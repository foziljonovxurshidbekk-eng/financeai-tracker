# Glass Finance

![Dashboard](docs/dashboard.png)

Marketing agentligi egasi uchun moliya paneli: shaxsiy va agentlik kirim-chiqimlari, loyihalar tannarxi va marjasi, xodimlarning oyligi (oylik yoki dona bo'yicha) hamda Claude AI bilan suhbat. Dizayni liquid glass uslubida, tungi va kunduzgi rejim bor, telefonda ham ishlaydi.

## Imkoniyatlar

| Bo'lim | Nima qiladi |
|---|---|
| **Dashboard** | Kirim, chiqim, sof foyda, rentabellik. Oylar bo'yicha diagramma, chiqimlar tarkibi (donut), foyda dinamikasi, agentlik va shaxsiy moliya alohida, loyihalar marjasi, kategoriyalar jadvali. Filtrlar: Hammasi / Agentlik / Shaxsiy va davr (bu oy, 3 oy, 6 oy, yil). |
| **Kirim-chiqim** | Qo'lda kiritish, qidiruv va filtrlar. **Tezkor AI kiritish**: matn yozasiz yoki 🎙 orqali gapirasiz (o'zbek/rus/ingliz), AI bitta gapdagi bir nechta operatsiyani ajratib oladi. Har biri uchun summa, kirim/chiqim, bo'lim, kategoriya, sana, loyiha va xodimni o'zi aniqlaydi. Saqlashdan oldin hammasini tekshirib, tuzatishingiz mumkin. |
| **Loyihalar** | Har bir loyiha uchun smeta: har bir ish yoki xizmatning soni, tannarxi, sotuv narxi, foydasi va marjasi. Fakt bo'yicha: daromad, tannarx (loyihaga bog'langan barcha chiqimlar), foyda, marja, ustama, mijozning qarzi. "Reja va fakt" va tannarx tarkibi diagrammalari. |
| **Jamoa** | Xodimlar **oylik** yoki **dona** bo'yicha (masalan, 1 reels = 250 000 so'm). Dona ishlarni kiritib borasiz, dastur hisoblangan summani o'zi chiqaradi. "To'lash" tugmasi to'lovni agentlikning ish haqi chiqimi sifatida yozadi va kerak bo'lsa loyiha tannarxiga qo'shadi. Har bir xodim bo'yicha: shu oyda hisoblangan, to'langan va umumiy qoldiq (qarzimiz yoki berilgan avans). |
| **Claude AI** | Barcha ma'lumotlar bo'yicha erkin suhbat: "Qaysi loyiha eng marjinal?", "Bu oy qayerga ko'p pul ketdi?", "Xodimlarga qancha qarzmiz?". Chat orqali yangi operatsiya ham qo'shsa bo'ladi: "benzinga 200 ming ketdi, qo'shib qo'y". Ovoz bilan ham yozish mumkin. |
| **Sozlamalar** | Kategoriyalarni qo'shish, nomini va rangini o'zgartirish. JSON zaxira nusxa (eksport/import), Excel uchun CSV, demo ma'lumotlar. |

O'ng pastdagi 🎙 tugmasi istalgan sahifadan ovoz bilan operatsiya qo'shish oynasini ochadi.

### Telegram bot

Bot sayt bilan bitta bazada ishlaydi:
- **Oddiy matn** yozsangiz (masalan, *tushlikka 85 ming, Oqtepa reklamaga 2 mln*), AI operatsiyalarni ajratib ko'rsatadi. "✅ Saqlash" tugmasini bossangiz, ular saytga tushadi.
- **Savol** yozsangiz (yoki boshiga `?` qo'ysangiz), Claude barcha ma'lumotlar asosida javob beradi.
- `/hisobot` buyrug'i bu oyning qisqa hisobotini beradi: kirim, chiqim, foyda, eng katta xarajatlar, loyihalar marjasi, xodimlarga qarz.

Sozlash tartibi: @BotFather'da bot yarating va tokenni `.env` fayliga `BOT_TOKEN` qilib yozing. Serverni ishga tushirib, botga `/start` yuboring. Bot sizning ID'ingizni ko'rsatadi, uni `TELEGRAM_ALLOWED_IDS` ga yozib, serverni qayta ishga tushiring.

Telegram'ning ovozli xabarlari (audio) hozircha qo'llab-quvvatlanmaydi. Ovoz bilan kiritish uchun telefon klaviaturasidagi mikrofon tugmasidan (diktovka) yoki saytdagi 🎙 tugmasidan foydalaning.

## Ishga tushirish

```bash
cd finance-app
npm install
cp .env.example .env      # ANTHROPIC_API_KEY ni yozing
npm start                 # http://localhost:3000
```

Birinchi marta ochganda **Sozlamalar → Demo ma'lumot yuklash** tugmasini bosing: dastur 6 oylik namunaviy agentlik ma'lumotlari bilan to'ladi. Keyin **Hammasini o'chirish** tugmasi bilan tozalab, o'z ma'lumotlaringizni kiritishni boshlaysiz.

- **AI:** `ANTHROPIC_API_KEY` bo'lsa, Claude (`claude-opus-5-5`) ishlatiladi. So'rovlarda server tomonidagi zaxira model (`fallbacks: "default"`) yoqilgan: Claude so'rovni rad etsa, javobni boshqa model beradi. Kalit bo'lmasa, ovozli kiritish oddiy kalit so'zlar asosida ishlaydi, chat esa o'chiq turadi.
- **Ovoz:** brauzerning Web Speech API'si orqali ishlaydi (Chrome, Edge, Safari). Mikrofon faqat `localhost` yoki `https` manzilda ishlaydi.
- **Ma'lumotlar:** `data/db.json` faylida saqlanadi. Vaqti-vaqti bilan eksport qilib, zaxira nusxa olib turing.
- **Himoya:** saytni internetga chiqarsangiz, `.env` faylida `APP_PASSWORD` ni albatta o'rnating.

## Serverga joylash (deploy)

Node.js 18+ ishlaydigan istalgan joyga qo'yish mumkin: VPS (pm2 bilan), Railway, Render va hokazo. `data/` papkasi doimiy (persistent) diskda turishi shart, aks holda server qayta ishga tushganda ma'lumotlar o'chib ketadi. Mikrofon ishlashi uchun sayt HTTPS orqali ochilishi kerak.

## Testlar

```bash
npm test
```

Testlar quyidagilarni tekshiradi: marja va tannarx hisob-kitoblari, oylik va dona bo'yicha xodimlar balansi, offline tahlilchi, Claude chatidagi tool-use sikli (soxta API server orqali).

## Tuzilishi

```
server/index.js    Express API (CRUD, to'lovlar, eksport/import, demo)
server/finance.js  Hisob-kitoblar: loyiha marjasi, xodimlar balansi, dashboard
server/bot.js      Telegram bot (operatsiya qo'shish, savol-javob, /hisobot)
server/ai.js       Claude: matn yoki ovozdan operatsiyalarni ajratish, tool'lar bilan chat
server/db.js       JSON fayl ko'rinishidagi baza
public/            Frontend (vanilla JS + Chart.js, liquid glass CSS)
```

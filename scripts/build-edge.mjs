// server/ kodini Supabase Edge Function uchun bitta ESM faylga yig'adi.
// Tashqi kutubxonalar (npm:...) yig'ilmaydi — Supabase ularni o'zi yuklaydi.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const banner = `// Avtomatik yaratilgan fayl — tahrirlamang. Manba: edge/main.js va server/. Qayta yig'ish: npm run build:edge
import { createRequire as __createRequire } from "node:module";
import __nodeProcess from "node:process";
const require = __createRequire(import.meta.url);
// process.env ni o'zgartirib bo'ladigan nusxa (sozlamalar bazadan yuklanadi)
const __env = { ...__nodeProcess.env };
const process = new Proxy(__nodeProcess, { get: (t, k) => (k === "env" ? __env : Reflect.get(t, k)) });`;

await build({
  entryPoints: ["edge/main.js"],
  outfile: "supabase/functions/glass/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  external: ["npm:*", "pg", "@anthropic-ai/sdk", "telegraf", "@google/genai"],
  banner: { js: banner },
  legalComments: "none",
  minifyIdentifiers: true,
  minifySyntax: true,
  supported: { "template-literal": false }, // ko'p qatorli template literal bo'lmasin (bo'shliqlarni xavfsiz olib tashlash uchun)
  logLevel: "warning",
});
// Bosh bo'shliqlarni olib tashlaymiz (hajm kichrayadi, qatorlar o'qiladigan qoladi).
// Ko'p qatorli template literal ichidagi qatorlar bo'shliq bilan boshlanmasligi tekshiriladi.
const out = "supabase/functions/glass/index.js";
const code = readFileSync(out, "utf8");
writeFileSync(out, code.split("\n").map((l) => l.trimStart()).join("\n"));
console.log("✓ " + out);

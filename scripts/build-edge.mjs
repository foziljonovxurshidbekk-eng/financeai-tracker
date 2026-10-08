// server/ kodini Supabase Edge Function uchun bitta ESM faylga yig'adi.
// Tashqi kutubxonalar (npm:...) yig'ilmaydi — Supabase ularni o'zi yuklaydi.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

// Node built-in modullari statik import qilinadi (createRequire masofaviy URL'dan yuklanganda ishlamaydi)
const banner = `// Avtomatik yaratilgan fayl — tahrirlamang. Manba: edge/main.js va server/. Qayta yig'ish: npm run build:edge
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
const process = new Proxy(__nodeProcess, { get: (t, k) => (k === "env" ? __env : Reflect.get(t, k)) });`;

await build({
  entryPoints: ["edge/main.js"],
  outfile: "supabase/functions/glass/app.js",
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
const out = "supabase/functions/glass/app.js";
const code = readFileSync(out, "utf8");
writeFileSync(out, code.split("\n").map((l) => l.trimStart()).join("\n"));
console.log("✓ " + out);

// Kirish nuqtasi: npm kutubxonalari + ilova. Mahalliy/CLI deploy uchun ./app.js;
// MCP orqali deploy qilinganda app.js GitHub'dagi aniq commit'dan olinadi (README'ga qarang).
writeFileSync(
  "supabase/functions/glass/index.js",
  `// Avtomatik yaratilgan fayl — tahrirlamang (npm run build:edge)
import * as genai from "npm:@google/genai@2.27.0";
import { Telegraf, Markup } from "npm:telegraf@4.16.3";
import { start } from "./app.js";

start({ genai, Telegraf, Markup });
`
);
console.log("✓ supabase/functions/glass/index.js");

// Avtomatik yaratilgan fayl — tahrirlamang (npm run build:edge)
import * as genai from "npm:@google/genai@2.27.0";
import { Telegraf, Markup } from "npm:telegraf@4.16.3";
import { start } from "./app.js";

start({ genai, Telegraf, Markup });

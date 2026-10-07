// API manzili. Bo'sh — sayt bilan bir serverda (Node/Express).
// GitHub Pages'da — Supabase Edge Function.
window.GF_API_BASE = location.hostname.endsWith("github.io")
  ? "https://sgpaatcnibhcxksykixu.supabase.co/functions/v1/glass"
  : "";

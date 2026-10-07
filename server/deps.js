// Tashqi kutubxonalar: Node'da odatdagidek require qilinadi,
// Supabase Edge (Deno) da esa npm: importlari orqali tashqaridan beriladi (deps.set).
const mods = {};
module.exports = {
  get(name) {
    // eslint-disable-next-line global-require
    return (mods[name] ??= require(name));
  },
  set(name, mod) {
    mods[name] = mod;
  },
};

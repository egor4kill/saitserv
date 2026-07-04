// Запускается при каждой сборке на Netlify (см. netlify.toml).
// Берёт все оригиналы (jpg/png/webp), которые ещё не обработаны,
// и делает из них две версии: маленькую (-thumb) для сетки
// и покрупнее (-full) для лайтбокса. Ничего вручную ресайзить не надо —
// просто закидываешь фото как есть в assets/img/gallery/ (или через /admin).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "img", "gallery");

const sizes = [
  { suffix: "-thumb", width: 500, quality: 75 },
  { suffix: "-full", width: 1600, quality: 82 }
];

if (!fs.existsSync(DIR)) {
  console.log("Нет папки", DIR, "— пропускаю обработку фото.");
  process.exit(0);
}

const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));

if (!files.length) {
  console.log("Новых оригиналов не найдено, обрабатывать нечего.");
}

files.forEach((f) => {
  const base = f.replace(/\.(jpe?g|png)$/i, "");
  const src = path.join(DIR, f);

  sizes.forEach(({ suffix, width, quality }) => {
    const outName = `${base}${suffix}.webp`;
    const out = path.join(DIR, outName);
    if (fs.existsSync(out)) return; // уже обработано раньше, не трогаем

    sharp(src)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(out)
      .then(() => console.log("Сделал:", outName))
      .catch((err) => console.error("Не смог обработать", f, err.message));
  });
});

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "img", "gallery");

const sizes = [
  { suffix: "-thumb", width: 500, quality: 75 },
  { suffix: "-full", width: 1600, quality: 82 }
];

async function run() {
  if (!fs.existsSync(DIR)) {
    console.log("Нет папки", DIR, "— пропускаю обработку фото.");
    process.exit(0);
  }

  const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));

  if (!files.length) {
    console.log("Новых оригиналов не найдено, обрабатывать нечего.");
    return;
  }

  for (const f of files) {
    const base = f.replace(/-(full|thumb)$/i, "").replace(/\.(jpe?g|png)$/i, "");
    const src = path.join(DIR, f);

    for (const { suffix, width, quality } of sizes) {
      const outName = `${base}${suffix}.webp`;
      const out = path.join(DIR, outName);
      if (fs.existsSync(out)) continue;

      try {
        await sharp(src)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality })
          .toFile(out);
        console.log("Сделал:", outName);
      } catch (err) {
        console.error("Не смог обработать", f, err.message);
      }
    }
  }
}

run().catch((err) => {
  console.error("Ошибка при обработке изображений:", err);
  process.exit(1);
});

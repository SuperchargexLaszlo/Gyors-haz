import sharp from 'sharp';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs/promises';

const INPUT_DIR = 'src/assets/products/original';
const OUTPUT_DIR = 'public/images/products';
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 800;
const OUTPUT_QUALITY = 85;

// --- Logós vízjel beállításai ---
const LOGO_PATH = 'logo.jpeg';   // a márka logó (navy kör + fehér ház)
const WM_SIZE = 520;             // vízjel mérete pixelben (középen, nagy méret)
const WM_OPACITY = 0.17;         // halványság (0 = láthatatlan, 1 = teljesen látszik)

// Kör alakú maszk SVG-ként
function circleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

// Egyszer előállítjuk a halvány, kör alakú logó-vízjelet
async function buildWatermark() {
  let logoBuf;
  try {
    logoBuf = await sharp(LOGO_PATH).trim({ threshold: 12 }).toBuffer();
  } catch {
    logoBuf = await sharp(LOGO_PATH).toBuffer();
  }

  // Kör alakúra vágott logó
  const circular = await sharp(logoBuf)
    .resize(WM_SIZE, WM_SIZE, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleMask(WM_SIZE), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Egységes áttetszőség: az alfa csatornát WM_OPACITY-vel szorozzuk
  const faint = await sharp(circular)
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * WM_OPACITY)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  return faint;
}

async function processImages() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const pattern = `${INPUT_DIR}/*.{jpg,jpeg,png,webp}`;
  let files = [];

  try {
    for await (const file of glob(pattern)) {
      files.push(file);
    }
  } catch {
    const { globby } = await import('globby').catch(() => ({ globby: null }));
    if (globby) {
      files = await globby(pattern);
    } else {
      const dirFiles = await fs.readdir(INPUT_DIR).catch(() => []);
      files = dirFiles
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map((f) => path.join(INPUT_DIR, f));
    }
  }

  if (files.length === 0) {
    console.log('Nincs feldolgozandó kép a forrás mappában:', INPUT_DIR);
    return;
  }

  console.log(`${files.length} kép feldolgozása logós vízjellel...`);

  const watermark = await buildWatermark();

  for (const inputPath of files) {
    const basename = path
      .basename(inputPath, path.extname(inputPath))
      .replace(/m2$/, '')
      .replace(/\s+/g, '-');
    const outputPath = path.join(OUTPUT_DIR, `${basename}.webp`);

    try {
      await sharp(inputPath)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: 'cover', position: 'centre' })
        .composite([{ input: watermark, gravity: 'centre' }])
        .webp({ quality: OUTPUT_QUALITY })
        .toFile(outputPath);

      console.log(`OK: ${inputPath} → ${outputPath}`);
    } catch (err) {
      console.error(`HIBA: ${inputPath}:`, err.message);
    }
  }

  console.log('Vízjelezés kész.');
}

processImages();

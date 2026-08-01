import sharp from 'sharp';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs/promises';

const INPUT_DIR = 'src/assets/products/original';
const OUTPUT_DIR = 'public/images/products';
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 800;
const OUTPUT_QUALITY = 85;

const WATERMARK_SVG = `<svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${OUTPUT_WIDTH - 20}"
    y="${OUTPUT_HEIGHT - 20}"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="bold"
    text-anchor="end"
    fill="white"
    opacity="0.65"
    stroke="black"
    stroke-width="1"
    paint-order="stroke"
  >gyors-haz.hu</text>
</svg>`;

async function processImages() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const pattern = `${INPUT_DIR}/*.{jpg,jpeg,png,webp}`;
  let files = [];

  try {
    for await (const file of glob(pattern)) {
      files.push(file);
    }
  } catch {
    // node:fs/promises glob may not be available in older Node — fallback
    const { globby } = await import('globby').catch(() => ({ globby: null }));
    if (globby) {
      files = await globby(pattern);
    } else {
      const dirFiles = await fs.readdir(INPUT_DIR).catch(() => []);
      files = dirFiles
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => path.join(INPUT_DIR, f));
    }
  }

  if (files.length === 0) {
    console.log('Nincs feldolgozandó kép a forrás mappában:', INPUT_DIR);
    return;
  }

  console.log(`${files.length} kép feldolgozása...`);

  const watermarkBuffer = Buffer.from(WATERMARK_SVG);

  for (const inputPath of files) {
    const basename = path.basename(inputPath, path.extname(inputPath)).replace(/m2$/, '').replace(/\s+/g, '-');
    const outputPath = path.join(OUTPUT_DIR, `${basename}.webp`);

    try {
      await sharp(inputPath)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
          fit: 'cover',
          position: 'centre',
        })
        .composite([
          {
            input: watermarkBuffer,
            top: 0,
            left: 0,
          },
        ])
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

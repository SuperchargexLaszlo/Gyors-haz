/**
 * Átnevezi és átmásolja a forrásképeket az eredeti mappákba.
 * Futtatás: node scripts/copy-images.mjs
 * Forrás: projekt gyökérmappájában lévő PNG-k
 * Cél: src/assets/products/original/
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEST = path.join(ROOT, 'src/assets/products/original');

const RENAME_MAP = [
  ['Hitelezhető_konténetház_22m2.png',  'ksz-22.png'],
  ['Hitelezhető_konténetház_32m2.png',  'ksz-32.png'],
  ['Hitelezhető_konténetház_35m2.png',  'ksz-35.png'],
  ['Hitelezhető_konténetház_52m2.png',  'ksz-52.png'],
  ['Hitelezhető_konténetház_62m2.png',  'ksz-62.png'],
  ['Hitelezhető_konténetház_78nm2.png', 'ksz-78.png'],
  ['Hitelezhető_konténetház_86nm2.png', 'ksz-86.png'],
  ['Hitelezhető_konténetház_87m2.png',  'ksz-87.png'],
  ['Hitelezhető_konténetház_96m2.png',  'ksz-96.png'],
  ['Hitelezhető_konténetház_126m2.png', 'ksz-126.png'],
];

await fs.mkdir(DEST, { recursive: true });

let copied = 0;
let missing = 0;

for (const [src, dest] of RENAME_MAP) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(DEST, dest);
  try {
    await fs.copyFile(srcPath, destPath);
    console.log(`✓  ${src}  →  ${dest}`);
    copied++;
  } catch {
    console.warn(`⚠  Nem található: ${src}`);
    missing++;
  }
}

console.log(`\nKész: ${copied} másolva, ${missing} hiányzó.`);
if (missing > 0) {
  console.log('Helyezze el a hiányzó PNG fájlokat a projekt gyökérmappájába, majd futtassa újra.');
}

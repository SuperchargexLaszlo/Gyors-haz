import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '../public/images/placeholder.webp');

await sharp({
  create: {
    width: 1200,
    height: 800,
    channels: 3,
    background: { r: 200, g: 200, b: 200 },
  },
})
  .webp({ quality: 80 })
  .toFile(outputPath);

console.log('placeholder.webp létrehozva:', outputPath);

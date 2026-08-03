// Márka-eszközök generálása a logo.jpeg-ből: favicon-ok + webes logó.
// Futtatás a projekt gyökeréből: node scripts/gen-brand-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC = 'logo.jpeg';
const PUB = 'public';
const NAVY = '#1A3C5E';

function circleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

// A világosszürke hátteret levágjuk, négyzetre igazítjuk, majd kör-maszkot teszünk rá.
async function makeMasterCircle(size) {
  let base;
  try {
    base = await sharp(SRC).trim({ threshold: 12 }).toBuffer();
  } catch {
    base = await sharp(SRC).toBuffer();
  }
  return await sharp(base)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

const master = await makeMasterCircle(512);
await fs.mkdir(PUB, { recursive: true });

// Átlátszó hátterű, kör alakú favicon PNG-k (böngészőfülre)
const transparentPng = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-48x48.png': 48,
  'favicon-96x96.png': 96,
  'logo.png': 96,     // fejléc logó
  'logo-256.png': 256,
};
for (const [name, size] of Object.entries(transparentPng)) {
  await sharp(master).resize(size, size).png().toFile(`${PUB}/${name}`);
  console.log('WROTE', name);
}

// Fejléc logó webp-ben is
await sharp(master).resize(96, 96).webp({ quality: 92 }).toFile(`${PUB}/logo.webp`);
console.log('WROTE logo.webp');

// Fehér hátterű ikonok (iOS / PWA – ezeknél nem szép az átlátszóság)
await sharp(master).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(`${PUB}/apple-touch-icon.png`);
await sharp(master).resize(192, 192).flatten({ background: '#ffffff' }).png().toFile(`${PUB}/icon-192.png`);
await sharp(master).resize(512, 512).flatten({ background: '#ffffff' }).png().toFile(`${PUB}/icon-512.png`);
console.log('WROTE apple-touch-icon.png, icon-192.png, icon-512.png');

// Vektoros favicon.svg (éles minden méretben, matcheli a logót)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="${NAVY}"/>
  <path d="M112 250 L256 134 L400 250" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="334" y="150" width="42" height="86" rx="8" fill="#ffffff"/>
  <path d="M168 244 L168 372 Q168 390 186 390 L326 390 Q344 390 344 372 L344 244 Z" fill="#ffffff"/>
  <path d="M236 390 L236 322 Q236 312 246 312 L266 312 Q276 312 276 322 L276 390 Z" fill="${NAVY}"/>
</svg>
`;
await fs.writeFile(`${PUB}/favicon.svg`, faviconSvg, 'utf8');
console.log('WROTE favicon.svg');

// Webmanifest (PWA)
const manifest = {
  name: 'Gyors Ház',
  short_name: 'Gyors Ház',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: NAVY,
  background_color: '#ffffff',
  display: 'standalone',
};
await fs.writeFile(`${PUB}/site.webmanifest`, JSON.stringify(manifest, null, 2), 'utf8');
console.log('WROTE site.webmanifest');

console.log('BRAND_ASSETS_DONE');

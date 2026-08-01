import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';

const OUT = 'src/assets/products/original';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Csak a hiányzó modellek — akinek már van helyi képe, az ki van hagyva
const images = [
  // SINGLE MODULE
  { file: 'mod-nizza.jpg',     url: 'https://static.wixstatic.com/media/4ab130_7595124be60545b5a0a3525a82f147f0~mv2.png' },
  { file: 'mod-seville.jpg',   url: 'https://static.wixstatic.com/media/4ab130_3f9efe7e877b4f8593c83c58e841da36~mv2.png' },
  { file: 'mod-tallinn.jpg',   url: 'https://static.wixstatic.com/media/4ab130_c9916ae011004afca13c3c4ade30620e~mv2.png' },
  { file: 'mod-toscana.jpg',   url: 'https://static.wixstatic.com/media/4ab130_fed2ab520a2b48fd8410c357c2f2b1ba~mv2.png' },
  { file: 'mod-atlanta.jpg',   url: 'https://static.wixstatic.com/media/4ab130_1ae7efb60ac343a5bd902d76799e9cec~mv2.png' },
  { file: 'mod-boston.jpg',    url: 'https://static.wixstatic.com/media/75aa7f_69375164a28342d4869bf06195b50a40~mv2.jpg' },
  { file: 'mod-stockholm.jpg', url: 'https://static.wixstatic.com/media/4ab130_7edd463c6d0a49308ef254417db5732d~mv2.jpg' },
  { file: 'mod-sicilia.jpg',   url: 'https://static.wixstatic.com/media/4ab130_5cc25ce748434f069b69eaa1f263531c~mv2.png' },
  { file: 'mod-slovakia.jpg',  url: 'https://static.wixstatic.com/media/4ab130_98428b513be145ef8b1506dcb8eb40e0~mv2.jpg' },
  { file: 'mod-montana.jpg',   url: 'https://static.wixstatic.com/media/4ab130_252ecc8ed74a434a9cfe72e471913bf8~mv2.png' },
  { file: 'mod-bonn.jpg',      url: 'https://static.wixstatic.com/media/4ab130_67426c263fd44f4cb61f2dd962b8adcf~mv2.jpg' },
  { file: 'mod-dublin.jpg',    url: 'https://static.wixstatic.com/media/4ab130_1d3a8d264b774c3d8bc4ae0748726e68~mv2.jpg' },
  { file: 'mod-majorca.jpg',   url: 'https://static.wixstatic.com/media/4ab130_e712fca7e1ec4ca68599215a75531b10~mv2.png' },
  { file: 'mod-ottawa.jpg',    url: 'https://static.wixstatic.com/media/4ab130_72e68aea4fc14872a55cbb0fd099a002~mv2.png' },
  { file: 'mod-malta.jpg',     url: 'https://static.wixstatic.com/media/4ab130_1b7d3498360e4d45abbd03d4a1dcd89b~mv2.jpg' },
  // MULTI-MODUL
  { file: 'mod-milan.jpg',      url: 'https://static.wixstatic.com/media/4ab130_a178ac19adab429ba0d297c542858858~mv2.jpg' },
  { file: 'mod-capri.jpg',      url: 'https://static.wixstatic.com/media/75aa7f_3903aa20b51c49a3b2e12fbe9bed7bff~mv2.jpg' },
  { file: 'mod-palermo.jpg',    url: 'https://static.wixstatic.com/media/4ab130_9683f12259e141debff3adc6123d2111~mv2.jpg' },
  { file: 'mod-florence.jpg',   url: 'https://static.wixstatic.com/media/4ab130_f42d6b25838745e0863ad585908a57da~mv2.png' },
  { file: 'mod-montreal.jpg',   url: 'https://static.wixstatic.com/media/75aa7f_839b8e16441b439292f0462d0fad0003~mv2.png' },
  { file: 'mod-vienna.jpg',     url: 'https://static.wixstatic.com/media/4ab130_aa5e864a8bd149c1856781e0cd0a24a7~mv2.png' },
  { file: 'mod-washington.jpg', url: 'https://static.wixstatic.com/media/4ab130_e5239bea928641f190d11748c05e6e79~mv2.jpg' },
  { file: 'mod-versailles.jpg', url: 'https://static.wixstatic.com/media/4ab130_c48bef50a743413facbe322043c10494~mv2.png' },
  { file: 'mod-natal.jpg',      url: 'https://static.wixstatic.com/media/4ab130_411c7c656b8f49eb9c61b1ebd711e2ac~mv2.png' },
  { file: 'mod-reykjavik.jpg',  url: 'https://static.wixstatic.com/media/75aa7f_e45cbcda709d4625899958d53efc8611~mv2.jpg' },
  { file: 'mod-lisbon.jpg',     url: 'https://static.wixstatic.com/media/4ab130_749ff61b79f44438abdb06976987475c~mv2.jpg' },
  { file: 'mod-grindavik.jpg',  url: 'https://static.wixstatic.com/media/4ab130_3d22c7462052400aaffa11d66c8bf942~mv2.jpg' },
  { file: 'mod-happywife.jpg',  url: 'https://static.wixstatic.com/media/75aa7f_a231d521f6dd42babe66ca5817850d75~mv2.jpg' },
  // TINY HOUSE
  { file: 'mod-tinyhouse2.jpg', url: 'https://static.wixstatic.com/media/4ab130_30ccf60216d24ae381349094fc1de3ae~mv2.png' },
  { file: 'mod-tinyhouse3.jpg', url: 'https://static.wixstatic.com/media/4ab130_8434f3b7d31044ec9e97df63badc4cc9~mv2.png' },
  { file: 'mod-tinyhouse4.jpg', url: 'https://static.wixstatic.com/media/4ab130_f32bff4d92b9430e93da5cfc5ec06e32~mv2.png' },
];

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

console.log(`\n📥 ${images.length} kép letöltése...\n`);
let ok = 0, fail = 0;

for (const { file, url } of images) {
  const dest = path.join(OUT, file);
  if (existsSync(dest)) {
    console.log(`⏭  Már létezik: ${file}`);
    ok++;
    continue;
  }
  try {
    await download(url, dest);
    console.log(`✓  ${file}`);
    ok++;
    await new Promise(r => setTimeout(r, 300)); // 300ms szünet kérések között
  } catch (e) {
    console.log(`✗  ${file} — ${e.message}`);
    fail++;
  }
}

console.log(`\n✅ Kész: ${ok} sikeres, ${fail} sikertelen\n`);

/** Bútorkatalógus a tervezőhöz. A méretek méterben, felülnézeti befoglaló. */
export type FurnItem = { k: string; n: string; w: number; h: number; s: string };
export type FurnCat = { c: string; icon: string; items: FurnItem[] };

export const furnitureCats: FurnCat[] = [
  {
    c: 'Nappali',
    icon: 'sofa',
    items: [
      { k: 'kanape3', n: 'Kanapé (3 sz.)', w: 2.1, h: 0.9, s: 'sofa' },
      { k: 'kanape2', n: 'Kanapé (2 sz.)', w: 1.6, h: 0.9, s: 'sofa' },
      { k: 'sarokkanape', n: 'Sarokkanapé', w: 2.6, h: 1.8, s: 'lsofa' },
      { k: 'fotel', n: 'Fotel', w: 0.85, h: 0.85, s: 'armchair' },
      { k: 'dohanyzoasztal', n: 'Dohányzóasztal', w: 1.1, h: 0.6, s: 'table' },
      { k: 'tvszekreny', n: 'TV-szekrény', w: 1.6, h: 0.45, s: 'cabinet' },
      { k: 'tv', n: 'TV', w: 1.2, h: 0.08, s: 'tv' },
      { k: 'konyvespolc', n: 'Könyvespolc', w: 0.9, h: 0.35, s: 'cabinet' },
      { k: 'vitrin', n: 'Vitrin', w: 1.2, h: 0.4, s: 'cabinet' },
      { k: 'szonyeg', n: 'Szőnyeg', w: 2.4, h: 1.6, s: 'rug' },
      { k: 'kandallo', n: 'Kandalló', w: 1.0, h: 0.5, s: 'cabinet' },
    ],
  },
  {
    c: 'Hálószoba',
    icon: 'bed',
    items: [
      { k: 'franciaagy', n: 'Franciaágy 160', w: 1.6, h: 2.0, s: 'bed' },
      { k: 'franciaagy180', n: 'Franciaágy 180', w: 1.8, h: 2.0, s: 'bed' },
      { k: 'agy90', n: 'Egyszemélyes ágy', w: 0.9, h: 2.0, s: 'bed' },
      { k: 'agy140', n: 'Ágy 140', w: 1.4, h: 2.0, s: 'bed' },
      { k: 'gyerekagy', n: 'Gyerekágy', w: 0.7, h: 1.4, s: 'bed' },
      { k: 'ejjeliszekreny', n: 'Éjjeliszekrény', w: 0.45, h: 0.4, s: 'cabinet' },
      { k: 'gardrob', n: 'Gardróbszekrény', w: 2.0, h: 0.6, s: 'wardrobe' },
      { k: 'szekreny', n: 'Szekrény', w: 1.2, h: 0.6, s: 'wardrobe' },
      { k: 'komod', n: 'Komód', w: 1.2, h: 0.45, s: 'cabinet' },
      { k: 'fesulkodo', n: 'Fésülködő', w: 1.0, h: 0.45, s: 'desk' },
    ],
  },
  {
    c: 'Konyha, étkező',
    icon: 'stove',
    items: [
      { k: 'konyhapult', n: 'Konyhapult', w: 2.0, h: 0.6, s: 'counter' },
      { k: 'konyhapult_sarok', n: 'Sarokpult', w: 1.2, h: 1.2, s: 'counter' },
      { k: 'sziget', n: 'Konyhasziget', w: 1.8, h: 0.9, s: 'counter' },
      { k: 'tuzhely', n: 'Tűzhely', w: 0.6, h: 0.6, s: 'stove' },
      { k: 'fozolap', n: 'Főzőlap', w: 0.6, h: 0.52, s: 'stove' },
      { k: 'huto', n: 'Hűtőszekrény', w: 0.6, h: 0.65, s: 'fridge' },
      { k: 'huto90', n: 'Side-by-side hűtő', w: 0.9, h: 0.7, s: 'fridge' },
      { k: 'mosogato', n: 'Mosogató', w: 0.8, h: 0.6, s: 'sink' },
      { k: 'mosogatogep', n: 'Mosogatógép', w: 0.6, h: 0.6, s: 'washer' },
      { k: 'etkezoasztal', n: 'Étkezőasztal', w: 1.4, h: 0.8, s: 'table' },
      { k: 'etkezo6', n: 'Étkezőasztal (6 fő)', w: 1.8, h: 0.9, s: 'table' },
      { k: 'kerekasztal', n: 'Kerek asztal', w: 1.2, h: 1.2, s: 'roundtable' },
      { k: 'szek', n: 'Szék', w: 0.45, h: 0.45, s: 'chair' },
      { k: 'barszek', n: 'Bárszék', w: 0.4, h: 0.4, s: 'chair' },
      { k: 'kamrapolc', n: 'Kamrapolc', w: 0.9, h: 0.4, s: 'cabinet' },
    ],
  },
  {
    c: 'Fürdő, WC',
    icon: 'bath',
    items: [
      { k: 'furdokad', n: 'Fürdőkád 170', w: 1.7, h: 0.75, s: 'bath' },
      { k: 'furdokad150', n: 'Fürdőkád 150', w: 1.5, h: 0.7, s: 'bath' },
      { k: 'sarokkad', n: 'Sarokkád', w: 1.4, h: 1.4, s: 'bath' },
      { k: 'zuhany', n: 'Zuhanytálca 90', w: 0.9, h: 0.9, s: 'shower' },
      { k: 'zuhany120', n: 'Zuhanytálca 120', w: 1.2, h: 0.9, s: 'shower' },
      { k: 'wc', n: 'WC', w: 0.4, h: 0.65, s: 'toilet' },
      { k: 'fali_wc', n: 'Fali WC', w: 0.38, h: 0.55, s: 'toilet' },
      { k: 'bide', n: 'Bidé', w: 0.38, h: 0.55, s: 'bidet' },
      { k: 'mosdo', n: 'Mosdó', w: 0.6, h: 0.45, s: 'sink' },
      { k: 'mosdo_dupla', n: 'Dupla mosdó', w: 1.2, h: 0.5, s: 'sink' },
      { k: 'mosogep', n: 'Mosógép', w: 0.6, h: 0.6, s: 'washer' },
      { k: 'szaritogep', n: 'Szárítógép', w: 0.6, h: 0.6, s: 'washer' },
      { k: 'furdoszekreny', n: 'Fürdőszobaszekrény', w: 0.8, h: 0.4, s: 'cabinet' },
    ],
  },
  {
    c: 'Dolgozó, egyéb',
    icon: 'desk',
    items: [
      { k: 'iroasztal', n: 'Íróasztal', w: 1.2, h: 0.6, s: 'desk' },
      { k: 'sarok_iroasztal', n: 'Sarok íróasztal', w: 1.6, h: 1.2, s: 'desk' },
      { k: 'irodaszek', n: 'Irodaszék', w: 0.6, h: 0.6, s: 'chair' },
      { k: 'iratszekreny', n: 'Iratszekrény', w: 0.8, h: 0.4, s: 'cabinet' },
      { k: 'lepcso', n: 'Lépcső', w: 1.0, h: 3.0, s: 'stairs' },
      { k: 'csigalepcso', n: 'Csigalépcső', w: 1.6, h: 1.6, s: 'spiral' },
      { k: 'cipospolc', n: 'Cipőspolc', w: 0.8, h: 0.35, s: 'cabinet' },
      { k: 'fogas', n: 'Fogas', w: 0.9, h: 0.25, s: 'cabinet' },
      { k: 'kazan', n: 'Kazán', w: 0.5, h: 0.4, s: 'cabinet' },
      { k: 'novery', n: 'Növény', w: 0.5, h: 0.5, s: 'plant' },
      { k: 'auto', n: 'Személyautó', w: 1.8, h: 4.5, s: 'car' },
    ],
  },
];

export const roomTypes = [
  'Nappali', 'Konyha', 'Étkező', 'Konyha-étkező', 'Hálószoba', 'Gyerekszoba',
  'Fürdőszoba', 'WC', 'Előszoba', 'Közlekedő', 'Dolgozó', 'Kamra', 'Gardrób',
  'Mosókonyha', 'Kazánház', 'Terasz', 'Garázs', 'Tároló', 'Szoba',
];

/**
 * Kész alaprajz-sablonok.
 * rooms: [x, y, szélesség, magasság, megnevezés] — méterben.
 * openings: [típus, x, y, szélesség] — a legközelebbi falra ugrik.
 */
export const templates = [
  {
    name: 'Garzon / 1 szobás',
    area: '39 m²',
    desc: 'Egyterű lakás előszobával, külön konyhával és fürdővel.',
    rooms: [
      [0, 0, 1.8, 2.4, 'Előszoba'],
      [1.8, 0, 3.0, 2.4, 'Konyha'],
      [4.8, 0, 2.4, 2.4, 'Kamra'],
      [0, 2.4, 1.8, 3.0, 'Fürdőszoba'],
      [1.8, 2.4, 5.4, 3.0, 'Nappali'],
    ],
    openings: [
      ['door', 0.9, 0, 0.9],
      ['door', 1.8, 1.2, 0.8],
      ['door', 1.8, 3.9, 0.9],
      ['window', 4.5, 5.4, 1.8],
      ['window', 3.3, 0, 1.2],
    ],
  },
  {
    name: '2 szobás lakás',
    area: '62 m²',
    desc: 'Nappali + két szoba, külön fürdő és előszoba.',
    rooms: [
      [0, 0, 5.4, 3.6, 'Nappali'],
      [5.4, 0, 3.6, 3.6, 'Konyha-étkező'],
      [0, 3.6, 1.5, 3.3, 'Előszoba'],
      [1.5, 3.6, 3.3, 3.3, 'Hálószoba'],
      [4.8, 3.6, 2.4, 3.3, 'Gyerekszoba'],
      [7.2, 3.6, 1.8, 3.3, 'Fürdőszoba'],
    ],
    openings: [
      ['door', 0.75, 6.9, 0.9],
      ['window', 2.7, 0, 1.8],
      ['window', 7.2, 0, 1.8],
      ['window', 3.0, 6.9, 1.4],
      ['door', 1.5, 5.2, 0.8],
      ['door', 4.8, 5.2, 0.8],
      ['door', 7.2, 5.2, 0.8],
    ],
  },
  {
    name: 'Családi ház',
    area: '108 m²',
    desc: 'Három szoba, nappali-étkező, dolgozó, kamra, fürdő és külön WC.',
    rooms: [
      [0, 0, 6.0, 4.5, 'Nappali'],
      [6.0, 0, 3.3, 4.5, 'Konyha-étkező'],
      [9.3, 0, 2.7, 2.0, 'Kamra'],
      [9.3, 2.0, 2.7, 2.5, 'Dolgozó'],
      [0, 4.5, 2.4, 4.5, 'Előszoba'],
      [2.4, 4.5, 3.6, 4.5, 'Hálószoba'],
      [6.0, 4.5, 3.3, 4.5, 'Gyerekszoba'],
      [9.3, 4.5, 2.7, 2.5, 'Fürdőszoba'],
      [9.3, 7.0, 2.7, 2.0, 'WC'],
    ],
    openings: [
      ['door', 1.2, 9.0, 1.0],
      ['window', 3.0, 0, 2.4],
      ['window', 7.6, 0, 1.8],
      ['window', 4.2, 9.0, 1.6],
      ['window', 7.6, 9.0, 1.6],
      ['door', 2.4, 6.7, 0.9],
      ['door', 6.0, 6.7, 0.9],
    ],
  },
  {
    name: 'Fürdőszoba',
    area: '5 m²',
    desc: 'Egy helyiség — kádat, zuhanyt, mosdót rakhatsz bele.',
    rooms: [[0, 0, 2.4, 2.1, 'Fürdőszoba']],
    openings: [['door', 1.8, 0, 0.8]],
  },
  {
    name: 'Konyha',
    area: '11 m²',
    desc: 'Négyzetes konyha az L- vagy U-alakú pult kirakásához.',
    rooms: [[0, 0, 3.6, 3.0, 'Konyha']],
    openings: [
      ['door', 0.7, 3.0, 0.8],
      ['window', 1.8, 0, 1.2],
    ],
  },
  {
    name: 'Üres lap',
    area: '',
    desc: 'Kezdj a nulláról, saját helyiségekkel.',
    rooms: [],
    openings: [],
  },
];

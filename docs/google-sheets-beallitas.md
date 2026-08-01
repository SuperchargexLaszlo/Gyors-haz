# Google Sheets árkezelés beállítása

## Sheet struktúra (fejléc sor — PONTOSAN így kell!)
id | ar_eur | ar_ft | ar_deviza | aktiv

## Kitöltési szabályok:
- id: pontosan egyezzen a products.ts id mezőivel
- ar_eur: csak szám (pl. 16000), 0 ha nincs EUR ár
- ar_ft: csak szám (pl. 12790000), 0 ha nincs Ft ár
- ar_deviza: EUR vagy HUF
- aktiv: igen vagy nem

## Példa sorok:
ksz-22 | 16000 | 0 | EUR | igen
ksz-32 | 18600 | 0 | EUR | igen
ksz-35 | 20300 | 0 | EUR | igen
ksz-52 | 22000 | 0 | EUR | igen
ksz-62 | 23000 | 0 | EUR | igen
ksz-78 | 31000 | 0 | EUR | igen
ksz-86 | 32000 | 0 | EUR | igen
ksz-87 | 34000 | 0 | EUR | igen
ksz-96 | 35000 | 0 | EUR | igen
ksz-126 | 43000 | 0 | EUR | igen
mod-amsterdam | 0 | 0 | EUR | igen
mod-paris | 0 | 0 | EUR | igen
mod-monaco | 0 | 0 | EUR | igen
mod-sydney | 0 | 0 | EUR | igen
mod-bremen | 0 | 0 | EUR | igen
mod-lyon | 0 | 0 | EUR | igen
mod-london | 0 | 0 | EUR | igen
mod-barcelona | 0 | 0 | EUR | igen
mod-marseille | 0 | 0 | EUR | igen
mod-alessandria | 0 | 0 | EUR | igen
mod-tinyhouse | 0 | 0 | EUR | igen
kont-manhattan | 0 | 12790000 | HUF | igen
kont-manhattan-l | 0 | 13790000 | HUF | igen
kont-beverly | 0 | 15090000 | HUF | igen
kont-beverly-l | 0 | 16090000 | HUF | igen
kont-nordic | 0 | 25500000 | HUF | igen

## Hogyan aktiválod:
1. Hozz létre egy Google Sheets táblázatot a fenti struktúrával
2. Fájl → Megosztás → Mindenki, aki rendelkezik a hivatkozással → Megtekintő
3. Fájl → Letöltés → CSV URL-ből: Fájl → Megosztás → Közzéteendő a weben → CSV format → közzé
4. A kapott URL-t másold a Netlify Environment Variables közé: SHEETS_CSV_URL

## Netlify Environment Variable beállítása:
- Netlify Admin → Site configuration → Environment variables
- Key: SHEETS_CSV_URL
- Value: https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0

## Hogyan működik:
- Buildkor a kód letölti a CSV-t és merge-eli a FALLBACK_PRODUCTS-szal
- Csak az id + ar_eur + ar_ft + ar_deviza + aktiv mezőket írja felül
- Ha a Sheets nem elérhető, a fallback árak jelennek meg (nincs leállás)
- az aktiv=nem sorú termékek nem jelennek meg a listázó oldalakon

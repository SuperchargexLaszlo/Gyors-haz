# Gyors Ház – gyors-haz.hu

Astro 5 + Tailwind v4 statikus weboldal könnyűszerkezetes, modulházi és konténerházi termékekhez.

## Fejlesztői parancsok

```bash
npm run dev        # Fejlesztői szerver: http://localhost:4321
npm run build      # Produkciós build (vízjelezés + Astro build)
npm run preview    # Build előnézete lokálisan
npm run watermark  # Csak vízjelezés futtatása
```

---

## Google Sheets ár-szinkronizálás

Az árak build-time Google Sheets CSV-ből töltődnek be. Ha nincs beállítva, a statikus fallback adatok töltődnek be.

### Beállítás lépései

**1. Google Sheets létrehozása**

Hozzon létre egy új Google Táblázatot az alábbi fejlécekkel az első sorban:

```
id | kategoria | nev | meret_m2 | ar_eur | afa | szobak | konyha | furdo | terasz_m2 | kep | leiras | tartalmaz | nem_tartalmaz | aktiv | slug
```

Kategória értékek: `konnyuszerkezetes` | `modulhaz` | `kontenerhoz`

**2. Közzététel CSV-ként**

1. Nyissa meg a táblázatot
2. **Fájl → Közzététel a weben**
3. Válassza ki a lapot (Sheet1)
4. Formátum: **Vesszővel elválasztott értékek (.csv)**
5. Kattintson a **Közzététel** gombra
6. Másolja ki a megjelenő URL-t

**3. Környezeti változó beállítása**

Másolja az `.env.example` fájlt `.env`-re és töltse ki:

```bash
cp .env.example .env
```

```env
SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0
```

**4. Netlify: Environment Variables beállítása**

1. Netlify Dashboard → **Site settings**
2. **Environment variables** → **Add a variable**
3. Key: `SHEETS_CSV_URL`
4. Value: a másolt CSV URL
5. Mentés → Trigger new deploy

---

## Képek és vízjelezés

### Első feltöltés

1. Helyezze el a forrásképeket a projekt gyökérmappájában (lásd elnevezési lista lent)
2. Futtassa: `node scripts/copy-images.mjs` (átnevezés + másolás)
3. Futtassa: `npm run watermark` (vízjelezés, 1200×800 WebP export)

### Elnevezési lista

| Eredeti fájlnév | Célnév |
|---|---|
| Hitelezhető_konténetház_22m2.png | ksz-22.png |
| Hitelezhető_konténetház_32m2.png | ksz-32.png |
| Hitelezhető_konténetház_35m2.png | ksz-35.png |
| Hitelezhető_konténetház_52m2.png | ksz-52.png |
| Hitelezhető_konténetház_62m2.png | ksz-62.png |
| Hitelezhető_konténetház_78nm2.png | ksz-78.png |
| Hitelezhető_konténetház_86nm2.png | ksz-86.png |
| Hitelezhető_konténetház_87m2.png | ksz-87.png |
| Hitelezhető_konténetház_96m2.png | ksz-96.png |
| Hitelezhető_konténetház_126m2.png | ksz-126.png |

A feldolgozott képek helye: `public/images/products/*.webp`

---

## Mappastruktúra

```
src/
  assets/products/original/   ← Forrásképek (nem deployolódnak)
  components/                 ← Astro komponensek
  content/blog/               ← Markdown blog bejegyzések
  layouts/                    ← BaseLayout, BlogLayout
  lib/products.ts             ← Termékadatbázis + Sheets fetch
  pages/                      ← Összes oldal
  styles/global.css           ← Tailwind v4 + @theme változók
public/
  images/products/            ← Vízjeles WebP képek (deployolódnak)
  robots.txt
  _redirects                  ← Netlify redirectek
scripts/
  watermark.mjs               ← Sharp vízjelező script
  copy-images.mjs             ← Kép-átnevező script
  gen-placeholder.mjs         ← Placeholder kép generátor
```

---

## Deployment (Netlify)

1. Repo pusholása GitHub-ra
2. Netlify → **Add new site → Import an existing project**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment variables: `SHEETS_CSV_URL` beállítása (lásd fent)

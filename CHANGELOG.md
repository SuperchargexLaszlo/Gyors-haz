# CHANGELOG — tartalom-migráció

Lokális, session-váltás közti haladáskövető fájl. NEM git commit — lásd SPRINTS.md.

## Döntések

- **pubDate**: a migrált cikkeknél a mai dátumot használjuk (nem a régi CSV `Datum` mezőjét),
  vagyis friss tartalomként kezeljük őket. (Felhasználói döntés, 2026-07-31.)

## Sprint 0 — Alaprendszer ✅ kész (2026-07-31)

- `src/data/hazak.json` — 57 termék (10 könnyűszerkezetes, 42 modulház, 5 konténerház),
  forrás: `src/lib/products.ts` `FALLBACK_PRODUCTS` (jelenlegi valós termékkínálat, nem kitalált adat).
- `src/components/HazakGrid.astro` — `kategoria`, `slugok`, `columns` (2/3/4) propokkal,
  alapértelmezésben (propok nélkül) az összes terméket mutatja.
- Tesztelve helyi dev szerveren (`npm run dev`, port 4322 — a 4321 másik projekt alatt foglalt volt):
  `/teliesitett-kontenerhaz-arak` oldalon 57/57 termékkártya renderel, `npx astro check`: 0 hiba.

## Jóváhagyott cikk-sablon (2026-08-01)

A `teliesitett-kontenerhaz-arak.astro` a felhasználó által jóváhagyott végleges minta.
A SPRINTS.md frissült ("A JÓVÁHAGYOTT CIKK-SABLON" szakasz Sprint 1 elé), minden új
cikk ezt a 12 lépéses szerkezetet követi. Sprint 1 (GSC_Prioritas=IGEN sorok) valójában
**15 db** cikk (a SPRINTS.md-ben becsült ~21 helyett — a CSV-ben ennyi az `IGEN` sor).

## Sprint 1 — GSC-prioritású cikkek ✅ KÉSZ (14 cikk + 1 redirect = 15/15 CSV-sor) (2026-08-01)

- [x] `teliesitett-kontenerhaz-arak` — Téliesített Konténerház Árak (pilot/jóváhagyott sablon)
- [x] `mobilhaz-epitesi-engedely` — Mobilház Építési Engedély (cross-category, konnyuszerkezetes anchor a "teljes kínálat" grid-hez)
- [x] `konnyuszerkezetes-haz-szerkezeti-rajz` — Könnyűszerkezetes Ház Szerkezeti Rajz
- [x] `4-evszakos-mobilhaz-arak` — 4 Évszakos Mobilház Árak (konnyuszerkezetes anchor)
- [x] `acelvazas-konnyuszerkezetes-haz-arak` — Acélvázas Könnyűszerkezetes Ház Árak
- [x] `luxus-mobilhaz` — Luxus Mobilház (modulhaz anchor; **nincs ár a hazak.json-ban a modulházakhoz**,
      az árszekció ezt nyíltan jelzi, nem találtam ki számot)
- [x] `konnyuszerkezetes-haz-bovites` — Könnyűszerkezetes Ház Bővítés — **[ELLENŐRZENDŐ, LEZÁRVA]**:
      nincs konkrét "bővítés" termék/ár a hazak.json-ban, a cikk ezt jelzi és inkább egy nagyobb új ház
      alternatíváját kínálja fel referenciaként. Felhasználó jóváhagyta, nincs további teendő (2026-08-01).
- [x] `konnyuszerkezetes-haz-alapozasa` — Könnyűszerkezetes Ház Alapozása
- [x] `80-m2-konnyuszerkezetes-haz` — 80 M2 Könnyűszerkezetes Ház — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ,
      lásd lent]**
- [x] `ki-epithet-konnyuszerkezetes-hazat` — Ki Építhet Könnyűszerkezetes Házat
- [x] `hasznalt-4-evszakos-mobilhaz-arak` — Használt 4 Évszakos Mobilház Árak — **[ELLENŐRZENDŐ, LEZÁRVA]**:
      a Gyors Ház nem árul/közvetít használt egységet, a hazak.json-ban nincs használt-piaci adat; a cikk
      ezt nyíltan jelzi, és új alternatívát kínál. Felhasználó jóváhagyta, nincs további teendő (2026-08-01).
- [x] `kontenerhaz-epites-hazilag` — Konténerház Építés Házilag — **[ELLENŐRZENDŐ, LEZÁRVA]**: erős
      tartalmi átfedés a már létező `/blog/kontenerhaz-epites-hazilag` cikkel; rövidebb összefoglaló + link
      a teljes cikkre. Felhasználó jóváhagyta, nincs további teendő (2026-08-01).
- [x] `modern-mobilhaz-arak` — Modern Mobilház Árak (modulhaz anchor, más modellválasztással mint a
      Luxus Mobilház, hogy ne legyen tartalmi duplikáció)
- [x] `teliesitett-mobilhaz-surgosen-elado` — Téliesített Mobilház Sürgősen Eladó — **[ELLENŐRZENDŐ, LEZÁRVA]**:
      a régi cím magánhirdetés-stílusú ("sürgősen eladó"), amit a Gyors Ház nem szolgáltat; a cikk ezt
      nyíltan jelzi, és a leggyorsabb ÚJ megoldásra (konténerház, 1-3 nap telepítés) irányítja az olvasót.
      Felhasználó jóváhagyta, nincs további teendő (2026-08-01).

**`kontenerhaz-epitesi-engedely-2020` — VISSZAVONVA, redirectre cserélve (2026-08-01):**
Nem lett belőle önálló cikk. A felhasználó döntése alapján a slug helyett 301-es redirect mutat a
meglévő `/blog/kontenerhoz-epitesi-engedely` (2026) cikkre, mivel a téma tartalmilag megegyezik.
A redirect a projektben már használt `public/_redirects` (Netlify) fájlban lett rögzítve:
`/kontenerhaz-epitesi-engedely-2020  /blog/kontenerhoz-epitesi-engedely  301`.
Az erre mutató kereszthivatkozást (`kontenerhaz-epites-hazilag.astro` "Kapcsolódó keresések" blokkja)
átírtam közvetlenül a `/blog/kontenerhoz-epitesi-engedely` célra.
Effektív cikkszám ezért **14/14** (a Sprint 1 15 CSV-sorából 1 redirect lett, nem cikk).

## UTÓLAGOS TEENDŐ (Sprint 7 végére)

- **80-m2-konnyuszerkezetes-haz**: az új `/80-m2-konnyuszerkezetes-haz` cikk és a meglévő
  `/blog/80-m2-konnyuszerkezetes-haz` cikk **jelenleg párhuzamosan fut, eltérő árakkal**:
  - Új cikk (jelenlegi `hazak.json` adat): 78 m² = 31.000 EUR, 86 m² = 32.000 EUR
  - Régi blogcikk (elavult): 78 m² = 28.200 EUR, 86 m² = 29.700 EUR
  Sprint 7 (Végső ellenőrzés) végén el kell dönteni: a régi blogcikk árait frissítjük a jelenlegire,
  vagy a két oldalt összevonjuk/az egyiket redirectáljuk a másikra — hogy ne legyen ellentmondó ár
  élesben a két URL-en.

### Ellenőrzés
- `npx astro check`: **0 hiba** (50 fájl összesen, a redirectre cserélt cikk eltávolítása után)
- Mind a 14 cikk-URL **200-as** státusszal él a helyi dev szerveren (`http://localhost:4322`)
- Az összes cikkközi (`kapcsolódó keresések` + szövegközi) link ellenőrizve — **egy sem törött**
- Az összes `HazakGrid slugok`-ban hivatkozott termék-slug ellenőrizve a `hazak.json` ellen — **mind létezik**
- Böngészőben átnézve: pilot, `luxus-mobilhaz` (nincs ár eset), `hasznalt-4-evszakos-mobilhaz-arak`
  (ELLENŐRZENDŐ átfogalmazás) — mind helyesen renderel
- **`/kontenerhaz-epitesi-engedely-2020` redirect**: a `public/_redirects` (Netlify) fájl **nem
  aktív egyszerű `astro dev` alatt** — ez már a projekt meglévő redirect-bejegyzéseire (pl.
  `/kontenerhoz` → `/kontenerhaz`) is igaz, ellenőriztem, azok is 404-et adnak lokálisan. A redirect
  helyessége csak `netlify dev`-vel vagy éles Netlify-környezetben tesztelhető — ez Sprint 7
  (link-ellenőrzés) részeként validálandó.

**Sprint 1 kész.** A felhasználó jóváhagyta, és 3 döntést hozott:
1. `kontenerhaz-epitesi-engedely-2020` → **visszavonva, 301 redirect** a `/blog/kontenerhoz-epitesi-engedely`-re
   (`public/_redirects`-ben rögzítve). Effektív Sprint 1 = 14 cikk + 1 redirect.
2. `80-m2-konnyuszerkezetes-haz` ELLENŐRZENDŐ → **UTÓLAGOS TEENDŐ**-vé alakítva (lásd fent), Sprint 7-re halasztva.
3. A másik 4 ELLENŐRZENDŐ cikk (`konnyuszerkezetes-haz-bovites`, `hasznalt-4-evszakos-mobilhaz-arak`,
   `kontenerhaz-epites-hazilag`, `teliesitett-mobilhaz-surgosen-elado`) → **véglegesnek elfogadva, lezárva**.

## Sprint 2 — Könnyűszerkezetes kategória (folyamatban)

A CSV-ben ténylegesen **114** (nem ~100) nem-prioritásos, könnyűszerkezetes témájú sor van, sok
valódi duplikátummal (elavult évszámos változatok, szinonima címek). A felhasználó jóváhagyta a
**konszolidáció + redirect** stratégiát: a valódi duplikátumokat egy-egy kanonikus oldalra 301-es
redirecttel irányítom (a `public/_redirects`-ben), a ~31 genuinely egyedi témához pedig önálló,
sablonkövető cikket írok. Becsült végeredmény: **~31 új cikk + ~79 redirect + 4 kizárt (helyszín-specifikus/
versenytárs-közeli) sor** = 114.

Kizárt sorok (helyszín-specifikus vagy versenytárs-közeli, SPRINTS.md szabály szerint):
- `konnyuszerkezetes-haz-arak-gyor` (Győr — helyszín-specifikus)
- `konnyuszerkezetes-haz-arak-vas-megye` (Vas megye — helyszín-specifikus)
- `konnyuszerkezetes-haz-elado-budapest` (Budapest — helyszín-specifikus)
- `romaniabol-femvazas-konnyuszerkezetes-haz-arak` (külföldi beszerzési forrás — versenytárs-közeli téma)

### Batch 1/7 (5 cikk) — kész
- [x] `50m2-konnyuszerkezetes-haz` — 50 m² Könnyűszerkezetes Ház (legközelebbi modell: 52 m², 22.000 EUR)
- [x] `fa-konnyuszerkezetes-haz-arak` — Fa Könnyűszerkezetes Ház — **[ELLENŐRZENDŐ]**: nálunk nincs favázas
      termék, csak acélvázas; a cikk ezt nyíltan tisztázza és az acélvázas kínálatra irányít
- [x] `gyorshaz-konnyuszerkezetes-haz` — Gyorsház (umbrella marketing kifejezés a könnyűszerkezetes vonalra)
- [x] `kis-konnyuszerkezetes-hazak` — Kis Könnyűszerkezetes Házak (22-35 m²)
- [x] `kulcsrakesz-konnyuszerkezetes-haz` — Kulcsrakész Könnyűszerkezetes Ház (mit jelent, mit tartalmaz)

### Batch 2/7 (5 cikk) — kész
- [x] `konnyuszerkezetes-csarnok` — Könnyűszerkezetes Csarnok — **[ELLENŐRZENDŐ]**: ipari csarnokot nem
      kínálunk, csak lakóépületet; a cikk ezt nyíltan jelzi és a legnagyobb lakóépület-megoldásainkra irányít
- [x] `konnyuszerkezetes-emeletes-haz` — Emeletes Könnyűszerkezetes Ház — **[ELLENŐRZENDŐ]**: jelenlegi
      modellek egyszintesek, a cikk ezt jelzi és egyszintes nagy alapterületű alternatívát kínál
- [x] `konnyuszerkezetes-fal` — Könnyűszerkezetes Fal (rétegrend, felépítés)
- [x] `konnyuszerkezetes-fodem` — Könnyűszerkezetes Födém (padlószerkezet, szigetelés)
- [x] `konnyuszerkezetes-garazs` — Könnyűszerkezetes Garázs — **[ELLENŐRZENDŐ]**: nincs dedikált garázs-termék,
      a cikk a legkisebb modellek egyedi átalakítási lehetőségét mutatja be

### Batch 3/7 (5 cikk) — kész
- [x] `konnyuszerkezetes-haz-szigetelese` — Könnyűszerkezetes Ház Szigetelése (rétegrend, belül/kívül)
- [x] `konnyuszerkezetes-haz-epitesi-engedely` — Könnyűszerkezetes Ház Építési Engedély (új kanonikus,
      nincs meglévő könnyűszerkezetes-specifikus /blog/ engedély cikk, tehát nem duplikátum)
- [x] `konnyuszerkezetes-haz-gyartok` — Könnyűszerkezetes Ház Gyártók (gyártóválasztási szempontok)
- [x] `konnyuszerkezetes-haz-hitel` — Könnyűszerkezetes Ház Hitel (finanszírozás)
- [x] `konnyuszerkezetes-haz-hatranyai` — Könnyűszerkezetes Ház Hátrányai (őszinte, kiegyensúlyozott áttekintés)

### Batch 4/7 (5 cikk) — kész
- [x] `konnyuszerkezetes-haz-kalkulator` — Könnyűszerkezetes Ház Kalkulátor — **[ELLENŐRZENDŐ]**: nincs
      valódi online kalkulátor eszköz, a cikk ezt jelzi és manuális árbecslési táblát ad helyette
- [x] `konnyuszerkezetes-haz-vagy-tegla` — Könnyűszerkezetes Ház Vagy Tégla (összehasonlítás)
- [x] `konnyuszerkezetes-haz-villanyszereles` — Könnyűszerkezetes Ház Villanyszerelése
- [x] `konnyuszerkezetes-haz-arak` — Könnyűszerkezetes Ház Árak — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**:
      azonos témájú, meglévő `/blog/konnyuszerkezetes-haz-arak` cikkel párhuzamosan fut (root vs blog
      route) — ugyanazokat az árakat használja, nincs ellentmondás, de Sprint 7-en érdemes összevetni,
      mint a 80-m2 esetnél
- [x] `konnyuszerkezetes-haz-elettartam` — Könnyűszerkezetes Ház Élettartama (óvatos, konkrét évszám nélkül)

### Batch 5/7 (5 cikk) — kész
- [x] `konnyuszerkezetes-haz-epites` — Könnyűszerkezetes Ház Építése (folyamat lépésről lépésre)
- [x] `konnyuszerkezetes-haz-epitese-hazilag` — Könnyűszerkezetes Ház Építése Házilag (DIY, honest)
- [x] `konnyuszerkezetes-mellekepulet` — Könnyűszerkezetes Melléképület — **[ELLENŐRZENDŐ]**: nincs
      dedikált termék, legkisebb modellek átalakítási lehetőségét mutatja be
- [x] `konnyuszerkezetes-laposteto` — Könnyűszerkezetes Lapostető — **[ELLENŐRZENDŐ]**: modelljeink
      döntött tetővel készülnek, nem lapostetővel; a cikk ezt nyíltan tisztázza
- [x] `konnyuszerkezetes-muhely` — Könnyűszerkezetes Műhely — **[ELLENŐRZENDŐ]**: nincs dedikált
      műhely-termék, a cikk a kisebb modellek egyedi átalakítási lehetőségét mutatja be

### Batch 6/7 (5 cikk) — kész
- [x] `konnyuszerkezetes-terasz-beepites` — Könnyűszerkezetes Terasz Beépítés
- [x] `konnyuszerkezetes-teto` — Könnyűszerkezetes Ház Teteje (35°-os döntött tető)
- [x] `konnyuszerkezetes-tipushaz` — Könnyűszerkezetes Típusház
- [x] `legjobb-konnyuszerkezetes-haz` — Legjobb Könnyűszerkezetes Ház — **[ELLENŐRZENDŐ]**: nincs
      objektív "legjobb" válasz, a cikk döntési szempontokat ad szuperlatívusz-állítás helyett
- [x] `olcso-konnyuszerkezetes-haz` — Olcsó Könnyűszerkezetes Ház (legkedvezőbb áraink)

### Batch 7/7 (1 cikk) — kész — mind a 31 új cikk elkészült
- [x] `konnyuszerkezetes-haz-40-nm` — Könnyűszerkezetes Ház 40 Nm — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**:
      azonos témájú, meglévő `/blog/konnyuszerkezetes-haz-40-nm` cikkel párhuzamosan fut (root vs blog
      route), ugyanaz a mintázat, mint a `80-m2-konnyuszerkezetes-haz` esetében — Sprint 7-en összevetendő.

### Redirect-térkép — 79 sor a `public/_redirects`-ben ("Sprint 2 — könnyűszerkezetes duplikátumok" blokk)

A CSV 114 könnyűszerkezetes sorából: 31 új cikk + 79 redirect (elavult évszámos változatok és
szinonima-címek → kanonikus oldal) + 4 kizárt (helyszín-specifikus/versenytárs-közeli) = 114. A
redirectek 25 különböző célra mutatnak: 20 új Sprint 2 cikkre, 3 Sprint 1 cikkre (`acelvazas-
konnyuszerkezetes-haz-arak`, `konnyuszerkezetes-haz-bovites`, `hasznalt-4-evszakos-mobilhaz-arak`,
`4-evszakos-mobilhaz-arak`), és 1 meglévő `/blog/konnyuszerkezetes-haz-arak` cikkre.

Kizárt sorok (nem kaptak se cikket, se redirectet):
- `konnyuszerkezetes-haz-elado-budapest` (Budapest — helyszín-specifikus)
- `konnyuszerkezetes-haz-arak-gyor` (Győr — helyszín-specifikus)
- `konnyuszerkezetes-haz-arak-vas-megye` (Vas megye — helyszín-specifikus)
- `romaniabol-femvazas-konnyuszerkezetes-haz-arak` (külföldi beszerzési forrás — versenytárs-közeli téma)

### Ellenőrzés
- `npx astro check`: **0 hiba** (81 fájl összesen)
- Mind a 31 új cikk-URL **200-as** státusszal él a helyi dev szerveren
- Az összes redirect FROM-path egyedi (nincs duplikátum), és mind a 25 redirect-cél valós, létező
  oldalra mutat (ellenőrizve fájllétezéssel)
- Az összes cikkközi (`kapcsolódó keresések` + szövegközi) link ellenőrizve mind a 31 új cikkben —
  **egy sem törött** (39 egyedi célpont, mind 200-as)
- Az összes `HazakGrid slugok`-ban hivatkozott termék-slug ellenőrizve a `hazak.json` ellen — **mind létezik**
- Böngészőben átnézve: `konnyuszerkezetes-laposteto` (őszinte "nincs lapostető" eset) — helyesen renderel

### Sprint 2 ELLENŐRZENDŐ cikkek (emberi review-t igényelnek)
- `fa-konnyuszerkezetes-haz-arak` — nincs favázas termékünk, csak acélvázas
- `konnyuszerkezetes-csarnok` — ipari csarnokot nem kínálunk
- `konnyuszerkezetes-emeletes-haz` — jelenlegi modellek egyszintesek
- `konnyuszerkezetes-garazs` — nincs dedikált garázs-termék
- `konnyuszerkezetes-mellekepulet` — nincs dedikált melléképület-termék
- `konnyuszerkezetes-laposteto` — modelljeink döntött tetővel készülnek
- `konnyuszerkezetes-muhely` — nincs dedikált műhely-termék
- `konnyuszerkezetes-haz-kalkulator` — nincs valódi online kalkulátor
- `legjobb-konnyuszerkezetes-haz` — nincs objektív "legjobb" válasz, döntési szempontokat ad helyette

### Sprint 2 UTÓLAGOS TEENDŐ (Sprint 7 végére, a 80-m2 tétel mellé)
- `konnyuszerkezetes-haz-arak` (root) és `konnyuszerkezetes-haz-40-nm` (root) mindkettő azonos témájú,
  már létező `/blog/` cikkel fut párhuzamosan. Egyik esetben sincs ár-ellentmondás (mindkét oldal a
  jelenlegi `hazak.json` adatokat tükrözi), de Sprint 7-en érdemes eldönteni: marad-e mindkét route,
  vagy az egyik redirectté alakul.

**Sprint 2 lezárva.** A felhasználó jóváhagyta, mind a 9 ELLENŐRZENDŐ cikket véglegesnek fogadta el.

## Sprint 3 — Modulház/mobilház kategória ✅ KÉSZ (2026-08-01)

A CSV-ben ténylegesen **88** (nem ~90) nem-prioritásos, modulház/mobilház témájú sor volt (91 találat
mínusz 2, amelyek már a Sprint 2 könnyűszerkezetes-halmazban szerepeltek). Ez a kategória sokkal
töredezettebb volt, mint a Sprint 2-es: rengeteg "eladó/használt/sürgősen eladó" magánhirdetés-stílusú
duplikátum, évszám-variáns és helyszín/márkanév-specifikus cím. Ugyanazt a konszolidáció+redirect
stratégiát alkalmaztam:

- **7 új, egyedi cikk**
- **62 redirect** a `public/_redirects`-ben ("Sprint 3" blokk)
- **18 kizárt** sor (helyszín-specifikus vagy versenytárs/piactér-közeli)
- **1 sor igényelt nulla akciót**: `modulhaz` (bare) — ez már a meglévő `/modulhaz` kategóriaoldalra
  mutat, nincs migrálandó régi tartalom, amit pótolni kellene
- Összesen: 7 + 62 + 18 + 1 = 88 ✓

### Új cikkek
- [x] `mobilhaz-szallitas` — Mobilház Szállítás (díjak, feltételek típusonként)
- [x] `mobilhaz-szerkezete` — Mobilház Szerkezete (a 3 kategória szerkezeti összehasonlítása)
- [x] `mobilhaz-engedely-nelkul` — Építhető Mobilház Engedély Nélkül? — óvatos, jogi kockázatra
      figyelmeztető tartalom, nem bátorít illegális építésre, a bejelentési eljárás felé tereli az olvasót
- [x] `zartkert-mobilhaz` — Mobilház Zártkertben — óvatos, nem állít konkrét jogi tényt zártkerti
      beépíthetőségről, a helyi önkormányzati egyeztetésre irányít
- [x] `mobilhaz-arak` — Mobilház Árak — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**: azonos témájú, meglévő
      `/blog/mobilhaz-arak-2025` cikkel fut párhuzamosan (root vs blog route)
- [x] `modulhaz-arak` — Modulház Árak — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**: azonos témájú, meglévő
      `/blog/modulhaz-arak` cikkel fut párhuzamosan; **a régi blogcikk modell-méretei jelentősen eltérnek
      a jelenlegi `hazak.json` adatoktól** (pl. Dublin 50→46 m², Ottawa 55→48 m², London 55→80 m², Vienna
      65→72 m², Amsterdam 30→35 m², Tallinn 26→30 m², Toscana 28→35 m²) — az új cikk a jelenlegi
      `hazak.json` adatait használja, a régiét NEM javítottam (más fájl), de a Sprint 7 UTÓLAGOS TEENDŐ
      listára felvettem
- [x] `modulhaz-es-alomterasz` — Modulház és Álomterasz (terasz méretek modellenként)

### Kizárt sorok (18 db)
- Helyszín-specifikus (magyar városok): `mobilhaz-balaton`, `mobilhaz-eger`, `mobilhaz-gyula`,
  `mobilhaz-kecskemet`, `mobilhaz-miskolc`, `modulhaz-gyor`, `modulhaz-kecskemet`
- Helyszín-specifikus (külföld): `elado-mobilhaz-ausztria`, `mobilhaz-3-haloszoba-olaszorszag`,
  `olaszorszagi-nyaralas-mobilhaz`
- Versenytárs/piactér-közeli: `adria-mobilhaz-arak` (Adria márka), `angol-mobilhaz-arak` (külföldi
  eredet-fókusz, a Románia-precedenshez hasonlóan), `feszek-mobilhaz` (lehetséges márkanév),
  `jegmadar-mobilhaz`, `jegmadar-mobilhaz-arak` (Jégmadár márka), `jofogas-mobilhaz`,
  `mobilhaz-jofogas`, `mobilhaz-arak-jofogas` (Jófogás.hu piactér)

### Ellenőrzés
- `npx astro check`: **0 hiba** (88 fájl összesen)
- Mind a 7 új cikk-URL **200-as** státusszal él a helyi dev szerveren
- Az összes redirect FROM-path egyedi, és mind a 21 redirect-cél (a Sprint 3 blokkban) valós, létező
  oldalra mutat (ellenőrizve fájllétezéssel, beleértve a `/modulhaz` kategóriaoldalt és a
  `/blog/mobilhaz-arak-2025`, `/blog/mobilhaz-reszletre`, `/blog/modulhaz-arak` meglévő cikkeket is)
- Az összes cikkközi link és `HazakGrid slugok` ellenőrizve mind a 7 új cikkben — **egy sem törött**

### Sprint 3 UTÓLAGOS TEENDŐ (Sprint 7 végére, a 80-m2 és a 40-nm tétel mellé)
- `mobilhaz-arak` (root) — párhuzamos a `/blog/mobilhaz-arak-2025` cikkel, nincs adatellentmondás
- ~~`modulhaz-arak` (root) — párhuzamos a `/blog/modulhaz-arak` cikkel, modell-méret ellentmondással~~
  — **javítva 2026-08-01, lásd lent, ez a tétel lezárva.** A route-párhuzamosság (root vs blog) önmagában
  megmarad Sprint 7-re eldöntendő kérdésként, de adatellentmondás már nincs.

**Sprint 3 kész (7 cikk + 62 redirect).**

## Sürgősségi javítás — `/blog/modulhaz-arak.md` méretadatok (2026-08-01)

A felhasználó 3 konkrét hibát jelzett (Dublin, London, Ottawa), amit a teljes cikk átvizsgálásával
9 további eltéréssel egészítettem ki. Mind a 12 javítás a `hazak.json` jelenlegi, hiteles adataira lett
igazítva:

| Modell | Régi (hibás) | Új (hazak.json) |
|---|---|---|
| Tallinn | 26 m² | 30 m² |
| Toscana | 28 m² | 35 m² |
| Amsterdam | 30 m² | 35 m² |
| Paris | 32 m² | 35 m² |
| Bonn | 48 m² | 45 m² |
| Dublin | 50 m² | 46 m² |
| Majorca | 52 m² | 46 m² |
| Ottawa | 55 m² | 48 m² |
| Malta | 55 m² | 56 m² |
| London | 55 m² | **80 m²** |
| Montreal | 60 m² | 70 m² |
| Vienna | 65 m² | 72 m² |

Emellett a méretkategória-tartományok (Kis/Közepes/Nagy modellek fejlécei) is frissültek, mivel a
London (80 m²) és a Montreal/Vienna (70/72 m²) a javítás után más csoportba kerültek. A frontmatter
`description` mezőjében is javítottam egy külön hibát: "20–144 m²-ig" → "15–122 m²-ig" (ez sem a
`hazak.json`-nal, sem a cikk saját szövegével nem egyezett korábban).

Nem találtam további eltérést a fájl többi részén (árbecslések, FAQ, kivitelezési idők — ezek nem
modellspecifikus adatok, nem változtak).

**Ellenőrzés:** `npx astro check` → 0 hiba (88 fájl), `/blog/modulhaz-arak` → 200. Nem commitoltam.

A felhasználó jóváhagyta a folytatást Sprint 4-gyel közvetlenül, e javítás jóváhagyásától függetlenül.

## Sprint 4 — Konténerház kategória ✅ KÉSZ (2026-08-01)

A CSV-ben ténylegesen **84** nem-prioritásos, konténerház témájú sor volt, ebből **2 már a Sprint 3-ban**
kezelve lett (`kontener-mobilhaz`, `mobilhaz-kontenerhaz-tiny-house-elado`) → **82** effektív sor
Sprint 4-hez. Ugyanaz a konszolidáció+redirect stratégia:

- **10 új, egyedi cikk**
- **65 redirect** a `public/_redirects`-ben ("Sprint 4" blokk)
- **5 kizárt** sor (helyszín-specifikus vagy külföldi eredet-fókusz)
- **2 sor igényelt nulla akciót**: `kontener-haz` (már meglévő pre-existing redirect a `/kontenerhaz`-ra)
  és `kontenerhaz` bare (már a meglévő `/kontenerhaz` kategóriaoldalra mutat)
- Összesen: 10 + 65 + 5 + 2 = 82 ✓

### Új cikkek
- [x] `100-nm-kontenerhaz-arak` — 100 Nm Konténerház Árak (legközelebbi: Beverly L, 90 m²)
- [x] `20-m2-kontenerhaz` — **[ELLENŐRZENDŐ]**: nincs ilyen kis méretű konténerházunk (legkisebb 55 m²),
      a cikk ezt nyíltan tisztázza és könnyűszerkezetes alternatívát ajánl
- [x] `70-nm-kontenerhaz` — 70 Nm Konténerház (Manhattan L és Nordic Premium)
- [x] `emeletes-kontenerhaz` — **[ELLENŐRZENDŐ]**: jelenlegi modellek egyszintesek
- [x] `kontenerhaz-60-nm` — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**: azonos témájú, meglévő
      `/blog/kontenerhoz-60-nm` cikkel fut párhuzamosan (root vs blog, "haz" vs "hoz" írásmód)
- [x] `kontenerhaz-alapozas` — **[ELLENŐRZENDŐ → UTÓLAGOS TEENDŐ]**: azonos témájú, meglévő
      `/blog/kontenerhoz-alapozas` cikkel fut párhuzamosan (root vs blog); nincs adatellentmondás,
      csak route-párhuzamosság
- [x] `kontenerhaz-belulrol` — Konténerház Belülről (belső kivitel modellenként)
- [x] `kontenerhaz-hatranyai` — Konténerház Hátrányai (őszinte áttekintés)
- [x] `kontenerhaz-meretek` — Konténerház Méretek (teljes táblázat, mind az 5 modell)
- [x] `kontenerhaz-szigeteles` — Konténerház Szigetelés (modellenkénti szigetelési szint)

### Kizárt sorok (5 db)
- Helyszín-specifikus: `kontener-haz-eger` (Eger), `kontenerhaz-dunafoldvar` (Dunaföldvár),
  `kontenerhaz-gyor` (Győr), `kontenerhaz-kecskemet` (Kecskemét)
- Külföldi eredet-fókusz (versenytárs-közeli, Románia-precedenshez hasonlóan):
  `kontener-haz-szloveniabol-ar` (Szlovéniából importálás)

### Fontos: felfedezett, NEM javított meglévő ellentmondás (out of scope)
A `/blog/kontenerhoz-60-nm.md` és a `/blog/kontenerhoz-arak.md` **egymásnak ellentmondó szállítási
időt** adnak meg: az `arak` cikk szerint "1–3 nap telepítés, 2–4 hét teljes folyamat", a `60-nm` cikk
szerint "4–6 hét gyártás + 1 hét telepítés". Ez a felhasználó mostani javítási kérésén kívül eső,
másik meglévő `/blog/` fájlokat érintő ellentmondás — nem javítottam, csak jelzem. Az új
`kontenerhaz-60-nm.astro` cikkemben nem állítottam konkrét szállítási időt, hogy ne örököljem az
ellentmondást egyik oldalról sem.

### Ellenőrzés
- `npx astro check`: **0 hiba** (98 fájl összesen)
- Mind a 10 új cikk-URL **200-as** státusszal él a helyi dev szerveren
- Az összes redirect FROM-path egyedi, és mind a 16 redirect-cél (a Sprint 4 blokkban) valós, létező
  oldalra mutat (ellenőrizve fájllétezéssel, beleértve a `/kontenerhaz` kategóriaoldalt és a
  `/blog/kontenerhoz-epitesi-engedely` meglévő cikket is)
- Az összes cikkközi link és `HazakGrid slugok` ellenőrizve mind a 10 új cikkben — **egy sem törött**

### Sprint 4 UTÓLAGOS TEENDŐ (Sprint 7 végére)
- `kontenerhaz-60-nm` (root) — párhuzamos a `/blog/kontenerhoz-60-nm` cikkel
- `kontenerhaz-alapozas` (root) — párhuzamos a `/blog/kontenerhoz-alapozas` cikkel
- A fent jelzett szállítási idő ellentmondás a két meglévő `/blog/` konténerház-cikk között
  (`kontenerhoz-arak.md` vs `kontenerhoz-60-nm.md`)

**Sprint 4 lezárva.** A felhasználó jóváhagyta Sprint 4-et és a modulhaz-arak sürgősségi javítást.

## Sprint 5 — Generikus gyorsház/készház kategória ✅ KÉSZ (2026-08-01)

A CSV-ben ténylegesen **69** (nem ~60) nem-prioritásos, generikus gyorsház/készház témájú sor volt
(a 78 nem-kategória-specifikus sorból 9 rönkház-témájú, azok Sprint 6-ra maradnak). Ez a kategória
**szinte teljes egészében márkanevekből és szinonimákból állt** — a "gyorsház"/"készház" fogalmak
maguk is csak szinonimái a már Sprint 1-4-ben megépített "mobilház" umbrella-tartalmaknak. Ugyanaz a
konszolidáció+redirect stratégia:

- **2 új, egyedi cikk** (a többi genuinely csak szinonima vagy márkanév volt)
- **54 redirect** a `public/_redirects`-ben ("Sprint 5" blokk)
- **13 kizárt** sor (versenytárs-márkanevek és külföldi eredet-fókusz)
- Összesen: 2 + 54 + 13 = 69 ✓

### Új cikkek
- [x] `keszhaz-jelentese` — Mit Jelent a Készház Kifejezés? (definíciós, fogalomtisztázó cikk)
- [x] `keszhaz-nyaralo` — Készház Nyaralónak (kompakt modellek nyaraló-használatra)

### Kizárt sorok (13 db) — mind versenytárs-márkanév vagy külföldi eredet-fókusz
- **Leier** márka: `leier-gyorshaz`, `leier-keszhaz`, `leier-keszhazak` (Leier valós magyar
  építőanyag-gyártó/készházmárka)
- **Liapor** márka: `liapor-keszhaz` (Liapor valós magyar építőanyag-márka)
- **Koncz** márka: `koncz-keszhaz` (Koncz Készházak valós magyar cégnév)
- Specifikus cégnév-gyanús: `gyorshazak-next-kft` ("Next" egyedi márkajelölés),
  `keszhaz-menedzser-kft` (egyedi cégnév-gyanús elnevezés)
- Feltételezett külső portál/aggregátor: `keszhaz-centrum`, `keszhaz-portal`, `keszhazak-hu`,
  `gyorshaz-hu` (utóbbi kettő külső domain-re utalhat, a mi domainünk kötőjeles gyors-haz.hu)
- Külföldi eredet-fókusz (a Románia/Szlovénia-precedenshez hasonlóan): `keszhaz-lengyelorszag`
  (Lengyelország), `sved-gyorshaz` ("svéd" eredet-marketing)

### Ellenőrzés
- `npx astro check`: **0 hiba** (100 fájl összesen)
- Mind a 2 új cikk-URL **200-as** státusszal él a helyi dev szerveren
- Az összes redirect FROM-path egyedi, és mind a 13 redirect-cél (a Sprint 5 blokkban) valós, létező
  oldalra mutat (ellenőrizve fájllétezéssel)
- Az összes cikkközi link és `HazakGrid slugok` ellenőrizve mind a 2 új cikkben — **egy sem törött**
  (menet közben egy saját hibát is javítottam: az "Amsterdam" modulház modellt tévesen 20 m²-esként
  írtam a `keszhaz-nyaralo.astro`-ban, a valós méret 35 m² — a példát a ténylegesen 20 m²-es
  "Tiny House" modellre cseréltem, mielőtt véglegesítettem volna)

### Sprint 5 UTÓLAGOS TEENDŐ
Nincs új tétel — ebben a sprintben egyik redirect sem mutatott meglévő `/blog/` cikkre olyan témában,
ahol adateltérést találtam volna (a redirectek a saját Sprint 1-4-es kanonikus oldalainkra mutatnak,
nem a régi blogra).

**Sprint 5 lezárva.** A felhasználó jóváhagyta.

## Sprint 6 — Rönkház kategória ✅ KÉSZ (2026-08-01)

A CSV-ben pontosan **9** rönkház témájú sor volt, ahogy a SPRINTS.md becsülte. **Fontos felfedezés：
a `hazak.json`-ban egyáltalán nincs rönkház kategória** — csak `konnyuszerkezetes`, `modulhaz` és
`kontenerhaz` létezik, egyetlen rönkház (fa gerendaház) terméket sem árulunk. Ez egy teljesen
off-catalog kategória.

- **1 új, [ELLENŐRZENDŐ] cikk**: `ronkhaz-arak` — nyíltan kimondja, hogy nincs rönkház termékünk, és
  alternatívát kínál (Nordic Premium konténerház fa homlokzattal, mint legközelebbi esztétikai
  megfelelő + a teljes könnyűszerkezetes/modulház/konténerház kínálat)
- **8 redirect** mind erre az egy kanonikus oldalra (eladó, "kanadai" stílus, kis méret, kulcsrakész,
  alapanyag, két "eladó" szórendi variáns, "ár", "építés" — mind ugyanaz az "nincs ilyen termékünk"
  üzenet, csak szinonima/variáns)
- **0 kizárás** — a "Kanadai Rönkház Árak" sort NEM zártam ki versenytársként, mert ez egy építési
  stílus-leírás (rönkház/blockhouse stílus), nem egy konkrét márkanév
- Összesen: 1 + 8 = 9 ✓

### Ellenőrzés
- `npx astro check`: **0 hiba** (101 fájl összesen)
- `/ronkhaz-arak` → **200**
- Az összes redirect FROM-path egyedi, a célja (`/ronkhaz-arak`) létezik
- Az összes cikkközi link és `HazakGrid slugok` ellenőrizve — **egy sem törött**

### Sprint 6 UTÓLAGOS TEENDŐ
Nincs új tétel.

**Sprint 6 kész (1 cikk + 8 redirect). Ezzel a teljes tartalom-migráció (Sprint 1-6) elkészült.
Megállva a felhasználó jóváhagyására — utána már csak a Sprint 7 (végső ellenőrzés + a felgyűlt
UTÓLAGOS TEENDŐ audit-lista összeállítása) van hátra.**

## Sprint 7 — Végső ellenőrzés

### Javítás — szállítási/átadási idő ellentmondás feloldása (2026-08-01)

**Felfedezett probléma** (a Sprint 7 audit során, `UTOLAGOS_TEENDOK_AUDIT.md` D szakasz): a
`/blog/kontenerhoz-arak.md` és a `/blog/kontenerhoz-60-nm.md` egymásnak ellentmondó teljes
átfutási időt állított a konténerházak megrendeléstől a kulcsátadásig tartó folyamatára
(2–4 hét vs. 4–6 hét + 1 hét telepítés, azaz kb. 2 hónap). A felhasználó explicit utasítására
egy konzisztens, óvatos tartományra egyeztettük mindkét fájlt.

**Döntés:** mivel nem állt rendelkezésre megbízható forrás a pontos időre, a szélesebb, biztonságosabb
**"jellemzően 4–6 hét, egyedi igény és a telek adottságai szerint eltérhet"** megfogalmazást választottuk
mindkét helyen — külön kiemelve, hogy ez a *teljes* folyamat (gyártás+szállítás+alapozás+összeszerelés),
míg a helyszíni összeszerelés önmagában (az alapozás után) továbbra is 1–3 nap, ami nem mond ellent semminek.

**Módosított fájlok:**
- `src/content/blog/kontenerhoz-arak.md`: összehasonlító táblázat "Átadási idő" sora (2–4 hét → 4–6 hét)
  + FAQ válasz ("Mennyi ideig tart a szállítás és a telepítés?") pontosítva
- `src/content/blog/kontenerhoz-60-nm.md`: FAQ válasz ("Mennyi idő alatt szállítják ki a konténerházat?")
  pontosítva, a korábbi "4-6 hét gyártás + 1 hét telepítés = kb. 2 hónap" számítás-jellegű állítás törölve
- `src/pages/teliesitett-kontenerhaz-arak.astro`: ugyanez a probléma megtalálható volt a saját FAQ
  válaszban is (a sablonból öröklődött "teljes folyamat... 2–4 hét" állítás) — javítva
- `src/pages/teliesitett-mobilhaz-surgosen-elado.astro`: ugyanez az öröklött állítás 4 helyen
  (FAQ válasz, `summary` prop, összehasonlító táblázat sora, záró bekezdés) — mind javítva

**Nem módosítva** (nem ellentmondásos, mert kifejezetten csak a helyszíni telepítést, nem a teljes
folyamatot írja le): `src/pages/kontenerhaz-epites-hazilag.astro` és `src/pages/mobilhaz-szallitas.astro`
"1–3 nap" telepítési idő említései.

**Ellenőrzés:** `npx astro check` → 0 hiba, 0 figyelmeztetés (1 pre-existing, nem kapcsolódó hint az
`index.astro`-ban). Curl 200: `/blog/kontenerhoz-arak`, `/blog/kontenerhoz-60-nm`,
`/teliesitett-kontenerhaz-arak`, `/teliesitett-mobilhaz-surgosen-elado`.

### Javítás — 11 fájl elavult ára/mérete a `hazak.json` alapján (2026-08-01)

**Felhasználói utasítás:** az `UTOLAGOS_TEENDOK_AUDIT.md` A) és B) szakaszában feltárt, rendszerszintűen
elavult könnyűszerkezetes árakat (9 fájl) és modulház (Ticab) méreteket (2 fájl) javítani a `hazak.json`
jelenlegi adataira, mechanikusan — ugyanúgy, mint a korábbi `modulhaz-arak.md` sürgősségi javításnál.

**Mesterreferencia (könnyűszerkezetes, `hazak.json`):**

| Modell | Helyes ár |
|---|---|
| 32 m² | 18.600 EUR |
| 35 m² | 20.300 EUR |
| 62 m² | 23.000 EUR |
| 78 m² | 31.000 EUR |
| 86 m² | 32.000 EUR |
| 87 m² | 34.000 EUR |
| 96 m² | 35.000 EUR |

(22 m² / 16.000 EUR, 52 m² / 22.000 EUR és 126 m² / 43.000 EUR minden fájlban változatlanul helyes maradt.)

#### 1. `src/content/blog/konnyuszerkezetes-haz-arak.md`
| Mező | Régi | Új |
|---|---|---|
| Ártáblázat KSZ-32 | 17.600 EUR | 18.600 EUR |
| Ártáblázat KSZ-35 | 18.400 EUR | 20.300 EUR |
| Ártáblázat KSZ-62 | 24.500 EUR | 23.000 EUR |
| Ártáblázat KSZ-78 | 28.200 EUR | 31.000 EUR |
| Ártáblázat KSZ-86 | 29.700 EUR | 32.000 EUR |
| Ártáblázat KSZ-87 | 30.500 EUR | 34.000 EUR |
| Ártáblázat KSZ-96 | 35.800 EUR | 35.000 EUR |
| Nm-ár oszlop (32/35/62/78/86/87/96) | régi árakból számolt | újraszámolva az új árakból (~581/~580/~371/~397/~372/~391/~365 EUR/m²) |
| "Kapcsolódó modelljeink" linkek (KSZ-35, 78, 96) | régi árak | új árak |
| KSZ-86 vs KSZ-87 árkülönbség mondat | "29.700 vs. 30.500 EUR" | "32.000 vs. 34.000 EUR" |
| KSZ-35 "különleges megjegyzés" mondat | fabrikált "alap/emelt kiviteli szint" két-áras állítás (18.400 / 20.300+ EUR) | egyszerűsítve: egyetlen ár, 20.300 EUR-tól (a két-áras állítás nem volt alátámasztva a hazak.json-ban) |

#### 2. `src/content/blog/konnyuszerkezetes-haz-40-nm.md`
| Mező | Régi | Új |
|---|---|---|
| Frontmatter description | 35 m² (18.400 EUR) | 35 m² (20.300 EUR) |
| Intro | 18.400 EUR-tól | 20.300 EUR-tól |
| H2 cím (KSZ-35) | 18.400 EUR + ÁFA | 20.300 EUR + ÁFA |
| "Magasabb kiviteli szintű változat" mondat | fabrikált, a javított alapárral ellentmondásossá vált állítás | törölve |
| KSZ-35/KSZ-52 árkülönbség | "3.600 EUR (kb. 1,4 M Ft)" | "1.700 EUR (kb. 680.000 Ft)" |
| Összehasonlító táblázat (Ár / Ft / Nm-ár) | 18.400 EUR / ~7,36 M Ft / 526 EUR/m² | 20.300 EUR / ~8,12 M Ft / 580 EUR/m² |
| "Egyéb modellek" lista (KSZ-32, KSZ-62) | 17.600 EUR / 24.500 EUR | 18.600 EUR / 23.000 EUR |

#### 3. `src/content/blog/80-m2-konnyuszerkezetes-haz.md`
| Mező | Régi | Új |
|---|---|---|
| Frontmatter description + intro + H2 árak (78 m², 86 m²) | 28.200 EUR / 29.700 EUR (7 előfordulás) | 31.000 EUR / 32.000 EUR |
| Összehasonlító táblázat | 28.200 EUR / 29.700 EUR | 31.000 EUR / 32.000 EUR |
| Hitelkalkuláció mondat | "28-30 ezer eurós vételár", "~10,3M Ft", "~3,1M Ft önerő" | "31-32 ezer eurós", "~11,3M Ft", "~3,4M Ft önerő" |
| FAQ válaszok | 28.200 EUR (78 m²) / 29.700 EUR (86 m²) | 31.000 EUR / 32.000 EUR |

#### 4. `src/content/blog/mobilhaz-arak-2025.md`
| Mező | Régi | Új |
|---|---|---|
| KSZ-78 összehasonlító mondat | 28.200 EUR, ~11,3 M Ft szerkezet, 14–15 M Ft összesen | 31.000 EUR, ~12,4 M Ft szerkezet, 15–16 M Ft összesen |

#### 5. `src/content/blog/mobilhaz-reszletre.md`
| Mező | Régi | Új |
|---|---|---|
| Hitelkalkuláció táblázat, KSZ-78 sor | 28.200 EUR (~11,3 MFt) / ~3,4 MFt önerő / ~7,9 MFt hitel / ~80.000 Ft havi | 31.000 EUR (~12,4 MFt) / ~3,7 MFt önerő / ~8,7 MFt hitel / ~87.000 Ft havi |

#### 6. `src/content/blog/szendvicspanel-haz-arak.md`
| Mező | Régi | Új |
|---|---|---|
| Nm-ár táblázat (KSZ-35, 78, 96) | 18.400/526 EUR/m²/~210.000 Ft; 28.200/362 EUR/m²/~145.000 Ft; 35.800/373 EUR/m²/~149.000 Ft | 20.300/580/~232.000 Ft; 31.000/397/~159.000 Ft; 35.000/365/~146.000 Ft |
| Szendvicspanel vs téglaház táblázat (78 m²-es ház ára) | ~11,3 M Ft (28.200 EUR) | ~12,4 M Ft (31.000 EUR) |
| FAQ (80 nm-es ház ára) | 28.200 EUR, ~11,3 M Ft, 15–16 M Ft összesen | 31.000 EUR, ~12,4 M Ft, 16–17 M Ft összesen |

#### 7. `src/content/blog/szendvicspanel-haz-elado.md`
| Mező | Régi | Új |
|---|---|---|
| Teljes ártáblázat (mind a 10 modell) | 32/17.600, 35/18.400, 62/24.500, 78/28.200, 86/29.700, 87/30.500, 96/35.800 EUR | 32/18.600, 35/20.300, 62/23.000, 78/31.000, 86/32.000, 87/34.000, 96/35.000 EUR |

#### 8. `src/content/blog/100-nm-kontenerhoz-arak.md`
| Mező | Régi | Új |
|---|---|---|
| Könnyűszerkezetes összehasonlító mondat (86 m²) | 29.700 EUR | 32.000 EUR |

#### 9. `src/content/blog/kontenerhaz-vs-konnyuszerkezetes.md`
| Mező | Régi | Új |
|---|---|---|
| Összehasonlító lista (KSZ-96) | 35.800 EUR | 35.000 EUR |

#### 10. `src/content/blog/modulhaz-debrecen.md`
| Modell | Régi | Új |
|---|---|---|
| Dublin | 50 m² | 46 m² |
| Ottawa | 55 m² | 48 m² |
| Montreal | 60 m² | 70 m² |
| Vienna | 65 m² | 72 m² |

#### 11. `src/content/blog/modulhaz-gyor.md`
| Modell | Régi | Új |
|---|---|---|
| Dublin | 50 m² | 46 m² |
| London | 55 m² | 80 m² |
| Montreal | 60 m² | 70 m² |
| Vienna | 65 m² | 72 m² |

**Megjegyzés a mechanikus javításon túl:** két helyen (`konnyuszerkezetes-haz-arak.md` KSZ-35 megjegyzés,
`konnyuszerkezetes-haz-40-nm.md` "magasabb kiviteli szintű változat" mondat) a fájl egy nem létező,
fabrikált két-áras (alap/emelt) modellváltozatot állított — ezek a javított alapárral szó szerint
önellentmondóvá váltak volna, ezért ezeket egyetlen, a `hazak.json`-nal konzisztens árra egyszerűsítettem,
tartalom hozzáadása nélkül.

**Ellenőrzés:** `npx astro check` → 0 hiba, 0 figyelmeztetés (1 pre-existing, nem kapcsolódó hint az
`index.astro`-ban). Curl 200 mind a 11 érintett `/blog/*` oldalon.

### Összevonás — mind a 7 C) route-duplikáció (C.1–C.7) lezárva (2026-08-01)

**Felhasználói utasítás:** a root cikk marad a kanonikus URL; a `/blog/` cikk egyedi, adatvezérelt
tartalmi többlete átemelve a root cikkbe (a root cikk saját, már javított áraival/adataival
kombinálva, a blog elavult adatai nélkül); a `/blog/` cikk törölve, 301 redirect rá a rootra; a root
cikk esetleges "korábbi cikkünk" önhivatkozása eltávolítva.

| # | Root (kanonikus) | Törölt /blog/ cikk | Átemelt tartalom |
|---|---|---|---|
| C.1 | `/80-m2-konnyuszerkezetes-haz` | `/blog/80-m2-konnyuszerkezetes-haz` | 78m²/86m² modell részletes bemutatása (nm-ár, terasz, szoba – a hazak.json-nal ellenőrzött, javított adatokkal), "Hitelre is megvehető" szekció, +1 FAQ (építési idő) |
| C.2 | `/konnyuszerkezetes-haz-arak` | `/blog/konnyuszerkezetes-haz-arak` | Nm-ár oszlop az ártáblázatban, "Négyzetméterár összehasonlítás" (tégla/konténer/modulház/használt lakás), bővített "mit nem tartalmaz" lista, "Miért érdemes könnyűszerkezetes házat választani" szekció, "Hitelre is megvehető" szekció, +5 FAQ (alku, garancia, teljes költség, KSZ-86 vs 87) |
| C.3 | `/konnyuszerkezetes-haz-40-nm` | `/blog/konnyuszerkezetes-haz-40-nm` | KSZ-52 modell részletes bemutatása, "35 vs 52 m² részletes összehasonlítás" táblázat, "Melyiket válasszam" döntési szempontlista, "Egyéb modellek" (32/62 m²), "Finanszírozás" szekció, +4 FAQ |
| C.4 | `/mobilhaz-arak` | `/blog/mobilhaz-arak-2025` | "Mi befolyásolja az árat" bővítve 5 tényezőre, "Mobilház vs hagyományos ház" összehasonlítás, "Hitelre is megvehető" konkrét kalkulációval, "Új vs használt mobilház árak" szekció, +2 FAQ |
| C.5 | `/modulhaz-arak` | `/blog/modulhaz-arak` | "Mi az a modulház" definíció, **teljes Ticab-katalógus** 4 méretkategóriában (a blog elavult, hiányos 33-modelles listája helyett a `hazak.json` jelenlegi, teljes 42-modelles kínálatából újraépítve – 9 modell hiányzott a blogból: Monaco, Sydney, Atlanta, Boston, Milan, Capri, Palermo, Florence, Lyon), "Modulház előnyei és hátrányai" táblázat, "Hogyan rendeld meg" 3-lépéses folyamat, +2 FAQ |
| C.6 | `/kontenerhaz-60-nm` | `/blog/kontenerhoz-60-nm` | Manhattan L / Nordic Premium külön, teljes specifikációval (bruttó/nettó, mit tartalmaz/nem tartalmaz), bővített összehasonlító táblázat (gipszkarton, homlokzat, terasz sorok), "Engedélyezés és alapozás" szekció, +2 FAQ (nettó/bruttó, szállítási idő – az utóbbi a korábban javított "4–6 hét" egységes megfogalmazással) |
| C.7 | `/kontenerhaz-alapozas` | `/blog/kontenerhoz-alapozas` | Mind a 4 alapozástípus (pontalapos, talpgerendás, lemezalap, csavarpilóta) saját alcímmel és előny/hátrány/ár bontással, "Mit befolyásol az alapozás árát" szekció, "Az alapozás folyamatának lépései" (5 lépés), "Tippek az alapozáshoz" szekció, +3 FAQ |

**Adatellenőrzés a merge közben (nem csak szöveg-átemelés):** a C.1-nél kiderült, hogy a blog cikk
78 m²-es modellre vonatkozó szoba- (2 hálószoba) és terasz-adata (16 m²) **eltért** a `hazak.json`
tényleges adataitól (3 szoba, 14 m² terasz) — a root cikk saját, hazak.json-nal egyező adatai lettek
megtartva, a blog hibás adata nem került átvételre. A C.5-nél a blog Ticab-katalógusa 9 valós, a
`hazak.json`-ban szereplő modellt egyáltalán nem tartalmazott — ezek helyett a teljes, pontos
katalógus lett felépítve.

**Internal linkek frissítve:** a törölt 7 `/blog/` URL-re a kódbázisban máshonnan (más root cikkek
"Kapcsolódó keresések" pilljei, illetve 2 megmaradó `/blog/` cikk) mutató, összesen ~35 hivatkozás
frissítve a megfelelő új root URL-re, hogy ne redirecten keresztül, hanem közvetlenül a kanonikus
URL-re mutassanak.

**Ellenőrzés:** `npx astro check` → 0 hiba (1 pre-existing, nem kapcsolódó hint). Curl 200 mind a 7
root URL-en; a törölt `/blog/*` URL-ek helyi dev szerveren 404-et adnak (ez várt viselkedés – a
Netlify `_redirects` fájlt a lokális `astro dev` szerver nem dolgozza fel, csak éles Netlify
környezetben aktiválódik a 301-es redirect).

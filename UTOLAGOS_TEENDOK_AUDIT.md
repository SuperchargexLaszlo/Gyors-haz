# UTÓLAGOS TEENDŐK AUDIT — Sprint 7

Ez a dokumentum a Sprint 1-6 tartalom-migráció során felgyűlt, **még nem javított**, meglévő
`/blog/` fájlokat érintő tételeket gyűjti össze egy helyre, a Sprint 7 végleges döntéseihez.

**Fontos:** ezen a listán **semmi nincs kijavítva** (a `modulhaz-arak.md` már javított eset kivételével,
ami itt csak történeti referenciaként szerepel). Minden tétel eldöntésre vár: frissítés, összevonás
vagy redirect.

Az audit összeállítása közben (2026-08-01) **aktívan újra ellenőriztem** néhány korábbi CHANGELOG-bejegyzést
("nincs adatellentmondás" állítások), és ennek során **2 korábban tévesen "nincs ellentmondás"-ként
feljegyzett tételnél is találtam eltérést** (lásd A.2 és A.4 pont) — ezeket itt korrigálom. Emellett a
mélyebb ellenőrzés során **egy korábban egyáltalán nem dokumentált, rendszerszintű árazási probléma**
is előkerült (A pont), ami 10 különböző meglévő fájlt érint.

---

## A) RENDSZERSZINTŰ: elavult könnyűszerkezetes árazás — ~~nyitott~~ **JAVÍTVA 2026-08-01**

Mind a 9 fájl mechanikusan javítva a `hazak.json` jelenlegi áraira, a felhasználó explicit utasítására
(ugyanaz a módszer, mint a `modulhaz-arak.md` sürgősségi javításnál). Részletek: `CHANGELOG.md`
"Javítás — 11 fájl elavult ára/mérete a `hazak.json` alapján (2026-08-01)" szakasz.

### A.0 — Mesterreferencia: helyes árak (`hazak.json`, jelenlegi valós kínálat)

| Modell | Helyes ár (hazak.json) |
|---|---|
| 22 m² | 16.000 EUR |
| 32 m² | 18.600 EUR |
| 35 m² | 20.300 EUR |
| 52 m² | 22.000 EUR |
| 62 m² | 23.000 EUR |
| 78 m² | 31.000 EUR |
| 86 m² | 32.000 EUR |
| 87 m² | 34.000 EUR |
| 96 m² | 35.000 EUR |
| 126 m² | 43.000 EUR |

### A.1 — `src/content/blog/konnyuszerkezetes-haz-arak.md`

**Mező:** a cikk fő ártáblázata ("Könnyűszerkezetes ház árak 2026 – Teljes táblázat") + a "Kapcsolódó
modelljeink" szekció linkjei.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 32 m² | 17.600 EUR | 18.600 EUR |
| 35 m² | 18.400 EUR | 20.300 EUR |
| 62 m² | 24.500 EUR | 23.000 EUR |
| 78 m² | 28.200 EUR | 31.000 EUR |
| 86 m² | 29.700 EUR | 32.000 EUR |
| 87 m² | 30.500 EUR | 34.000 EUR |
| 96 m² | 35.800 EUR | 35.000 EUR |

(22 m², 52 m², 126 m² helyesek a fájlban.) Ez a fájl gyakorlatilag **ugyanaz a cikk, mint az általam
írt `konnyuszerkezetes-haz-arak.astro`** (lásd C.2 pont) — kettős probléma: route-duplikáció ÉS
adateltérés egyszerre.

**Felfedezve:** Sprint 7 audit közben (2026-08-01). A Sprint 2 CHANGELOG-bejegyzés tévesen
"ugyanazokat az árakat használja, nincs ellentmondás"-ként rögzítette ezt — ez a megállapítás **hibás
volt**, most korrigálva.

### A.2 — `src/content/blog/konnyuszerkezetes-haz-40-nm.md`

**Mező:** a cikk fő modell-bemutatói és az "Egyéb modellek" szekció.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 32 m² | 17.600 EUR | 18.600 EUR |
| 35 m² | 18.400 EUR | 20.300 EUR |
| 62 m² | 24.500 EUR | 23.000 EUR |

(52 m² helyes a fájlban.) Ugyanaz a kettős probléma, mint A.1-nél: ez a fájl gyakorlatilag ugyanaz a
téma, mint az én `konnyuszerkezetes-haz-40-nm.astro` cikkem (lásd C.3 pont).

**Felfedezve:** Sprint 7 audit közben (2026-08-01). A Sprint 2 CHANGELOG szintén tévesen "nincs
ellentmondás"-ként rögzítette — korrigálva.

### A.3 — `src/content/blog/80-m2-konnyuszerkezetes-haz.md`

*(Ez már a Sprint 1 CHANGELOG-ban is szerepelt, itt csak a teljesség kedvéért ismétlem.)*

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 78 m² | 28.200 EUR | 31.000 EUR |
| 86 m² | 29.700 EUR | 32.000 EUR |

### A.4 — `src/content/blog/mobilhaz-arak-2025.md`

**Mező:** "Mobilház vs hagyományos ház – Ár összehasonlítás" szekció.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 78 m² | 28.200 EUR | 31.000 EUR |

**Felfedezve:** Sprint 7 audit közben. A Sprint 3 CHANGELOG tévesen "nincs adatellentmondás"-ként
rögzítette a `mobilhaz-arak` (root) vs. ez a fájl viszonyt — ez a konkrét 78 m²-es hivatkozás miatt
pontosítandó. (A cikk többi része, pl. a 22 m²-es és 52 m²-es hivatkozások, helyesek.)

### A.5 — `src/content/blog/mobilhaz-reszletre.md`

**Mező:** hitelkalkulációs táblázat.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 78 m² | 28.200 EUR | 31.000 EUR |

(22 m², 52 m² helyesek.) **Első felfedezés ebben az auditban** — korábban egyetlen CHANGELOG-bejegyzés
sem említette ezt a fájlt.

### A.6 — `src/content/blog/szendvicspanel-haz-arak.md`

**Mező:** fő ártáblázat.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 35 m² | 18.400 EUR | 20.300 EUR |
| 78 m² | 28.200 EUR | 31.000 EUR |
| 96 m² | 35.800 EUR | 35.000 EUR |

(22 m², 126 m² helyesek.) **Első felfedezés ebben az auditban.** Megjegyzés: ez a "szendvicspanel ház"
elnevezésű cikk ugyanazt a könnyűszerkezetes termékkört írja le, mint a többi — nem tudni, hogy ez a
CSV 378 soros migrációs listájának is része volt-e, vagy azon kívüli, korábbi tartalom.

### A.7 — `src/content/blog/szendvicspanel-haz-elado.md`

**Mező:** fő ártáblázat (mind a 10 modell szerepel).

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 32 m² | 17.600 EUR | 18.600 EUR |
| 35 m² | 18.400 EUR | 20.300 EUR |
| 62 m² | 24.500 EUR | 23.000 EUR |
| 78 m² | 28.200 EUR | 31.000 EUR |
| 86 m² | 29.700 EUR | 32.000 EUR |
| 87 m² | 30.500 EUR | 34.000 EUR |
| 96 m² | 35.800 EUR | 35.000 EUR |

(22 m², 52 m², 126 m² helyesek.) **Első felfedezés ebben az auditban.**

### A.8 — `src/content/blog/100-nm-kontenerhoz-arak.md`

**Mező:** könnyűszerkezetes-összehasonlító mondat.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 86 m² | 29.700 EUR | 32.000 EUR |

**Első felfedezés ebben az auditban.**

### A.9 — `src/content/blog/kontenerhaz-vs-konnyuszerkezetes.md`

**Mező:** összehasonlító lista.

| Modell | Fájlban szereplő (hibás) | Helyes érték |
|---|---|---|
| 96 m² | 35.800 EUR | 35.000 EUR |

(22 m², 52 m² helyesek.) **Első felfedezés ebben az auditban.**

---

## B) RENDSZERSZINTŰ: elavult modulház (Ticab) méretek további fájlokban — ~~nyitott~~ **JAVÍTVA 2026-08-01**

A `src/content/blog/modulhaz-arak.md`-t **már kijavítottam** korábban (lásd CHANGELOG, 2026-08-01), és
most a felhasználó explicit utasítására a 2 további, helyszín-specifikus blogcikkben talált elavult
méreteket is mechanikusan javítottam a `hazak.json` jelenlegi adataira:

### B.1 — `src/content/blog/modulhaz-debrecen.md`

| Modell | Fájlban szereplő (hibás) | Helyes érték (hazak.json) |
|---|---|---|
| Dublin | 50 m² | 46 m² |
| Ottawa | 55 m² | 48 m² |
| Montreal | 60 m² | 70 m² |
| Vienna | 65 m² | 72 m² |

### B.2 — `src/content/blog/modulhaz-gyor.md`

| Modell | Fájlban szereplő (hibás) | Helyes érték (hazak.json) |
|---|---|---|
| Dublin | 50 m² | 46 m² |
| London | 55 m² | 80 m² |
| Montreal | 60 m² | 70 m² |
| Vienna | 65 m² | 72 m² |

**Felfedezve:** Sprint 7 audit közben (2026-08-01). Első dokumentálás.

---

## C) Route-duplikáció (root cikk vs. meglévő /blog/ cikk, azonos témában) — ~~nyitott~~ **ÖSSZEVONVA 2026-08-01**

Mind a 7 pár összevonva a felhasználó explicit utasítására: a root cikk maradt a kanonikus URL, a
`/blog/` cikk egyedi tartalmi mélysége átemelve a root cikkbe (a root saját, javított adataival
kombinálva), a `/blog/` cikk törölve, 301 redirect rá a rootra. Részletek: `CHANGELOG.md`
"Összevonás — mind a 7 C) route-duplikáció (C.1–C.7) lezárva" szakasz.

| # | Kanonikus URL | Törölt /blog/ cikk | Státusz |
|---|---|---|---|
| C.1 | `/80-m2-konnyuszerkezetes-haz` | ~~`/blog/80-m2-konnyuszerkezetes-haz`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.2 | `/konnyuszerkezetes-haz-arak` | ~~`/blog/konnyuszerkezetes-haz-arak`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.3 | `/konnyuszerkezetes-haz-40-nm` | ~~`/blog/konnyuszerkezetes-haz-40-nm`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.4 | `/mobilhaz-arak` | ~~`/blog/mobilhaz-arak-2025`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.5 | `/modulhaz-arak` | ~~`/blog/modulhaz-arak`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.6 | `/kontenerhaz-60-nm` | ~~`/blog/kontenerhoz-60-nm`~~ | **ÖSSZEVONVA**, redirect aktív |
| C.7 | `/kontenerhaz-alapozas` | ~~`/blog/kontenerhoz-alapozas`~~ | **ÖSSZEVONVA**, redirect aktív |

Az összevonás során ~35, más fájlból a törölt `/blog/` URL-ekre mutató belső link is frissítve lett a
megfelelő root URL-re (lásd CHANGELOG). A redirectek `public/_redirects`-ben aktívak, de csak éles
Netlify környezetben lépnek életbe (a lokális `astro dev` nem dolgozza fel ezt a fájlt).

### Történeti feljegyzés (a 2026-08-01 összevonás előtti állapot — a döntéshez vezető elemzés)

Az alábbi két alszakasz (előzetes megállapítás + pár-jellemzés) a döntés meghozatala **előtti**
állapotot rögzíti, és mint ilyen, a lenti hivatkozások és jellemzések a már törölt `/blog/` cikkekre
vonatkoznak. Megtartva referenciaként, hogy világos legyen, milyen tartalom került átemelésre.

### Fontos előzetes megállapítás: a 7 root cikk MÁR MOST is hivatkozik a blog-párjára

Mind a 7 új root cikk (ellenőrizve 2026-08-01) tartalmaz egy élő linket a saját `/blog/` párjára —
vagy a "Kapcsolódó keresések" pill-listában ("korábbi cikkünk" felirattal), vagy — C.6 és C.7 esetén —
kifejezetten a szövegtörzsben, "a teljes, típusonkénti részletezést a részletes cikkünkben olvashatja"
jellegű mondattal. Ez azt jelenti, hogy a duplikáció eddig **nem véletlen ütközés volt, hanem tudatosan
egymásra hivatkozó pár** — a root cikk rövid összefoglalóként, a blog cikk mélyebb háttéranyagként
funkcionált. Ha bármelyik `/blog/` cikk redirectté alakul, ezeket a hivatkozásokat frissíteni vagy törölni
kell a root cikkben.

### Organikus forgalom (Ubersuggest, 2026-08-01)

Lekérdezve mind a `domain_top_pages` (gyors-haz.hu, HU), mind egyedi `page_overview` a `/blog/` URL-ekre.
**Egyik `/blog/` cikkhez sem tartozik mérhető organikus forgalom** — a domain összesített forgalma is
elenyésző (a legjobban teljesítő oldal, a `/teliesitett-kontenerhaz-arak` root cikk is csak becsült havi
9 látogatót kap; a `/blog/` URL-ek egyikére sincs adat). Tehát **egyik verzió mellett sem szól a "meglévő
rangsorolást ne veszélyeztessük" érv** — a döntést tisztán tartalmi/strukturális szempontok alapján lehet
meghozni.

### Pár-jellemzés: melyik verzió erősebb tartalmilag?

| # | Root cikk (2026-08-01) | Blog cikk (2026 eleje) | Jellemzés |
|---|---|---|---|
| C.1 | 6 szekció, sablonos: ár, ajánlott modellek (élő HazakGrid), "miért jó méret", mit tartalmaz, kinek ajánljuk, teljes kínálat | 11 fejezet/FAQ: külön H2 a 78 m²-es ÉS a 86 m²-es modellnek, összehasonlító táblázat, hitel szekció | **Blog mélyebb** — modellenkénti bontása és a hitelrész egyedi tartalom, amit a root nem fed le |
| C.2 | 5 szekció, sablonos | 8 H2 + 5 FAQ: "rejtett költségek" lista, nm²-ár összehasonlítás más megoldásokkal (tégla, konténer, használt lakás, modulház), "miért érdemes" meggyőző szekció, KSZ-86 vs 87 FAQ | **Blog mélyebb** — a nm²-ár piaci összehasonlítás és a rejtett költségek lista a root cikkben nincs meg |
| C.3 | 5 szekció, sablonos | 8 H2/FAQ: KSZ-35 és KSZ-52 külön, teljes specifikációval, "melyiket válasszam" döntési szempontlista, finanszírozási rész | **Blog mélyebb** — a döntéstámogató "melyiket válasszam" szempontlista egyedi, a rootból hiányzik |
| C.4 | 4 szekció, sablonos | 7 H2/FAQ: "mi az a mobilház" alapfogalom-tisztázás, új vs. használt ár-összehasonlítás | **Blog mélyebb** — a fogalomtisztázó bevezető és az új/használt összehasonlítás a rootból hiányzik |
| C.5 | 4 szekció, sablonos | 16 H2/H3/FAQ: teljes Ticab-katalógus 4 méretkategóriára bontva (Tiny House, kis, közepes, nagy), bővíthetőség, alapozás-Q&A, megrendelési folyamat | **Blog LÉNYEGESEN mélyebb** — ez a legnagyobb depth-különbség a 7 pár közül, a blog gyakorlatilag a teljes termékkatalógust dokumentálja |
| C.6 | 4 szekció; a szövegben **explicit módon a blog cikkre mutat** ("a részletes összehasonlítást a blog cikkben olvashatja") | 7 H2/FAQ: Manhattan L és Nordic Premium külön, teljes műszaki adatlappal, engedélyezési szekció | **Blog mélyebb, és a root ezt maga is elismeri** — a root szándékosan rövid összefoglalóként lett megírva |
| C.7 | 4 szekció; a szövegben **explicit módon a blog cikkre mutat** ("a teljes, típusonkénti részletezést a részletes cikkünkben olvashatja") | 10 H2/H3/FAQ: mind a 4 alapozástípus (pontalapos, talpgerendás, lemezalap, csavarpilóta) saját alcímmel, folyamat lépései, tippek szekció | **Blog mélyebb, és a root ezt maga is elismeri** — a root itt is kifejezetten "rövid összefoglaló"-ként lett definiálva |

**Összegzés:** mind a 7 párnál a `/blog/` cikk tartalmilag mélyebb és specifikusabb, mint az általam írt
root cikk — ez a 12-lépéses sablon rövidebb, egységesített jellegéből fakad. A root cikkek erőssége a
strukturált adat (FAQPage és Breadcrumb schema.org JSON-LD — a blog cikkeknek nincs FAQPage schema-ja),
az élő, `hazak.json`-ból generált termékrács (mindig aktuális ár, valódi linkek — a blog cikkek statikus,
kézzel írt árai voltak azok, amik rendszerszinten elavultak, lásd A) pont), és a konzisztens CTA/kapcsolódó
keresések blokk. Organikus forgalmi érv egyik oldalon sincs (lásd fent).

---

## D) Egyéb, meglévő /blog/ cikkek közötti belső ellentmondás (nem az én cikkeimet érinti)

### D.1 — Konténerház szállítási idő ellentmondás — ~~nyitott~~ **JAVÍTVA 2026-08-01**

Eredeti ellentmondás (felfedezve Sprint 4 közben):
- `src/content/blog/kontenerhoz-arak.md`: *"A gyártás után a szállítás és telepítés jellemzően 1–3 napot
  vesz igénybe. A teljes folyamat (alapozástól a kulcsátadásig) 2–4 hét."*
- `src/content/blog/kontenerhoz-60-nm.md`: *"A megrendeléstől számítva általában 4-6 hét a gyártási és
  szállítási idő, majd a helyszíni telepítés kb. 1 hét."* (≈5-7 hét összesen)

**Felhasználói döntés (2026-08-01):** mindkét fájlt egyeztetni egy konzisztens, óvatos tartományra;
ha nincs biztos forrás a pontos időre, a szélesebb, biztonságosabb tartományt választani mindkét helyen.

**Elvégzett javítás:** mindkét fájl (és a helyszíni összeszerelés 1–3 napos időtartama) most egységesen ezt
állítja: *"A helyszíni szállítás és összeszerelés – az alapozás elkészülte után – jellemzően 1–3 napot vesz
igénybe. A teljes folyamat, a megrendeléstől (gyártás, szállítás, alapozás, összeszerelés) a kulcsátadásig,
jellemzően 4–6 hét, de ez egyedi igény és a telek adottságai szerint eltérhet."* Részletek: `CHANGELOG.md`
"Sprint 7 — Végső ellenőrzés" szakasz.

Emellett a saját, sablonból örökölt cikkeimben (`src/pages/teliesitett-kontenerhaz-arak.astro`,
`src/pages/teliesitett-mobilhaz-surgosen-elado.astro`) is megtaláltam ugyanezt a "teljes folyamat... 2–4 hét"
állítást — ezeket is a fenti egységes megfogalmazásra javítottam, hogy ne keletkezzen új ellentmondás.

**Ellenőrzés:** `npx astro check` → 0 hiba. Curl 200: mind a 4 érintett oldal.

---

## Összefoglaló táblázat — Sprint 7 státusz

| Kategória | Tételszám |
|---|---|
| Rendszerszintű, elavult könnyűszerkezetes árazás (A pont, 9 fájl) | ~~9 fájl, ~30 egyedi ár-eltérés~~ 0 (lezárva, 2026-08-01) |
| Rendszerszintű, elavult modulház méretadat (B pont, 2 fájl) | ~~2 fájl, 8 egyedi méret-eltérés~~ 0 (lezárva, 2026-08-01) |
| Route-duplikáció, adateltéréssel (C.1, C.2, C.3, C.4) | ~~4~~ 0 (az alapadat javítva, lásd A pont; a route-duplikáció ténye — két URL, egy téma — továbbra is fennáll, döntés még nyitott) |
| Route-duplikáció, adateltérés nélkül (C.6, C.7) | 2 |
| Route-duplikáció, már javítva (C.5) | 1 (lezárva) |
| Egyéb belső ellentmondás meglévő cikkek között (D.1) | ~~1~~ 0 (lezárva, 2026-08-01) |

**Még nyitott, döntésre váró tétel:**
1. A C pontban felsorolt route-duplikációknál (C.1–C.4, illetve C.6–C.7) eldönteni: marad mindkét route
   (SEO-szempontból két különböző URL azonos témában nem ideális), vagy a régi `/blog/` verzió redirectté
   alakul az új, naprakész root cikkre. Az adateltérés kérdése ezeknél már nem akadály (az A pont
   javításával megszűnt), pusztán a duplikáció ténye maradt eldöntendő.

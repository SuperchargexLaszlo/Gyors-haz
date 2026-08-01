# SPRINTS.md — gyors-haz.hu tartalom-migráció

## Projekt kontextus

A gyors-haz.hu régi WordPress oldalról Netlify/Astro-ra költözött. 378 régi blogcikket
kell újraépíteni az új oldalon, **pontosan a régi URL-slug-okkal** (redirect nem kell,
mert az új cikk ugyanazon a slug-on jön létre, mint a régi).

Forrás-adat: `gyors-haz-epitendo-cikkek-VEGLEGES.csv`
(oszlopok: Cim, Slug, URL, Datum, GSC_Prioritas, GSC_Kattintas, GSC_Megjelenes)

## Alapszabályok minden sprinthez

- **NE COMMITOLJ** batch-enként vagy cikkenként. Minden fejlesztés kizárólag lokálisan,
  a helyi dev szerveren történik (`npm run dev` / `astro dev`). Git commit CSAK a
  Sprint 7 (Végső ellenőrzés) végén, egyetlen alkalommal, a teljes kész anyagra.
- **URL-struktúra**: gyökér-szintű, `/blog/` prefix NÉLKÜL. Pl. `Slug = teliesitett-kontenerhaz-arak`
  → az oldal a `/teliesitett-kontenerhaz-arak/` útvonalon éljen.
- **Minden cikk alján** meg kell jelenjen a teljes mobilház-kínálat, kategória-szűrés NÉLKÜL:
  `<HazakGrid columns={3} />`
- **Ne** hozz létre új cikket a kizárt (helyszín-specifikus vagy versenytárs) címekhez.
- Minden cikk/batch végén frissítsd a CHANGELOG.md-t a slug listával (ez NEM commit,
  csak a fájl helyi mentése — a haladás követéséhez kell, session-váltás esetére).
- Ha egy cikkhez nincs egyértelmű, valós tartalmi mondanivaló (pl. túl generikus cím),
  jelöld meg `[ELLENŐRZENDŐ]` taggel a CHANGELOG-ban, ne találj ki tényeket.

---

## Sprint 0 — Alaprendszer felépítése

1. Hozd létre a `src/data/hazak.json` fájlt a jelenlegi termékkínálat alapján
   (méret, ár, szobaszám, kép — kérdezd meg a felhasználót, ha valamelyik adat hiányzik).
2. Hozd létre a `src/components/HazakGrid.astro` komponenst, ami a `hazak.json`-ból
   dolgozik, opcionális `kategoria` és `slugok` propokkal, de alapértelmezésben
   (propok nélkül) az ÖSSZES terméket mutatja.
3. Teszteld egy meglévő oldalon, hogy a grid helyesen renderel.
4. Mentsd el lokálisan, NE commitolj — a végleges commit csak a Sprint 7 végén lesz.

## A JÓVÁHAGYOTT CIKK-SABLON (kötelező minden cikknél)

A `src/pages/teliesitett-kontenerhaz-arak.astro` a jóváhagyott végleges minta —
ELSŐ LÉPÉSKÉNT mindig ezt a fájlt nézd meg referenciaként minden új cikk előtt.
Minden új cikk ugyanezt a szerkezetet, komponenshasználatot és hangnemet kövesse:

1. H1 — cím + belépő ár/kulcsadat, ha van (pl. "X árak 2026 – Y-tól")
2. Rövid intro (2-4 mondat)
3. "Mennyibe kerül..." H2 — ártáblázat a releváns termékekkel
4. "Ajánlott modellek" — HazakGrid slugok proppal, 3 releváns termék (NEM az összes)
5. Szakmai/tartalmi H2 (a kulcsszó valódi szándéka szerint, 700-1200 szó összesen
   a teljes cikkben, NEM 2500+)
6. "Teljes bekerülési költség" jellegű szekció, ha releváns a témához (ár-alapú
   kulcsszavaknál igen; máshol elhagyható)
7. Összehasonlító szekció más háztípussal, ha releváns
8. "Kinek ajánljuk?" — jó választás / kevésbé ideális lista
9. FAQ szekció (FaqSection komponens) — 4-6 kérdés, VALÓS, forrással alátámasztható
   válaszokkal; ha nincs elég adat egy pontos válaszhoz, fogalmazz általánosan és
   irányíts ajánlatkérésre — SOHA ne találj ki konkrét számot/tényt
10. "Teljes [kategória]-kínálatunk" — HazakGrid kategoria proppal (a releváns
    kategória összes terméke, NEM mind az 57)
11. CTA doboz — konkrét, cselekvésre ösztönző szöveg (nem sima "Ajánlatot kérek")
12. "Kapcsolódó keresések" — 4-6 belső link más, MÁR ELKÉSZÜLT cikkekre

TILOS:
- Kép a cikkben (site-wide asset-probléma van a termékfotóknál, amíg nincs javítva)
- Megalapozatlan/kockázatos állítás — mindig óvatosan, ellenőrizhető tények szintjén
- Az összes 57 termék megjelenítése egy cikkben — csak a releváns kategória

## Sprint 1 — GSC-prioritású cikkek (kb. 21 db)

A CSV-ben `GSC_Prioritas = IGEN` sorok. Ezeknek volt valós keresési forgalma
a régi oldalon — ezek a legfontosabbak.

Minden cikkhez pontosan a fenti jóváhagyott sablont kövesd. A régi Datum mezőt
NE használd publikálási dátumnak — a mai dátumot használd (ahogy a pilot cikknél
is történt).

Frissítsd a CHANGELOG.md-t minden 5 cikk után (lokálisan, commit nélkül), hogy
session-váltás esetén is látszódjon a haladás.

## Sprint 2 — Könnyűszerkezetes kategória (kb. 100 db, GSC-prioritás nélküliek)

Csoportosítsd a fennmaradó könnyűszerkezetes témájú cikkeket, és haladj
10-15 cikkes batch-ekben. Minden batch után CHANGELOG.md frissítés (commit nélkül).

## Sprint 3 — Modulház/mobilház kategória (kb. 90 db)

Ugyanaz a batch-elt megközelítés, mint Sprint 2-nél.

## Sprint 4 — Konténerház kategória (kb. 85 db)

Ugyanaz a batch-elt megközelítés.

## Sprint 5 — Generikus gyorsház/készház kategória (kb. 60 db)

Ugyanaz a batch-elt megközelítés.

## Sprint 6 — Rönkház (9 db)

Kisebb kategória, egy batch-ben is elvégezhető.

## Sprint 7 — Végső ellenőrzés és EGYETLEN commit

1. Futtass egy linkellenőrzést az összes újonnan létrehozott URL-en (200-as státusz)
   a helyi dev szerveren
2. Ellenőrizd, hogy minden cikk alján megjelenik-e a `HazakGrid`
3. Frissítsd a sitemap.xml-t / Astro sitemap integrációt, ha szükséges
4. Készíts összefoglalót: hány cikk készült el, mennyi maradt `[ELLENŐRZENDŐ]` jelöléssel
5. **Csak ha mindez rendben van és a felhasználó jóváhagyta**: EKKOR (és csak ekkor)
   végezd el az első és egyetlen commitot a teljes anyagra, egy összefoglaló
   commit-üzenettel (pl. "378 régi blogcikk migrálása + HazakGrid komponens").

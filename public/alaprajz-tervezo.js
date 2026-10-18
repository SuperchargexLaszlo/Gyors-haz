/* =====================================================================
   Alaprajz tervező — gyors-haz.hu
   Vászonalapú, függőség nélküli alaprajz szerkesztő.

   Felépítés:
     1. állapot és segédfüggvények
     2. illesztés (snap) és segédvonalak
     3. rajzolás: helyiség, fal, nyílászáró, bútor, méretvonal
     4. bútor-szimbólumok (felülnézeti jelek)
     5. mutató- és billentyűkezelés
     6. tulajdonságpanel és összegzés
     7. export (PNG fejléccel, léptékvonallal)
     8. e-mail kapu + onboarding
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("ap-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var app = document.getElementById("ap-app");

  /* ---------------------------------------------------------------
     1. ÁLLAPOT
     --------------------------------------------------------------- */
  var INK = "#14181d",
    MUTED = "#5a636e",
    FAINT = "#8b939e",
    ACCENT = "#0b6bcb",
    ACCENT_SOFT = "#e8f1fc",
    WALL = "#2b323b",
    LINE = "#cfd6e0",
    ROOM_FILL = "#fdfcfa",
    DIM = "#0b6bcb";

  var STORE = "gh_ap_v2";
  var FURN = window.AP_FURN || {};
  var ROOMTYPES = window.AP_ROOMTYPES || ["Szoba"];
  var TEMPLATES = window.AP_TEMPLATES || [];

  var state = {
    v: 2,
    grid: 0.1, // 10 cm rácsosztás
    wall: 0.1, // falvastagság méterben (megjelenítéshez)
    title: "Alaprajz",
    objects: [],
    zones: [], // zárt területek elnevezései: { x, y, label }
  };
  var uid = 1;
  var view = { scale: 46, ox: 0, oy: 0 };
  var undoStack = [],
    redoStack = [];
  var sel = null; // kijelölt objektum
  var tool = "select";
  var pendingFurn = null;
  var guides = [];
  var dimRects = [];
  var drag = null;
  var pendingExport = null;

  /* ---------------------------------------------------------------
     segédfüggvények
     --------------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function gsnap(v) { return Math.round(v / state.grid) * state.grid; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function s2w(px, py) { return { x: (px - view.ox) / view.scale, y: (py - view.oy) / view.scale }; }
  function w2s(x, y) { return { x: x * view.scale + view.ox, y: y * view.scale + view.oy }; }
  function fmt(m) { return r2(Math.abs(m)).toString().replace(".", ",") + " m"; }
  function areaOf(o) { return r2(Math.abs(o.w * o.h)); }
  function evPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return false;
      var s = JSON.parse(raw);
      if (!s || !s.objects || !s.objects.length) return false;
      state = s;
      state.grid = state.grid || 0.1;
      state.wall = state.wall || 0.1;
      state.zones = state.zones || [];
      state.objects.forEach(function (o) { uid = Math.max(uid, (o.id || 0) + 1); });
      return true;
    } catch (e) { return false; }
  }
  function pushUndo() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 120) undoStack.shift();
    redoStack = [];
    save();
    syncUndoUI();
  }
  function syncUndoUI() {
    var u = $("ap-undo"), r = $("ap-redo");
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }
  function restore(json) {
    state = JSON.parse(json);
    invalidateZones();
    sel = null;
    setSelClass();
    props();
    summary();
    draw();
    save();
    syncUndoUI();
  }

  /* ---------------------------------------------------------------
     2. ILLESZTÉS (snap) — a mágnes mindig aktív
     --------------------------------------------------------------- */
  function snapTargets(exclude) {
    var xs = [], ys = [];
    state.objects.forEach(function (o) {
      if (o === exclude) return;
      if (o.type === "room" || o.type === "furniture") {
        xs.push(o.x, o.x + o.w);
        ys.push(o.y, o.y + o.h);
      }
    });
    return { xs: xs, ys: ys };
  }

  /** Pont illesztése: előbb más elemek éleihez, aztán a rácshoz. */
  function snapPoint(p, exclude, size) {
    var t = snapTargets(exclude);
    var tol = 12 / view.scale;
    var out = { x: p.x, y: p.y };
    guides = [];
    var w = size ? size.w : 0, h = size ? size.h : 0;

    var bestX = null, bestXd = tol;
    [p.x, p.x + w].forEach(function (px, i) {
      t.xs.forEach(function (tx) {
        var d = Math.abs(px - tx);
        if (d < bestXd) { bestXd = d; bestX = { v: tx - (i ? w : 0), g: tx }; }
      });
    });
    var bestY = null, bestYd = tol;
    [p.y, p.y + h].forEach(function (py, i) {
      t.ys.forEach(function (ty) {
        var d = Math.abs(py - ty);
        if (d < bestYd) { bestYd = d; bestY = { v: ty - (i ? h : 0), g: ty }; }
      });
    });

    if (bestX) { out.x = bestX.v; guides.push({ axis: "x", v: bestX.g }); } else out.x = gsnap(p.x);
    if (bestY) { out.y = bestY.v; guides.push({ axis: "y", v: bestY.g }); } else out.y = gsnap(p.y);
    return out;
  }

  /** Az összes fal-szakasz: helyiségek élei + önálló falak. */
  function wallSegments(exclude) {
    var segs = [];
    state.objects.forEach(function (o) {
      if (o === exclude) return;
      if (o.type === "room") {
        segs.push([o.x, o.y, o.x + o.w, o.y]);
        segs.push([o.x + o.w, o.y, o.x + o.w, o.y + o.h]);
        segs.push([o.x + o.w, o.y + o.h, o.x, o.y + o.h]);
        segs.push([o.x, o.y + o.h, o.x, o.y]);
      } else if (o.type === "wall") {
        segs.push([o.x1, o.y1, o.x2, o.y2]);
      }
    });
    return segs;
  }

  function projectToSeg(px, py, s) {
    var dx = s[2] - s[0], dy = s[3] - s[1];
    var len2 = dx * dx + dy * dy;
    if (!len2) return { x: s[0], y: s[1], d: Math.hypot(px - s[0], py - s[1]), t: 0, ang: 0 };
    var t = clamp(((px - s[0]) * dx + (py - s[1]) * dy) / len2, 0, 1);
    var x = s[0] + t * dx, y = s[1] + t * dy;
    return { x: x, y: y, d: Math.hypot(px - x, py - y), t: t, ang: Math.atan2(dy, dx) };
  }

  /** Nyílászáró falhoz tapasztása. */
  function snapOpening(o) {
    var segs = wallSegments(null);
    var best = null;
    segs.forEach(function (s) {
      var p = projectToSeg(o.x, o.y, s);
      if (!best || p.d < best.d) best = p;
    });
    if (best && best.d < 0.7) {
      o.x = r2(best.x);
      o.y = r2(best.y);
      o.ang = best.ang;
      o.onWall = true;
    } else {
      o.onWall = false;
    }
    return o;
  }


  /* ---------------------------------------------------------------
     FAL-VÉGPONTOK ILLESZTÉSE
     A fal akkor hasznos, ha tényleg összeér a többivel. Ezért a végpont
     ráugrik a közeli sarkokra, falvégekre és falvonalakra.
     --------------------------------------------------------------- */
  function wallSnapPoints(exclude) {
    var pts = [];
    state.objects.forEach(function (o) {
      if (o === exclude) return;
      if (o.type === "room") {
        pts.push([o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]);
      } else if (o.type === "wall") {
        pts.push([o.x1, o.y1], [o.x2, o.y2]);
      }
    });
    return pts;
  }

  /** Végpont illesztése: sarok → fal-/helyiségél → rács. */
  function snapWallEnd(p, exclude) {
    var tol = 16 / view.scale;
    var best = null, bestD = tol;

    // 1) sarokpontok
    wallSnapPoints(exclude).forEach(function (q) {
      var d = Math.hypot(p.x - q[0], p.y - q[1]);
      if (d < bestD) { bestD = d; best = { x: q[0], y: q[1], kind: "corner" }; }
    });
    if (best) return best;

    // 2) élre vetítés (helyiségfal vagy másik fal vonala)
    var segs = wallSegments(exclude);
    var bp = null, bd = tol;
    segs.forEach(function (sg) {
      var pr = projectToSeg(p.x, p.y, sg);
      if (pr.d < bd) { bd = pr.d; bp = { x: r2(pr.x), y: r2(pr.y), kind: "edge" }; }
    });
    if (bp) return bp;

    // 3) rács
    return { x: gsnap(p.x), y: gsnap(p.y), kind: "grid" };
  }

  /* ---------------------------------------------------------------
     ZÁRT TERÜLET FELISMERÉSE
     Ha a falak körbezárnak egy területet, az kapjon alapterületet és
     nevet — különben a fal csak egy vonal, ami semmit nem jelent.
     A módszer: 10 cm-es rácson kitakarjuk a falakat és a helyiségeket,
     kívülről elárasztjuk, és ami nem lett elárasztva, az zárt terület.
     --------------------------------------------------------------- */
  var zonesCache = null;
  function invalidateZones() { zonesCache = null; }

  function detectZones() {
    if (zonesCache) return zonesCache;
    var walls = state.objects.filter(function (o) { return o.type === "wall"; });
    if (!walls.length) { zonesCache = []; return zonesCache; }

    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    var bump = function (x, y) {
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    };
    walls.forEach(function (w) { bump(w.x1, w.y1); bump(w.x2, w.y2); });
    state.objects.forEach(function (o) {
      if (o.type === "room") { bump(o.x, o.y); bump(o.x + o.w, o.y + o.h); }
    });
    var G = 0.1, PAD = 0.4;
    minx -= PAD; miny -= PAD; maxx += PAD; maxy += PAD;
    var nx = Math.round((maxx - minx) / G), ny = Math.round((maxy - miny) / G);
    if (nx < 3 || ny < 3 || nx * ny > 500000) { zonesCache = []; return zonesCache; }

    var BLOCK = 1, OUT = 2;
    var g = new Uint8Array(nx * ny);
    var ix = function (x) { return Math.round((x - minx) / G); };
    var iy = function (y) { return Math.round((y - miny) / G); };

    // Falak kitakarása. A sáv pontosan olyan vastag, mint a fal, hogy a
    // kiszámolt terület a valós belméret legyen — és lépcsősen zárunk,
    // hogy az elárasztás sehol ne szivárogjon át átlósan.
    var mark = function (xx, yy) {
      if (xx >= 0 && yy >= 0 && xx < nx && yy < ny) g[yy * nx + xx] = BLOCK;
    };
    var half = Math.max(0, Math.round((state.wall || 0.1) / G / 2) - 1);
    walls.forEach(function (w) {
      var x0 = ix(w.x1), y0 = iy(w.y1), x1 = ix(w.x2), y1 = iy(w.y2);
      var steps = Math.max(1, Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2);
      var px = null, py = null;
      for (var i = 0; i <= steps; i++) {
        var cx = Math.round(x0 + ((x1 - x0) * i) / steps);
        var cy = Math.round(y0 + ((y1 - y0) * i) / steps);
        if (px !== null && cx !== px && cy !== py) mark(px, cy); // lépcső bezárása
        for (var d = -half; d <= half; d++) { mark(cx + d, cy); mark(cx, cy + d); }
        mark(cx, cy);
        px = cx; py = cy;
      }
    });
    // a helyiségek területe nem zóna (annak már van saját m²-e)
    state.objects.forEach(function (o) {
      if (o.type !== "room") return;
      var x0 = ix(o.x), x1 = ix(o.x + o.w), y0 = iy(o.y), y1 = iy(o.y + o.h);
      for (var yy = y0; yy <= y1; yy++)
        for (var xx = x0; xx <= x1; xx++)
          if (xx >= 0 && yy >= 0 && xx < nx && yy < ny) g[yy * nx + xx] = BLOCK;
    });

    // elárasztás kívülről
    var stack = [];
    for (var x = 0; x < nx; x++) { stack.push(x); stack.push(0, x, ny - 1); }
    for (var y = 0; y < ny; y++) { stack.push(0, y, nx - 1, y); }
    var st = [];
    for (var i0 = 0; i0 < nx; i0++) { st.push([i0, 0], [i0, ny - 1]); }
    for (var j0 = 0; j0 < ny; j0++) { st.push([0, j0], [nx - 1, j0]); }
    while (st.length) {
      var c = st.pop(), cx2 = c[0], cy2 = c[1];
      if (cx2 < 0 || cy2 < 0 || cx2 >= nx || cy2 >= ny) continue;
      var k = cy2 * nx + cx2;
      if (g[k] !== 0) continue;
      g[k] = OUT;
      st.push([cx2 + 1, cy2], [cx2 - 1, cy2], [cx2, cy2 + 1], [cx2, cy2 - 1]);
    }

    // ami maradt: zárt terület — összefüggő foltokra bontva
    var zones = [];
    for (var k2 = 0; k2 < g.length; k2++) {
      if (g[k2] !== 0) continue;
      var cells = [], q = [k2];
      g[k2] = 3;
      var sx = 0, sy = 0;
      while (q.length) {
        var kk = q.pop();
        var qx = kk % nx, qy = (kk - qx) / nx;
        cells.push(kk); sx += qx; sy += qy;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var ax = qx + d[0], ay = qy + d[1];
          if (ax < 0 || ay < 0 || ax >= nx || ay >= ny) return;
          var ak = ay * nx + ax;
          if (g[ak] === 0) { g[ak] = 3; q.push(ak); }
        });
      }
      var area = cells.length * G * G;
      if (area < 1.0) continue; // apró rés, nem helyiség
      zones.push({
        area: r2(area),
        cx: minx + (sx / cells.length) * G,
        cy: miny + (sy / cells.length) * G,
        x0: minx, y0: miny, G: G, nx: nx,
        cells: cells,
      });
    }
    zonesCache = zones;
    return zones;
  }

  /** A zárt területhez tartozó név (a felhasználó által elhelyezett horgony alapján). */
  function zoneLabel(z) {
    var list = state.zones || [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var cx = Math.round((a.x - z.x0) / z.G), cy = Math.round((a.y - z.y0) / z.G);
      if (z.cells.indexOf(cy * z.nx + cx) >= 0) return a.label;
    }
    return null;
  }

  function drawZones() {
    var zones = detectZones();
    zones.forEach(function (z) {
      // halvány kitöltés
      ctx.save();
      ctx.fillStyle = "rgba(11,107,203,0.05)";
      z.cells.forEach(function (k) {
        var qx = k % z.nx, qy = (k - qx) / z.nx;
        var p1 = w2s(z.x0 + qx * z.G, z.y0 + qy * z.G);
        ctx.fillRect(p1.x, p1.y, z.G * view.scale + 1, z.G * view.scale + 1);
      });
      ctx.restore();

      var c = w2s(z.cx, z.cy);
      var name = zoneLabel(z);
      ctx.textAlign = "center";
      ctx.fillStyle = INK;
      ctx.font = "600 13px 'Plus Jakarta Sans',Inter,sans-serif";
      ctx.textBaseline = "bottom";
      ctx.fillText(name || "Zárt terület", c.x, c.y - 1);
      ctx.fillStyle = MUTED;
      ctx.font = "12px Inter,sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(z.area.toString().replace(".", ",") + " m²", c.x, c.y + 2);
      if (!name) {
        ctx.fillStyle = FAINT;
        ctx.font = "11px Inter,sans-serif";
        ctx.fillText("kattints ide az elnevezéshez", c.x, c.y + 18);
      }
    });
  }

  /** Melyik zárt területre esik a képernyőpont. */
  function zoneAt(px, py) {
    var w = s2w(px, py);
    var zones = detectZones();
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      var cx = Math.round((w.x - z.x0) / z.G), cy = Math.round((w.y - z.y0) / z.G);
      if (z.cells.indexOf(cy * z.nx + cx) >= 0) return z;
    }
    return null;
  }

  /* ---------------------------------------------------------------
     3. RAJZOLÁS
     --------------------------------------------------------------- */
  function resize() {
    var r = canvas.getBoundingClientRect();
    var d = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(r.width * d));
    canvas.height = Math.max(1, Math.round(r.height * d));
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  function draw() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    dimRects = [];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fbfbfc";
    ctx.fillRect(0, 0, w, h);
    drawGrid(w, h);

    // rétegsorrend: helyiség → zárt terület → fal → nyílászáró → bútor → felirat
    var order = { room: 0, wall: 1, door: 2, window: 2, furniture: 3, text: 4 };
    var list = state.objects.slice().sort(function (a, b) { return order[a.type] - order[b.type]; });
    list.filter(function (o) { return o.type === "room"; }).forEach(function (o) { drawObj(o); });
    drawZones();
    list.filter(function (o) { return o.type !== "room"; }).forEach(function (o) { drawObj(o); });

    drawAllDims();

    drawGuides(w, h);
    if (sel) drawSelection(sel);
    if (drag && drag.preview) drawObj(drag.preview, true);
  }

  function drawGrid(w, h) {
    var g = state.grid * view.scale;
    while (g < 8) g *= 5;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#eef1f5";
    ctx.beginPath();
    for (var x = view.ox % g; x < w; x += g) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
    for (var y = view.oy % g; y < h; y += g) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
    ctx.stroke();
    // méteres főrács
    var G = view.scale;
    while (G < 40) G *= 2;
    ctx.strokeStyle = "#e0e6ee";
    ctx.beginPath();
    for (var x2 = view.ox % G; x2 < w; x2 += G) { ctx.moveTo(Math.round(x2) + 0.5, 0); ctx.lineTo(Math.round(x2) + 0.5, h); }
    for (var y2 = view.oy % G; y2 < h; y2 += G) { ctx.moveTo(0, Math.round(y2) + 0.5); ctx.lineTo(w, Math.round(y2) + 0.5); }
    ctx.stroke();
  }

  function drawGuides(w, h) {
    if (!guides.length) return;
    ctx.save();
    ctx.strokeStyle = "#e07b00";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    guides.forEach(function (g) {
      ctx.beginPath();
      if (g.axis === "x") { var s = w2s(g.v, 0); ctx.moveTo(s.x, 0); ctx.lineTo(s.x, h); }
      else { var s2 = w2s(0, g.v); ctx.moveTo(0, s2.y); ctx.lineTo(w, s2.y); }
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawObj(o, ghost) {
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.5;
    if (o.type === "room") dRoom(o);
    else if (o.type === "wall") dWall(o);
    else if (o.type === "door") dDoor(o);
    else if (o.type === "window") dWindow(o);
    else if (o.type === "furniture") dFurniture(o);
    else if (o.type === "text") dText(o);
    ctx.restore();
  }

  /* ---------------------------------------------------------------
     FŰTETLEN TEREK
     A terasz, erkély, loggia és garázs nem lakótér: nem számít bele a
     hasznos alapterületbe, és a rajzon is másképp néz ki — szaggatott
     külső fallal, halvány kitöltéssel. Aki 62 m²-es házat tervez, ne
     azon lepődjön meg a kivitelezőnél, hogy a 12 m²-es terasz is bele
     volt számolva.
     --------------------------------------------------------------- */
  var UNHEATED = { "Terasz": 1, "Erkély": 1, "Loggia": 1, "Garázs": 1, "Tornác": 1 };
  function isUnheated(o) {
    return !!UNHEATED[String(o && o.label || "").replace(/\s*\d+$/, "")];
  }

  /* ---------------------------------------------------------------
     Helyiség szín-kódolás típus szerint — halvány, a vonalrajzot nem
     tompító háttérszínek, hogy a beosztás első pillantásra olvasható
     legyen (hálószoba, konyha, fürdő, nappali, egyéb).
     --------------------------------------------------------------- */
  var ROOM_TYPE_FILL = {
    "Hálószoba": "rgba(173,216,230,0.25)",
    "Gyerekszoba": "rgba(173,216,230,0.25)",
    "Konyha": "rgba(255,255,150,0.2)",
    "Konyha-étkező": "rgba(255,255,150,0.2)",
    "Fürdőszoba": "rgba(150,230,200,0.2)",
    "WC": "rgba(150,230,200,0.2)",
    "Nappali": "rgba(255,220,180,0.2)",
  };
  function roomFillFor(o) {
    var t = String(o && o.label || "").replace(/\s*\d+$/, "");
    return ROOM_TYPE_FILL[t] || "rgba(240,240,240,0.15)";
  }

  function dRoom(o) {
    var a = w2s(o.x, o.y), b = w2s(o.x + o.w, o.y + o.h);
    var W = b.x - a.x, H = b.y - a.y;
    var open = isUnheated(o);
    ctx.save();
    ctx.fillStyle = ROOM_FILL;
    ctx.fillRect(a.x, a.y, W, H);
    ctx.fillStyle = open ? "#f4f6f8" : roomFillFor(o);
    ctx.fillRect(a.x, a.y, W, H);
    // falvastagság kifelé rajzolva
    var t = Math.max(3, state.wall * view.scale);
    ctx.strokeStyle = open ? MUTED : WALL;
    ctx.lineWidth = open ? Math.max(1.5, t / 2.5) : t;
    ctx.lineJoin = "miter";
    if (open) ctx.setLineDash([7, 5]);
    ctx.strokeRect(a.x, a.y, W, H);
    ctx.restore();

    // felirat + terület
    var cx = a.x + W / 2, cy = a.y + H / 2;
    if (W < 34 || H < 26) return;
    var label = o.label || "Szoba";
    var avail = W - 8;

    // A felirat mérete a helyiség szélességéhez igazodik, hogy ne lógjon ki.
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    var fs = 13;
    ctx.font = "600 " + fs + "px 'Plus Jakarta Sans',Inter,sans-serif";
    while (fs > 8 && ctx.measureText(label).width > avail) {
      fs -= 1;
      ctx.font = "600 " + fs + "px 'Plus Jakarta Sans',Inter,sans-serif";
    }
    var showArea = H > 40 && fs >= 9;
    if (ctx.measureText(label).width > avail) {
      // Még így sem fér ki: rövidítünk.
      while (label.length > 3 && ctx.measureText(label + "…").width > avail) label = label.slice(0, -1);
      label += "…";
    }
    ctx.textBaseline = showArea ? "bottom" : "middle";
    ctx.fillText(label, cx, showArea ? cy - 1 : cy);
    if (showArea) {
      ctx.fillStyle = MUTED;
      ctx.font = Math.max(9, fs - 1) + "px Inter,sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(areaOf(o).toString().replace(".", ",") + " m²", cx, cy + 2);
    }
  }

  function dWall(o) {
    var a = w2s(o.x1, o.y1), b = w2s(o.x2, o.y2);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = Math.max(3, (o.t || state.wall) * view.scale);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    var len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
    if (len > 0.5) {
      ctx.save();
      ctx.fillStyle = MUTED;
      ctx.font = "11px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(fmt(len), (a.x + b.x) / 2, (a.y + b.y) / 2 - 7);
      ctx.restore();
    }
  }

  function dDoor(o) {
    var c = w2s(o.x, o.y);
    var L = o.len * view.scale;
    var t = Math.max(3, state.wall * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(o.ang || 0);
    // falkivágás
    ctx.fillStyle = "#fbfbfc";
    ctx.fillRect(-L / 2, -t / 2 - 1, L, t + 2);
    // tokvonalak
    ctx.strokeStyle = WALL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-L / 2, -t / 2); ctx.lineTo(-L / 2, t / 2);
    ctx.moveTo(L / 2, -t / 2); ctx.lineTo(L / 2, t / 2);
    ctx.stroke();

    var dir = o.flip ? -1 : 1;
    var side = o.side ? -1 : 1;
    if (o.kind === "sliding") {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-L / 2, side * (t / 2 + 2));
      ctx.lineTo(L / 2 - 2, side * (t / 2 + 2));
      ctx.stroke();
    } else if (o.kind === "double") {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.6;
      [-1, 1].forEach(function (s) {
        var hx = (s * L) / 2;
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, side * (L / 2));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, 0, L / 2, side > 0 ? 0 : -Math.PI, side > 0 ? Math.PI / 2 : -Math.PI / 2, s < 0);
        ctx.stroke();
      });
    } else {
      var hx = (dir * -L) / 2;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, side * L);
      ctx.stroke();
      ctx.lineWidth = 1.3;
      ctx.setLineDash([]);
      ctx.beginPath();
      var a0 = side > 0 ? 0 : 0;
      ctx.arc(hx, 0, L, dir > 0 ? 0 : Math.PI, dir > 0 ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? Math.PI / 2 : -Math.PI / 2), dir > 0 ? side < 0 : side > 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function dWindow(o) {
    var c = w2s(o.x, o.y);
    var L = o.len * view.scale;
    var t = Math.max(3, state.wall * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(o.ang || 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-L / 2, -t / 2, L, t);
    ctx.strokeStyle = WALL;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-L / 2, -t / 2, L, t);
    ctx.strokeStyle = "#6ea8dc";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0);
    ctx.stroke();
    ctx.restore();
  }

  function dText(o) {
    var p = w2s(o.x, o.y);
    ctx.fillStyle = INK;
    ctx.font = "600 " + (o.size || 14) + "px Inter,sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(o.text || "Felirat", p.x, p.y);
  }

  /* --- méretvonalak --------------------------------------------- */
  function dimLine(x1, y1, x2, y2, label, obj, dim) {
    ctx.save();
    ctx.strokeStyle = DIM;
    ctx.fillStyle = DIM;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    [[x1, y1], [x2, y2]].forEach(function (p) {
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();
      ctx.restore();
    });
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.font = "600 11px Inter,sans-serif";
    var tw = ctx.measureText(label).width + 10;
    ctx.save();
    ctx.translate(mx, my);
    if (Math.abs(y2 - y1) > Math.abs(x2 - x1)) ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#fbfbfc";
    ctx.fillRect(-tw / 2, -8, tw, 16);
    ctx.fillStyle = DIM;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0.5);
    ctx.restore();
    if (obj) dimRects.push({ x: mx - tw / 2, y: my - 9, w: tw, h: 18, obj: obj, dim: dim });
    ctx.restore();
  }

  function drawDims(o, off) {
    var a = w2s(o.x, o.y), b = w2s(o.x + o.w, o.y + o.h);
    off = off || 15;
    dimLine(a.x, a.y - off, b.x, a.y - off, fmt(o.w), o, "w");
    dimLine(b.x + off, a.y, b.x + off, b.y, fmt(o.h), o, "h");
  }

  /**
   * Sok helyiségnél a szobánkénti méretvonal olvashatatlanná teszi a rajzot.
   * Ezért: 3 helyiségig mindegyik kap méretet; fölötte csak a kijelölt kap,
   * és mindig kirajzoljuk a teljes rajz külső befoglaló méretét.
   */
  function drawAllDims() {
    var rooms = state.objects.filter(function (o) { return o.type === "room"; });
    if (!rooms.length) return;
    if (rooms.length <= 3) {
      rooms.forEach(function (r) { drawDims(r); });
      return;
    }
    if (sel && sel.type === "room") drawDims(sel, 13);

    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    rooms.forEach(function (r) {
      minx = Math.min(minx, r.x); miny = Math.min(miny, r.y);
      maxx = Math.max(maxx, r.x + r.w); maxy = Math.max(maxy, r.y + r.h);
    });
    var a = w2s(minx, miny), b = w2s(maxx, maxy);
    var off = 26;
    dimLine(a.x, a.y - off, b.x, a.y - off, fmt(maxx - minx), null, null);
    dimLine(b.x + off, a.y, b.x + off, b.y, fmt(maxy - miny), null, null);
  }

  /* ---------------------------------------------------------------
     4. BÚTOR-SZIMBÓLUMOK (felülnézet)
     --------------------------------------------------------------- */
  function rr(x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var SYM = {
    bed: function (w, h) {
      rr(0, 0, w, h, 3); ctx.fill(); ctx.stroke();
      // takaró
      ctx.beginPath(); ctx.moveTo(0, h * 0.28); ctx.lineTo(w, h * 0.28); ctx.stroke();
      // párnák
      var pw = w > h ? h * 0.62 : w * 0.42, ph = w > h ? w * 0.2 : h * 0.14;
      var n = w * h > 2.4 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var px = n === 1 ? (w - pw) / 2 : (i ? w * 0.52 : w * 0.06);
        rr(px, h * 0.05, n === 1 ? pw : w * 0.42, h * 0.18, 2);
        ctx.stroke();
      }
    },
    sofa: function (w, h, o) {
      rr(0, 0, w, h, 4); ctx.fill(); ctx.stroke();
      // ülőfelület
      rr(w * 0.09, h * 0.32, w * 0.82, h * 0.6, 3); ctx.stroke();
      // ülésosztás (szélesség alapján 1-3 ülés)
      var seats = o && o.w >= 1.9 ? 3 : o && o.w >= 1.3 ? 2 : 1;
      for (var i = 1; i < seats; i++) {
        var x = w * 0.09 + (w * 0.82 * i) / seats;
        ctx.beginPath(); ctx.moveTo(x, h * 0.32); ctx.lineTo(x, h * 0.92); ctx.stroke();
      }
      // háttámla vastagabb vonallal
      ctx.save();
      ctx.lineWidth = Math.max(1.8, ctx.lineWidth * 1.8);
      ctx.beginPath(); ctx.moveTo(w * 0.04, h * 0.13); ctx.lineTo(w * 0.96, h * 0.13); ctx.stroke();
      ctx.restore();
    },
    armchair: function (w, h) {
      rr(0, 0, w, h, 4); ctx.fill(); ctx.stroke();
      rr(w * 0.14, h * 0.28, w * 0.72, h * 0.64, 3); ctx.stroke();
    },
    table: function (w, h) {
      rr(0, 0, w, h, 3); ctx.fill(); ctx.stroke();
      rr(w * 0.12, h * 0.14, w * 0.76, h * 0.72, 2); ctx.stroke();
    },
    roundtable: function (w, h) {
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, 6.284); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.36, h * 0.36, 0, 0, 6.284); ctx.stroke();
    },
    chair: function (w, h) {
      rr(w * 0.06, h * 0.2, w * 0.88, h * 0.76, 2); ctx.fill(); ctx.stroke();
      // háttámla
      ctx.save();
      ctx.lineWidth = Math.max(1.6, ctx.lineWidth * 2);
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.11); ctx.lineTo(w * 0.94, h * 0.11); ctx.stroke();
      ctx.restore();
    },
    cabinet: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    },
    wardrobe: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = 0.45;
      ctx.beginPath();
      for (var i = -h; i < w; i += 7) { ctx.moveTo(i, h); ctx.lineTo(i + h, 0); }
      ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    },
    counter: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.lineTo(w, h * 0.78); ctx.stroke();
    },
    stove: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      var r = Math.min(w, h) * 0.17;
      [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].forEach(function (p) {
        ctx.beginPath(); ctx.ellipse(w * p[0], h * p[1], r, r, 0, 0, 6.284); ctx.stroke();
      });
    },
    fridge: function (w, h) {
      rr(0, 0, w, h, 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * 0.42); ctx.lineTo(w, h * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.86, h * 0.16); ctx.lineTo(w * 0.86, h * 0.34); ctx.stroke();
    },
    sink: function (w, h) {
      rr(0, 0, w, h, 2); ctx.fill(); ctx.stroke();
      rr(w * 0.12, h * 0.2, w * 0.5, h * 0.6, 3); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.8, h * 0.5, Math.min(w, h) * 0.09, Math.min(w, h) * 0.09, 0, 0, 6.284); ctx.stroke();
    },
    washer: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      var r = Math.min(w, h) * 0.3;
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, r, r, 0, 0, 6.284); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, r * 0.55, r * 0.55, 0, 0, 6.284); ctx.stroke();
    },
    bath: function (w, h) {
      rr(0, 0, w, h, 3); ctx.fill(); ctx.stroke();
      rr(w * 0.07, h * 0.12, w * 0.86, h * 0.76, Math.min(w, h) * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(w * 0.16, h * 0.5, Math.min(w, h) * 0.07, Math.min(w, h) * 0.07, 0, 0, 6.284); ctx.stroke();
    },
    shower: function (w, h) {
      rr(0, 0, w, h, 2); ctx.fill(); ctx.stroke();
      // zuhanyajtó nyílásíve a bal alsó sarokból
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      ctx.beginPath(); ctx.arc(0, h, Math.min(w, h) * 0.95, -Math.PI / 2, 0); ctx.stroke();
      ctx.restore();
      // lefolyó
      var r = Math.min(w, h) * 0.09;
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, r, r, 0, 0, 6.284); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 - r, h / 2); ctx.lineTo(w / 2 + r, h / 2);
      ctx.moveTo(w / 2, h / 2 - r); ctx.lineTo(w / 2, h / 2 + r);
      ctx.stroke();
    },
    toilet: function (w, h) {
      ctx.fillRect(w * 0.08, 0, w * 0.84, h * 0.26); ctx.strokeRect(w * 0.08, 0, w * 0.84, h * 0.26);
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.62, w * 0.38, h * 0.36, 0, 0, 6.284);
      ctx.fill(); ctx.stroke();
    },
    bidet: function (w, h) {
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.42, h * 0.44, 0, 0, 6.284); ctx.fill(); ctx.stroke();
    },
    desk: function (w, h) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(w * 0.62, 0); ctx.lineTo(w * 0.62, h); ctx.stroke();
      ctx.strokeRect(w * 0.68, h * 0.18, w * 0.24, h * 0.28);
    },
    rug: function (w, h) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      rr(0, 0, w, h, 3); ctx.stroke();
      ctx.restore();
    },
    plant: function (w, h) {
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.96, r * 0.96, 0, 0, 6.284); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.34, r * 0.34, 0, 0, 6.284); ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * 6.284;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.36, cy + Math.sin(a) * r * 0.36);
        ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
        ctx.stroke();
      }
      ctx.restore();
    },

    spiral: function (w, h) {
      var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R, 0, 0, 6.284); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.2, R * 0.2, 0, 0, 6.284); ctx.fill(); ctx.stroke();
      for (var i = 0; i < 12; i++) {
        var a = (i / 12) * 6.284;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.2, cy + Math.sin(a) * R * 0.2);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.save();
      ctx.strokeStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.62, -Math.PI * 0.9, Math.PI * 0.55);
      ctx.stroke();
      var ea = Math.PI * 0.55;
      var ex = cx + Math.cos(ea) * R * 0.62, ey = cy + Math.sin(ea) * R * 0.62;
      ctx.beginPath();
      ctx.moveTo(ex - R * 0.16, ey - R * 0.06);
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - R * 0.04, ey - R * 0.2);
      ctx.stroke();
      ctx.restore();
    },

    lsofa: function (w, h) {
      // L alakú sarokkanapé: a rövidebb szár a bal oldalon
      var armW = w * 0.38;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(armW, h * 0.55);
      ctx.lineTo(armW, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.lineWidth = Math.max(1.8, ctx.lineWidth * 1.8);
      ctx.beginPath();
      ctx.moveTo(w * 0.02, h * 0.1); ctx.lineTo(w * 0.98, h * 0.1);
      ctx.moveTo(w * 0.06, h * 0.06); ctx.lineTo(w * 0.06, h * 0.96);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.16); ctx.lineTo(w * 0.5, h * 0.5);
      ctx.moveTo(w * 0.76, h * 0.16); ctx.lineTo(w * 0.76, h * 0.5);
      ctx.moveTo(w * 0.16, h * 0.62); ctx.lineTo(w * 0.36, h * 0.62);
      ctx.stroke();
    },
    tv: function (w, h) {
      ctx.fillRect(0, h * 0.32, w, h * 0.36); ctx.strokeRect(0, h * 0.32, w, h * 0.36);
    },
    stairs: function (w, h, o) {
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      // A fokszám a valós hosszból jön (kb. 28 cm-es fellépő), nem pixelből.
      var runM = o ? (o.h >= o.w ? o.h : o.w) : 3;
      var n = clamp(Math.round(runM / 0.28), 3, 22);
      ctx.beginPath();
      for (var i = 1; i < n; i++) {
        if (h >= w) { ctx.moveTo(0, (h / n) * i); ctx.lineTo(w, (h / n) * i); }
        else { ctx.moveTo((w / n) * i, 0); ctx.lineTo((w / n) * i, h); }
      }
      ctx.stroke();
      ctx.strokeStyle = ACCENT;
      ctx.beginPath();
      if (h >= w) { ctx.moveTo(w / 2, h * 0.9); ctx.lineTo(w / 2, h * 0.1); ctx.lineTo(w * 0.36, h * 0.24); ctx.moveTo(w / 2, h * 0.1); ctx.lineTo(w * 0.64, h * 0.24); }
      else { ctx.moveTo(w * 0.9, h / 2); ctx.lineTo(w * 0.1, h / 2); ctx.lineTo(w * 0.24, h * 0.36); ctx.moveTo(w * 0.1, h / 2); ctx.lineTo(w * 0.24, h * 0.64); }
      ctx.stroke();
    },
    car: function (w, h) {
      rr(0, 0, w, h, Math.min(w, h) * 0.18); ctx.fill(); ctx.stroke();
      rr(w * 0.2, h * 0.16, w * 0.6, h * 0.34, 3); ctx.stroke();
    },
  };

  function dFurniture(o) {
    var f = FURN[o.kind] || {};
    var rot = ((o.rot || 0) % 360 + 360) % 360;
    var swap = rot === 90 || rot === 270;
    var W = (swap ? o.h : o.w) * view.scale;
    var H = (swap ? o.w : o.h) * view.scale;
    var c = w2s(o.x + (swap ? o.h : o.w) / 2, o.y + (swap ? o.w : o.h) / 2);

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate((-(o.w * view.scale)) / 2, (-(o.h * view.scale)) / 2);
    ctx.fillStyle = "#f2f4f7";
    ctx.strokeStyle = "#6d7683";
    ctx.lineWidth = 1.25;
    ctx.lineJoin = "round";
    var fn = SYM[f.s] || SYM.cabinet;
    fn(o.w * view.scale, o.h * view.scale, o);
    ctx.restore();
  }

  /* --- kijelölés és fogantyúk ------------------------------------ */
  function bbox(o) {
    if (o.type === "room") { var a = w2s(o.x, o.y), b = w2s(o.x + o.w, o.y + o.h); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; }
    if (o.type === "furniture") {
      var rot = ((o.rot || 0) % 180) !== 0;
      var W = (rot ? o.h : o.w) * view.scale, H = (rot ? o.w : o.h) * view.scale;
      var c = w2s(o.x + o.w / 2, o.y + o.h / 2);
      return { x: c.x - W / 2, y: c.y - H / 2, w: W, h: H };
    }
    if (o.type === "wall") {
      var a2 = w2s(o.x1, o.y1), b2 = w2s(o.x2, o.y2);
      return { x: Math.min(a2.x, b2.x) - 5, y: Math.min(a2.y, b2.y) - 5, w: Math.abs(b2.x - a2.x) + 10, h: Math.abs(b2.y - a2.y) + 10 };
    }
    if (o.type === "door" || o.type === "window") {
      var c3 = w2s(o.x, o.y);
      var L = (o.len * view.scale) / 2 + 6;
      return { x: c3.x - L, y: c3.y - L, w: L * 2, h: L * 2 };
    }
    var p = w2s(o.x, o.y);
    ctx.font = "600 " + (o.size || 14) + "px Inter,sans-serif";
    var tw = ctx.measureText(o.text || "Felirat").width;
    return { x: p.x - 3, y: p.y - 11, w: tw + 6, h: 22 };
  }

  function drawSelection(o) {
    var b = bbox(o);
    ctx.save();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    ctx.setLineDash([]);
    if (o.type === "room") {
      [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]].forEach(function (p) {
        var s = w2s(p[0], p[1]);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, 5.5, 0, 6.284); ctx.fill(); ctx.stroke();
      });
    }
    ctx.restore();
  }

  function hitTest(px, py) {
    var order = { text: 0, furniture: 1, door: 2, window: 2, wall: 3, room: 4 };
    var list = state.objects.slice().sort(function (a, b) { return order[a.type] - order[b.type]; });
    for (var i = 0; i < list.length; i++) {
      var o = list[i], b = bbox(o);
      if (px >= b.x - 5 && px <= b.x + b.w + 5 && py >= b.y - 5 && py <= b.y + b.h + 5) return o;
    }
    return null;
  }

  function roomHandle(o, px, py) {
    if (!o || o.type !== "room") return null;
    var hs = [["nw", o.x, o.y], ["ne", o.x + o.w, o.y], ["sw", o.x, o.y + o.h], ["se", o.x + o.w, o.y + o.h]];
    for (var i = 0; i < 4; i++) {
      var s = w2s(hs[i][1], hs[i][2]);
      if (Math.abs(px - s.x) < 10 && Math.abs(py - s.y) < 10) return hs[i][0];
    }
    return null;
  }

  function dimHit(px, py) {
    for (var i = 0; i < dimRects.length; i++) {
      var d = dimRects[i];
      if (px >= d.x && px <= d.x + d.w && py >= d.y && py <= d.y + d.h) return d;
    }
    return null;
  }

  /* ---------------------------------------------------------------
     5. MUTATÓ- ÉS BILLENTYŰKEZELÉS
     --------------------------------------------------------------- */
  var pointers = {};
  var pinch = null;

  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = evPos(e);
    if (Object.keys(pointers).length === 2) {
      var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
      pinch = { d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), scale: view.scale };
      drag = null;
      return;
    }
    var p = evPos(e);

    // méretcímke szerkesztése
    var d = dimHit(p.x, p.y);
    if (d && tool === "select") { editDim(d); return; }

    if (tool === "wall" || tool === "door" || tool === "window") {
      startCreateSegment(p);
      return;
    }
    if (tool === "text") {
      var w = s2w(p.x, p.y);
      var txt = prompt("Felirat szövege:", "Felirat");
      if (txt) {
        pushUndo();
        var t = { id: uid++, type: "text", x: gsnap(w.x), y: gsnap(w.y), text: txt, size: 14 };
        state.objects.push(t);
        sel = t; setTool("select"); afterChange();
      }
      return;
    }
    if (tool === "furniture" && pendingFurn) {
      var wp = s2w(p.x, p.y);
      placeFurniture(pendingFurn, wp.x, wp.y);
      return;
    }

    // kijelölés / mozgatás / átméretezés
    var hitObj = hitTest(p.x, p.y);
    var h = sel ? roomHandle(sel, p.x, p.y) : null;
    if (h) {
      pushUndo();
      drag = { mode: "resize", handle: h, obj: sel, start: s2w(p.x, p.y), o0: Object.assign({}, sel) };
      return;
    }
    if (hitObj) {
      sel = hitObj;
      setSelClass();
      props();
      pushUndo();
      var wp2 = s2w(p.x, p.y);
      drag = { mode: "move", obj: hitObj, dx: wp2.x - (hitObj.x !== undefined ? hitObj.x : hitObj.x1), dy: wp2.y - (hitObj.y !== undefined ? hitObj.y : hitObj.y1), o0: JSON.parse(JSON.stringify(hitObj)) };
      draw();
      return;
    }
    // zárt terület elnevezése
    var z = zoneAt(p.x, p.y);
    if (z && tool === "select") {
      nameZone(z, s2w(p.x, p.y));
      return;
    }

    sel = null;
    setSelClass();
    props();
    drag = { mode: "pan", sx: p.x, sy: p.y, ox: view.ox, oy: view.oy };
    draw();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (pointers[e.pointerId]) pointers[e.pointerId] = evPos(e);
    if (pinch) {
      var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
      if (ps.length < 2) return;
      var nd = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      var mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      zoomAt(mid.x, mid.y, clamp((pinch.scale * nd) / pinch.d, 12, 220) / view.scale);
      return;
    }
    if (!drag) return;
    var p = evPos(e);

    if (drag.mode === "pan") {
      view.ox = drag.ox + (p.x - drag.sx);
      view.oy = drag.oy + (p.y - drag.sy);
      draw();
      return;
    }
    if (drag.mode === "createSeg") {
      var w = s2w(p.x, p.y);
      var e = snapWallEnd(w, null);
      drag.preview = buildSegment(drag.a, { x: e.x, y: e.y }, drag.kind);
      drag.snapKind = e.kind;
      draw();
      return;
    }
    if (drag.mode === "move") {
      invalidateZones();
      var wp = s2w(p.x, p.y);
      var o = drag.obj;
      if (o.type === "wall") {
        var dx = wp.x - drag.dx - o.x1, dy = wp.y - drag.dy - o.y1;
        o.x1 = gsnap(o.x1 + dx); o.y1 = gsnap(o.y1 + dy);
        o.x2 = gsnap(o.x2 + dx); o.y2 = gsnap(o.y2 + dy);
        guides = [];
      } else if (o.type === "door" || o.type === "window") {
        o.x = wp.x - drag.dx; o.y = wp.y - drag.dy;
        snapOpening(o);
        guides = [];
      } else {
        var s = snapPoint({ x: wp.x - drag.dx, y: wp.y - drag.dy }, o, { w: o.w, h: o.h });
        o.x = r2(s.x); o.y = r2(s.y);
      }
      draw();
      return;
    }
    if (drag.mode === "resize") {
      invalidateZones();
      var w2 = s2w(p.x, p.y);
      var s2 = snapPoint({ x: w2.x, y: w2.y }, drag.obj, null);
      var o2 = drag.obj, o0 = drag.o0;
      var x1 = o0.x, y1 = o0.y, x2 = o0.x + o0.w, y2 = o0.y + o0.h;
      if (drag.handle.indexOf("n") === 0 || drag.handle === "nw" || drag.handle === "ne") y1 = s2.y;
      if (drag.handle === "sw" || drag.handle === "se") y2 = s2.y;
      if (drag.handle === "nw" || drag.handle === "sw") x1 = s2.x;
      if (drag.handle === "ne" || drag.handle === "se") x2 = s2.x;
      o2.x = r2(Math.min(x1, x2));
      o2.y = r2(Math.min(y1, y2));
      o2.w = Math.max(0.5, r2(Math.abs(x2 - x1)));
      o2.h = Math.max(0.5, r2(Math.abs(y2 - y1)));
      draw();
      return;
    }
  });

  function endPointer(e) {
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinch = null;
    if (!drag) return;
    if (drag.mode === "createSeg" && drag.preview) {
      var seg = drag.preview;
      var ok = seg.type === "wall" ? Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) > 0.15 : true;
      drag = null;
      if (ok) { pushUndo(); state.objects.push(seg); sel = seg; setTool("select"); invalidateZones(); afterChange(); return; }
    }
    var wasMove = drag.mode === "move" || drag.mode === "resize";
    drag = null;
    guides = [];
    if (wasMove) { save(); props(); summary(); }
    draw();
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    var p = evPos(e);
    zoomAt(p.x, p.y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  function zoomAt(px, py, f) {
    var before = s2w(px, py);
    view.scale = clamp(view.scale * f, 12, 220);
    var after = s2w(px, py);
    view.ox += (after.x - before.x) * view.scale;
    view.oy += (after.y - before.y) * view.scale;
    draw();
  }

  /* --- szakasz létrehozása (fal / ajtó / ablak) ------------------- */
  function startCreateSegment(p) {
    var w = s2w(p.x, p.y);
    if (tool === "wall") {
      var a0 = snapWallEnd(w, null);
      drag = { mode: "createSeg", kind: "wall", a: { x: a0.x, y: a0.y } };
      drag.preview = buildSegment(drag.a, drag.a, "wall");
      draw();
      return;
    }
    // ajtó/ablak: egy kattintás, a legközelebbi falra ugrik
    pushUndo();
    var o = {
      id: uid++,
      type: tool,
      x: r2(w.x),
      y: r2(w.y),
      len: tool === "door" ? 0.9 : 1.2,
      ang: 0,
      kind: tool === "door" ? "single" : undefined,
    };
    snapOpening(o);
    state.objects.push(o);
    sel = o;
    setTool("select");
    afterChange();
  }

  function buildSegment(a, b, kind) {
    // Derékszögbe kényszerítés — de ha a végpont pontosan egy sarokra ült,
    // nem mozdítjuk el, mert akkor nem érne össze a többi fallal.
    var dx = b.x - a.x, dy = b.y - a.y;
    var exact = Math.abs(dx) < 0.011 || Math.abs(dy) < 0.011;
    if (!exact) {
      if (Math.abs(dx) > Math.abs(dy) * 3) dy = 0;
      else if (Math.abs(dy) > Math.abs(dx) * 3) dx = 0;
    }
    return { id: uid++, type: "wall", x1: a.x, y1: a.y, x2: r2(a.x + dx), y2: r2(a.y + dy), t: state.wall };
  }

  /* --- elemek létrehozása ---------------------------------------- */
  function placeFurniture(kind, cx, cy) {
    var f = FURN[kind];
    if (!f) return;
    var s = snapPoint({ x: cx - f.w / 2, y: cy - f.h / 2 }, null, { w: f.w, h: f.h });
    pushUndo();
    var it = { id: uid++, type: "furniture", kind: kind, x: r2(s.x), y: r2(s.y), w: f.w, h: f.h, rot: 0 };
    state.objects.push(it);
    sel = it;
    setTool("select");
    afterChange();
  }

  function addRoom(w, h, label) {
    var cw = s2w(canvas.clientWidth / 2, canvas.clientHeight / 2);
    var rw = w || 4, rh = h || 3.5;
    var off = state.objects.filter(function (o) { return o.type === "room"; }).length * 0.4;
    var s = snapPoint({ x: cw.x - rw / 2 + off, y: cw.y - rh / 2 + off }, null, { w: rw, h: rh });
    pushUndo();
    var r = { id: uid++, type: "room", x: r2(s.x), y: r2(s.y), w: rw, h: rh, label: label || "Szoba" };
    state.objects.push(r);
    sel = r;
    setTool("select");
    afterChange();
    return r;
  }

  function applyTemplate(tpl) {
    pushUndo();
    state.objects = [];
    uid = 1;
    (tpl.rooms || []).forEach(function (r) {
      state.objects.push({ id: uid++, type: "room", x: r[0], y: r[1], w: r[2], h: r[3], label: r[4] });
    });
    (tpl.openings || []).forEach(function (o) {
      var it = { id: uid++, type: o[0], x: o[1], y: o[2], len: o[3], ang: 0, kind: o[0] === "door" ? "single" : undefined };
      snapOpening(it);
      state.objects.push(it);
    });
    sel = null;
    fitView();
    afterChange();
    closeSheet("ap-tpl-sheet");
  }

  function afterChange() {
    invalidateZones();
    setSelClass();
    props();
    summary();
    updateEmpty();
    save();
    draw();
  }

  function editDim(d) {
    var cur = d.dim === "w" ? d.obj.w : d.obj.h;
    var v = prompt((d.dim === "w" ? "Szélesség" : "Hosszúság") + " (méter):", r2(cur).toString().replace(".", ","));
    if (v === null) return;
    var n = parseFloat(String(v).replace(",", "."));
    if (isNaN(n) || n <= 0) return;
    pushUndo();
    if (d.dim === "w") d.obj.w = r2(n); else d.obj.h = r2(n);
    sel = d.obj;
    afterChange();
  }

  /* --- billentyűk ------------------------------------------------- */
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var meta = e.ctrlKey || e.metaKey;

    if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (meta && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }
    if (meta && e.key.toLowerCase() === "d" && sel) { e.preventDefault(); duplicate(); return; }

    if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); removeSel(); return; }
    if (e.key.toLowerCase() === "r" && sel && sel.type === "furniture") { rotateSel(); return; }
    if (e.key === "Escape") { setTool("select"); sel = null; afterChange(); return; }

    var map = { s: "addroom", f: "wall", a: "door", b: "window", t: "text" };
    var m = map[e.key.toLowerCase()];
    if (m === "addroom") { addRoom(); return; }
    if (m) { setTool(m); return; }

    // nyilakkal léptetés
    if (sel && e.key.indexOf("Arrow") === 0) {
      e.preventDefault();
      var step = e.shiftKey ? 0.5 : state.grid;
      var dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      var dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (sel.type === "wall") { sel.x1 += dx; sel.y1 += dy; sel.x2 += dx; sel.y2 += dy; }
      else { sel.x = r2(sel.x + dx); sel.y = r2(sel.y + dy); }
      save(); draw();
    }
  });

  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state));
    restore(undoStack.pop());
    updateEmpty();
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state));
    restore(redoStack.pop());
    updateEmpty();
  }
  function removeSel() {
    if (!sel) return;
    pushUndo();
    var i = state.objects.indexOf(sel);
    if (i >= 0) state.objects.splice(i, 1);
    sel = null;
    afterChange();
  }
  function duplicate() {
    if (!sel) return;
    pushUndo();
    var c = JSON.parse(JSON.stringify(sel));
    c.id = uid++;
    if (c.x !== undefined) { c.x = r2(c.x + 0.3); c.y = r2(c.y + 0.3); }
    else { c.x1 += 0.3; c.y1 += 0.3; c.x2 += 0.3; c.y2 += 0.3; }
    state.objects.push(c);
    sel = c;
    afterChange();
  }
  function rotateSel() {
    if (!sel) return;
    pushUndo();
    if (sel.type === "furniture") sel.rot = ((sel.rot || 0) + 90) % 360;
    else if (sel.type === "door" || sel.type === "window") sel.ang = (sel.ang || 0) + Math.PI / 2;
    afterChange();
  }


  /** Zárt terület elnevezése — a név egy horgonyponthoz tapad. */
  function nameZone(z, at) {
    var cur = zoneLabel(z) || "";
    var v = prompt(
      "Mi legyen ennek a " + z.area.toString().replace(".", ",") + " m²-es területnek a neve?",
      cur || "Nappali"
    );
    if (v === null) return;
    pushUndo();
    state.zones = (state.zones || []).filter(function (a) {
      var cx = Math.round((a.x - z.x0) / z.G), cy = Math.round((a.y - z.y0) / z.G);
      return z.cells.indexOf(cy * z.nx + cx) < 0;
    });
    if (v.trim()) state.zones.push({ x: r2(at.x), y: r2(at.y), label: v.trim() });
    afterChange();
  }

  /* ---------------------------------------------------------------
     6. TULAJDONSÁGPANEL + ÖSSZEGZÉS
     --------------------------------------------------------------- */
  function setSelClass() {
    if (app) app.classList.toggle("ap-has-sel", !!sel);
    setHelp();
  }

  function field(label, node) {
    var w = document.createElement("div");
    var l = document.createElement("label");
    l.textContent = label;
    w.appendChild(l);
    w.appendChild(node);
    return w;
  }
  function numInput(v, on) {
    var i = document.createElement("input");
    i.type = "number"; i.step = "0.1"; i.min = "0.1"; i.value = r2(v);
    i.addEventListener("change", function () {
      var x = parseFloat(i.value);
      if (!isNaN(x) && x > 0) { pushUndo(); on(r2(x)); afterChange(); }
    });
    return i;
  }
  function textInput(v, on) {
    var i = document.createElement("input");
    i.type = "text"; i.value = v || "";
    i.addEventListener("change", function () { pushUndo(); on(i.value); afterChange(); });
    return i;
  }
  function selectInput(opts, val, on) {
    var s = document.createElement("select");
    opts.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o.v !== undefined ? o.v : o;
      op.textContent = o.n !== undefined ? o.n : o;
      if (String(val) === String(op.value)) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener("change", function () { pushUndo(); on(s.value); afterChange(); });
    return s;
  }
  function actionRow() {
    var row = document.createElement("div");
    row.className = "ap-actions";
    var rot = document.createElement("button");
    rot.className = "ap-mini"; rot.type = "button"; rot.title = "Forgatás (R)";
    rot.innerHTML = icon("rotate") + "<span>Forgat</span>";
    rot.addEventListener("click", rotateSel);
    var dup = document.createElement("button");
    dup.className = "ap-mini"; dup.type = "button"; dup.title = "Másolás (Ctrl+D)";
    dup.innerHTML = icon("copy") + "<span>Másol</span>";
    dup.addEventListener("click", duplicate);
    var del = document.createElement("button");
    del.className = "ap-mini ap-danger"; del.type = "button"; del.title = "Törlés (Del)";
    del.innerHTML = icon("trash") + "<span>Töröl</span>";
    del.addEventListener("click", removeSel);
    if (sel && (sel.type === "furniture" || sel.type === "door" || sel.type === "window")) row.appendChild(rot);
    row.appendChild(dup);
    row.appendChild(del);
    return row;
  }

  function props() {
    var body = $("ap-props-body");
    var title = $("ap-props-title");
    if (!body) return;
    body.innerHTML = "";
    if (!sel) {
      if (title) title.textContent = "Tulajdonságok";
      var hint = document.createElement("p");
      hint.className = "ap-hint";
      hint.textContent = "Kattints egy helyiségre, bútorra vagy nyílászáróra, és itt tudod pontosan beállítani.";
      body.appendChild(hint);
      return;
    }

    if (sel.type === "room") {
      title.textContent = "Helyiség";
      body.appendChild(field("Megnevezés", selectInput(ROOMTYPES, sel.label, function (v) { sel.label = v; })));
      body.appendChild(field("Szélesség (m)", numInput(sel.w, function (v) { sel.w = v; })));
      body.appendChild(field("Hosszúság (m)", numInput(sel.h, function (v) { sel.h = v; })));
      var info = document.createElement("p");
      info.className = "ap-info";
      info.textContent = "Alapterület: " + areaOf(sel).toString().replace(".", ",") + " m² · kerület: " + r2(2 * (sel.w + sel.h)).toString().replace(".", ",") + " m";
      body.appendChild(info);
    } else if (sel.type === "furniture") {
      title.textContent = (FURN[sel.kind] && FURN[sel.kind].n) || "Bútor";
      body.appendChild(field("Szélesség (m)", numInput(sel.w, function (v) { sel.w = v; })));
      body.appendChild(field("Mélység (m)", numInput(sel.h, function (v) { sel.h = v; })));
      body.appendChild(field("Forgatás", selectInput([{ v: 0, n: "0°" }, { v: 90, n: "90°" }, { v: 180, n: "180°" }, { v: 270, n: "270°" }], sel.rot || 0, function (v) { sel.rot = parseInt(v, 10); })));
    } else if (sel.type === "door") {
      title.textContent = "Ajtó";
      body.appendChild(field("Típus", selectInput([{ v: "single", n: "Egyszárnyú" }, { v: "double", n: "Kétszárnyú" }, { v: "sliding", n: "Toló" }], sel.kind, function (v) { sel.kind = v; })));
      body.appendChild(field("Szélesség (m)", numInput(sel.len, function (v) { sel.len = v; })));
      var b1 = document.createElement("button");
      b1.className = "ap-mini ap-wide"; b1.type = "button";
      b1.innerHTML = icon("flip") + "<span>Nyitásirány tükrözése</span>";
      b1.addEventListener("click", function () { pushUndo(); sel.flip = !sel.flip; afterChange(); });
      body.appendChild(b1);
      var b2 = document.createElement("button");
      b2.className = "ap-mini ap-wide"; b2.type = "button";
      b2.innerHTML = icon("swap") + "<span>Másik oldalra nyíljon</span>";
      b2.addEventListener("click", function () { pushUndo(); sel.side = !sel.side; afterChange(); });
      body.appendChild(b2);
    } else if (sel.type === "window") {
      title.textContent = "Ablak";
      body.appendChild(field("Szélesség (m)", numInput(sel.len, function (v) { sel.len = v; })));
    } else if (sel.type === "wall") {
      title.textContent = "Fal";
      var len = Math.hypot(sel.x2 - sel.x1, sel.y2 - sel.y1);
      body.appendChild(field("Hossz (m)", numInput(len, function (v) {
        var a = Math.atan2(sel.y2 - sel.y1, sel.x2 - sel.x1);
        sel.x2 = r2(sel.x1 + Math.cos(a) * v);
        sel.y2 = r2(sel.y1 + Math.sin(a) * v);
      })));
      body.appendChild(field("Vastagság (m)", numInput(sel.t || state.wall, function (v) { sel.t = v; })));
    } else if (sel.type === "text") {
      title.textContent = "Felirat";
      body.appendChild(field("Szöveg", textInput(sel.text, function (v) { sel.text = v; })));
      body.appendChild(field("Méret (px)", numInput(sel.size || 14, function (v) { sel.size = v; })));
    }
    body.appendChild(actionRow());
  }

  function summary() {
    var el = $("ap-summary");
    var statEl = $("ap-stat");
    var rooms = state.objects.filter(function (o) { return o.type === "room"; });
    var zones = detectZones().map(function (z) {
      return { label: zoneLabel(z) || "Zárt terület", w: null, h: null, area: z.area };
    });
    var heated = rooms.filter(function (r) { return !isUnheated(r); });
    var open = rooms.filter(isUnheated);
    var total = heated.reduce(function (s, r) { return s + areaOf(r); }, 0) +
      zones.reduce(function (s, z) { return s + z.area; }, 0);
    var openTotal = open.reduce(function (s, r) { return s + areaOf(r); }, 0);
    var furn = state.objects.filter(function (o) { return o.type === "furniture"; }).length;

    // ─── Élő szinkron a 3D nézettel (House3DViewer) ─────────────────────────
    if (rooms.length) {
      var bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;
      rooms.forEach(function (r) {
        bx1 = Math.min(bx1, r.x); by1 = Math.min(by1, r.y);
        bx2 = Math.max(bx2, r.x + r.w); by2 = Math.max(by2, r.y + r.h);
      });
      var hasTerrace = rooms.some(function (r) {
        return String(r.label || "").replace(/\s*\d+$/, "") === "Terasz";
      });
      window.dispatchEvent(new CustomEvent("plannerUpdate", {
        detail: {
          width: r2(bx2 - bx1),
          depth: r2(by2 - by1),
          hasTerrace: hasTerrace,
          windows: state.objects.filter(function (o) { return o.type === "window"; }).length,
          doors: state.objects.filter(function (o) { return o.type === "door"; }).length,
        },
      }));
    }

    if (statEl) {
      statEl.textContent = (heated.length + zones.length) + " helyiség · "
        + r2(total).toString().replace(".", ",") + " m²"
        + (openTotal ? " + " + r2(openTotal).toString().replace(".", ",") + " m² " + openLabel(open) : "")
        + " · " + furn + " bútor";
    }
    if (!el) return;
    if (!rooms.length && !zones.length) { el.innerHTML = ""; return; }
    var row = function (label, size, area, cls) {
      return "<tr" + (cls ? ' class="' + cls + '"' : "") + "><td>" + esc(label) + "</td><td"
        + (size === "falakkal" ? " class='ap-faint'" : "") + ">" + esc(size) + "</td><td class='ap-r'>"
        + area.toString().replace(".", ",") + "</td></tr>";
    };
    var dim = function (r) {
      return r2(r.w).toString().replace(".", ",") + " × " + r2(r.h).toString().replace(".", ",");
    };
    // Minden sor EGY törzsbe kerül: a böngésző a <tfoot>-ot a táblázat
    // végére tolja, amitől a „Hasznos alapterület” a terasz alá csúszott.
    var html = '<table class="ap-sum"><thead><tr><th>Helyiség</th><th>Méret</th><th class="ap-r">m²</th></tr></thead><tbody>';
    heated.forEach(function (r) { html += row(r.label || "Szoba", dim(r), areaOf(r)); });
    zones.forEach(function (z) { html += row(z.label, "falakkal", z.area); });
    html += row(openTotal ? "Hasznos alapterület" : "Összesen", "", r2(total), "ap-total");
    if (openTotal) {
      open.forEach(function (r) { html += row(r.label || "Terasz", dim(r), areaOf(r), "ap-open"); });
      html += row(openLabel(open) + " összesen", "", r2(openTotal), "ap-open ap-total");
    }
    html += "</tbody></table>";
    var tiers = window.AP_SIZE_TIERS || [];
    if (tiers.length && total > 0) {
      var match = tiers.find(function (t) { return total <= t.m2; }) || tiers[tiers.length - 1];
      html += '<p class="ap-info mt-2">Ez az alapterület a <strong>' + esc(match.label) + '</strong> modellnek felel meg.</p>';
    }
    el.innerHTML = html;
  }
  /** „terasz”, vagy több fajtánál „fűtetlen tér”. */
  function openLabel(list) {
    var names = {};
    list.forEach(function (r) { names[String(r.label || "").replace(/\s*\d+$/, "").toLowerCase()] = 1; });
    var keys = Object.keys(names);
    return keys.length === 1 ? keys[0] : "fűtetlen tér";
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function updateEmpty() {
    var e = $("ap-empty");
    if (!e) return;
    // Rajzoló eszközzel a kezdőképernyő ne fogja el a kattintásokat.
    var hide = state.objects.length > 0 || tool !== "select";
    e.style.display = hide ? "none" : "flex";
  }

  /* --- kontextusfüggő súgó --------------------------------------- */
  var HELP = {
    wall: "Húzz egy vonalat — a végpont ráugrik a sarkokra és a falakra. Ha körbezársz egy területet, magától kiszámoljuk a m²-ét.",
    door: "Kattints a falra, ahová az ajtót szeretnéd. Odaugrik magától.",
    window: "Kattints a falra, ahová az ablakot szeretnéd.",
    text: "Kattints oda, ahová a feliratot írnád.",
    furniture: "Kattints a vászonra a bútor elhelyezéséhez.",
  };
  function setHelp() {
    var el = $("ap-help");
    if (!el) return;
    var t = HELP[tool];
    if (!t && sel) {
      t = sel.type === "room"
        ? "Húzd a sarkokat az átméretezéshez, vagy kattints a kék méretszámra és írd be pontosan."
        : "Mozgatás húzással · R = forgatás · Del = törlés";
    }
    if (t) { el.textContent = t; el.style.display = "block"; } else el.style.display = "none";
  }

  /* --- eszköztár -------------------------------------------------- */
  function setToolUI(t) {
    document.querySelectorAll(".ap-tool[data-tool]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.tool === t ? "true" : "false");
    });
    document.querySelectorAll(".ap-furn").forEach(function (b) {
      b.setAttribute("aria-pressed", t === "furniture" && b.dataset.furn === pendingFurn ? "true" : "false");
    });
    canvas.style.cursor = t === "select" ? "default" : "crosshair";
    setHelp();
  }
  function setTool(t) {
    tool = t;
    if (t !== "furniture") pendingFurn = null;
    setToolUI(t);
    updateEmpty();
  }

  document.querySelectorAll(".ap-tool[data-tool]").forEach(function (b) {
    b.addEventListener("click", function () { setTool(b.dataset.tool === tool ? "select" : b.dataset.tool); });
  });
  document.querySelectorAll(".ap-furn").forEach(function (b) {
    b.addEventListener("click", function () {
      pendingFurn = b.dataset.furn;
      tool = "furniture";
      setToolUI("furniture");
      closeSheet("ap-lib-sheet");
    });
    b.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", b.dataset.furn);
      e.dataTransfer.effectAllowed = "copy";
    });
  });
  canvas.addEventListener("dragover", function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
  canvas.addEventListener("drop", function (e) {
    e.preventDefault();
    var k = e.dataTransfer.getData("text/plain");
    if (!k || !FURN[k]) return;
    var p = evPos(e), w = s2w(p.x, p.y);
    placeFurniture(k, w.x, w.y);
  });

  bind("ap-add-room", function () { addRoom(); });
  bind("ap-empty-add", function () { addRoom(); });
  bind("ap-undo", doUndo);
  bind("ap-redo", doRedo);
  bind("ap-zoomin", function () { zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.2); });
  bind("ap-zoomout", function () { zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.2); });
  bind("ap-fit", fitView);
  bind("ap-clear", function () {
    if (!state.objects.length || confirm("Biztosan törlöd az egész alaprajzot?")) {
      pushUndo();
      state.objects = [];
      sel = null;
      afterChange();
    }
  });
  bind("ap-help-btn", function () { openSheet("ap-shortcuts"); });
  bind("ap-shortcuts-close", function () { closeSheet("ap-shortcuts"); });
  bind("ap-tpl-btn", function () { openSheet("ap-tpl-sheet"); });
  bind("ap-tpl-btn2", function () { openSheet("ap-tpl-sheet"); });
  bind("ap-tpl-close", function () { closeSheet("ap-tpl-sheet"); });
  bind("ap-lib-btn", function () { openSheet("ap-lib-sheet"); });
  bind("ap-lib-close", function () { closeSheet("ap-lib-sheet"); });
  bind("ap-props-close", function () { sel = null; afterChange(); });

  document.querySelectorAll("[data-tpl]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = TEMPLATES[parseInt(b.dataset.tpl, 10)];
      if (t) applyTemplate(t);
    });
  });

  function bind(id, fn) { var e = $(id); if (e) e.addEventListener("click", fn); }
  function openSheet(id) { var e = $(id); if (e) e.style.display = "flex"; }
  function closeSheet(id) { var e = $(id); if (e) e.style.display = "none"; }
  document.querySelectorAll(".ap-sheet").forEach(function (s) {
    s.addEventListener("click", function (e) { if (e.target === s) s.style.display = "none"; });
  });

  var search = $("ap-search");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".ap-furn").forEach(function (b) {
        var hit = !q || (b.dataset.label || "").toLowerCase().indexOf(q) >= 0;
        b.style.display = hit ? "" : "none";
      });
      document.querySelectorAll(".ap-cat").forEach(function (c) {
        var any = Array.prototype.some.call(c.querySelectorAll(".ap-furn"), function (b) { return b.style.display !== "none"; });
        c.style.display = any ? "" : "none";
      });
    });
  }

  function fitView() {
    var rooms = state.objects.filter(function (o) { return o.x !== undefined && o.w !== undefined; });
    if (!rooms.length) { view.scale = 46; view.ox = canvas.clientWidth / 2; view.oy = canvas.clientHeight / 2; draw(); return; }
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    rooms.forEach(function (o) {
      minx = Math.min(minx, o.x); miny = Math.min(miny, o.y);
      maxx = Math.max(maxx, o.x + o.w); maxy = Math.max(maxy, o.y + o.h);
    });
    var pad = 1.2;
    var sx = canvas.clientWidth / (maxx - minx + pad * 2);
    var sy = canvas.clientHeight / (maxy - miny + pad * 2);
    view.scale = clamp(Math.min(sx, sy), 12, 160);
    view.ox = canvas.clientWidth / 2 - ((minx + maxx) / 2) * view.scale;
    view.oy = canvas.clientHeight / 2 - ((miny + maxy) / 2) * view.scale;
    draw();
  }

  /* ---------------------------------------------------------------
     7. EXPORT — PNG rajzfejléccel és léptékvonallal
     --------------------------------------------------------------- */
  function renderExport(scaleFactor) {
    var rooms = state.objects.filter(function (o) { return o.x !== undefined && o.w !== undefined; });
    var minx = 0, miny = 0, maxx = 10, maxy = 8;
    if (rooms.length) {
      minx = Infinity; miny = Infinity; maxx = -Infinity; maxy = -Infinity;
      rooms.forEach(function (o) {
        minx = Math.min(minx, o.x); miny = Math.min(miny, o.y);
        maxx = Math.max(maxx, o.x + o.w); maxy = Math.max(maxy, o.y + o.h);
      });
    }
    var pad = 1.4;
    var W = maxx - minx + pad * 2, H = maxy - miny + pad * 2;
    var px = clamp(Math.round(1100 * scaleFactor / W), 20, 200);
    var head = Math.round(56 * scaleFactor);
    var foot = Math.round(64 * scaleFactor);

    var off = document.createElement("canvas");
    off.width = Math.round(W * px);
    off.height = Math.round(H * px) + head + foot;

    var saveCanvas = canvas, saveCtx = ctx, saveView = view, saveSel = sel, saveGuides = guides, saveDims = dimRects;
    canvas = off; ctx = off.getContext("2d"); sel = null; guides = [];
    view = { scale: px, ox: -minx * px + pad * px, oy: -miny * px + pad * px + head };

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, off.width, off.height);

    // rajzterület
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, head, off.width, off.height - head - foot);
    ctx.clip();
    dimRects = [];
    var order = { room: 0, wall: 1, door: 2, window: 2, furniture: 3, text: 4 };
    var sorted = state.objects.slice().sort(function (a, b) { return order[a.type] - order[b.type]; });
    sorted.filter(function (o) { return o.type === "room"; }).forEach(function (o) { drawObj(o); });
    drawZones();
    sorted.filter(function (o) { return o.type !== "room"; }).forEach(function (o) { drawObj(o); });
    state.objects.filter(function (o) { return o.type === "room"; }).forEach(function (r) { drawDims(r, 15); });
    ctx.restore();

    // fejléc
    var f = scaleFactor;
    ctx.fillStyle = INK;
    ctx.font = "700 " + Math.round(22 * f) + "px 'Plus Jakarta Sans',Inter,sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(state.title || "Alaprajz", 20 * f, head / 2);
    ctx.fillStyle = FAINT;
    ctx.font = Math.round(13 * f) + "px Inter,sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("gyors-haz.hu", off.width - 20 * f, head / 2);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, head); ctx.lineTo(off.width, head); ctx.stroke();

    // lábléc: léptékvonal + összegzés
    var fy = off.height - foot;
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(off.width, fy); ctx.stroke();
    var barM = 1;
    while (barM * px < 60 * f) barM *= 2;
    var bx = 20 * f, by = fy + foot * 0.55;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2 * f;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + barM * px, by);
    ctx.moveTo(bx, by - 5 * f); ctx.lineTo(bx, by + 5 * f);
    ctx.moveTo(bx + barM * px, by - 5 * f); ctx.lineTo(bx + barM * px, by + 5 * f);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = Math.round(12 * f) + "px Inter,sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(barM + " m", bx, by - 8 * f);

    var rms = state.objects.filter(function (o) { return o.type === "room"; });
    var zs = detectZones();
    var tot = rms.reduce(function (s, r) { return s + areaOf(r); }, 0) +
      zs.reduce(function (s, z) { return s + z.area; }, 0);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.font = "600 " + Math.round(14 * f) + "px Inter,sans-serif";
    ctx.fillText((rms.length + zs.length) + " helyiség · összesen " + r2(tot).toString().replace(".", ",") + " m²", off.width - 20 * f, by);

    var url = off.toDataURL("image/png");
    canvas = saveCanvas; ctx = saveCtx; view = saveView; sel = saveSel; guides = saveGuides; dimRects = saveDims;
    draw();
    return url;
  }

  function doExport(kind) {
    var url = renderExport(kind === "print" ? 1.6 : 1.4);
    if (kind === "print") {
      var w = window.open("");
      if (!w) { alert("Engedélyezd a felugró ablakot a nyomtatáshoz."); return; }
      w.document.write('<title>Alaprajz</title><body style="margin:0"><img src="' + url + '" style="width:100%" onload="window.focus();window.print()">');
      w.document.close();
    } else {
      var a = document.createElement("a");
      a.href = url;
      a.download = (state.title || "alaprajz").replace(/[^\w\-]+/g, "-").toLowerCase() + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  /* ---------------------------------------------------------------
     8. E-MAIL KAPU
     --------------------------------------------------------------- */
  var modal = $("ap-modal");
  function openModal(kind) {
    if (!state.objects.length) {
      alert("Előbb rajzolj legalább egy helyiséget!");
      return;
    }
    pendingExport = kind;
    var msg = $("ap-email-msg");
    if (msg) { msg.textContent = ""; msg.className = "ap-msg"; }
    if (modal) modal.style.display = "flex";
    var inp = $("ap-email-input");
    if (inp) setTimeout(function () { inp.focus(); }, 40);
  }
  bind("ap-download", function () { openModal("download"); });
  bind("ap-print", function () { openModal("print"); });
  bind("ap-email-cancel", function () { if (modal) modal.style.display = "none"; });
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) modal.style.display = "none"; });

  var form = $("ap-email-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = ($("ap-email-input").value || "").trim();
      var name = ($("ap-email-name").value || "").trim();
      var msg = $("ap-email-msg");
      // Bejelölte-e, hogy árajánlatot is kér? A csapat értesítése ettől
      // függetlenül minden alaprajzról megy — ez csak azt jelzi, hogy a
      // látogató vár is visszahívást.
      var wantsQuote = !!($("ap-send-to-us") && $("ap-send-to-us").checked);
      var btn = form.querySelector('button[type="submit"]');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        msg.textContent = "Adj meg egy érvényes e-mail címet.";
        msg.className = "ap-msg ap-msg-err";
        return;
      }
      btn.disabled = true;
      msg.textContent = "Egy pillanat…";
      msg.className = "ap-msg";
      var image = renderExport(1.4);
      var kind = pendingExport || "download";

      // Egy valódi alaprajz PNG-je legalább néhány tíz kilobájt. Ha ennél
      // sokkal kisebb, akkor a vászon valamiért üresen renderelődött —
      // ilyenkor inkább szólunk, mint hogy a látogató egy üres csatolmányt
      // kapjon, és azt higgye, elment neki a rajz.
      if (!image || image.length < 5000) {
        btn.disabled = false;
        msg.textContent = "A rajz nem renderelődött. Frissítsd az oldalt, és próbáld újra.";
        msg.className = "ap-msg ap-msg-err";
        return;
      }

      try { localStorage.setItem("gh_ap_mail", "1"); } catch (er) {}

      // 2) Alaprajz e-mailben — best effort. Ha nem megy, a látogató akkor is
      //    megkapja a rajzot: azonnal letöltjük.
      function finish(text, ok) {
        btn.disabled = false;
        msg.textContent = text;
        msg.className = "ap-msg " + (ok ? "ap-msg-ok" : "");
        setTimeout(function () {
          if (modal) modal.style.display = "none";
          doExport(kind);
        }, 800);
      }

      var done = false;
      function once(text, ok) { if (!done) { done = true; finish(text, ok); } }
      // Ha az e-mail szolgáltató lassú, ne várakoztassuk a látogatót.
      setTimeout(function () { once("Köszönjük! Az alaprajzot most letöltjük.", true); }, 6000);

      fetch("/.netlify/functions/send-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email, name: name, image: image,
          rooms: summaryText(), sendToUs: wantsQuote,
        }),
      })
        .then(function (r) { return r.ok; })
        .then(function (ok) {
          once(
            ok
              ? "Elküldtük e-mailben! Az alaprajz most letöltődik."
              : "Köszönjük! Az alaprajzot most letöltjük.",
            true
          );
        })
        .catch(function () {
          once("Köszönjük! Az alaprajzot most letöltjük.", true);
        });
    });
  }
  function summaryText() {
    var rooms = state.objects.filter(function (o) { return o.type === "room"; });
    var fmt = function (r) { return (r.label || "Szoba") + " " + r2(r.w) + "×" + r2(r.h) + " m (" + areaOf(r) + " m²)"; };
    var heated = rooms.filter(function (r) { return !isUnheated(r); }).map(fmt);
    var open = rooms.filter(isUnheated).map(fmt);
    return heated.join("; ") + (open.length ? " · fűtetlen: " + open.join("; ") : "");
  }

  /* --- ikonok ----------------------------------------------------- */
  function icon(n) {
    var p = {
      rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
      copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
      trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
      flip: '<path d="M12 3v18M8 7 4 12l4 5M16 7l4 5-4 5"/>',
      swap: '<path d="M7 8h13l-3-3M17 16H4l3 3"/>',
    }[n] || "";
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
  }

  /* ---------------------------------------------------------------
     INDÍTÁS
     --------------------------------------------------------------- */
  var hadSaved = load();
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  resize();
  if (hadSaved) fitView();
  else { view.ox = canvas.clientWidth / 2; view.oy = canvas.clientHeight / 2; }
  updateEmpty();
  summary();
  syncUndoUI();
  setToolUI("select");
  draw();

  // Ikonok kirajzolása a bútorkönyvtárban
  document.querySelectorAll(".ap-furn-ic").forEach(function (svg) {
    var shape = svg.dataset.shape;
    svg.innerHTML = libIcon(shape);
  });

  function libIcon(s) {
    var g = {
      // Franciaágy: kettő párna + fejvég-vonal
      bed: '<path d="M1,2 h38 v26 h-38 z M1,9 h38 M3,9 a5,5 0 0,0 10,0 M27,9 a5,5 0 0,0 10,0"/>',
      // 3-üléses kanapé: karfák + üléspárna-osztóvonalak
      sofa: '<path d="M2,2 h36 v20 h-36 z M2,8 h36 M2,8 v14 M38,8 v14 M5,22 v6 h30 v-6 M14.6,8 v14 M25.3,8 v14"/>',
      // Sarokkanapé: L-alak, két szárny
      lsofa: '<path d="M2,2 h36 v12 h-14 v14 h-22 z M2,8 h36 M2,8 v20 M22,14 v14 M38,8 v6"/>',
      armchair: '<path d="M9,7 h22 v16 h-22 z M13,11 h14 v11 h-14 z M9,7 v16 M31,7 v16"/>',
      table: '<path d="M5,8 h30 v14 h-30 z M9,11 h22 M9,15 h22 M9,19 h22"/>',
      roundtable: '<circle cx="20" cy="15" r="8"/><circle cx="20" cy="15" r="4"/>',
      chair: '<path d="M12,9 h16 v13 h-16 z M13,7 h14 M12,7 v2 M28,7 v2"/>',
      cabinet: '<path d="M6,8 h28 v14 h-28 z M20,8 v14 M11,15 v2 M29,15 v2"/>',
      wardrobe: '<path d="M6,6 h28 v18 h-28 z M20,6 v18 M11,15 v2 M29,15 v2"/>',
      counter: '<path d="M4,9 h32 v12 h-32 z M4,18 h32 M9,9 v2 M16,9 v2 M23,9 v2 M30,9 v2"/>',
      // Tűzhely: 4 főzőzóna
      stove: '<path d="M8,6 h24 v18 h-24 z"/><circle cx="15" cy="12" r="2.4"/><circle cx="25" cy="12" r="2.4"/><circle cx="15" cy="19" r="2.4"/><circle cx="25" cy="19" r="2.4"/>',
      fridge: '<path d="M11,4 h18 v22 h-18 z M11,12 h18 M26,7 v3"/>',
      // Mosdó: téglalap + belső ovális + csap
      sink: '<path d="M3,5 h14 v20 h-14 z M5,9 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 M10,2 v4 M8,3 h4"/>',
      washer: '<path d="M9,5 h22 v20 h-22 z"/><circle cx="20" cy="15" r="6"/><circle cx="20" cy="15" r="2.6"/>',
      bath: '<path d="M4,9 h32 v12 h-32 z M7,11 h26 v8 h-26 z"/><circle cx="11" cy="15" r="1.4"/>',
      // Zuhanykabin: négyzet + átlós rácsvonalak
      shower: '<path d="M2,2 h26 v26 h-26 z M2,2 l26,26 M2,28 l26,-26 M14,2 v4 a4,4 0 0,0 0,8"/>',
      // WC: tartály + szűkülő kagyló-forma
      toilet: '<path d="M8,22 h24 v6 h-24 z M10,2 a10,12 0 1,0 20,0 l0,20 h-20 z"/>',
      bidet: '<ellipse cx="20" cy="15" rx="9" ry="7"/><circle cx="20" cy="12" r="1.4"/>',
      desk: '<path d="M4,8 h32 v12 h-32 z M25,8 v12 M27,10 h7 v6 h-7 z"/>',
      rug: '<rect x="4" y="7" width="32" height="16" rx="2" stroke-dasharray="4 3"/>',
      plant: '<circle cx="20" cy="15" r="8"/><path d="M20,15 14,9M20,15l6-6M20,15l-7,3M20,15l7,3M20,15v9"/>',
      tv: '<rect x="5" y="12" width="30" height="6" rx="1"/>',
      stairs: '<path d="M8,5 h24 v20 h-24 z M8,10 h24 M8,15 h24 M8,20 h24"/><path d="M20,22v-14M17,11l3-3 3,3" stroke="#0b6bcb"/>',
      // Csigalépcső: körvonal + spirál
      spiral: '<circle cx="20" cy="15" r="13"/><circle cx="20" cy="15" r="2"/><path d="M20,15 a4,4 0 1,1 -4,4 a7,7 0 1,1 7,-7 a10,10 0 1,1 -10,10" stroke="#0b6bcb"/>',
      car: '<path d="M5,8 h30 v14 h-30 z M11,11 h18 v7 h-18 z M5,15 h30"/>',
    }[s] || '<rect x="7" y="8" width="26" height="14"/>';
    return '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">' + g + "</g>";
  }

  /* --- onboarding (első használat) -------------------------------- */
  var ONB = [
    { t: "Kezdj egy helyiséggel", x: "Nyomd meg a ＋ Helyiség gombot, vagy válassz kész alaprajz-sablont. Utána bármikor átméretezheted." },
    { t: "Írd be a pontos méretet", x: "A helyiség mellett kék számok jelennek meg. Kattints rájuk, és írd be, hány méter — a rajz azonnal átáll." },
    { t: "Tedd bele a berendezést", x: "Húzd be a bútorokat a bal oldali listából. Az elemek maguktól a falhoz és egymáshoz igazodnak." },
    { t: "Kérd e-mailben", x: "Ha kész, az alaprajzot elküldjük e-mailben PNG-ként, és le is töltheted." },
  ];
  var onbI = 0;
  var onb = $("ap-onb");
  function showOnb() {
    var s = ONB[onbI];
    $("ap-onb-title").textContent = s.t;
    $("ap-onb-text").textContent = s.x;
    $("ap-onb-next").textContent = onbI < ONB.length - 1 ? "Tovább" : "Kezdjük";
    var dots = $("ap-onb-dots");
    dots.innerHTML = "";
    ONB.forEach(function (_, i) {
      var d = document.createElement("span");
      d.className = "ap-dot" + (i === onbI ? " ap-dot-on" : "");
      dots.appendChild(d);
    });
  }
  function closeOnb() {
    if (onb) onb.style.display = "none";
    try { localStorage.setItem("gh_ap_onb_v2", "1"); } catch (e) {}
  }
  if (onb) {
    // Az onboarding nem ugrik fel magától (a süti-sáv mellett tolakodó lenne).
    // A "Hogyan működik?" gomb és a súgó ikon nyitja.
    bind("ap-onb-open", function () { onbI = 0; onb.style.display = "flex"; showOnb(); });
    bind("ap-onb-skip", closeOnb);
    bind("ap-onb-next", function () {
      if (onbI < ONB.length - 1) { onbI++; showOnb(); }
      else { closeOnb(); openSheet("ap-tpl-sheet"); }
    });
  }
})();

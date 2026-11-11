/* 장면 만들기(입체 집으로 지은 거리·방)와 자유 걷기 */
(function () {
  'use strict';

  const DIRS = { chr_: 'characters', fac_: 'locations', bg_: 'locations', int_: 'locations', near_: 'locations',
    tile_: 'tiles', prop_: 'props', ui_: 'ui', crowd_: 'world', world_: 'world' };
  function assetUrl(id) {
    const k = Object.keys(DIRS).find(p => id.indexOf(p) === 0);
    return 'assets/web/' + (k ? DIRS[k] : 'props') + '/' + id + '.webp';
  }
  window.assetUrl = assetUrl;

  const STREET_X = 6.2;      // 길 가운데에서 건물 정면까지
  const WALK_X = 4.9;        // 걸을 수 있는 길의 반폭
  const FAC_W = { fac_wall_tile: 8.5, fac_board_wall: 8, fac_gate_house: 9.5 };
  const NIGHT_TINT = [0.42, 0.47, 0.72];
  const HOUSE = { th: 50 * Math.PI / 180, eave: 0.6 };    // 집: 지붕 기울기, 처마 내밀기
  const WALL = { th: 32 * Math.PI / 180, eave: 0.22 };     // 담장: 얇은 지붕
  const css = a => 'rgb(' + a.map(v => Math.round(v)).join(',') + ')';
  const mixc = (a, b, k) => a.map((v, i) => v * (1 - k) + b[i] * k);

  // 집 지붕은 처마 → 중간 → 용마루 세 면으로 나눠 한옥처럼 휘게 한다(f: 높이 비율, a: 땅에서 잰 기울기)
  const HOUSE_SEGS = [{ f: 0.30, a: 24 * Math.PI / 180 }, { f: 0.36, a: 38 * Math.PI / 180 }, { f: 0.34, a: 52 * Math.PI / 180 }];

  /* 지붕 옆선(깊이, 높이)의 점들로 옆벽 모양(지붕 아래 다각형)을 만든다 */
  function gablePath(x, S, G) {
    const X = d => d / G.dep * S, Y = h => S - h / G.H * S;
    const half = [[0, G.yE]].concat(G.prof.filter(p => p[0] > 0.001));           // 벽 위 → 용마루
    const top = half.concat(half.slice(0, -1).reverse().map(p => [G.dep - p[0], p[1]]));
    x.beginPath(); x.moveTo(0, S); x.lineTo(S, S);
    top.slice().reverse().forEach(p => x.lineTo(X(p[0]), Y(p[1])));
    x.closePath();
    return top.map(p => [X(p[0]), Y(p[1])]);
  }
  /* 옆벽(합각벽): 색은 정면 그림에서 읽은 색을 쓴다 */
  function sideCanvas(c, G) {
    const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const x = cv.getContext('2d');
    const X = m => m / G.dep * S, Y = h => S - h / G.H * S, V = m => m / G.H * S;
    const pl = css(c.plaster), wd = css(c.wood), ln = css(c.line), st = css(mixc(c.plaster, c.wood, 0.3));
    const yW = Y(G.hw);
    let top = gablePath(x, S, G); x.fillStyle = pl; x.fill();
    x.save(); gablePath(x, S, G); x.clip();
    x.lineWidth = 2.2; x.strokeStyle = ln; x.lineJoin = 'round';
    const box = (px, py, w, h, fill) => { x.fillStyle = fill; x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h); };
    const pw = X(0.2), bh = V(0.2), yB = Y(0.3);
    box(S / 2 - pw / 2, -4, pw, yW + 4, wd);                                    // 합각의 가운데 기둥
    [0, S / 2 - pw / 2, S - pw].forEach(px => box(px, yW, pw, yB - yW, wd));    // 기둥
    box(-4, yW, S + 8, bh, wd);                                                 // 도리
    box(-4, Y(G.hw * 0.5), S + 8, bh * 0.8, wd);                                // 중방
    box(-4, yB, S + 8, V(0.3) + 4, st);                                         // 기단
    const tb = V(0.3);                                                          // 박공널: 지붕 옆선을 따라가는 널
    x.beginPath(); top.forEach((p, i) => i ? x.lineTo(p[0], p[1] - 3) : x.moveTo(p[0], p[1] - 3));
    top.slice().reverse().forEach(p => x.lineTo(p[0], p[1] + tb));
    x.closePath(); x.fillStyle = wd; x.fill(); x.stroke();
    x.restore();
    gablePath(x, S, G); x.lineWidth = 3; x.strokeStyle = ln; x.stroke();
    return cv;
  }
  /* 담장 끝 단면: 회벽 몸통 + 기와 지붕 */
  function capCanvas(c, G) {
    const S = 256, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const x = cv.getContext('2d'), Y = h => S - h / G.H * S;
    gablePath(x, S, G); x.fillStyle = css(c.plaster); x.fill();
    x.save(); gablePath(x, S, G); x.clip();
    x.fillStyle = css(c.tile); x.fillRect(0, 0, S, Y(G.hw));
    x.fillStyle = css(mixc(c.plaster, c.wood, 0.45)); x.fillRect(0, Y(0.4), S, S);
    x.strokeStyle = css(c.line); x.lineWidth = 2.2;
    [Y(G.hw), Y(0.4)].forEach(yy => { x.beginPath(); x.moveTo(0, yy); x.lineTo(S, yy); x.stroke(); });
    x.restore();
    gablePath(x, S, G); x.lineWidth = 3.5; x.strokeStyle = css(c.line); x.stroke();
    return cv;
  }
  /* ───── 방의 옆벽·천장·뒷문: 뒷벽 그림의 색과 띠 높이에 맞춰 직접 그린다 ─────
     bands: 위에서부터 가로로 지나는 나무(도리·창방·인방)의 [시작, 끝] (높이를 1로 본 비율)
     rail: 중방, skirt: 아래 널벽이 시작하는 높이, base: 걸레받이, raf: 방 너비에 걸리는 서까래 수 */
  const ROOM_STYLE = {
    int_jimulpo_back_AUT: { plaster: [242, 223, 198], wood: [205, 116, 58], line: [117, 77, 53], bands: [[0, 0.2], [0.27, 0.31]], rail: 0.56, skirt: 0.77, base: 0.945, raf: 22 },
    int_jimulpo_back_SUM: { plaster: [250, 238, 224], wood: [180, 116, 69], line: [112, 72, 49], bands: [[0, 0.2], [0.27, 0.31]], rail: 0.56, skirt: 0.77, base: 0.945, raf: 22 },
    int_maru_back_APR: { plaster: [252, 244, 236], wood: [144, 112, 88], line: [104, 76, 58], bands: [[0, 0.085], [0.15, 0.21], [0.275, 0.31]], rail: 0.56, skirt: 0.8, base: 0.945, raf: 20 },
    int_maru_back_WIN: { plaster: [244, 241, 235], wood: [145, 121, 104], line: [99, 79, 66], bands: [[0, 0.085], [0.15, 0.21], [0.275, 0.31]], rail: 0.56, skirt: 0.8, base: 0.945, raf: 20 },
    int_room_hangyeol_night: { plaster: [249, 229, 202], wood: [203, 116, 63], line: [84, 62, 58], bands: [[0, 0.145], [0.215, 0.25]], rail: 0.58, skirt: 0, base: 0.945, raf: 17 },
    int_room_hangyeol_day: { plaster: [251, 236, 219], wood: [215, 144, 91], line: [92, 70, 62], bands: [[0, 0.145], [0.215, 0.25]], rail: 0.58, skirt: 0, base: 0.945, raf: 17 },
    int_attic: { plaster: [245, 233, 213], wood: [150, 95, 64], line: [93, 73, 67], plank: true, raf: 12 }
  };
  /* 옆벽 한 칸(기둥에서 기둥까지). 양 끝에 기둥을 반씩 그려, 이어 붙이면 기둥 하나가 된다 */
  function roomWallCanvas(st, bay) {
    const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const x = cv.getContext('2d'), pl = css(st.plaster), wd = css(st.wood), ln = css(st.line);
    const wd2 = css(mixc(st.wood, st.line, 0.2)), wd3 = css(mixc(st.wood, st.plaster, 0.16));
    const Y = f => f * S, PX = m => m / bay * S;
    x.lineWidth = 2.6; x.strokeStyle = ln; x.lineJoin = 'round';
    const box = (px, py, w, h, fill) => { x.fillStyle = fill; x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h); };
    if (st.plank) {                                   // 다락: 세로 널벽
      const n = Math.max(4, Math.round(bay / 0.3));
      for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? wd : wd3; x.fillRect(i * S / n, 0, S / n + 1, S); }
      for (let i = 0; i < n; i++) { x.beginPath(); x.moveTo(i * S / n, 0); x.lineTo(i * S / n, S); x.stroke(); }
      box(-8, -8, S + 16, Y(0.07) + 8, wd2); box(-8, Y(0.5), S + 16, Y(0.045), wd2); box(-8, Y(0.93), S + 16, S, wd2);
      return cv;
    }
    x.fillStyle = pl; x.fillRect(0, 0, S, S);
    const pw = PX(0.24), top = st.bands[st.bands.length - 1][1];
    if (st.skirt) {                                   // 아래 널벽(머름): 문짝 아래 널과 높이를 맞춘다
      box(-8, Y(st.skirt), S + 16, Y(st.base - st.skirt), wd);
      const n = 3, g = PX(0.07), w = (S - pw) / n, y0 = Y(st.skirt) + g, hh = Y(st.base - st.skirt) - g * 2;
      for (let i = 0; i < n; i++) box(pw / 2 + i * w + g / 2, y0, w - g, hh, wd3);
    }
    if (st.rail) box(-8, Y(st.rail), S + 16, Y(0.03), wd);                    // 중방
    box(-pw / 2, Y(top) - 2, pw, S, wd); box(S - pw / 2, Y(top) - 2, pw, S, wd);   // 기둥
    st.bands.forEach(b => box(-8, Y(b[0]) - (b[0] ? 0 : 8), S + 16, Y(b[1] - b[0]) + (b[0] ? 0 : 8), wd));
    box(-8, Y(st.base), S + 16, S, wd2);                                      // 걸레받이
    return cv;
  }
  /* 천장 한 칸: 서까래 한 줄과 그 사이의 흙벽(다락은 널). 방 너비 쪽으로 되풀이한다 */
  function roomCeilCanvas(st) {
    const S = 256, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const x = cv.getContext('2d');
    x.fillStyle = css(st.plank ? mixc(st.wood, st.line, 0.5) : mixc(st.plaster, st.line, 0.2)); x.fillRect(0, 0, S, S);
    x.strokeStyle = css(mixc(st.line, st.plaster, 0.35)); x.lineWidth = 3;
    [0.25, 0.75].forEach(f => { x.beginPath(); x.moveTo(0, S * f); x.lineTo(S, S * f); x.stroke(); });     // 서까래 사이 이음 줄
    x.fillStyle = css(mixc(st.wood, st.line, st.plank ? 0.3 : 0.14)); x.fillRect(S * 0.3, 0, S * 0.4, S);
    x.strokeStyle = css(st.line); x.lineWidth = 7;
    [0.3, 0.7].forEach(f => { x.beginPath(); x.moveTo(S * f, 0); x.lineTo(S * f, S); x.stroke(); });
    return cv;
  }
  /* 방 뒤쪽(들어온 쪽)의 띠살문 두 짝 */
  function roomDoorCanvas(st) {
    const W = 448, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), wd = css(st.wood), ln = css(st.line), paper = css(mixc(st.plaster, [255, 255, 255], 0.35));
    x.fillStyle = wd; x.fillRect(0, 0, W, H); x.strokeStyle = ln; x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3);
    const lw = (W - 54) / 2;
    [18, 36 + lw].forEach(lx => {
      x.lineWidth = 3; x.fillStyle = css(mixc(st.wood, st.plaster, 0.1)); x.fillRect(lx, 18, lw, H - 36); x.strokeRect(lx, 18, lw, H - 36);
      const px = lx + 12, py = 30, pw = lw - 24, ph = (H - 60) * 0.72;
      x.fillStyle = paper; x.fillRect(px, py, pw, ph); x.strokeRect(px, py, pw, ph);
      x.lineWidth = 1.6;
      for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(px + pw * i / 8, py); x.lineTo(px + pw * i / 8, py + ph); x.stroke(); }
      [0.08, 0.12, 0.16, 0.46, 0.5, 0.54, 0.84, 0.88, 0.92].forEach(f => { x.beginPath(); x.moveTo(px, py + ph * f); x.lineTo(px + pw, py + ph * f); x.stroke(); });
      x.lineWidth = 3; x.fillStyle = css(mixc(st.wood, st.plaster, 0.18)); x.fillRect(px, py + ph + 12, pw, H - 60 - ph - 12); x.strokeRect(px, py + ph + 12, pw, H - 60 - ph - 12);
    });
    x.fillStyle = css(mixc(st.line, [0, 0, 0], 0.2));
    [W / 2 - 16, W / 2 + 16].forEach(cx => { x.beginPath(); x.arc(cx, H * 0.56, 6, 0, Math.PI * 2); x.fill(); });   // 문고리
    return cv;
  }
  /* 길에서 만나는 이름 없는 사람들: 전신 그림(world_npc_*)이 있으면 그것을 쓰고,
     없으면 「지나가는 사람들」 그림에서 한 사람(또는 두 사람)을 오려 그림자 모습으로 세운다. [왼쪽, 오른쪽] */
  const SIL = { man: [0, 0.054], woman: [0.071, 0.121], pair: [0.172, 0.252], man2: [0.303, 0.354], basket: [0.399, 0.451],
    man3: [0.496, 0.549], women: [0.613, 0.705], man4: [0.759, 0.81], woman2: [0.858, 0.911] };
  /* 뒷벽 */
  function backCanvas(c) {
    const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.fillStyle = css(c.plaster); x.fillRect(0, 0, W, H);
    x.lineWidth = 2.2; x.strokeStyle = css(c.line);
    const box = (px, py, w, h, fill) => { x.fillStyle = fill; x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h); };
    for (let i = 0; i <= 4; i++) box(Math.min(W - 15, i * (W - 14) / 4), 0, 14, H * 0.88, css(c.wood));
    box(-4, 0, W + 8, 13, css(c.wood)); box(-4, H * 0.45, W + 8, 11, css(c.wood));
    box(-4, H * 0.88, W + 8, H * 0.12 + 4, css(mixc(c.plaster, c.wood, 0.3)));
    return cv;
  }
  /* 장롱 앞면: 서랍 세 칸 + 여닫이문 두 짝 + 놋쇠 장식 */
  function chestCanvas() {
    const S = 256, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const x = cv.getContext('2d'), ln = '#38241a', brass = '#d8b25a';
    x.fillStyle = '#8c5b3e'; x.fillRect(0, 0, S, S);
    x.strokeStyle = ln; x.lineWidth = 2.2; x.lineJoin = 'round';
    const box = (px, py, w, h, fill) => { x.fillStyle = fill; x.fillRect(px, py, w, h); x.strokeRect(px, py, w, h); };
    for (let i = 0; i < 3; i++) { box(8 + i * 81, 8, 77, 34, '#9a6746'); x.fillStyle = brass; x.beginPath(); x.arc(46 + i * 81, 25, 5, 0, 7); x.fill(); x.stroke(); }
    [0, 1].forEach(i => { box(8 + i * 122, 50, 118, 178, '#9a6746'); box(22 + i * 122, 66, 90, 146, '#a67250'); });
    [0, 1].forEach(i => [70, 190].forEach(py => box(i ? S - 20 : 8, py, 12, 22, brass)));
    x.fillStyle = brass; x.beginPath(); x.arc(S / 2, 139, 20, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(S / 2, 119); x.lineTo(S / 2, 159); x.stroke();
    box(0, 236, S, 20, '#6e4630'); x.fillStyle = '#38241a'; x.fillRect(40, 244, S - 80, 12);
    x.lineWidth = 4; x.strokeRect(0, 0, S, S);
    return cv;
  }
  /* 평상 윗면 */
  function benchCanvas() {
    const W = 128, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.fillStyle = '#cf9360'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#5a3b28'; x.lineWidth = 2;
    for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(0, i * H / 7); x.lineTo(W, i * H / 7); x.stroke(); }
    x.lineWidth = 5; x.strokeRect(0, 0, W, H);
    return cv;
  }

  class World {
    constructor(g, hooks) {
      this.g = g; this.hooks = hooks || {};
      this.scene = null; this.nodes = []; this.d = 0; this.x = 0; this.yaw = 0;
      this.phase = 0; this.locked = true; this.time = 0; this.items = [];
    }

    async load(def, opt) {
      opt = opt || {};
      const g = this.g, need = [];
      const S = def.season ? '_' + def.season : '';
      const facId = n => (n.indexOf('fac_') === 0 ? n + S : n);
      const want = (id, o) => { need.push([id, o || {}]); return id; };
      this.scene = def; this.memory = !!opt.memory;
      g.clearQuads();
      const quads = [];
      const isRoom = def.type === 'room';
      const L = def.length || 30;
      this.facPos = {}; this.solids = []; this._benches = [];

      if (!isRoom) {
        const sky = want(def.sky || 'bg_far_day_MAR', { max: 2048, repeat: 'mirror' });
        const ground = want(def.ground || 'tile_ground_dirt_MAR', { max: 1024, repeat: 'repeat' });
        // 하늘: 빙 둘러싼 8장(360도)
        const R = 190, span = Math.PI / 4, pw = 2 * R * Math.tan(span / 2), hh = pw;
        for (let i = 0; i < 8; i++) {
          const a = i * span;
          quads.push({ tex: sky, x: -Math.sin(a) * R, y: -hh * 0.2, z: -Math.cos(a) * R, w: pw + 0.6, h: hh, ry: a, uv: [0.5, 1, i * 0.5, 0], layer: -3, fog: 0, follow: true, sky: true });
        }
        const GW = 90, GD = L + 190;
        quads.push({ tex: ground, flat: true, x: 0, y: 0, z: -(GD / 2 - 45), w: GW, h: GD, uv: [GW / 4, GD / 4, 0, 0], layer: -2, cut: 0 });
        const lay = (arr, side) => {
          let cur = -22;
          const list = (arr || []).slice();
          list.unshift('fac_wall_tile'); list.unshift('fac_shop_b_closed');
          while (true) {
            const total = list.reduce((s, it) => s + ((it.w) || FAC_W[it.img || it] || 9.5) + 1.3, -22);
            if (total > L + (def.end ? 4 : 46)) break;
            list.push(['fac_shop_b_closed', 'fac_wall_tile', 'fac_gate_house', 'fac_shop_a_closed'][list.length % 4]);
          }
          list.forEach((it, i) => {
            const name = it.img || it, w = it.w || FAC_W[name] || 9.5;
            const thin = /wall_tile|board_wall/.test(name);
            const id = want(facId(name), { trim: true, max: 1024, roof: true });
            const d = cur + w / 2; cur += w + (thin ? 0.25 : 1.3);
            this.facPos[side + (i - 2)] = d;       // L0, L1 … (맨 앞 두 채는 채움)
            if (it.id) this.facPos[it.id] = d;
            quads.push({ tex: id, x: side === 'L' ? -STREET_X : STREET_X, y: 0, z: -d, w: w, ry: side === 'L' ? Math.PI / 2 : -Math.PI / 2, _fit: true, _fac: true, _body: !thin, _panel: /gate_house/.test(name) });
          });
        };
        lay(def.left, 'L'); lay(def.right, 'R');
        if (def.end) {
          const id = want(facId(def.end.img), { trim: true, max: 1280, roof: true });
          const w = def.end.w || 11, d = L + (def.end.back || 7);
          quads.push({ tex: id, x: 0, y: 0, z: -d, w: w, ry: 0, _fit: true, _fac: true, _body: true, _panel: /gate_house/.test(def.end.img) });
          const wl = want(facId('fac_wall_tile'), { trim: true, max: 1024, roof: true });
          [-1, 1].forEach(s => quads.push({ tex: wl, x: s * (w / 2 + 4.3), y: 0, z: -d - 0.2, w: 8.5, ry: 0, _fit: true, _fac: true }));
          this.facPos.END = d;
        }
        // 뒤쪽을 막는 담장
        const wb = want(facId('fac_wall_tile'), { trim: true, max: 1024, roof: true });
        [-1, 0, 1].forEach(s => quads.push({ tex: wb, x: s * 8.5, y: 0, z: 9.5, w: 8.5, ry: Math.PI, _fit: true, _fac: true }));
        this.bounds = { x0: -WALK_X, x1: WALK_X, d0: -8.5, d1: def.end ? L + 4.6 : L + 3 };
      } else {
        const r = def.room || {};
        const W = r.width || 9, D = L + (r.back || 3.2);
        const wall = want(r.wall, { max: 2048 });
        const floor = want(r.floor || 'tile_floor_maru', { max: 1024, repeat: 'repeat' });
        quads.push({ tex: floor, flat: true, x: 0, y: 0, z: -(D / 2 - 3), w: W, h: D + 6, uv: [W / 2.4, (D + 6) / 2.4, 0, 0], layer: -2, fog: 0, cut: 0 });
        quads.push({ tex: wall, x: 0, y: 0, z: -D, w: W, _fitRoom: true, fog: 0, layer: -1, cut: 0 });
        this._roomW = W; this._roomD = D;
        this._roomColors = [r.wallColor || [0.972, 0.953, 0.914], r.beamColor || [0.52, 0.38, 0.28], r.ceilColor || [0.36, 0.26, 0.19]];
        this.bounds = { x0: -W / 2 + 0.7, x1: W / 2 - 0.7, d0: -2.3, d1: D - 1.5 };
      }

      (def.sprites || []).forEach(s => {
        if (/bench/.test(s.img)) { this._benches.push(s); return; }     // 평상은 그림 대신 입체로 만든다
        const id = want(s.img, { trim: true, max: s.max || 768 });
        quads.push({ tex: id, x: s.x || 0, y: s.y || 0, z: -(s.d), _h: s.h, w: s.w, ry: s.ry || 0, _fit: true, bb: true, _solid: true });
      });
      (def.crowds || []).forEach(c => {
        const id = want(c.img, { trim: true, max: 2048 });
        if (c.side === 'far') quads.push({ tex: id, x: c.x || 0, y: 0, z: -c.d, w: c.w || 13, _fit: true });
        else quads.push({ tex: id, x: c.side === 'L' ? -(c.x || 5.2) : (c.x || 5.2), y: 0, z: -c.d, w: c.w || 14, ry: c.side === 'L' ? Math.PI / 2 : -Math.PI / 2, _fit: true });
      });

      // 행위 지점
      const done = opt.done || {};
      this.nodes = (def.nodes || []).map(n => {
        const o = Object.assign({}, n);
        if (o.at != null && this.facPos[o.at] != null) o.d = this.facPos[o.at] + (o.dOff || 0);
        const fac = o.at != null && o.at !== 'END';
        o.x = o.x != null ? o.x : (o.side === 'L' ? -(fac ? 4.6 : 2.6) : o.side === 'R' ? (fac ? 4.6 : 2.6) : 0);
        if (o.at === 'END') o.d -= 2.2;
        if (isRoom && o.x) o.x = Math.max(-this._roomW / 2 + 1, Math.min(this._roomW / 2 - 1, o.x));
        if (isRoom && o.furn === 'chest') { o._sgn = o.side === 'L' ? -1 : 1; o._chestX = o._sgn * (this._roomW / 2 - 0.32); o.x = o._sgn * (this._roomW / 2 - 1.25); o.markY = 1.05; }
        o.r = o.r || (o.at === 'END' ? 3.6 : fac ? 3.2 : isRoom ? 2.7 : 2.6);     // 이 거리 안에 들어오면 할 수 있다
        o.done = !!done[o.id];
        if (opt.only && o.id !== opt.only) o.skip = true;
        if (opt.only && o.id === opt.only) { o.required = true; o.done = false; }
        if (o.prop) { o._tex = want(o.prop, { trim: true, max: 512 }); }
        return o;
      }).filter(n => !n.skip);

      if (isRoom && this.nodes.length) { const far = Math.max.apply(null, this.nodes.map(n => n.d)); this.bounds.d1 = Math.min(this.bounds.d1, far + 1.3); }
      // 만날 사람을 장면에 세운다(그림 아랫부분은 흐리게 사라지게)
      for (const n of this.nodes) {
        if (n.who && this.hooks.portrait) {
          const full = this.hooks.worldSprite ? this.hooks.worldSprite(n.who) : null;
          if (full && await World.exists(full)) { n._who = want(full, { trim: true, max: 1024 }); n._full = true; }
          else { const pid = this.hooks.portrait(n.who, n.whoFace || 'neutral'); if (pid) n._who = want(pid, { trim: true, max: 768, fade: true }); }
        }
        if (!n._who && n.sil && SIL[n.sil]) n._sil = want('crowd_passersby', { trim: true, max: 2048 });
      }
      const keep = new Set(need.map(n => n[0])); Object.keys(g.tex).forEach(k => { if (k.charAt(0) === '_') keep.add(k); });
      g.freeAll(keep);
      await Promise.all(need.map(n => g.load(n[0], assetUrl(n[0]), n[1])));

      quads.forEach(q => {
        const t = g.tex[q.tex];
        if (q._fit && t) { if (q._h && !q.w) { q.h = q._h; q.w = q._h * t.w / t.h; } else { q.h = q.w * t.h / t.w; } }
        if (q._fitRoom && t) q.h = q.w * t.h / t.w;
        if (q._solid) this.solids.push({ x: q.x, z: q.z, r: Math.min(1.1, q.w * 0.38) });
        if (q._fac && t && q._panel) { if (t.gate && t.band) this.gate(q, t); else this.panel(q, t); }
        else if (q._fac && t && (t.split || (!q._body && t.band))) this.building(q, t);
        else g.add(q);
      });

      if (isRoom) {
        const W = this._roomW, D = this._roomD, H = W * g.tex[def.room.wall].h / g.tex[def.room.wall].w;
        const [wc, bc, cc] = this._roomColors;
        const st = ROOM_STYLE[def.room.wall], Ld = D + 6, zc = -(D / 2 - 3);     // 옆벽은 z = 6 … -D
        if (st) {
          // 옆벽·천장·뒷문을 뒷벽 그림과 같은 색으로 그려 붙인다. 칸 수를 정수로 맞춰 뒷벽 모서리에 기둥이 오게 한다
          const key = def.room.wall, nb = Math.max(2, Math.round(Ld / 2.5)), nf = Math.max(2, Math.round(W / 2.5));
          g.addCanvas('_rw_' + key, roomWallCanvas(st, Ld / nb), { max: 512, repeat: 'repeat' });
          g.addCanvas('_rc_' + key, roomCeilCanvas(st), { max: 256, repeat: 'repeat' });
          g.addCanvas('_rd_' + key, roomDoorCanvas(st), { max: 512 });
          [-1, 1].forEach(s => g.add({ tex: '_rw_' + key, x: s * W / 2, y: 0, z: zc, w: Ld, h: H, ry: s < 0 ? Math.PI / 2 : -Math.PI / 2, uv: [nb, 1, 0, 0], fog: 0, cut: 0 }));
          g.add({ tex: '_rc_' + key, flat: true, x: 0, y: H, z: zc, w: W, h: Ld, uv: [st.raf, Ld / 2.2, 0, 0], fog: 0, cut: 0, tint: [0.86, 0.84, 0.82] });
          g.add({ tex: '_rw_' + key, x: 0, y: 0, z: 3.0, w: W, h: H, ry: Math.PI, uv: [nf, 1, 0, 0], fog: 0, cut: 0 });
          if (!st.plank) g.add({ tex: '_rd_' + key, x: 0, y: 0, z: 2.96, w: 2.0, h: H * 0.62, ry: Math.PI, fog: 0, cut: 0 });   // 들어온 문
        } else {
          [-1, 1].forEach(s => {
            const ry = s < 0 ? Math.PI / 2 : -Math.PI / 2;
            g.add({ color: wc, x: s * W / 2, y: 0, z: zc, w: Ld, h: H, ry: ry, fog: 0 });
            g.add({ color: bc, x: s * (W / 2 - 0.02), y: 0, z: zc, w: Ld, h: 0.5, ry: ry, fog: 0 });
            g.add({ color: bc, x: s * (W / 2 - 0.02), y: H - 0.45, z: zc, w: Ld, h: 0.45, ry: ry, fog: 0 });
          });
          g.add({ color: cc, flat: true, x: 0, y: H, z: zc, w: W, h: Ld, fog: 0 });
          g.add({ color: wc, x: 0, y: 0, z: 3.0, w: W, h: H, fog: 0 });
          g.add({ color: bc, x: 0, y: 0, z: 2.98, w: W, h: 0.5, fog: 0 });
          g.add({ color: bc, x: 0, y: 0, z: 2.97, w: 1.5, h: 2.1, fog: 0 });      // 뒤쪽 문
        }
        g.fog.amt = 0; g.clear = (st ? mixc(st.plaster, st.line, 0.3).map(v => v / 255 * 0.8) : cc).slice();
        g.tint = def.night ? [0.8, 0.8, 0.92] : [1, 1, 1];
      } else {
        const sk = g.tex[def.sky || 'bg_far_day_MAR'];
        g.clear = sk.top.slice();
        g.fog.color = [0, 1, 2].map(i => sk.mid[i] * 0.45 + sk.bottom[i] * 0.2 + 0.35 * 0.93); g.fog.near = def.fogNear || 34; g.fog.far = def.fogFar || 120; g.fog.amt = def.fogAmt == null ? 0.92 : def.fogAmt;
        g.tint = def.night ? NIGHT_TINT.slice() : [1, 1, 1];
        if (def.night) { g.quads.forEach(q => { if (q.sky) q.tint = [1 / NIGHT_TINT[0], 1 / NIGHT_TINT[1], 1 / NIGHT_TINT[2]]; }); g.fog.color = [sk.mid[0] * 0.9, sk.mid[1] * 0.9, sk.mid[2] * 0.9]; }
      }

      this._benches.forEach(b => this.bench(b.x, b.d));
      // 만날 사람
      this.nodes.forEach(n => {
        if (!n._who) return;
        const t = g.tex[n._who], kid = /bomi/.test(n._who), seated = /sick/.test(n._who);
        const top = n._full ? (seated ? 1.0 : kid ? 1.3 : 1.62) : (kid ? 1.25 : 1.6), h = n._full ? top : (kid ? 1.0 : 1.3);
        const px = n.whoX != null ? n.whoX : n.x + (n.x >= 0 ? 0.9 : -0.9), pd = n.d + (n.whoD != null ? n.whoD : 0.8);
        g.add({ tex: n._who, x: Math.max(this.bounds.x0 - 0.3, Math.min(this.bounds.x1 + 0.3, px)), y: top - h, z: -pd, h: h, w: h * t.w / t.h, bb: true, cut: n._full ? 0.4 : 0.03, fog: 0.4 });
        if (n.markY == null && !n.prop) n.markY = top + 0.25;
      });
      // 이름 없는 사람들(그림자 모습)과 바닥에 떨어진 천 조각
      this.nodes.forEach(n => {
        if (n._sil) {
          const t = g.tex[n._sil], r = SIL[n.sil], top = 1.58, w = (r[1] - r[0]) * t.w / t.h * top;
          const px = n.whoX != null ? n.whoX : n.x + (n.x >= 0 ? 0.9 : -0.9), pd = n.d + (n.whoD != null ? n.whoD : 0.8);
          const o = { tex: n._sil, x: Math.max(this.bounds.x0 - 0.3, Math.min(this.bounds.x1 + 0.3, px)), y: 0, z: -pd, h: top, w: w, uv: [r[1] - r[0], 1, r[0], 0], bb: true, cut: 0.4, fog: 0.4 };
          if (n.silTint) o.tint = n.silTint;
          g.add(o);
          if (n.markY == null && !n.prop) n.markY = top + 0.25;
        }
        if (n.strip) { const sq = g.add({ color: n.strip, flat: true, x: n.x, y: 0.02, z: -n.d, w: 0.8, h: 0.12 }); sq.hidden = !!n.done; n._q = sq; this.items.push(n); n.markY = 0.5; }
      });
      // 줍는 물건
      this.items = [];
      this.nodes.forEach(n => { if (n.furn === 'chest') this.chest(n._chestX, n.d, n._sgn); });
      this.nodes.forEach(n => {
        if (!n._tex) return;
        const t = g.tex[n._tex], asp = t.w / t.h;
        let q;
        if (n.on === 'desk') { this.desk(n.x, n.d); n.propY = 0.36; if (!n.propH) n.propH = /brush/.test(n.prop) ? 0.3 : 0.34; }
        if (n.mount) {            // 담장·벽에 걸린 물건
          const sgn = n.side === 'L' ? -1 : 1, h = n.propH || 0.9;
          q = g.add({ tex: n._tex, x: sgn * (STREET_X - 0.12), y: n.propY != null ? n.propY : 1.2, z: -n.d, h: h, w: h * asp, ry: sgn < 0 ? Math.PI / 2 : -Math.PI / 2 });
          n.x = sgn * (STREET_X - 0.5); n.markY = (n.propY != null ? n.propY : 1.2) + h / 2;
        } else if (n.lay != null ? n.lay : /newspaper|note|letter|leaflet|underground|magazine|inkstone/.test(n.prop)) {   // 종이류와 벼루처럼 위에서 내려다본 그림은 눕혀 둔다
          const dpt = n.propH || 0.5;
          q = g.add({ tex: n._tex, flat: true, x: n.x, y: n.propY != null ? n.propY : 0.05, z: -n.d, h: dpt, w: dpt * asp, fog: 0.3 });
          n.markY = (n.propY != null ? n.propY : 0.05) + 0.5;
        } else {                  // 그 밖의 물건은 바닥에 세워 둔다
          const h = n.propH || 0.55;
          q = g.add({ tex: n._tex, x: n.x, y: n.propY != null ? n.propY : 0, z: -n.d, h: h, w: h * asp, fog: 0.3, bb: true });
          n.markY = (n.propY != null ? n.propY : 0) + h + 0.3;
        }
        q.hidden = n.done && !n.keepProp; n._q = q; this.items.push(n);
      });

      this.speed = isRoom ? 2.2 : 3.2;
      this.length = L; this.isRoom = isRoom;
      this.baseY = def.eye || 1.42;
      this.place(opt.startD != null ? opt.startD : (def.startD || 0), 0, 0);
      g.cam.pitch = isRoom ? -0.02 : 0.0;
      this.locked = false; this.focusNode = null; this.atNode = null; this.nearNode = null;
      g.render();
    }

    /* 정면 그림을 벽과 지붕으로 잘라 단순한 입체에 입힌다.
       · 지붕: 집은 세 면(처마·중간·용마루)으로 나눠 휘게, 담장은 한 면. 앞뒤 대칭.
       · 벽: 지붕 밑면에 닿는 높이까지 올려 벽과 지붕 사이에 틈이 없게 한다.
       · 옆벽·뒷벽: 그림에서 읽은 색으로 새로 그려 지붕 옆선에 딱 맞춘다. */
    building(q, t) {
      const thin = !q._body;
      this.block(q, t, { thin: thin, sp0: t.top0 || 0, sp: thin ? (t.band || t.split) : t.split, u0: 0, u1: 1, bL: t.wallL, bR: t.wallR });
    }
    /* 대문채: 가운데 높은 몸채는 집처럼, 양옆의 낮은 담은 담장처럼 따로 세운다 */
    gate(q, t) {
      const G = t.gate;
      const dep = this.block(q, t, { thin: false, u0: G.rL, u1: G.rR, sp0: t.top0 || 0, sp: t.band, bL: G.cL, bR: G.cR, mirror: true, low: G.wTop, lowL: G.cL, lowR: G.cR });
      const off = Math.max(0, (dep - 0.8) / 2);        // 담은 몸채 두께의 가운데에 붙인다
      this.block(q, t, { thin: true, u0: 0, u1: G.cL, sp0: G.wTop, sp: G.wBand, bL: G.wL, bR: G.cL, caps: [true, false], off: off, noDeco: true });
      this.block(q, t, { thin: true, u0: G.cR, u1: 1, sp0: G.wTop, sp: G.wBand, bL: G.cR, bR: G.wR, caps: [false, true], off: off, noDeco: true });
    }
    /* P: thin(담장), u0·u1(그림에서 쓸 세로 띠), sp0·sp(지붕이 시작하는 줄·끝나는 줄), bL·bR(몸통의 좌우 끝),
          off(뒤로 물리기), caps(담장 끝 단면을 둘 곳), mirror(뒷면도 같은 그림), low·lowL·lowR(이 줄 아래로는 좁은 몸통만) */
    block(q, t, P) {
      const g = this.g, thin = P.thin, sp0 = P.sp0, sp = P.sp, off = P.off || 0;
      const H = q.h, hr = H * (sp - sp0), hw = H * (1 - sp), HT = hw + hr;      // HT: 용마루 높이
      const EV = thin ? 0.28 : HOUSE.eave;                                      // 처마 내밀기
      const segs = thin ? [{ f: 1, a: Math.atan(hr / (0.4 + EV)) }] : HOUSE_SEGS;
      // 지붕 옆선: [벽에서 뒤로 들어간 깊이, 높이]. 처마 끝에서 시작해 용마루까지
      const prof = [[-EV, hw]];
      segs.forEach(s => { const a = prof[prof.length - 1], rise = s.f * hr; prof.push([a[0] + rise / Math.tan(s.a), a[1] + rise]); });
      const dep = prof[prof.length - 1][0] * 2;
      let yE = hw;                                                              // 벽 바로 위에서의 지붕 높이
      for (let i = 0; i < segs.length; i++) if (prof[i][0] <= 0 && prof[i + 1][0] >= 0) { yE = prof[i][1] - prof[i][0] * Math.tan(segs[i].a); break; }
      const nx = Math.sin(q.ry), nz = Math.cos(q.ry), tx = Math.cos(q.ry), tz = -Math.sin(q.ry);   // 앞쪽 방향, 옆 방향
      const c = t.col, rgb = (a, m) => a.map(v => Math.min(1, v / 255 * m)), under = rgb(c.wood, 0.7);
      const at = (u, dpt) => ({ x: q.x + tx * u - nx * (dpt + off), z: q.z + tz * u - nz * (dpt + off) });   // 옆으로 u, 뒤로 dpt
      const U = f => (f - 0.5) * q.w, uw = P.u1 - P.u0, uC = U((P.u0 + P.u1) / 2), W = uw * q.w;
      const bL = U(P.bL), bR = U(P.bR);                                                            // 몸통의 좌우 끝
      const spx = sp - (yE - hw) / H;                                                              // 벽을 지붕 밑면까지 올린다
      // 벽 조각 [왼쪽, 오른쪽, 윗줄, 아랫줄] — 그림의 그 부분을 그대로 세운다
      const parts = P.low ? [[P.u0, P.u1, spx, P.low], [P.lowL, P.lowR, P.low, 1]] : [[P.u0, P.u1, spx, 1]];
      const wall = (dpt, back) => parts.forEach(w => { const s = at(U((w[0] + w[1]) / 2), dpt);
        const flip = back && P.caps;
        g.add({ tex: q.tex, x: s.x, y: H * (1 - w[3]), z: s.z, w: (w[1] - w[0]) * q.w, h: H * (w[3] - w[2]), ry: q.ry + (back ? Math.PI : 0), uv: flip ? [w[0] - w[1], w[3] - w[2], w[1], w[2]] : [w[1] - w[0], w[3] - w[2], w[0], w[2]] }); });
      wall(0, false);
      let v = sp, p;
      segs.forEach((s, i) => {
        const rise = s.f * hr, len = rise / Math.sin(s.a), vh = s.f * (sp - sp0), uv = [uw, vh, P.u0, v - vh], rx = -(Math.PI / 2 - s.a);
        p = at(uC, prof[i][0]);
        g.add({ tex: q.tex, x: p.x, y: prof[i][1], z: p.z, w: W, h: len + 0.01, ry: q.ry, rx: rx, uv: uv, back: under });
        p = at(uC, dep - prof[i][0]);
        g.add({ tex: q.tex, x: p.x, y: prof[i][1], z: p.z, w: W, h: len + 0.01, ry: q.ry + Math.PI, rx: rx, uv: [-uw, vh, P.u0 + uw, v - vh], back: under });
        v -= vh;
      });
      // 지붕 위로 올라온 나뭇가지 같은 장식은 용마루 뒤에 세운다
      if (sp0 > 0 && !P.noDeco) { p = at(uC, dep / 2); g.add({ tex: q.tex, x: p.x, y: HT - 0.06, z: p.z, w: W, h: H * sp0, ry: q.ry, uv: [uw, sp0, P.u0, 0] }); }
      const G = { dep: dep, H: HT, hw: hw, yE: yE, prof: prof };
      if (thin || P.mirror) wall(dep, true);
      if (thin) {
        const cid = '_cp_' + q.tex + (P.caps ? '_g' : '');
        g.addCanvas(cid, capCanvas(c, G), { max: 256 });
        [bL, bR].forEach((u, i) => { if (P.caps && !P.caps[i]) return; const s = at(u, dep / 2); g.add({ tex: cid, x: s.x, y: 0, z: s.z, w: dep, h: HT, ry: q.ry + Math.PI / 2 }); });
        return dep;
      }
      const key = q.tex + '_' + Math.round(q.w * 10);
      g.addCanvas('_sd_' + key, sideCanvas(c, G), { max: 512 });
      [bL, bR].forEach(u => { const s = at(u, dep / 2); g.add({ tex: '_sd_' + key, x: s.x, y: 0, z: s.z, w: dep, h: HT, ry: q.ry + Math.PI / 2 }); });
      if (!P.mirror) {
        g.addCanvas('_bk_' + key, backCanvas(c), { max: 512 });
        p = at((bL + bR) / 2, dep); g.add({ tex: '_bk_' + key, x: p.x, y: 0, z: p.z, w: bR - bL, h: hw, ry: q.ry + Math.PI });
        g.add({ color: rgb(c.plaster, 0.97), x: p.x, y: hw, z: p.z, w: bR - bL, h: yE - hw, ry: q.ry + Math.PI });
      }
      return dep;
    }

    /* 대문채(경계를 읽지 못했을 때만 쓰는 옛 방법): 지붕을 기울이지 않고, 두께가 있는 문으로 세운다 */
    panel(q, t) {
      const g = this.g, D = 0.8, nx = Math.sin(q.ry), nz = Math.cos(q.ry), tx = Math.cos(q.ry), tz = -Math.sin(q.ry);
      const rgb = (a, m) => a.map(v => Math.min(1, v / 255 * m)), capH = q.h * 0.36;
      [0, D / 2, D].forEach((dp, i) => g.add({ tex: q.tex, x: q.x - nx * dp, y: 0, z: q.z - nz * dp, w: q.w, h: q.h, ry: q.ry + (i === 2 ? Math.PI : 0) }));
      [-1, 1].forEach(e => { const u = e * (q.w / 2 - 0.06); g.add({ color: rgb(t.col.wood, 0.85), x: q.x + tx * u - nx * D / 2, y: 0, z: q.z + tz * u - nz * D / 2, w: D, h: capH, ry: q.ry + Math.PI / 2 }); });
    }

    /* 낮은 상(평상·책상 공용): 윗면 + 테두리 + 다리 네 개 */
    table(x, d, WX, LZ, top, tex, tone) {
      const g = this.g, z = -d, k = tone || 1, ap = [0.62 * k, 0.42 * k, 0.27 * k], leg = [0.52 * k, 0.34 * k, 0.22 * k], th = Math.min(0.1, top * 0.3);
      if (tex) g.add({ tex: tex, flat: true, x: x, y: top, z: z, w: WX, h: LZ, cut: 0 });
      else g.add({ color: [0.72 * k, 0.5 * k, 0.33 * k], flat: true, x: x, y: top, z: z, w: WX, h: LZ });
      [-1, 1].forEach(s => {
        g.add({ color: ap, x: x + s * WX / 2, y: top - th, z: z, w: LZ, h: th, ry: Math.PI / 2 });
        g.add({ color: ap, x: x, y: top - th, z: z + s * LZ / 2, w: WX, h: th });
      });
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
        const lx = x + sx * (WX / 2 - 0.07), lz = z + sz * (LZ / 2 - 0.07);
        g.add({ color: leg, x: lx, y: 0, z: lz, w: 0.09, h: top - th });
        g.add({ color: leg, x: lx, y: 0, z: lz, w: 0.09, h: top - th, ry: Math.PI / 2 });
      }));
    }
    bench(x, d) {
      this.g.addCanvas('_bench', benchCanvas(), { max: 256 });
      this.table(x, d, 1.1, 1.9, 0.42, '_bench');
      this.solids.push({ x: x, z: -d - 0.5, r: 0.55 }, { x: x, z: -d + 0.5, r: 0.55 });
    }
    desk(x, d) {
      this.table(x, d, 0.95, 0.5, 0.34, null, 0.82);
      this.solids.push({ x: x, z: -d, r: 0.35 });
    }
    /* 장롱: 벽에 붙여 세운 상자. 앞면만 그림, 옆과 위는 나무색 */
    chest(x, d, sgn) {
      const g = this.g, z = -d, W = 1.5, H = 1.55, D = 0.6, wood = [0.47, 0.30, 0.2];
      g.addCanvas('_chest', chestCanvas(), { max: 256 });
      g.add({ tex: '_chest', x: x - sgn * D / 2, y: 0, z: z, w: W, h: H, ry: -sgn * Math.PI / 2, cut: 0 });
      [-1, 1].forEach(e => g.add({ color: wood, x: x, y: 0, z: z + e * W / 2, w: D, h: H }));
      g.add({ color: [0.55, 0.36, 0.24], flat: true, x: x, y: H, z: z, w: D, h: W });
      this.solids.push({ x: x, z: z, r: 0.75 });
    }

    place(d, x, yaw) {
      this.d = d; this.x = x || 0; if (yaw != null) this.yaw = yaw;
      const c = this.g.cam; c.x = this.x; c.z = -this.d; c.y = this.baseY; c.yaw = this.yaw;
    }

    pendingRequired() { let best = null; const k = n => (n.order != null ? n.order : n.d); this.nodes.forEach(n => { if (n.required && !n.done && (!best || k(n) < k(best))) best = n; }); return best; }

    complete(node) {
      node.done = true;
      if (node._q && !node.keepProp) node._q.hidden = true;
      this.focusNode = null; this.atNode = null; this.nearNode = null;
    }

    /* 다음에 가야 할 곳: 이름, 거리, 화면에서의 방향(0=정면, +오른쪽) */
    goal() {
      const n = this.pendingRequired();
      if (!n) return null;
      const dx = n.x - this.x, dd = n.d - this.d, dist = Math.hypot(dx, dd);
      let ang = Math.atan2(dx, dd) + this.yaw;                 // 정면 기준 오른쪽이 +
      while (ang > Math.PI) ang -= 2 * Math.PI; while (ang < -Math.PI) ang += 2 * Math.PI;
      return { label: n.goal || n.label, dist: Math.max(0, dist - n.r * 0.6), angle: ang, here: dist <= n.r };
    }

    update(dt, input) {
      const g = this.g, cam = g.cam, b = this.bounds;
      this.time += dt;
      let moving = false;
      if (!this.locked) {
        if (input.look) this.yaw += input.look * 1.9 * dt;
        if (input.turn) { this.yaw += input.turn; input.turn = 0; }
        let v = 0;
        if (input.fwd) v += this.speed; if (input.back) v -= this.speed * 0.7;
        const sx = input.strafe ? input.strafe * this.speed * 0.8 : 0;
        if (this.autoGoal) {                                   // 검수용: 목표로 곧장 걷기
          const n = this.pendingRequired() || this.nodes.find(o => !o.done);
          if (n) { const ax = n.x - this.x, ad = n.d - this.d, al = Math.hypot(ax, ad) || 1, st = Math.min(al, this.speed * dt);
            this.x += ax / al * st; this.d += ad / al * st; this.yaw = Math.atan2(-ax, ad); moving = true; }
        } else if (v || sx) {
          const fx = -Math.sin(this.yaw), fd = Math.cos(this.yaw);      // 앞 방향(x, d)
          let nx = this.x + (fx * v + fd * sx) * dt, nd = this.d + (fd * v - fx * sx) * dt;
          nx = Math.max(b.x0, Math.min(b.x1, nx)); nd = Math.max(b.d0, Math.min(b.d1, nd));
          this.solids.forEach(s => { const ox = nx - s.x, oz = -nd - s.z, l = Math.hypot(ox, oz); if (l < s.r + 0.35 && l > 0.001) { const k = (s.r + 0.35) / l; nx = s.x + ox * k; nd = -(s.z + oz * k); } });
          moving = Math.abs(nx - this.x) + Math.abs(nd - this.d) > 1e-4;
          this.x = nx; this.d = nd;
        }
      }
      if (moving) this.phase += dt * 7.2;
      const bob = moving ? Math.sin(this.phase) * 0.03 : 0;
      cam.x = this.x; cam.z = -this.d; cam.yaw = this.yaw;
      cam.y += ((this.baseY + bob) - cam.y) * Math.min(1, dt * 14);
      if (!moving && Math.abs(cam.y - this.baseY) < 0.0005) cam.y = this.baseY;

      // 가까이 있는 지점(필수는 차례가 된 것만)
      const req = this.pendingRequired();
      let focus = null, best = 1e9;
      this.nodes.forEach(n => {
        if (n.done || (n.required && n !== req)) return;
        const dist = Math.hypot(n.x - this.x, n.d - this.d);
        if (dist <= n.r && dist < best) { best = dist; focus = n; }
      });
      if (focus !== this.focusNode) {
        this.focusNode = focus; this.atNode = focus && focus.required ? focus : null; this.nearNode = focus && !focus.required ? focus : null;
        if (this.hooks.onFocus) this.hooks.onFocus(focus, !!(focus && focus.required));
      }
      this.moving = moving;
      g.render();
    }

    /* 화면에 띄울 표시 */
    markers() {
      const out = [], req = this.pendingRequired();
      this.nodes.forEach(n => {
        if (n.done || (n.required && n !== req)) return;
        const dist = Math.hypot(n.x - this.x, n.d - this.d);
        if (dist > 38) return;
        const p = this.g.project(n.x, n.markY != null ? n.markY : 1.5, -n.d);
        if (p) out.push({ id: n.id, x: p.x, y: p.y, near: dist < 7, required: !!n.required, focus: n === this.focusNode });
      });
      return out;
    }
  }

  /* 그림 파일이 있는지 미리 알아본다(한 번 본 것은 기억) */
  const seen = {};
  World.exists = function (id) {
    if (seen[id] != null) return Promise.resolve(seen[id]);
    return new Promise(res => { const im = new Image(); im.onload = () => res(seen[id] = true); im.onerror = () => res(seen[id] = false); im.src = assetUrl(id); });
  };
  window.World = World;
})();

/* 게임 흐름 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const h = UI.h, T = UI.T;
  const qs = new URLSearchParams(location.search);
  const DEBUG = qs.get('debug') === '1';
  const FAST = DEBUG || qs.get('fast') === '1';   // 검수용: 빠르게 걷기
  const input = { fwd: false, back: false, look: 0, l: false, r: false, turn: 0, strafe: 0 };
  let g, world, playing = false, nodeRes = null, last = 0, stepPhase = 0;
  const FACES = { father: ['neutral', 'sad', 'smile', 'worry'], mother: ['neutral', 'sad', 'smile', 'worry'], mother_sick: ['neutral', 'worry'], grandma: ['neutral', 'sad', 'smile', 'worry'],
    grandma_white: ['neutral', 'sad'], hg: ['neutral', 'smile', 'surprise', 'worry'], hg20: ['neutral', 'sad', 'smile'], bomi23: ['neutral', 'smile', 'surprise'], bomi: ['neutral', 'smile', 'surprise'] };
  const NAMES = { father: '아버지', mother: '어머니', mother_sick: '어머니', grandma: '할머니', grandma_white: '할머니', hg: '{hg}', hg20: '{hg}', bomi: '봄이', bomi23: '봄이' };
  function portrait(who, face) {
    const p = Store.data.profile || {};
    if (!FACES[who]) return null;
    const f = FACES[who].indexOf(face) >= 0 ? face : 'neutral';
    const base = who === 'hg' ? 'chr_hangyeol_' + (p.hgFemale ? 'f' : 'm') + '_1919' : who === 'hg20' ? 'chr_hangyeol_' + (p.hgFemale ? 'f' : 'm') + '_1920'
      : who === 'bomi' ? 'chr_bomi_1919' : who === 'bomi23' ? 'chr_bomi_1923' : 'chr_' + who;
    return base + '_' + f;
  }

  /* 맵에 세울 전신 그림 이름(있으면 쓰고, 없으면 대화용 그림을 흐리게 세운다) */
  function worldSprite(who) {
    const p = Store.data.profile || {};
    if (who === 'hg' || who === 'hg20') return 'world_hangyeol_' + (p.hgFemale ? 'f' : 'm') + (who === 'hg' ? '_1919' : '_1920');
    if (who === 'bomi23') return 'world_bomi_1923';
    if (/^npc_/.test(who)) return 'world_' + who;        // 길에서 만나는 사람: 그림이 있으면 쓴다
    return FACES[who] ? 'world_' + who : null;
  }

  const Game = {
    portraitId: portrait, nameOf: who => NAMES[who] || who,
    ch: null, scene: null, chip: '', inMemory: false,

    async boot() {
      if (location.protocol === 'file:') {
        $('screen').className = 'show'; $('screen').innerHTML = '<div class="panel"><h1>종로 지물포의 봄</h1><p>이 게임은 파일을 바로 열어서는 실행되지 않습니다.</p><p>폴더 안의 <b>「게임 실행(선생님 컴퓨터).bat」</b>을 두 번 눌러 실행하거나, 선생님이 알려 준 인터넷 주소로 들어오세요.</p></div>';
        return;
      }
      try { g = new GL3D($('gl')); } catch (e) {
        $('screen').className = 'show'; $('screen').innerHTML = '<div class="panel"><h1>종로 지물포의 봄</h1><p>이 기기의 브라우저에서 3D 화면을 쓸 수 없습니다. 크롬 브라우저를 최신으로 올린 뒤 다시 열어 주세요.</p></div>'; return;
      }
      world = new World(g, { portrait: portrait, worldSprite: worldSprite, onFocus: (n, req) => { if (UI.mode === 'walk' && !world.locked) UI.prompt(n, req); if (n && req) Sound.sfx('tick'); } });
      this.world = world;
      this.bind();
      if (FAST) setInterval(() => this.loop(performance.now()), 16); else requestAnimationFrame(t => this.loop(t));
      if (qs.get('unlock') === '1') Store.data.unlockAll = true;
      await this.titleScreen();
    },

    bind() {
      const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
      const key = (e, down) => {
        if (typing(e)) return;
        const k = e.key;
        let used = true;
        if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'ㅈ') input.fwd = down;
        else if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'ㄴ') input.back = down;
        else if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ㅁ') input.l = down;
        else if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'ㅇ') input.r = down;
        else if (k === 'q' || k === 'Q' || k === 'ㅂ') input.sl = down;
        else if (k === 'e' || k === 'E' || k === 'ㄷ') input.sr = down;
        else if (k === ' ' || k === 'Enter') { if (down && !e.repeat) { if (e.target && e.target.tagName === 'BUTTON' && UI.mode === 'modal') return; this.action(); } }
        else if (k === 'Tab') { if (down && playing && UI.mode === 'walk') { UI.prompt(null); UI.notebook(); } }
        else used = false;
        input.look = (input.l ? 1 : 0) - (input.r ? 1 : 0); input.strafe = (input.sr ? 1 : 0) - (input.sl ? 1 : 0);
        if (used) e.preventDefault();
      };
      window.addEventListener('keydown', e => { Sound.unlock(); key(e, true); });
      window.addEventListener('keyup', e => key(e, false));
      window.addEventListener('blur', () => { input.fwd = input.back = input.l = input.r = input.sl = input.sr = false; input.look = 0; input.strafe = 0; });
      $('dlg').addEventListener('click', () => UI.advance());
      $('fade').addEventListener('click', () => UI.advance());
      $('prompt').addEventListener('click', () => this.action());
      $('btn-note').addEventListener('click', () => { if (playing && UI.mode === 'walk') { UI.prompt(null); UI.notebook(); } });
      Sound.load(); this.syncSound();
      $('btn-sound').addEventListener('click', () => { Sound.set(!Sound.on); this.syncSound(); });
      $('btn-help').addEventListener('click', () => { if (playing && UI.mode === 'walk') UI.notebook('help'); });
      // 화면을 끌어서 둘러보기
      const cv = $('gl'); let drag = null;
      cv.addEventListener('pointerdown', e => { drag = e.clientX; cv.setPointerCapture(e.pointerId); Sound.unlock(); });
      cv.addEventListener('pointermove', e => { if (drag === null) return; input.turn += (drag - e.clientX) * 0.005; drag = e.clientX; });
      ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = null; }));
      // 터치·마우스용 걷기 단추
      const hold = (id, on, off) => { const b = $(id); ['pointerdown'].forEach(ev => b.addEventListener(ev, e => { e.preventDefault(); Sound.unlock(); on(); }));
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, off)); };
      hold('pad-up', () => input.fwd = true, () => input.fwd = false);
      hold('pad-down', () => input.back = true, () => input.back = false);
      hold('pad-left', () => { input.l = true; input.look = 1; }, () => { input.l = false; input.look = 0; });
      hold('pad-right', () => { input.r = true; input.look = -1; }, () => { input.r = false; input.look = 0; });
    },

    syncSound() { const b = $('btn-sound'); b.classList.toggle('off', !Sound.on); b.textContent = Sound.on ? '소리 켜짐' : '소리 꺼짐'; b.title = Sound.on ? '누르면 소리를 끕니다' : '누르면 소리를 켭니다'; },

    action() {
      if (UI.advance()) return;
      if (!playing || UI.mode !== 'walk' || world.locked) return;
      const n = world.atNode || world.nearNode;
      if (n && nodeRes) { const r = nodeRes; nodeRes = null; UI.prompt(null); r(n); }
    },
    waitNode() { return new Promise(r => { nodeRes = r; }); },

    loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      if (world && world.scene) {
        const can = playing && UI.mode === 'walk' && !world.locked;
        const inp = can ? input : { fwd: false, back: false, look: 0, turn: 0, strafe: 0 };
        if (this.demo) { const L = world.length || 20; world.place(world.isRoom ? 0.5 : L * 0.15 + (Math.sin(t / 9000) * 0.5 + 0.5) * L * 0.3, 0, Math.sin(t / 7000) * 0.3); }
        world.autoGoal = DEBUG && can && !!this.auto;
        world.update(dt * (FAST && can ? 4 : 1), inp);
        if (world.moving && can) { stepPhase += dt; if (stepPhase > 0.42) { stepPhase = 0; Sound.sfx('step'); } }
        UI.markers(can ? world.markers() : []);
        if (playing) UI.hud(this.chip, can ? world.goal() : null);
        if (can && DEBUG && this.auto) { const n = world.atNode || (world.pendingRequired() ? null : world.nearNode); if (n && nodeRes) this.action(); }
        if (can) { const n = world.atNode || world.nearNode; UI.prompt(n || null, !!world.atNode); } else if (UI.mode !== 'walk') UI.prompt(null);
      }
      if (DEBUG && this.auto) UI.advance();
      if (!FAST) requestAnimationFrame(tt => this.loop(tt));
    },

    // ────────── 첫 화면 ──────────
    async titleScreen() {
      playing = false; document.body.classList.remove('playing');
      UI.loading(true, '종로 거리를 그리는 중…');
      try {
        await world.load({ type: 'street', season: 'MAR', sky: 'bg_far_day_APR', ground: 'tile_ground_dirt_MAR', length: 60, startD: 6,
          left: ['fac_shop_a_open', 'fac_gate_house', 'fac_shop_b_open', 'fac_wall_tile', 'fac_shop_a_open'], right: ['fac_jimulpo_open', 'fac_shop_b_open', 'fac_wall_tile', 'fac_gate_house', 'fac_shop_a_open'],
          sprites: [{ img: 'near_onggi', x: -4.7, d: 12, h: 1.25 }, { img: 'near_cart', x: 4.3, d: 26, h: 1.5 }] });
      } catch (e) { console.error(e); }
      UI.loading(false);
      this.demo = true; world.locked = true;
      const sc = $('screen'); sc.className = 'show title'; sc.innerHTML = '';
      const has = Store.resume();
      this.syncSound();
      const p = Store.data.profile;
      const panel = h('div', { class: 'panel title-panel' }, [
        h('div', { class: 'title-sub', text: '추론하며 읽기 · 1919년 경성' }),
        h('h1', { text: '종로 지물포의 봄' }),
        h('p', { class: 'title-lead', text: '글은 다 말하지 않는다. 읽는 사람이 채운다.' }),
        has && p ? h('button', { class: 'btn primary big', text: p.hero + '의 이야기 이어 하기', onclick: () => { Sound.unlock(); this.menu(); } }) : null,
        h('button', { class: 'btn big' + (has ? '' : ' primary'), text: has ? '다른 이름으로 시작하기' : '시작하기', onclick: () => { Sound.unlock(); this.setup(); } }),
        h('div', { class: 'title-foot' }, [h('span', { text: '이 이야기의 인물은 지어낸 사람들입니다. 글 카드에 붙은 「실제 자료」만 그때의 글 그대로입니다.' }),
          h('a', { href: 'teacher.html', text: '선생님 화면' })])
      ]);
      sc.appendChild(panel);
    },

    setup() {
      const sc = $('screen'); sc.className = 'show'; sc.innerHTML = '';
      const old = Store.data.profile || {};
      const f = { cls: h('input', { type: 'text', placeholder: '예: 5-2', maxlength: 8, value: old.cls || '' }), num: h('input', { type: 'number', placeholder: '번호', min: 1, max: 60, value: old.num || '' }),
        name: h('input', { type: 'text', placeholder: '내 이름', maxlength: 10, value: old.name || '' }), hero: h('input', { type: 'text', placeholder: '이야기 속 내 이름', maxlength: 6, value: old.hero || '' }) };
      let meF = old.hg ? !!old.female : null, hgF = old.hg ? !!old.hgFemale : null;
      const msg = h('div', { class: 'form-msg' });
      const result = h('div', { class: 'hg-result' });
      const callName = () => meF === null || hgF === null ? null : (meF ? (hgF ? '언니' : '오빠') : (hgF ? '누나' : '형'));
      const show = () => { const c = callName(); result.textContent = c ? '이야기 속에서 나는 한결을 「' + c + '」라고 부릅니다.' : '둘을 고르면 한결을 부르는 말이 정해집니다.'; };
      const mePick = h('div', { class: 'me-pick' }), pick = h('div', { class: 'hg-pick' });
      [['남자아이', false], ['여자아이', true]].forEach(o => mePick.appendChild(h('button', { class: 'hg-opt' + (meF === o[1] ? ' on' : ''), onclick: (e) => {
        meF = o[1]; mePick.querySelectorAll('.hg-opt').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); Sound.sfx('tick'); show(); } }, [h('b', { text: o[0] })])));
      [['남자', false], ['여자', true]].forEach(o => pick.appendChild(h('button', { class: 'hg-opt' + (hgF === o[1] ? ' on' : ''), onclick: (e) => {
        hgF = o[1]; pick.querySelectorAll('.hg-opt').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); Sound.sfx('tick'); show(); } },
        [h('img', { src: assetUrl('chr_hangyeol_' + (o[1] ? 'f' : 'm') + '_1919_smile'), alt: '' }), h('b', { text: '한결 (' + o[0] + ')' })])));
      show();
      const start = () => {
        const v = { cls: f.cls.value.trim(), num: f.num.value.trim(), name: f.name.value.trim(), hero: f.hero.value.trim() };
        if (!v.cls || !v.num || !v.name) { msg.textContent = '반, 번호, 이름을 써 주세요.'; return; }
        if (!v.hero) { msg.textContent = '이야기 속에서 쓸 이름을 지어 주세요.'; return; }
        if (!/^[가-힣A-Za-z]+$/.test(v.hero)) { msg.textContent = '이야기 속 이름은 한글이나 영문으로만 지어 주세요.'; return; }
        if (!callName()) { msg.textContent = '나와 한결의 성별을 골라 주세요.'; return; }
        v.hg = callName(); v.female = meF; v.hgFemale = hgF;
        const go = fresh => { Store.open(v); if (fresh) { Store.reset(); Store.data.profile = Object.assign(Store.data.profile || {}, v); Store.save(); } Store.event('start', v.hero + '/' + v.hg + (fresh ? '/처음부터' : '')); this.menu(); };
        const had = Store.peek(v);
        if (had && Object.keys(had.chapters || {}).length) {
          UI.ask('같은 반·번호·이름으로 읽던 이야기가 있습니다. 어떻게 할까요?', ['읽던 곳부터 이어 하기', '처음부터 새로 시작하기'], null).then(i => go(i === 1));
        } else go(false);
      };
      sc.appendChild(h('div', { class: 'panel form' }, [
        h('h2', { text: '이야기를 시작하기 전에' }),
        h('div', { class: 'form-row' }, [h('label', null, ['반', f.cls]), h('label', null, ['번호', f.num]), h('label', null, ['이름', f.name])]),
        h('p', { class: 'form-note', text: '반·번호·이름은 선생님이 여러분의 글을 읽을 때 씁니다. ' + (CONFIG.ENDPOINT ? '쓴 글은 선생님께 전해집니다.' + (CONFIG.SHEET_MARK ? ' (연결 표시: ' + CONFIG.SHEET_MARK + ')' : '') : '지금은 쓴 글이 이 기기에만 저장됩니다.') }),
        h('label', { class: 'wide' }, ['1919년, 열두 살인 「나」의 이름을 지어 주세요', f.hero]),
        h('p', { class: 'form-q', text: '이야기 속의 나는' }), mePick,
        h('p', { class: 'form-q', text: '이야기에는 네 살 위 형제 한결이 나옵니다. 한결은' }), pick, result, msg,
        h('div', { class: 'modal-foot' }, [h('button', { class: 'btn', text: '뒤로', onclick: () => this.titleScreen() }), h('button', { class: 'btn primary', text: '시작', onclick: start })])
      ]));
      setTimeout(() => f.cls.focus(), 50);
    },

    toMenu() { playing = false; nodeRes = null; UI.endDialog(); UI.prompt(null); this.demo = true; world.locked = true; this.menu(); },

    menu() {
      playing = false; document.body.classList.remove('playing'); this.demo = true; if (world) world.locked = true;
      Sound.bgm('bgm_title');
      const sc = $('screen'); sc.className = 'show'; sc.innerHTML = '';
      const d = Store.data, list = h('div', { class: 'ch-list' });
      let open = true;
      STORY.order.forEach((id, i) => {
        const ch = STORY.chapters[id], st = d.chapters[id] || {};
        const can = open || d.unlockAll;
        const state = st.done ? '다 읽음' : st.scene ? '읽는 중' : can ? '새 이야기' : '잠김';
        list.appendChild(h('button', { class: 'ch-item' + (st.done ? ' done' : '') + (can ? '' : ' locked'), disabled: can ? null : 'disabled', onclick: () => { if (st.scene && !st.done) UI.ask(ch.title + ' — 읽던 곳이 있습니다.', ['읽던 곳부터 이어 하기', '이 장의 처음으로 돌아가기'], null).then(i => { if (i === 1) { st.scene = null; st.nodes = {}; st.entered = false; Store.save(); } this.play(id); }); else this.play(id); } },
          [h('b', { text: ch.title }), h('span', { text: ch.date }), h('em', { text: state })]));
        if (!st.done) open = false;
      });
      sc.appendChild(h('div', { class: 'panel menu' }, [
        h('h2', { text: T('{name}의 이야기') }),
        h('p', { class: 'form-note', text: '한 장은 한 차시(약 30분) 분량입니다. 도중에 닫아도 읽던 곳부터 이어집니다.' }), list,
        h('div', { class: 'menu-foot' }, [
          h('button', { class: 'btn', text: '읽기 수첩', onclick: () => UI.notebook() }),
          h('button', { class: 'btn', text: '내 기록 내려받기', onclick: () => Store.exportFile() }),
          h('button', { class: 'btn', text: '출처 모아 보기', onclick: () => UI.sources() }),
          h('button', { class: 'btn ghost', text: '처음부터 다시', onclick: () => { UI.ask('지금까지 읽은 것과 쓴 글을 이 기기에서 지우고 처음부터 다시 할까요? (선생님께 이미 보낸 답은 남아 있습니다)', ['아니요, 그대로 둘게요', '네, 처음부터 다시'], null).then(i => { if (i === 1) { Store.reset(); Store.event('reset', ''); } this.menu(); }); } }),
          h('button', { class: 'btn ghost', text: '선생님', onclick: () => { const c = prompt('선생님 암호를 넣으면 모든 장이 열립니다.'); if (c === CONFIG.TEACHER_CODE) { d.unlockAll = true; Store.save(); this.menu(); } } }),
          h('button', { class: 'btn ghost', text: Sound.on ? '소리 끄기' : '소리 켜기', onclick: (e) => { Sound.set(!Sound.on); this.syncSound(); e.currentTarget.textContent = Sound.on ? '소리 끄기' : '소리 켜기'; } }),
          h('button', { class: 'btn ghost', text: '처음 화면', onclick: () => this.titleScreen() })])
      ]));
    },

    // ────────── 장 진행 ──────────
    async play(chId) {
      const ch = STORY.chapters[chId], save = Store.chap(chId);
      if (save.done) { save.done = 'again'; save.scene = null; save.nodes = {}; save.entered = false; }
      this.ch = chId; this.chip = ch.title + ' · ' + ch.date;
      $('screen').className = ''; document.body.classList.add('playing'); this.demo = false;
      playing = true; Sound.bgm(ch.bgm);
      const tok = this.tok = (this.tok || 0) + 1;
      Store.event('chapter_start', chId);
      let sid = save.scene && ch.scenes[save.scene] ? save.scene : ch.start;
      try {
        while (sid && playing && tok === this.tok) sid = await this.playScene(ch, save, sid);
      } catch (e) { console.error(e); UI.toast('문제가 생겼습니다. 화면을 새로 고쳐 주세요.<br><small>' + (e && e.message) + '</small>'); return; }
      if (!playing || tok !== this.tok) return;
      save.done = true; save.scene = null; save.nodes = {}; save.entered = false; Store.save();
      Store.event('chapter_done', chId);
      playing = false; UI.prompt(null); UI.hud('', null);
      await UI.fade(true);
      const idx = STORY.order.indexOf(chId), next = STORY.order[idx + 1];
      const picked = this.chapterDone(ch, next);     // 마침 화면을 먼저 띄우고
      await UI.fade(false);                          // 검은 가림막을 걷은 다음
      await picked;                                  // 학생이 고르기를 기다린다
      if (this._next) { const n = this._next; this._next = null; this.play(n); } else this.toMenu();
    },

    chapterDone(ch, next) {
      return new Promise(res => {
        const d = Store.data;
        const sc = $('screen'); sc.className = 'show'; sc.innerHTML = '';
        sc.appendChild(h('div', { class: 'panel done' }, [
          h('div', { class: 'title-sub', text: '읽기를 마쳤습니다' }), h('h2', { text: ch.title }),
          h('p', { text: '읽기 수첩에 글 카드 ' + d.cards.filter(c => CARDS[c] && CARDS[c].kind !== 'gloss').length + '장, 경험 카드 ' + d.exps.length + '장, 배운 것 ' + d.concepts.length + '가지가 모였습니다.' }),
          h('p', { class: 'form-note', text: CONFIG.ENDPOINT ? (d.queue.length ? '선생님께 보내지 못한 답이 ' + d.queue.length + '개 있습니다. 인터넷이 이어지면 저절로 보냅니다.' : '쓴 글은 모두 선생님께 전해졌습니다.') : '쓴 글은 이 기기에 저장되었습니다.' }),
          h('div', { class: 'modal-foot' }, [
            h('button', { class: 'btn', text: '읽기 수첩 보기', onclick: () => UI.notebook() }),
            h('button', { class: 'btn', text: '여기까지 하기', onclick: () => { this._next = null; res(); } }),
            next ? h('button', { class: 'btn primary', text: '다음 장으로', onclick: () => { this._next = next; res(); } }) : null])
        ]));
      });
    },

    async playScene(ch, save, sid) {
      const def = ch.scenes[sid];
      if (save.scene !== sid) { save.scene = sid; save.nodes = {}; save.entered = false; Store.save(); }
      const tok = this.tok;
      this.scene = sid; world.locked = true; UI.prompt(null);
      await UI.fade(true);
      UI.loading(true, '장면을 준비하는 중…');
      await world.load(def, { done: save.nodes });
      world.locked = true;
      // 이어 하기: 마지막으로 한 필수 지점 앞에서 시작
      let lastN = null; world.nodes.forEach(n => { if (n.done && n.required && (!lastN || n.d > lastN.d)) lastN = n; });
      if (lastN) world.place(Math.max(world.bounds.d0, Math.min(world.bounds.d1, lastN.d - 1.6)), Math.max(world.bounds.x0, Math.min(world.bounds.x1, lastN.x * 0.6)), 0);
      UI.loading(false);
      Sound.bgm(def.bgm || ch.bgm);
      let steps = (def.enter || []).slice();
      if (!save.entered && steps.length && steps[0][0] === 't') { const t = steps.shift(); await UI.title(t[1], t[2]); } else await UI.fade(false);
      if (!save.entered) { const r = await this.run(steps); save.entered = true; Store.save(); if (r) return r.go || null; }
      world.locked = false; UI.mode = 'walk';
      while (playing) {
        const node = await this.waitNode();
        if (!playing || tok !== this.tok) return null;
        world.locked = true; UI.prompt(null);
        if (node.prop) Sound.sfx('paper');
        const r = await this.run(node.ev || []);
        world.complete(node); save.nodes[node.id] = 1; Store.save();
        UI.endDialog();
        if (tok !== this.tok) return null;
        if (r) return r.go || null;
        world.locked = false; UI.mode = 'walk';
      }
      return null;
    },

    async run(steps) {
      for (const s of steps) {
        const k = s[0];
        if (k === 'n') await UI.say({ kind: 'narr', text: s[1] });
        else if (k === 'me') await UI.say({ kind: 'me', name: '{name}', text: s[1] });
        else if (k === 's') await UI.say({ kind: 'say', name: NAMES[s[1]] || s[1], portrait: portrait(s[1], s[2]), text: s[3] });
        else if (k === 't') { UI.endDialog(); await UI.title(s[1], s[2]); }
        else if (k === 'card') { UI.endDialog(); if (!DEBUG) await UI.showCard(s[1]); else Store.add('cards', s[1]); }
        else if (k === 'pic') { UI.endDialog(); if (!DEBUG) await UI.showPic(s[1]); }
        else if (k === 'exp') UI.gainExp(s[1]);
        else if (k === 'concept') UI.gainConcept(s[1]);
        else if (k === 'quiz') { UI.endDialog(); if (!DEBUG) await UI.quiz(s[1]); else Store.answer(s[1], { steps: { debug: '검수용 자동 답' }, ms: 1 }); }
        else if (k === 'ask') { UI.endDialog(); if (!DEBUG) { await UI.ask(s[1], s[2], s[3]); if (s[4]) await UI.say({ kind: 'say', name: '아버지', portrait: portrait('father', 'smile'), text: s[4] }); } }
        else if (k === 'help') { if (!Store.data['help_' + s[1]] && !DEBUG) { Store.data['help_' + s[1]] = 1; UI.endDialog(); await UI.help(s[1]); } }
        else if (k === 'go') { UI.endDialog(); Sound.sfx('door'); return { go: s[1] }; }
        else if (k === 'end') { UI.endDialog(); return { end: true }; }
        else if (k === 'ending') { UI.endDialog(); await this.ending(); return { end: true }; }
      }
      UI.endDialog();
      return null;
    },

    // ────────── 기억 다시 걷기 ──────────
    async memoryWalk(expId) {
      const e = EXPS[expId]; if (!e || !e.mem) return;
      const def = STORY.chapters[e.mem[0]].scenes[e.mem[1]];
      const back = { def: world.scene, d: world.d, x: world.x, yaw: world.yaw, done: {} };
      world.nodes.forEach(n => { if (n.done) back.done[n.id] = 1; });
      Sound.sfx('memory');
      await UI.fade(true, '기억 다시 걷기');
      $('gl').classList.add('memory'); document.body.classList.add('in-memory');
      await world.load(def, { memory: true, only: e.mem[2] });
      const node = world.nodes[0];
      world.place(Math.max(def.startD || 0, node.d - (def.type === 'room' ? 3.5 : 10)), 0, 0);
      const chip0 = this.chip; this.chip = '기억 다시 걷기 · ' + T(e.title);
      this.inMemory = true; UI.mode = 'walk'; world.locked = false;
      await UI.fade(false);
      UI.toast('기억 속 길입니다. 빛나는 곳까지 걸어가 보세요.', 'exp');
      const hit = await this.waitNode();
      world.locked = true; UI.prompt(null);
      if (!DEBUG) await this.run(hit.mem || []);
      UI.endDialog();
      UI.gainExp(expId);
      Store.data.rewalks.push({ exp: expId, at: new Date().toISOString(), ch: this.ch });
      Store.event('rewalk', expId);
      await UI.fade(true);
      $('gl').classList.remove('memory'); document.body.classList.remove('in-memory');
      await world.load(back.def, { done: back.done });
      world.place(back.d, back.x, back.yaw); world.locked = true;
      this.chip = chip0; this.inMemory = false;
      await UI.fade(false);
    },

    // ────────── 엔딩 ──────────
    ending() {
      return new Promise(res => {
        Sound.focus(false); Sound.bgm('bgm_attic_ending');
        const a = Store.data.answers.q5_reply;
        const reply = a && a.steps && typeof a.steps.reply === 'string' ? a.steps.reply : null;
        const mine = h('div', { class: 'card card-letter kind-mine' }, [h('div', { class: 'tag tag-mine', text: '4년 전, 내가 쓴 답장' }),
          h('div', { class: 'card-body' }, [h('div', { class: 'ln', text: reply || '(서랍 속 답장은 비어 있었다. 쓰지 못한 말도 답장이다.)' })])]);
        const lines = ['두 편지는 끝내 서로에게 닿지 못했다.', '한 통은 다락방 상자 속에, 다른 한 통은 책상 서랍 속에 남겨졌다.', '하지만 지금, 누군가 두 편지를 나란히 읽고 있다.',
          '글은 모든 것을 말해주지 않는다. 그 빈자리를 채우는 건 읽는 사람의 몫이다.', '추론 — ' + CONCEPTS.infer.text];
        const lineBox = h('div', { class: 'end-lines' });
        const btn = h('button', { class: 'btn primary', text: '읽기 수첩을 덮는다', style: 'visibility:hidden', onclick: async () => { UI.closeModal(); Store.add('concepts', 'infer'); await UI.sources(); res(); } });
        const ov = $('overlay'); ov.innerHTML = ''; ov.className = 'show ending';
        ov.appendChild(h('div', { class: 'modal ending' }, [h('div', { class: 'end-cards' }, [UI.cardGroup('hg_unsent', { noFlip: true, noWords: true }), mine]), lineBox, h('div', { class: 'modal-foot' }, [btn])]));
        UI.mode = 'modal'; UI._adv = null;
        lines.forEach((t, i) => setTimeout(() => { lineBox.appendChild(h('p', { class: i === lines.length - 1 ? 'last' : '', text: t })); if (i === lines.length - 1) btn.style.visibility = 'visible'; }, DEBUG ? 50 : 1400 + i * 2600));
      });
    }
  };

  window.Game = Game;
  window.addEventListener('DOMContentLoaded', () => Game.boot());
})();

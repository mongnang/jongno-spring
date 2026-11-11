/* 화면: 대사창, 글 카드, 문항, 읽기 수첩, 안내 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  function h(tag, attrs, kids) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'class') e.className = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k]; else if (k === 'text') e.textContent = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    (Array.isArray(kids) ? kids : kids != null ? [kids] : []).forEach(c => { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function josa(w, j) {
    if (!j) return '';
    const c = w.charCodeAt(w.length - 1), jong = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 !== 0 : false;
    const P = { '은는': ['은', '는'], '이가': ['이', '가'], '을를': ['을', '를'], '아야': ['아', '야'], '과와': ['과', '와'], '이_': ['이', ''] };
    return P[j] ? P[j][jong ? 0 : 1] : j;
  }
  function T(s) {
    const p = (Store.data.profile || {});
    return String(s == null ? '' : s).replace(/\{(name|hg|bme|bhg)(?:\|([^}]+))?\}/g, (m, k, j) => {
      const w = k === 'name' ? (p.hero || '아이') : k === 'hg' ? (p.hg || '형') : k === 'bme' ? (p.female ? '언니' : '오빠') : (p.hgFemale ? '큰언니' : '큰오빠');
      return w + josa(w, j);
    });
  }
  const KIND = { real: '실제 자료', gloss: '제작자 풀이', made: '사실에 바탕을 둔 창작 지문' };
  const UI = { T: T, h: h, mode: 'walk', _adv: null };

  // ─────────── 글 카드 ───────────
  function seg(text, key, cls) { return h('span', { class: 'seg ' + (cls || ''), 'data-seg': key, text: T(text) }); }
  function cardEl(id, opt) {
    opt = opt || {};
    const c = CARDS[id]; if (!c) return h('div', { text: '카드 없음: ' + id });
    const root = h('div', { class: 'card card-' + (c.style || 'plain') + ' kind-' + c.kind, 'data-card': id });
    const front = h('div', { class: 'card-front' });
    front.appendChild(h('div', { class: 'tag tag-' + c.kind, text: KIND[c.kind] }));
    if (c.head) front.appendChild(h('div', { class: 'card-head' }, [seg(c.head, id + ':head')]));
    if (c.title) front.appendChild(h('div', { class: 'card-title', text: T(c.title) }));
    const body = h('div', { class: 'card-body' });
    let n = 0;
    const line = (t, cls) => h('div', { class: 'ln ' + (cls || '') }, [seg(t, id + ':' + (n++))]);
    if (c.style === 'news' || c.style === 'ad') {
      (c.lines || []).forEach(l => {
        const row = h('div', { class: 'headline' });
        l.split(', ').forEach((part, i, arr) => { row.appendChild(seg(part, id + ':' + (n++))); if (i < arr.length - 1) row.appendChild(h('span', { class: 'comma', text: ', ' })); });
        body.appendChild(row);
      });
    } else if (c.stanzas) {
      (c.pre || []).forEach(l => body.appendChild(line(l, 'pre')));
      c.stanzas.forEach(st => { const s = h('div', { class: 'stanza' }); st.forEach(l => s.appendChild(line(l))); body.appendChild(s); });
      if (c.tail) body.appendChild(line(c.tail, 'tail'));
    } else {
      if (c.table) {
        const tb = h('table', { class: 'ctable' });
        c.table.forEach((r, i) => tb.appendChild(h('tr', null, r.map(x => h(i === 0 ? 'th' : 'td', { text: x })))));
        body.appendChild(tb);
      }
      (c.lines || []).forEach(l => body.appendChild(line(l)));
    }
    front.appendChild(body);
    if (c.meta) front.appendChild(h('div', { class: 'card-meta' }, [seg(c.meta, id + ':meta')]));
    if (c.kind === 'gloss') front.appendChild(h('div', { class: 'card-note', text: '위 원문을 이 게임 제작자가 쉬운 말로 바꾸어 쓴 글입니다.' }));
    if (c.kind === 'made') front.appendChild(h('div', { class: 'card-note', text: '이 글은 게임을 위해 새로 지은 글입니다.' + (c.note ? ' ' + T(c.note) : '') }));
    if (c.kind === 'real' && c.note) front.appendChild(h('div', { class: 'card-note', text: c.note }));
    if (c.words && !opt.noWords) {
      const w = h('div', { class: 'words' }, [h('b', { text: '낱말 풀이 ' })]);
      Object.keys(c.words).forEach(k => w.appendChild(h('span', { class: 'word' }, [h('em', { text: k }), ' ' + c.words[k]])));
      front.appendChild(w);
    }
    root.appendChild(front);
    // 뒷면: 출처
    const back = h('div', { class: 'card-back' });
    if (c.src) {
      back.appendChild(h('div', { class: 'back-title', text: '이 자료의 출처' }));
      [['쓴 사람·낸 곳', c.src.who], ['날짜', c.src.date], ['실린 곳', c.src.where], ['확인한 기관', c.src.org], ['주소', c.src.url], ['확인한 날', c.src.checked]].forEach(r =>
        back.appendChild(h('div', { class: 'back-row' }, [h('b', { text: r[0] }), h('span', { text: r[1] })])));
    }
    if (c.basis) {
      back.appendChild(h('div', { class: 'back-title', text: '이 글의 바탕이 된 사실' }));
      c.basis.forEach(b => back.appendChild(h('div', { class: 'back-fact' }, [h('p', { text: b.fact }), h('small', { text: '출처: ' + b.src + (b.url ? ' · ' + b.url : '') })])));
    }
    if (c.kind === 'gloss') back.appendChild(h('div', { class: 'back-fact', text: '원문 카드의 출처를 함께 보세요.' }));
    root.appendChild(back);
    if (!opt.noFlip && c.kind !== 'gloss') {
      const b = h('button', { class: 'flip', text: '출처 보기', onclick: (e) => { e.stopPropagation(); const f = root.classList.toggle('flipped'); b.textContent = f ? '글 보기' : '출처 보기'; Sound.sfx('paper'); } });
      root.appendChild(b);
    }
    return root;
  }
  function cardGroup(id, opt) {
    const c = CARDS[id], g = h('div', { class: 'card-group' }, [cardEl(id, opt)]);
    if (c && c.gloss) g.appendChild(cardEl(c.gloss, opt));
    return g;
  }
  UI.cardGroup = cardGroup;

  function modal(cls, kids, o) {
    const ov = $('overlay'); ov.innerHTML = ''; ov.className = 'show ' + (cls || '');
    const box = h('div', { class: 'modal ' + (cls || '') }, kids);
    ov.appendChild(box); UI.mode = 'modal';
    return box;
  }
  function closeModal() { const ov = $('overlay'); ov.className = ''; ov.innerHTML = ''; UI.mode = 'walk'; }
  UI.closeModal = closeModal;

  UI.showCard = function (id, o) {
    o = o || {};
    return new Promise(res => {
      Sound.sfx('paper');
      const isNew = Store.add('cards', id);
      const done = () => { closeModal(); UI._adv = null; res(); };
      const btn = h('button', { class: 'btn primary', text: o.view ? '닫기' : (isNew ? '읽기 수첩에 넣기' : '다 읽었어요'), onclick: done });
      modal('cardview', [h('div', { class: 'cardview-scroll' }, [cardGroup(id)]), h('div', { class: 'modal-foot' }, [h('span', { class: 'hint', text: '천천히 읽어 보세요. 「출처 보기」를 누르면 이 글이 어디서 왔는지 볼 수 있습니다.' }), btn])]);
      // 스페이스를 연달아 눌러도 글을 건너뛰지 않도록, 잠깐 뒤에 단추가 켜진다
      UI._adv = null; btn.disabled = true; btn.style.opacity = .5;
      setTimeout(() => { btn.disabled = false; btn.style.opacity = 1; if (document.body.contains(btn)) btn.focus(); }, o.view ? 100 : 1500);
    });
  };

  // ─────────── 대사창 ───────────
  let typer = null;
  UI.say = function (o) {
    return new Promise(res => {
      const d = $('dlg'), txt = $('dlg-text'), nm = $('dlg-name'), po = $('dlg-portrait');
      d.className = 'show ' + (o.kind || 'say');
      if (o.portrait) { if (po.getAttribute('data-id') !== o.portrait) { po.src = assetUrl(o.portrait); po.setAttribute('data-id', o.portrait); } po.className = 'show'; }
      else { po.className = ''; }
      nm.textContent = o.name ? T(o.name) : ''; nm.style.display = o.name ? '' : 'none';
      const full = T(o.text); let i = 0; txt.textContent = '';
      UI.mode = 'dialog';
      clearInterval(typer);
      const t0 = performance.now();
      typer = setInterval(() => { i = Math.floor((performance.now() - t0) / 15); txt.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(typer); typer = null; } }, 28);
      UI._adv = () => {
        if (typer) { clearInterval(typer); typer = null; txt.textContent = full; return; }
        Sound.sfx('next'); UI._adv = null; res();
      };
    });
  };
  UI.endDialog = function () { $('dlg').className = ''; $('dlg-portrait').className = ''; if (UI.mode === 'dialog') UI.mode = 'walk'; };
  UI.advance = function () { if (UI._adv) { UI._adv(); return true; } return false; };

  UI.ask = function (prompt, opts, correct, ok) {
    return new Promise(res => {
      const msg = h('div', { class: 'ask-msg' });
      const box = modal('ask', [h('div', { class: 'ask-q', text: T(prompt) }),
        h('div', { class: 'ask-opts' }, opts.map((t, i) => h('button', { class: 'btn', text: t, onclick: () => {
          if (correct == null || i === correct) { Sound.sfx('good'); closeModal(); res(i); }
          else { Sound.sfx('no'); msg.textContent = '다시 세어 볼까요?'; }
        } }))), msg]);
      UI._adv = null;
    });
  };

  // ─────────── 장 제목 · 전환 ───────────
  UI.title = function (big, small) {
    return new Promise(res => {
      const f = $('fade'); f.innerHTML = '';
      f.appendChild(h('div', { class: 'title-big', text: big })); f.appendChild(h('div', { class: 'title-stamp', text: small }));
      f.className = 'show title'; UI.mode = 'modal'; Sound.sfx('stamp'); Sound.jingle();
      let done = false;
      const end = () => { if (done) return; done = true; f.className = ''; UI.mode = 'walk'; UI._adv = null; setTimeout(res, 500); };
      UI._adv = end; setTimeout(end, 3200);
    });
  };
  UI.fade = function (on, text) {
    const f = $('fade'); f.innerHTML = text ? '<div class="title-stamp">' + text + '</div>' : '';
    f.className = on ? 'show' : '';
    return new Promise(r => setTimeout(r, 520));
  };
  UI.toast = function (html, kind) {
    const t = h('div', { class: 'toast ' + (kind || ''), html: html });
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3600); setTimeout(() => t.remove(), 4300);
  };
  UI.gainExp = function (id) {
    const e = EXPS[id]; if (!e) return;
    if (Store.add('exps', id)) { Sound.sfx('get'); UI.toast('<b>경험 카드</b> 「' + T(e.title) + '」<br><small>' + T(e.text) + '</small>', 'exp'); }
  };
  UI.gainConcept = function (id) {
    const c = CONCEPTS[id]; if (!c) return;
    if (Store.add('concepts', id)) { Sound.sfx('get'); UI.toast('<b>읽기 수첩 · 배운 것</b> 「' + c.title + '」<br><small>' + c.text + '</small>', 'concept'); }
  };

  // ─────────── HUD ───────────
  UI.hud = function (chip, goal) {
    if ($('chip').textContent !== (chip || '')) $('chip').textContent = chip || '';
    const g = $('goal');
    if (!goal) { if (g.className) g.className = ''; return; }
    if (g.className !== 'show') g.className = 'show';
    const steps = Math.max(1, Math.round(goal.dist / 0.7));
    const gl = goal.here ? T(goal.label) + ' — 다 왔어요' : '가는 곳: ' + T(goal.label) + ' · ' + (steps > 3 ? '약 ' + Math.round(steps / 5) * 5 : steps) + '걸음';
    if ($('goal-label').textContent !== gl) $('goal-label').textContent = gl;
    // 길잡이 화살표: 위쪽이 정면. 6도 단위로만 돌려 잔떨림을 막는다
    const deg = goal.here ? 0 : Math.round(goal.angle * 180 / Math.PI / 6) * 6, a = $('goal-arrow');
    if (a._deg !== deg) { a._deg = deg; a.style.transform = 'rotate(' + deg + 'deg)'; }
    const back = !goal.here && Math.abs(deg) > 110;
    if (a._back !== back) { a._back = back; a.classList.toggle('back', back); }
  };
  let promptKey = '';
  UI.prompt = function (node, required) {
    // 같은 내용이면 화면을 다시 건드리지 않는다(매 프레임 고쳐 쓰면 단추가 떨려 보임)
    const key = node ? node.id + '|' + (required ? 1 : 0) + '|' + node.label : '';
    if (key === promptKey) return;
    promptKey = key;
    const p = $('prompt');
    if (!node) { p.className = ''; return; }
    p.className = 'show' + (required ? ' req' : '');
    $('prompt-label').textContent = T(node.label);
  };
  const pool = {};
  UI.markers = function (list) {
    // 값이 바뀔 때만 화면을 고친다. 위치는 1픽셀 넘게 움직였을 때만 옮겨 잔떨림을 막는다.
    const host = $('markers'), seen = {};
    list.forEach(m => {
      let e = pool[m.id];
      if (!e) { e = pool[m.id] = h('div', { class: 'marker' }); e._x = -9999; e._y = -9999; e._c = ''; host.appendChild(e); }
      seen[m.id] = 1;
      const c = 'marker' + (m.near ? ' near' : '') + (m.required ? ' req' : '') + (m.focus ? ' focus' : '');
      if (c !== e._c) { e._c = c; e.className = c; }
      if (Math.abs(m.x - e._x) >= 1 || Math.abs(m.y - e._y) >= 1) { e._x = m.x; e._y = m.y; e.style.transform = 'translate(' + m.x.toFixed(1) + 'px,' + m.y.toFixed(1) + 'px)'; }
    });
    Object.keys(pool).forEach(k => { if (!seen[k]) { pool[k].remove(); delete pool[k]; } });
  };
  UI.loading = function (on, text) { const l = $('loading'); l.className = on ? 'show' : ''; if (text) $('loading-text').textContent = text; };

  // ─────────── 문항 ───────────
  const BASIS = [['clue', '글 속의 단서'], ['exp', '내가 겪은 일(경험)'], ['know', '알고 있던 것(지식)']];
  UI.quiz = function (id) {
    return new Promise(resolve => {
      const q = QUIZZES[id];
      const prev = Store.data.answers[id];
      const ans = prev ? JSON.parse(JSON.stringify(prev.steps)) : {};
      const rec = { steps: ans, hints: [], rewalk: [], recall: [], attempts: {} };
      const t0 = Date.now();
      let i = 0, afterShown = false;
      const left = h('div', { class: 'quiz-left' });
      (q.cards || []).forEach(cid => left.appendChild(cardGroup(cid, { noFlip: false })));
      if (!(q.cards || []).length) left.appendChild(h('div', { class: 'quiz-nocard', text: '이 물음은 글 카드 없이, 방금 듣고 겪은 일을 떠올려 답합니다.' }));
      const body = h('div', { class: 'quiz-body' }), dots = h('div', { class: 'dots' });
      const msg = h('div', { class: 'quiz-msg' });
      const nextBtn = h('button', { class: 'btn primary', text: '다음', onclick: () => go() });
      const memBtn = h('button', { class: 'btn ghost', text: '회상 떠올리기 (힌트)', onclick: () => memList() });
      const hintBtn = h('button', { class: 'btn ghost', text: '도움말 보기', onclick: () => showHint() });
      const right = h('div', { class: 'quiz-right' }, [
        h('div', { class: 'quiz-head' }, [h('span', { class: 'act', text: ACTS[q.act] }), h('h2', { text: T(q.title) }), dots]),
        body, msg, h('div', { class: 'modal-foot' }, [memBtn, hintBtn, nextBtn])]);
      modal('quiz', [left, right]);
      Sound.sfx('paper');
      Sound.focus(true);

      // 단서 표시(왼쪽 카드의 조각을 누름)
      let clueStep = null;
      left.addEventListener('click', e => {
        const s = e.target.closest('.seg'); if (!s || !clueStep) return;
        const cid = s.getAttribute('data-seg').split(':')[0];
        const base = CARDS[cid] && CARDS[cid].kind === 'gloss' ? CARDS[cid].of : cid;
        if (clueStep.from.indexOf(base) < 0 && clueStep.from.indexOf(cid) < 0) return;
        s.classList.toggle('picked'); Sound.sfx('tick');
        ans[clueStep.k] = Array.prototype.map.call(left.querySelectorAll('.seg.picked'), x => x.textContent);
        renderCount();
      });
      function paintPicked() {
        const all = {}; q.steps.forEach(s => { if (s.t === 'clues' && ans[s.k]) ans[s.k].forEach(t => all[t] = 1); });
        left.querySelectorAll('.seg').forEach(s => s.classList.toggle('picked', !!all[s.textContent]));
      }
      let countEl = null;
      function renderCount() { if (countEl && clueStep) countEl.textContent = '표시한 단서 ' + (ans[clueStep.k] || []).length + '개 (' + clueStep.min + '개 이상)'; }

      function expChips(ids, sel, onChange) {
        const wrap = h('div', { class: 'exps' });
        (ids || []).forEach(eid => {
          const e = EXPS[eid]; if (!e) return;
          if (Store.has('exps', eid)) {
            const on = sel.indexOf(eid) >= 0;
            wrap.appendChild(h('button', { class: 'exp-chip' + (on ? ' on' : ''), title: T(e.text), onclick: (ev) => {
              const k = sel.indexOf(eid); if (k >= 0) sel.splice(k, 1); else sel.push(eid); ev.currentTarget.classList.toggle('on'); Sound.sfx('tick'); onChange && onChange();
            } }, [h('b', { text: T(e.title) }), h('small', { text: T(e.text) })]));
          } else {
            wrap.appendChild(h('button', { class: 'exp-chip dim', onclick: () => rewalk(eid) }, [h('b', { text: '흐릿한 기억' }), h('small', { text: '아직 겪지 않았거나 지나친 일입니다. 눌러서 그때로 다시 걸어가 보세요.' })]));
          }
        });
        return wrap;
      }
      function basisBox(val, ids) {
        val.basis = val.basis || []; val.exps = val.exps || [];
        const box = h('div', { class: 'basis' }, [h('div', { class: 'basis-q', text: '무엇을 근거로 삼았나요? (여러 개 고를 수 있어요)' })]);
        const row = h('div', { class: 'basis-row' });
        BASIS.forEach(b => row.appendChild(h('button', { class: 'chip' + (val.basis.indexOf(b[0]) >= 0 ? ' on' : ''), text: b[1], onclick: (ev) => {
          const k = val.basis.indexOf(b[0]); if (k >= 0) val.basis.splice(k, 1); else val.basis.push(b[0]); ev.currentTarget.classList.toggle('on'); Sound.sfx('tick');
        } })));
        box.appendChild(row);
        if (ids && ids.length) { box.appendChild(h('div', { class: 'basis-q', text: '근거로 쓴 경험 카드가 있으면 눌러 주세요.' })); box.appendChild(expChips(ids, val.exps)); }
        return box;
      }
      async function rewalk(eid) {
        if (!window.Game || !Game.memoryWalk) return;
        $('overlay').classList.add('parked');
        await Game.memoryWalk(eid);
        $('overlay').classList.remove('parked'); UI.mode = 'modal';
        rec.rewalk.push(eid); render();
      }
      function memList() {
        // 앞에서 듣고 겪은 일을 다시 떠올린다. 떠올린 것은 선생님 화면에 기록된다.
        const ids = (q.exps || []).concat((q.steps[i].exps || []).filter(x => (q.exps || []).indexOf(x) < 0));
        body.innerHTML = '';
        body.appendChild(h('p', { class: 'step-q', text: '이 물음을 푸는 데 도움이 될 만한 기억입니다. 그때 듣고 겪은 일을 떠올려 보세요.' }));
        ids.forEach(eid => {
          const e = EXPS[eid]; if (!e) return;
          if (Store.has('exps', eid)) {
            if (rec.recall.indexOf(eid) < 0) rec.recall.push(eid);
            const who = e.say && e.say[0], pid = who && window.Game && Game.portraitId ? Game.portraitId(who, e.say[1]) : null;
            const name = who ? (window.Game && Game.nameOf ? Game.nameOf(who) : who) : '';
            body.appendChild(h('div', { class: 'recall' }, [
              pid ? h('img', { src: assetUrl(pid), alt: '' }) : h('div', { class: 'recall-ico', text: '기억' }),
              h('div', null, [h('b', { text: T(e.title) }), e.say ? h('p', { class: 'recall-say', text: T(name) + ': 「' + T(e.say[2]) + '」' }) : null, h('small', { text: T(e.text) }), e.pic ? UI.pic(e.pic) : null])]));
          } else {
            body.appendChild(h('div', { class: 'recall dim' }, [h('div', { class: 'recall-ico', text: '?' }),
              h('div', null, [h('b', { text: '아직 겪지 못한 일' }), h('small', { text: '지나쳤거나 살펴보지 않은 일입니다.' }),
                e.mem ? h('button', { class: 'btn', text: '그때로 걸어가 보기', onclick: () => rewalk(eid) }) : null])]));
          }
        });
        body.appendChild(h('button', { class: 'btn primary', text: '물음으로 돌아가기', onclick: () => render() }));
        nextBtn.style.display = 'none'; body.scrollTop = 0;
      }
      function showHint() {
        const s = q.steps[i]; if (!s.hint) return;
        if (rec.hints.indexOf(s.k) < 0) rec.hints.push(s.k);
        msg.className = 'quiz-msg hint'; msg.textContent = '도움말: ' + T(s.hint);
      }

      function render() {
        const s = q.steps[i];
        afterShown = false; clueStep = null; countEl = null;
        msg.className = 'quiz-msg'; msg.textContent = '';
        nextBtn.style.display = ''; nextBtn.textContent = '다음';
        dots.innerHTML = ''; q.steps.forEach((x, k) => dots.appendChild(h('i', { class: k < i ? 'done' : k === i ? 'now' : '' })));
        const hasExp = (q.exps && q.exps.length) || (s.exps && s.exps.length);
        memBtn.style.display = hasExp ? '' : 'none'; hintBtn.style.display = s.hint ? '' : 'none';
        left.classList.toggle('selecting', s.t === 'clues'); paintPicked();
        body.innerHTML = '';
        body.appendChild(h('p', { class: 'step-q', text: T(s.q) }));
        (s.notes || []).forEach(n => body.appendChild(h('p', { class: 'step-note' }, [h('b', { text: n[0] + ' ' }), T(n[1])])));
        if (s.t === 'text' || s.t === 'letter') {
          const ta = h('textarea', { rows: s.t === 'letter' ? 9 : (s.rows || 3), placeholder: s.ph ? T(s.ph) : '여기에 써 보세요', class: s.t === 'letter' ? 'letter' : '' });
          ta.value = ans[s.k] || ''; const cnt = h('div', { class: 'count' });
          const up = () => { ans[s.k] = ta.value; cnt.textContent = ta.value.trim().length + '자' + (s.min ? ' / ' + s.min + '자 이상' : ''); };
          ta.addEventListener('input', up); up(); body.appendChild(ta); body.appendChild(cnt); setTimeout(() => ta.focus(), 60);
        } else if (s.t === 'number') {
          const inp = h('input', { type: 'number', class: 'num', inputmode: 'numeric' }); inp.value = ans[s.k] || '';
          inp.addEventListener('input', () => ans[s.k] = inp.value);
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
          body.appendChild(h('div', { class: 'numrow' }, [inp, h('span', { text: s.unit || '' })])); setTimeout(() => inp.focus(), 60);
        } else if (s.t === 'choice') {
          const cur = ans[s.k] ? ans[s.k].i : -1;
          const box = h('div', { class: 'choices' });
          s.opts.forEach((o, k) => box.appendChild(h('button', { class: 'choice' + (k === cur ? ' on' : ''), text: T(o), onclick: (ev) => {
            ans[s.k] = { i: k, text: T(o) }; box.querySelectorAll('.choice').forEach(b => b.classList.remove('on')); ev.currentTarget.classList.add('on'); Sound.sfx('tick');
          } })));
          body.appendChild(box);
        } else if (s.t === 'clues') {
          clueStep = s; ans[s.k] = ans[s.k] || [];
          body.appendChild(h('div', { class: 'clue-guide', html: '왼쪽 글에서 <b>낱말이나 문장을 눌러</b> 단서로 표시하세요. 다시 누르면 지워집니다.<br>신문 이름이나 날짜도 단서가 될 수 있습니다.' }));
          countEl = h('div', { class: 'count big' }); body.appendChild(countEl); renderCount();
        } else if (s.t === 'classify') {
          const st = ans[s.k] && ans[s.k].pick ? ans[s.k] : (ans[s.k] = { pick: {} });
          const order = s.items.map((x, k) => k).sort((a, b) => ((a * 7 + 3) % s.items.length) - ((b * 7 + 3) % s.items.length));
          order.forEach(k => {
            const row = h('div', { class: 'cl-row', 'data-k': k }, [h('span', { class: 'cl-text', text: T(s.items[k][0]) })]);
            s.bins.forEach((b, bi) => row.appendChild(h('button', { class: 'chip' + (st.pick[k] === bi ? ' on' : ''), text: b, onclick: (ev) => {
              st.pick[k] = bi; row.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); ev.currentTarget.classList.add('on'); row.classList.remove('wrong'); Sound.sfx('tick');
            } })));
            body.appendChild(row);
          });
        } else if (s.t === 'build') {
          const st = { placed: [] };
          const all = s.pieces.concat(s.extra || []).map((t, k) => ({ t: t, k: k })).sort((a, b) => ((a.k * 5 + 2) % 7) - ((b.k * 5 + 2) % 7));
          const lineEl = h('div', { class: 'build-line' }), poolEl = h('div', { class: 'build-pool' });
          const draw = () => {
            lineEl.innerHTML = ''; poolEl.innerHTML = '';
            if (!st.placed.length) lineEl.appendChild(h('span', { class: 'ph', text: '아래 조각을 차례대로 누르세요' }));
            st.placed.forEach((p, idx) => lineEl.appendChild(h('button', { class: 'piece on', text: p.t, onclick: () => { st.placed.splice(idx, 1); draw(); } })));
            all.filter(p => st.placed.indexOf(p) < 0).forEach(p => poolEl.appendChild(h('button', { class: 'piece', text: p.t, onclick: () => { st.placed.push(p); Sound.sfx('tick'); draw(); } })));
          };
          draw(); body.appendChild(lineEl); body.appendChild(poolEl); s._st = st;
        } else if (s.t === 'word') {
          const val = ans[s.k] && typeof ans[s.k] === 'object' ? ans[s.k] : (ans[s.k] = { meaning: '' });
          body.appendChild(h('div', { class: 'wordcard' }, [h('div', { class: 'wc-word', text: T(s.word) }), h('div', { class: 'wc-dict', text: s.dict }), h('div', { class: 'wc-arrow', text: '이 글에서는?' })]));
          const ta = h('textarea', { rows: 3, placeholder: '이 글에서 이 말이 뜻하는 것을 써 보세요' }); ta.value = val.meaning || '';
          ta.addEventListener('input', () => val.meaning = ta.value); body.appendChild(ta);
          body.appendChild(basisBox(val, s.exps || q.exps)); setTimeout(() => ta.focus(), 60);
        } else if (s.t === 'basis') {
          const val = ans[s.k] && typeof ans[s.k] === 'object' ? ans[s.k] : (ans[s.k] = {});
          body.appendChild(basisBox(val, q.exps));
        }
        body.scrollTop = 0;
      }

      function fail(text, k) { rec.attempts[k] = (rec.attempts[k] || 0) + 1; msg.className = 'quiz-msg warn'; msg.textContent = text; Sound.sfx('no'); return false; }
      function check(s) {
        const v = ans[s.k];
        if (s.t === 'text' || s.t === 'letter') { if ((v || '').trim().length < (s.min || 1)) return fail('조금 더 자세히 써 볼까요? (' + (s.min || 1) + '자 이상)', s.k); }
        else if (s.t === 'number') { if (String(v || '').trim() === '') return fail('숫자를 써 주세요.', s.k);
          if (Number(v) !== s.answer) { const n = (rec.attempts[s.k] || 0) + 1; return fail(n >= 2 ? '다시 셈해 보세요. 필요한 숫자는 낱말 풀이나 아버지 말씀 속에 있습니다.' : '다시 셈해 볼까요?', s.k); } }
        else if (s.t === 'choice') { if (!v) return fail('하나를 골라 주세요.', s.k);
          if (s.correct != null && v.i !== s.correct) { if (ans[s.k + '_first'] == null) ans[s.k + '_first'] = v.text; return fail('다시 한번 생각해 볼까요?', s.k); } }
        else if (s.t === 'clues') { if ((v || []).length < (s.min || 1)) return fail('단서를 ' + (s.min || 1) + '개 이상 표시해 주세요.', s.k); }
        else if (s.t === 'classify') {
          let bad = 0; body.querySelectorAll('.cl-row').forEach(r => { const k = +r.getAttribute('data-k'); const ok = v.pick[k] === s.items[k][1]; r.classList.toggle('wrong', !ok); if (!ok) bad++; });
          if (bad) return fail('다시 살펴볼 것이 ' + bad + '개 있습니다. 붉게 표시된 것을 다시 생각해 보세요. 「…일 것이다」, 「…일지 모른다」는 직접 본 것일까요?', s.k);
          v.ok = true;
        } else if (s.t === 'build') {
          const got = s._st.placed.map(p => p.t);
          const same = arr => arr.length === got.length && arr.every((t, k) => t === got[k]);
          if (![s.pieces].concat(s.alts || []).some(same)) { const n = (rec.attempts[s.k] || 0) + 1; return fail(n >= 3 ? '첫 조각은 「' + s.pieces[0] + '」입니다.' : '차례나 조각이 조금 다릅니다. 「무엇을」, 「무엇을 바탕으로」, 「어떻게 하는 것」이 모두 들어가게 놓아 보세요.', s.k); }
          ans[s.k] = { ok: true };
        } else if (s.t === 'word') { if ((v.meaning || '').trim().length < 6) return fail('이 글에서의 뜻을 조금 더 써 주세요.', s.k); if (!(v.basis || []).length) return fail('근거를 하나 이상 골라 주세요.', s.k); }
        else if (s.t === 'basis') { if (!(v.basis || []).length) return fail('근거를 하나 이상 골라 주세요.', s.k); }
        return true;
      }
      function go() {
        const s = q.steps[i];
        if (!afterShown) {
          if (!check(s)) return;
          Sound.sfx('good');
          if (s.after) { afterShown = true; msg.className = 'quiz-msg after'; msg.innerHTML = '<b>생각 넓히기</b> ' + T(s.after); nextBtn.textContent = '계속'; return; }
        }
        i++;
        if (i >= q.steps.length) {
          rec.ms = Date.now() - t0;
          Store.answer(id, rec); closeModal(); UI._adv = null; Sound.focus(false); resolve(rec); return;
        }
        render();
      }
      body.addEventListener('input', () => { if (msg.classList.contains('warn')) { msg.className = 'quiz-msg'; msg.textContent = ''; } });
      body.addEventListener('click', e => { if (e.target.closest('button') && msg.classList.contains('warn')) { msg.className = 'quiz-msg'; msg.textContent = ''; } });
      UI._adv = null;
      render();
    });
  };

  // ─────────── 읽기 수첩 ───────────
  UI.notebook = function (tab) {
    return new Promise(res => {
      const prevMode = UI.mode;
      const tabs = [['concept', '배운 것'], ['cards', '글 카드'], ['exps', '경험 카드'], ['mine', '내가 쓴 글'], ['help', '도움말']];
      const body = h('div', { class: 'nb-body' }), bar = h('div', { class: 'nb-tabs' });
      const close = () => { closeModal(); UI.mode = prevMode === 'modal' ? 'walk' : prevMode; UI._adv = null; res(); };
      function show(t) {
        bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === t));
        body.innerHTML = '';
        const d = Store.data;
        if (t === 'concept') {
          if (!d.concepts.length) body.appendChild(h('p', { class: 'empty', text: '아직 배운 것이 없습니다. 이야기를 따라가면 한 장씩 채워집니다.' }));
          d.concepts.forEach(id => body.appendChild(h('div', { class: 'nb-concept' }, [h('h3', { text: CONCEPTS[id].title }), h('p', { text: CONCEPTS[id].text })])));
        } else if (t === 'cards') {
          if (!d.cards.length) body.appendChild(h('p', { class: 'empty', text: '아직 모은 글이 없습니다.' }));
          const grid = h('div', { class: 'nb-grid' });
          d.cards.forEach(id => { const c = CARDS[id]; if (!c || c.kind === 'gloss') return;
            grid.appendChild(h('button', { class: 'nb-card kind-' + c.kind, onclick: () => { body.innerHTML = ''; body.appendChild(h('button', { class: 'btn', text: '← 목록으로', onclick: () => show('cards') })); body.appendChild(cardGroup(id)); } },
              [h('span', { class: 'tag tag-' + c.kind, text: KIND[c.kind] }), h('b', { text: T(c.title || c.head || '') }), h('small', { text: T((c.lines || (c.stanzas ? c.stanzas[0] : ['']))[0]).slice(0, 34) })])); });
          body.appendChild(grid);
        } else if (t === 'exps') {
          if (!d.exps.length) body.appendChild(h('p', { class: 'empty', text: '아직 경험 카드가 없습니다. 길에서 빛나는 것을 살펴보세요.' }));
          d.exps.forEach(id => body.appendChild(h('div', { class: 'nb-exp' }, [h('h3', { text: T(EXPS[id].title) }), h('p', { text: T(EXPS[id].text) }), EXPS[id].pic ? UI.pic(EXPS[id].pic) : null])));
        } else if (t === 'mine') {
          const ids = Object.keys(d.answers);
          if (!ids.length) body.appendChild(h('p', { class: 'empty', text: '아직 쓴 글이 없습니다.' }));
          ids.forEach(id => { const q = QUIZZES[id]; if (!q) return; const box = h('div', { class: 'nb-mine' }, [h('h3', { text: T(q.title) })]);
            q.steps.forEach(s => { const v = d.answers[id].steps[s.k]; const txt = typeof v === 'string' ? v : v && v.meaning ? v.meaning : null; if (txt) box.appendChild(h('p', { text: txt })); });
            body.appendChild(box); });
        } else {
          body.appendChild(h('div', { class: 'nb-help', html: helpHTML() }));
          body.appendChild(h('div', { class: 'nb-actions' }, [
            h('button', { class: 'btn', text: '내 기록 내려받기', onclick: () => Store.exportFile() }),
            h('button', { class: 'btn', text: '출처 모아 보기', onclick: () => { close(); UI.sources(); } }),
            h('button', { class: 'btn', text: '장 고르는 곳으로', onclick: () => { close(); window.Game && Game.toMenu(); } })]));
          body.appendChild(h('p', { class: 'empty', text: (CONFIG.ENDPOINT ? '선생님께 보낸 답 ' + Store.data.sent + '개, 보내려고 기다리는 답 ' + Store.data.queue.length + '개' : '이 기기에만 저장되고 있습니다.') }));
        }
      }
      tabs.forEach(t => bar.appendChild(h('button', { 'data-t': t[0], text: t[1], onclick: () => { Sound.sfx('paper'); show(t[0]); } })));
      modal('notebook', [h('div', { class: 'nb-head' }, [h('h2', { text: T('{name}의 읽기 수첩') }), h('button', { class: 'btn', text: '닫기', onclick: close })]), bar, body]);
      UI._adv = null; show(tab || 'concept'); Sound.sfx('paper');
    });
  };
  function helpHTML() {
    return '<table class="keys"><tr><td><kbd>↑</kbd> <kbd>W</kbd></td><td>앞으로 걷기 (누르고 있는 동안)</td></tr><tr><td><kbd>↓</kbd> <kbd>S</kbd></td><td>몇 걸음 물러서기</td></tr>' +
      '<tr><td><kbd>←</kbd><kbd>→</kbd> <kbd>A</kbd><kbd>D</kbd></td><td>몸 돌리기 (누르는 동안 돌고, 떼면 그 방향을 봅니다). 화면을 마우스로 끌어도 됩니다</td></tr><tr><td><kbd>스페이스</kbd> <kbd>Enter</kbd></td><td>하기 · 대사 넘기기</td></tr>' +
      '<tr><td><kbd>Tab</kbd></td><td>읽기 수첩 열기</td></tr></table><p>화면 위의 <b>화살표</b>가 가야 할 곳을 가리킵니다. 길에서 <b>빛나는 표시</b>가 보이면 가까이 가서 스페이스를 누르세요. 그냥 지나가도 되지만, 살펴본 것은 <b>경험 카드</b>가 되어 나중에 글을 읽을 때 근거로 쓸 수 있습니다.</p>';
  }
  UI.help = function (kind) {
    return new Promise(res => {
      const html = kind === 'walk' ? '<h2>걷는 법</h2>' + helpHTML() : '<h2>살펴보기</h2><p>길에서 <b>빛나는 표시</b>가 보이면 가까이 가서 <kbd>스페이스</kbd>를 누르세요.</p><p>붉은 표시는 꼭 해야 하는 일, 푸른 표시는 해도 되고 안 해도 되는 일입니다. 살펴본 것은 <b>경험 카드</b>가 됩니다.</p>';
      const done = () => { closeModal(); UI._adv = null; res(); };
      modal('helpbox', [h('div', { html: html }), h('div', { class: 'modal-foot' }, [h('button', { class: 'btn primary', text: '알겠어요', onclick: done })])]);
      UI._adv = done;
    });
  };

  // ─────────── 약도(이야기 속에서 그려 받은 길 그림) ───────────
  const PICS = {
    jongno: { title: '약방 주인이 그려 준 길',
      cap: '실선은 지금도 서울 종로에 있는 곳(종로 큰길, 탑골공원, 인사동)이고, 점선은 이야기 속에서 지어낸 곳(우리 가게, 골목, 약방)입니다. 거리와 방향은 간단히 줄여 그렸습니다.',
      svg: '<svg viewBox="0 0 560 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="종로 큰길과 탑골공원, 인사동, 우리 가게를 그린 약도">'
        + '<rect x="1" y="1" width="558" height="298" rx="6" fill="#fbf4e2" stroke="#a48f6c"/>'
        + '<g stroke="#4a3828" stroke-width="2" stroke-linejoin="round">'
        + '<rect x="18" y="118" width="524" height="36" fill="#e9d8b2"/>'
        + '<rect x="150" y="26" width="170" height="84" rx="5" fill="#f4e4c9"/>'
        + '<rect x="332" y="40" width="130" height="70" rx="14" fill="#cddbb6"/></g>'
        + '<g fill="none" stroke="#4a3828" stroke-width="2" stroke-dasharray="7 6" stroke-linecap="round">'
        + '<path d="M128 224 H462 M128 252 H462"/><path d="M286 154 V224 M314 154 V224"/>'
        + '<rect x="16" y="210" width="112" height="56" rx="4" fill="#fffaf0"/><rect x="462" y="210" width="82" height="56" rx="4" fill="#fffaf0"/></g>'
        + '<circle cx="300" cy="238" r="7" fill="#a8281f"/>'
        + '<g font-family="inherit" font-size="25" fill="#2b2118" text-anchor="middle" font-weight="700">'
        + '<text x="100" y="145">종로 큰길</text><text x="235" y="77">인사동</text><text x="397" y="84">탑골공원</text>'
        + '<text x="72" y="246" font-size="22">우리 가게</text><text x="503" y="246" font-size="22">약방</text>'
        + '<text x="300" y="286" font-size="20" font-weight="400">갈림길</text><text x="392" y="208" font-size="19" font-weight="400">골목</text></g></svg>' }
  };
  UI.pic = function (id) { const p = PICS[id]; return p ? h('figure', { class: 'pic' }, [h('div', { html: p.svg }), h('figcaption', { text: p.cap })]) : null; };
  UI.showPic = function (id) {
    return new Promise(res => {
      const p = PICS[id]; if (!p) return res();
      const done = () => { closeModal(); UI._adv = null; res(); };
      modal('picbox', [h('h2', { text: p.title }), UI.pic(id), h('div', { class: 'modal-foot' }, [h('button', { class: 'btn primary', text: '잘 보았어요', onclick: done })])]);
      UI._adv = done;
    });
  };

  // ─────────── 출처 모아 보기 ───────────
  UI.sources = function () {
    return new Promise(res => {
      const body = h('div', { class: 'src-body' });
      body.appendChild(h('p', { html: '이 게임 속 <b>실제 자료</b>는 1918~1923년에 쓰인 글을 고치지 않고 실은 것입니다. <b>제작자 풀이</b>는 그 원문을 쉬운 말로 바꾼 것이고, <b>창작 지문</b>은 확인된 사실을 바탕으로 새로 지은 글입니다. 주인공과 가족, 한결은 모두 지어낸 인물입니다.' }));
      body.appendChild(h('h3', { text: '실제 자료' }));
      Object.keys(CARDS).forEach(id => { const c = CARDS[id]; if (c.kind !== 'real') return;
        body.appendChild(h('div', { class: 'src-row' }, [h('b', { text: (c.lines ? c.lines[0] : c.pre.join(' · ')).slice(0, 60) }), h('span', { text: c.src.who + ' · ' + c.src.date + ' · ' + c.src.where }), h('small', { text: c.src.org + ' · ' + c.src.url + ' · 확인 ' + c.src.checked })])); });
      body.appendChild(h('h3', { text: '창작 지문의 바탕이 된 사실' }));
      Object.keys(CARDS).forEach(id => { const c = CARDS[id]; if (c.kind !== 'made') return;
        c.basis.forEach(b => body.appendChild(h('div', { class: 'src-row' }, [h('b', { text: T(c.title) }), h('span', { text: b.fact }), h('small', { text: b.src + (b.url ? ' · ' + b.url : '') })]))); });
      body.appendChild(h('h3', { text: '그림과 소리' }));
      body.appendChild(h('p', { text: '모든 그림은 이 게임을 위해 새로 만든 창작 삽화입니다. 실제 사진이나 유물 사진이 아닙니다. 그림 속에는 일부러 글자를 넣지 않았습니다. 효과음은 게임 안에서 만든 소리입니다.' }));
      const done = () => { closeModal(); UI._adv = null; res(); };
      modal('sources', [h('div', { class: 'nb-head' }, [h('h2', { text: '출처 모아 보기' }), h('button', { class: 'btn', text: '닫기', onclick: done })]), body]);
      UI._adv = null;
    });
  };

  window.UI = UI;
})();

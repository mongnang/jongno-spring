/* 선생님 화면: 학생 답 모아 보기 · 채점 · 내보내기 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const QIDS = STORY.order.reduce((a, ch) => a.concat(Object.keys(QUIZZES).filter(q => QUIZZES[q].ch === ch)), []);
  const BASIS = { clue: '글 속 단서', exp: '경험', know: '지식' };
  const GKEY = 'jongno1919:grades';
  let students = {}, grades = {}, tab = 'grid', sel = { quiz: QIDS[0], stu: null };
  try { grades = JSON.parse(localStorage.getItem(GKEY) || '{}'); } catch (e) { grades = {}; }

  function josa(w, j) { const c = w.charCodeAt(w.length - 1), jong = (c - 0xAC00) % 28 !== 0; const P = { '은는': ['은', '는'], '이가': ['이', '가'], '을를': ['을', '를'], '아야': ['아', '야'], '과와': ['과', '와'], '이_': ['이', ''] }; return P[j] ? P[j][jong ? 0 : 1] : (j || ''); }
  const T = (s, hero) => String(s || '').replace(/\{(name|hg|bme|bhg)(?:\|([^}]+))?\}/g, (m, k, j) => { const w = k === 'name' ? (hero || '주인공') : k === 'hg' ? '한결' : k === 'bme' ? '언니·오빠' : '한결'; return w + josa(w, j); });
  const skey = r => [r.cls, r.num, r.name].join('|');

  function ingest(rows, gr) {
    rows.forEach(r => {
      if (!r.name) return;
      const k = skey(r), s = students[k] || (students[k] = { cls: String(r.cls), num: String(r.num), name: r.name, hero: r.hero, q: {}, ev: [] });
      if (r.hero) s.hero = r.hero;
      if (r.type === 'answer') { const old = s.q[r.quiz]; if (!old || new Date(r.ts) >= new Date(old.ts)) s.q[r.quiz] = r; }
      else s.ev.push(r);
    });
    (gr || []).forEach(g => { grades[[g.cls, g.num, g.name, g.quiz].join('|')] = { grade: g.grade, memo: g.memo || '' }; });
    $('count').textContent = '학생 ' + Object.keys(students).length + '명';
    render();
  }
  const list = () => Object.values(students).sort((a, b) => a.cls.localeCompare(b.cls) || (+a.num - +b.num));

  function stepText(q, s, v) {
    if (v == null) return '';
    if (s.t === 'text' || s.t === 'letter' || s.t === 'number') return String(v);
    if (s.t === 'choice') return v.text || '';
    if (s.t === 'clues') return (v || []).map(x => '· ' + x).join('\n');
    if (s.t === 'word') return (v.meaning || '') + '\n  근거: ' + (v.basis || []).map(b => BASIS[b]).join(', ') + ((v.exps || []).length ? ' / 경험 카드: ' + v.exps.map(e => T(EXPS[e] ? EXPS[e].title : e)).join(', ') : '');
    if (s.t === 'basis') return '근거: ' + (v.basis || []).map(b => BASIS[b]).join(', ') + ((v.exps || []).length ? ' / 경험 카드: ' + v.exps.map(e => T(EXPS[e] ? EXPS[e].title : e)).join(', ') : '');
    if (s.t === 'classify' || s.t === 'build') return v.ok ? '(완성)' : '';
    return JSON.stringify(v);
  }
  function answerHTML(st, qid, withGrade) {
    const q = QUIZZES[qid], r = st.q[qid];
    if (!r) return '<div class="card"><h3>' + esc(T(q.title, st.hero)) + '</h3><span class="none">아직 답하지 않음</span></div>';
    let h = '<div class="card"><h3>' + esc(ACTS[q.act]) + ' · ' + esc(T(q.title, st.hero)) + '</h3>';
    h += '<div class="meta">' + [r.tries > 1 ? '<span class="tagx">' + r.tries + '번째 답</span>' : '', r.rewalk ? '<span class="tagx warn">기억 다시 걷기: ' + esc(String(r.rewalk).split(',').map(e => T(EXPS[e] ? EXPS[e].title : e)).join(', ')) + '</span>' : '',
      r.recall ? '<span class="tagx">회상 떠올림: ' + esc(String(r.recall).split(',').map(e => T(EXPS[e] ? EXPS[e].title : e)).join(', ')) + '</span>' : '',
      r.hints ? '<span class="tagx warn">도움말 봄: ' + esc(r.hints) + '</span>' : '', '<span class="tagx">' + Math.round((r.ms || 0) / 1000) + '초</span>'].join('') + '</div>';
    q.steps.forEach(s => { const t = stepText(q, s, (r.steps || {})[s.k]); if (!t) return;
      h += '<div class="q">' + ((q.grade || []).indexOf(s.k) >= 0 ? '★ ' : '') + esc(T(s.q, st.hero)) + '</div><div class="a">' + esc(t) + '</div>'; });
    if (withGrade) h += gradeHTML(st, qid);
    return h + '</div>';
  }
  function gradeHTML(st, qid) {
    const k = [st.cls, st.num, st.name, qid].join('|'), g = grades[k] || {};
    return '<div class="grade" data-k="' + esc(k) + '">채점 ' + ['상', '중', '하'].map(x => '<button class="btn ' + x + (g.grade === x ? ' on' : '') + '" data-g="' + x + '">' + x + '</button>').join('') +
      ' <input type="text" placeholder="메모" value="' + esc(g.memo || '') + '" style="width:16em"></div>';
  }
  function saveGrade(k, grade, memo) {
    grades[k] = { grade: grade, memo: memo || '' };
    try { localStorage.setItem(GKEY, JSON.stringify(grades)); } catch (e) {}
    const p = k.split('|');
    if (conn.url && conn.key) fetch(conn.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: conn.key, grades: [{ cls: p[0], num: p[1], name: p[2], quiz: p[3], grade: grade, memo: memo || '' }] }) }).catch(() => {});
  }
  function flags(st) {
    const f = []; let rw = 0, hints = 0, len = 0, n = 0; const kinds = {};
    QIDS.forEach(qid => { const r = st.q[qid]; if (!r) return; if (r.rewalk) rw += String(r.rewalk).split(',').filter(Boolean).length; if (r.hints) hints += String(r.hints).split(',').filter(Boolean).length;
      QUIZZES[qid].steps.forEach(s => { const v = (r.steps || {})[s.k]; if (typeof v === 'string' && (s.t === 'text' || s.t === 'letter')) { len += v.trim().length; n++; } if (v && v.basis) kinds[v.basis.slice().sort().join('+')] = 1; }); });
    const done = QIDS.filter(q => st.q[q]).length;
    if (done < QIDS.length) f.push('답한 문항 ' + done + '/' + QIDS.length);
    if (rw >= 3) f.push('기억 다시 걷기 ' + rw + '번 (배경지식 보충 필요)');
    if (hints) f.push('마무리 읽기에서 도움말 ' + hints + '번');
    if (n >= 3 && len / n < 18) f.push('서술 답이 짧음 (평균 ' + Math.round(len / n) + '자)');
    if (Object.keys(kinds).length === 1 && done >= 6) f.push('근거 유형을 늘 한 가지로만 고름 (' + Object.keys(kinds)[0].split('+').map(b => BASIS[b]).join('+') + ')');
    const low = QIDS.filter(q => (grades[[st.cls, st.num, st.name, q].join('|')] || {}).grade === '하').length; if (low >= 3) f.push('「하」 ' + low + '개');
    return f;
  }

  function render() {
    const nav = $('nav'); nav.innerHTML = '';
    [['grid', '한눈에'], ['quiz', '문항별 · 채점'], ['stu', '학생별'], ['flag', '살펴볼 학생'], ['out', '내보내기']].forEach(t => {
      const b = document.createElement('button'); b.textContent = t[1]; b.className = tab === t[0] ? 'on' : ''; b.onclick = () => { tab = t[0]; render(); }; nav.appendChild(b); });
    const m = $('main'), L = list();
    if (!L.length) { m.innerHTML = '<p class="note">아직 불러온 자료가 없습니다.</p>'; return; }
    if (tab === 'grid') {
      let h = '<p class="note">칸을 누르면 그 학생의 답을 봅니다. 색: <span class="g상">상</span> <span class="g중">중</span> <span class="g하">하</span> <span class="ans">답함(채점 전)</span> · ↺ 기억 다시 걷기</p><div class="wrap"><table class="grid"><tr><th>반</th><th>번호</th><th>이름</th>';
      QIDS.forEach(q => h += '<th class="q" title="' + esc(T(QUIZZES[q].title)) + '">' + esc(STORY.chapters[QUIZZES[q].ch].title.split(' · ')[0]) + '<br>' + esc(ACTS[QUIZZES[q].act].slice(0, 1)) + ' ' + esc(T(QUIZZES[q].title).slice(0, 7)) + '</th>');
      h += '</tr>';
      L.forEach(st => { h += '<tr><td>' + esc(st.cls) + '</td><td>' + esc(st.num) + '</td><td><a href="#" data-stu="' + esc(skey(st)) + '">' + esc(st.name) + '</a></td>';
        QIDS.forEach(q => { const r = st.q[q], g = (grades[[st.cls, st.num, st.name, q].join('|')] || {}).grade;
          h += '<td class="c ' + (r ? (g ? 'g' + g : 'ans') : '') + '" data-stu="' + esc(skey(st)) + '" data-quiz="' + q + '">' + (r ? (g || '○') + (r.rewalk ? '↺' : '') : '<span class="none">·</span>') + '</td>'; });
        h += '</tr>'; });
      m.innerHTML = h + '</table></div>';
      m.querySelectorAll('[data-stu]').forEach(e => e.onclick = ev => { ev.preventDefault(); sel.stu = e.getAttribute('data-stu'); if (e.getAttribute('data-quiz')) { sel.quiz = e.getAttribute('data-quiz'); } tab = 'stu'; render(); });
    } else if (tab === 'quiz') {
      const q = QUIZZES[sel.quiz];
      let h = '<div class="bar"><b>문항</b> <select id="s-quiz">' + QIDS.map(id => '<option value="' + id + '"' + (id === sel.quiz ? ' selected' : '') + '>' + esc(STORY.chapters[QUIZZES[id].ch].title.split(' · ')[0] + ' · ' + ACTS[QUIZZES[id].act] + ' · ' + T(QUIZZES[id].title)) + '</option>').join('') + '</select></div>';
      h += '<div class="rubric"><b>채점 기준</b> (★ 표시한 물음을 중심으로) &nbsp; 상: ' + esc(q.rubric[0]) + ' &nbsp;/&nbsp; 중: ' + esc(q.rubric[1]) + ' &nbsp;/&nbsp; 하: ' + esc(q.rubric[2]) + '</div>';
      h += '<p class="note">읽은 글: ' + (q.cards || []).map(c => esc(T(CARDS[c].title || CARDS[c].head || (CARDS[c].lines || [''])[0]))).join(' · ') + '</p>';
      L.forEach(st => { h += '<h4 style="margin:1em 0 0">' + esc(st.cls + ' ' + st.num + '번 ' + st.name) + '</h4>' + answerHTML(st, sel.quiz, !!st.q[sel.quiz]); });
      m.innerHTML = h; $('s-quiz').onchange = e => { sel.quiz = e.target.value; render(); }; bindGrades(m);
    } else if (tab === 'stu') {
      if (!sel.stu || !students[sel.stu]) sel.stu = skey(L[0]);
      const st = students[sel.stu];
      let h = '<div class="bar"><b>학생</b> <select id="s-stu">' + L.map(s => '<option value="' + esc(skey(s)) + '"' + (skey(s) === sel.stu ? ' selected' : '') + '>' + esc(s.cls + ' ' + s.num + '번 ' + s.name) + '</option>').join('') + '</select> <span class="note">이야기 속 이름: ' + esc(st.hero || '') + '</span></div>';
      const f = flags(st); if (f.length) h += '<p>' + f.map(x => '<span class="tagx warn">' + esc(x) + '</span>').join('') + '</p>';
      STORY.order.forEach(ch => { h += '<h3 style="color:var(--red);margin:1.2em 0 0">' + esc(STORY.chapters[ch].title) + '</h3>'; QIDS.filter(q => QUIZZES[q].ch === ch).forEach(q => h += answerHTML(st, q, !!st.q[q])); });
      m.innerHTML = h; $('s-stu').onchange = e => { sel.stu = e.target.value; render(); }; bindGrades(m);
    } else if (tab === 'flag') {
      let h = '<p class="note">자동으로 표시한 것입니다. 판단은 선생님이 답을 직접 읽고 내려 주세요.</p><table><tr><th>학생</th><th>살펴볼 점</th></tr>';
      L.forEach(st => { const f = flags(st); if (f.length) h += '<tr><td><a href="#" data-stu="' + esc(skey(st)) + '">' + esc(st.cls + ' ' + st.num + '번 ' + st.name) + '</a></td><td>' + f.map(esc).join('<br>') + '</td></tr>'; });
      m.innerHTML = h + '</table>';
      m.querySelectorAll('[data-stu]').forEach(e => e.onclick = ev => { ev.preventDefault(); sel.stu = e.getAttribute('data-stu'); tab = 'stu'; render(); });
    } else {
      m.innerHTML = '<div class="card"><h3>AI에게 살펴보게 하기</h3><p class="note">챗GPT, 제미나이, 클로드 같은 AI에 그대로 넣을 수 있는 묶음입니다. 채점 기준·지문·학생 답이 한 파일에 들어 있고, <b>학생 이름은 「학생 01」처럼 번호로 가려집니다.</b> 어느 번호가 누구인지는 이름표 파일에만 남으니, 이름표는 AI에 넣지 마세요.</p>'
        + '<div class="bar"><button class="btn primary" id="b-ai">① AI 검수용 묶음 받기</button><button class="btn" id="b-map">② 이름표 받기 (내 컴퓨터에만 보관)</button><button class="btn" id="b-rev">③ 보고서를 다시 검수시키는 프롬프트 받기</button></div>'
        + '<p class="note">쓰는 법: ① 파일을 AI 대화창에 올리거나 내용을 붙여 넣으면 보고서가 나옵니다. 더 꼼꼼히 하려면 다른 AI(또는 새 대화)에 ③의 프롬프트, ① 파일, 나온 보고서를 함께 넣어 검수시킵니다. AI의 채점은 초안입니다. 학생의 답을 직접 읽고 판단해 주세요.</p></div>'
        + '<div class="bar"><button class="btn primary" id="b-csv">답 전체 내려받기 (CSV, 엑셀에서 열림)</button><button class="btn" id="b-sum">학생별 요약 초안 만들기</button></div><p class="note">요약 초안은 채점 결과를 세어 만든 글감입니다. 그대로 쓰지 말고 학생의 실제 답을 읽고 고쳐 써 주세요.</p><textarea class="out" id="out" readonly></textarea>';
      $('b-csv').onclick = csv; $('b-sum').onclick = () => { $('out').value = L.map(summary).join('\n\n'); };
      $('b-ai').onclick = () => { const d = aiData(); saveText('종로지물포_AI검수_묶음.md', AIKit.prompt(aiQ(), CARDS, ACTS, EXPS) + '\n\n' + d.text + '\n\n# 할 일\n위 [채점 기준 책]에 따라 [학생 답]을 살펴보고, 「보고서 형식」대로 보고서를 써 주세요.\n'); };
      $('b-map').onclick = () => { const d = aiData(); saveText('종로지물포_이름표(보관용).csv', '\ufeff' + [['AI용 번호', '반', '번호', '이름']].concat(d.map).map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv'); };
      $('b-rev').onclick = () => saveText('종로지물포_AI검수_다시보기_프롬프트.md', AIKit.reviewPrompt() + '\n\n(이 아래에 ① AI 검수용 묶음 파일의 내용과, 검수할 보고서를 차례로 붙여 넣으세요.)\n');
    }
  }
  function bindGrades(m) {
    m.querySelectorAll('.grade').forEach(box => { const k = box.getAttribute('data-k'), memo = box.querySelector('input');
      box.querySelectorAll('button').forEach(b => b.onclick = () => { box.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); saveGrade(k, b.getAttribute('data-g'), memo.value); });
      memo.onchange = () => { const g = grades[k]; if (g) saveGrade(k, g.grade, memo.value); }; });
  }
  /* AI 검수용: 문항은 수업 차례대로, 학생은 반·번호 차례대로. 이름은 번호로 가린다 */
  function aiQ() { const o = {}; QIDS.forEach(q => { o[q] = QUIZZES[q]; }); return o; }
  function aiData() { return AIKit.data(list(), aiQ(), ACTS, EXPS, stepText); }
  function saveText(name, text, type) {
    const blob = new Blob([text], { type: (type || 'text/markdown') + ';charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
  }
  function csv() {
    const rows = [['반', '번호', '이름', '장', '활동', '문항', '물음', '답', '회상 떠올림', '기억 다시 걷기', '도움말', '몇 번째 답', '걸린 시간(초)', '채점', '메모']];
    list().forEach(st => QIDS.forEach(qid => { const r = st.q[qid], q = QUIZZES[qid]; if (!r) return; const g = grades[[st.cls, st.num, st.name, qid].join('|')] || {};
      q.steps.forEach(s => { const t = stepText(q, s, (r.steps || {})[s.k]); if (!t) return;
        rows.push([st.cls, st.num, st.name, STORY.chapters[q.ch].title, ACTS[q.act], T(q.title, st.hero), T(s.q, st.hero), t, r.recall || '', r.rewalk || '', r.hints || '', r.tries || 1, Math.round((r.ms || 0) / 1000), g.grade || '', g.memo || '']); }); }));
    const cell = v => { let s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '종로지물포_답모음.csv'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
  }
  function summary(st) {
    const by = {}; QIDS.forEach(q => { const g = (grades[[st.cls, st.num, st.name, q].join('|')] || {}).grade; if (!g) return; const a = QUIZZES[q].act; (by[a] = by[a] || []).push(g); });
    const done = QIDS.filter(q => st.q[q]).length;
    const strong = [], weak = []; Object.keys(by).forEach(a => { const s = by[a].reduce((n, g) => n + (g === '상' ? 2 : g === '중' ? 1 : 0), 0) / by[a].length; (s >= 1.5 ? strong : s < 0.8 ? weak : []).push(ACTS[a].slice(2)); });
    return st.cls + ' ' + st.num + '번 ' + st.name + ': 추론하며 읽기 활동 ' + QIDS.length + '개 가운데 ' + done + '개를 마침.' + (strong.length ? ' ' + strong.join(', ') + '에서 근거를 들어 짐작하는 힘이 돋보임.' : '') +
      (weak.length ? ' ' + weak.join(', ') + '은(는) 단서와 경험을 글과 잇는 연습이 더 필요함.' : '') + (Object.keys(by).length ? '' : ' (아직 채점 전)') + (flags(st).length ? ' [살펴볼 점: ' + flags(st).join(' / ') + ']' : '');
  }

  // ───── 우리 반 연결: 내 구글 시트의 주소와 암호 ─────
  // 주소는 이 컴퓨터에 남기고, 암호는 창을 닫으면 잊는다(「기억하기」를 고르면 남김).
  const LKEY = 'jongno1919:teacher';
  const conn = { url: '', key: '' };
  try { const s = JSON.parse(localStorage.getItem(LKEY) || '{}'); conn.url = s.url || ''; conn.key = s.key || sessionStorage.getItem(LKEY + ':k') || ''; } catch (e) {}
  if (!conn.url && CONFIG.ENDPOINT) conn.url = CONFIG.ENDPOINT;
  function saveConn(keep) {
    try { localStorage.setItem(LKEY, JSON.stringify(keep ? { url: conn.url, key: conn.key } : { url: conn.url })); sessionStorage.setItem(LKEY + ':k', conn.key); } catch (e) {}
  }
  /* 시트에 묻기. 암호가 주소에 남지 않도록 먼저 본문에 실어 보내고, 그 길이 막혀 있으면 주소 방식으로 한 번 더 해 본다. */
  function ask(action) {
    return fetch(conn.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, key: conn.key }) }).then(r => r.json())
      .catch(() => fetch(conn.url + '?key=' + encodeURIComponent(conn.key) + (action === 'ping' ? '&ping=1' : '')).then(r => r.json()));
  }
  /* 학생에게 나눠 줄 주소: 지금 이 화면이 올라가 있는 곳의 index.html 에 내 시트 표시를 붙인다 */
  function classLink() {
    const p = CONFIG.sheetParts(conn.url); if (!p) return '';
    const base = location.href.replace(/[?#].*$/, '').replace(/teacher\.html$/, 'index.html');
    return base + '?s=' + p.id + (p.d ? '&d=' + encodeURIComponent(p.d) : '');
  }
  function showLink() {
    const p = CONFIG.sheetParts(conn.url), out = classLink();
    $('l-out').value = out; $('l-open').hidden = !out; if (out) $('l-open').href = out;
    const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    $('l-note').innerHTML = (out ? '학생은 이 주소로 들어와야 답이 내 시트로 옵니다. 학생 화면의 이름 쓰는 곳 아래에 연결 표시 <span class="mark">' + esc(p.id.slice(-4)) + '</span>가 보이면 맞게 들어온 것입니다.' : '학생은 이 주소로 들어와야 답이 내 시트로 옵니다.')
      + (local ? '<br><span class="bad">지금은 이 컴퓨터에서만 열리는 주소입니다.</span> 학생에게 줄 주소는 인터넷에 올린 게임의 선생님 화면(…/teacher.html)에서 만들어야 합니다.' : '');
  }
  $('l-step1').innerHTML = CONFIG.TEMPLATE_URL
    ? '아래 단추를 누르고 <b>사본 만들기</b>를 누르면, 필요한 것이 다 들어 있는 스프레드시트가 내 구글 드라이브에 생깁니다.<div class="row"><a class="btn primary" target="_blank" rel="noopener" href="' + esc(CONFIG.TEMPLATE_URL) + '">스프레드시트 사본 만들기</a></div>'
    : '구글 드라이브에서 새 스프레드시트를 만들고 <b>확장 프로그램 → Apps Script</b>를 엽니다. 처음 있는 코드를 지우고 <a href="apps_script/Code.gs" target="_blank" rel="noopener">Code.gs</a>의 내용을 통째로 붙여 넣은 뒤 저장합니다. 스프레드시트를 한 번 새로 고치면 「설정」 시트에 선생님 암호가 생깁니다.';
  $('l-url').value = conn.url; $('l-key').value = conn.key; if (conn.url) showLink();
  $('b-link').onclick = () => { $('link').hidden = !$('link').hidden; };
  $('l-show').onchange = e => { $('l-key').type = e.target.checked ? 'text' : 'password'; };
  $('l-copy').onclick = () => { const v = $('l-out').value; if (!v) return; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).catch(() => { $('l-out').select(); document.execCommand('copy'); }); $('l-copy').textContent = '복사됨'; setTimeout(() => { $('l-copy').textContent = '복사'; }, 1500); };
  $('l-test').onclick = () => {
    const url = $('l-url').value.trim(), key = $('l-key').value.trim(), msg = $('l-msg');
    const p = CONFIG.sheetParts(url);
    if (!p) { msg.className = 'bad'; msg.textContent = '웹 앱 주소가 아닙니다. https://script.google.com/ 으로 시작하고 /exec 로 끝나는 주소를 붙여 넣어 주세요.'; return; }
    if (!key) { msg.className = 'bad'; msg.textContent = '선생님 암호를 넣어 주세요. 스프레드시트 「설정」 시트의 B1 칸에 있습니다.'; return; }
    conn.url = CONFIG.sheetUrl(p.id, p.d); conn.key = key; msg.className = 'note'; msg.textContent = '확인하는 중…';
    ask('ping').then(d => {
      if (d && d.ok) { saveConn($('l-keep').checked); msg.className = 'ok'; msg.textContent = '연결되었습니다: 「' + (d.sheet || '내 스프레드시트') + '」'; showLink(); }
      else { msg.className = 'bad'; msg.textContent = (d && d.error) || '연결하지 못했습니다.'; }
    }).catch(e => { msg.className = 'bad'; msg.textContent = '시트에 닿지 못했습니다. 배포할 때 「액세스 권한: 모든 사용자」로 했는지 확인해 주세요. (' + e.message + ')'; });
  };

  // ───── 자료 불러오기 ─────
  $('b-sheet').onclick = () => {
    if (!conn.url) { $('link').hidden = false; $('status').textContent = '아직 연결된 구글 시트가 없습니다. 「① 우리 반 연결하기」를 먼저 해 주세요. 연결하지 않았다면 학생 기록 파일을 열 수도 있습니다.'; return; }
    if (!conn.key) { const k = prompt('선생님 암호를 넣어 주세요. (스프레드시트 「설정」 시트의 B1 칸)'); if (!k) return; conn.key = k.trim(); saveConn(false); }
    $('status').textContent = '불러오는 중…';
    ask('read').then(d => {
      if (d.error) { conn.key = ''; saveConn(false); $('status').textContent = d.error + ' 다시 눌러 암호를 넣어 주세요.'; return; }
      students = {}; ingest(d.rows || [], d.grades || []); $('status').textContent = '구글 시트에서 ' + (d.rows || []).length + '줄을 불러왔습니다.';
    }).catch(e => { $('status').textContent = '불러오지 못했습니다. 주소와 배포 설정(액세스: 모든 사용자)을 확인해 주세요. (' + e.message + ')'; });
  };
  $('files').onchange = async e => {
    let n = 0;
    for (const f of e.target.files) { try { const j = JSON.parse(await f.text()); const d = j.data || j, p = d.profile; if (!p) continue;
      const rows = Object.keys(d.answers || {}).map(q => Object.assign({ type: 'answer', ts: d.answers[q].at, cls: p.cls, num: p.num, name: p.name, hero: p.hero, quiz: q, ch: (QUIZZES[q] || {}).ch, act: (QUIZZES[q] || {}).act,
        hints: (d.answers[q].hints || []).join(','), rewalk: (d.answers[q].rewalk || []).join(','), recall: (d.answers[q].recall || []).join(',') }, d.answers[q]));
      ingest(rows); n++; } catch (err) { console.warn(f.name, err); } }
    $('status').textContent = '파일 ' + n + '개를 열었습니다.'; e.target.value = '';
  };
  $('b-demo').onclick = () => {
    const names = [['5-2', 3, '김하늘', '하늘'], ['5-2', 7, '박서준', '준'], ['5-2', 12, '이도윤', '윤'], ['5-2', 18, '최유나', '나리']];
    const sample = { text: ['신문을 다 찍은 뒤에 새 소식이 와서 한 장짜리를 따로 찍은 것 같다.', '슬퍼서 닫은 것 같다.', '잘 모르겠다.', '신문 이름 옆에 총독부 기관지라고 쓰여 있어서, 일본 쪽에서 보기에 나쁜 일로 보이게 하려고 그 낱말을 고른 것 같다.'],
      letter: ['올해는 장독대 옆 새싹이 일찍 돋았습니다. 할머니는 저녁마다 등잔 심지를 돋우십니다. 종이는 한 장도 버리지 않고 모아 둡니다. 밥은 식지 않게 아랫목에 묻어 둡니다.'] };
    const rows = [];
    names.forEach((n, si) => QIDS.forEach((qid, qi) => { if (si === 3 && qi > 14) return; const q = QUIZZES[qid], steps = {};
      q.steps.forEach((s, k) => { if (s.t === 'text') steps[s.k] = sample.text[(si + qi + k) % 4]; else if (s.t === 'letter') steps[s.k] = sample.letter[0]; else if (s.t === 'number') steps[s.k] = s.answer;
        else if (s.t === 'choice') steps[s.k] = { i: 0, text: s.opts[(si + k) % s.opts.length] }; else if (s.t === 'clues') steps[s.k] = ['(표시한 단서 예시)']; else if (s.t === 'word') steps[s.k] = { meaning: sample.text[(si + k) % 4], basis: si === 1 ? ['clue'] : ['clue', 'exp'], exps: (s.exps || q.exps || []).slice(0, 1) };
        else if (s.t === 'basis') steps[s.k] = { basis: si === 1 ? ['clue'] : ['exp', 'know'], exps: (q.exps || []).slice(0, 1) }; else steps[s.k] = { ok: true }; });
      rows.push({ type: 'answer', ts: new Date(2026, 10, 10, 9, qi).toISOString(), cls: n[0], num: n[1], name: n[2], hero: n[3], ch: q.ch, quiz: qid, act: q.act, tries: 1, ms: 90000 + qi * 7000, hints: '', rewalk: si === 2 && q.exps ? q.exps[0] : '', steps: steps }); }));
    students = {}; ingest(rows); $('status').textContent = '시범 자료입니다(지어낸 학생 4명). 실제 자료가 아닙니다.';
  };
  render();
})();

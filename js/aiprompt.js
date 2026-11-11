/* AI 검수 묶음 — 어떤 AI에 넣어도 학생 답을 채점 기준에 맞춰 살펴보고 보고서를 쓰게 하는 프롬프트와 자료를 만든다.
   · 선생님 화면(teacher.html)의 「내보내기」와 tools/build_ai_prompt.js 가 함께 쓴다.
   · 채점 기준·물음·지문은 data/quizzes.js, data/cards.js 에서 그대로 가져오므로, 문항을 고치면 저절로 따라 바뀐다. */
(function (root) {
  'use strict';
  var JOSA = { '은는': '은', '이가': '이', '을를': '을', '아야': '아', '과와': '과', '이_': '이' };
  /* 이름표 자리 채우기: 한결은 그대로, 주인공 이름은 「주인공」으로 */
  function T(s) {
    return String(s == null ? '' : s)
      .replace(/\{name(?:\|([^}]+))?\}/g, function (m, j) { return '주인공' + (j && JOSA[j] ? JOSA[j] : ''); })
      .replace(/\{hg(?:\|([^}]+))?\}/g, function (m, j) { return '한결' + (j && JOSA[j] ? JOSA[j] : ''); })
      .replace(/\{b(?:me|hg)(?:\|[^}]+)?\}/g, '(호칭)');
  }
  var TYPE = { text: '서술', letter: '편지 쓰기', word: '낱말 속뜻 쓰기 + 근거 고르기', basis: '근거 고르기', clues: '단서 표시', choice: '고르기', number: '셈', classify: '나누기', build: '낱말 조각 맞추기' };
  var BASIS = { clue: '글 속 단서', exp: '겪은 일(경험)', know: '알고 있던 것(지식)' };

  function cardText(C, id) {
    var c = C[id]; if (!c) return '';
    var out = [];
    if (c.kind === 'real') {
      out.push('- [실제 자료] ' + T(c.head || '') + (c.meta ? ' · ' + T(c.meta) : ''));
      (c.lines || c.pre || []).forEach(function (l) { out.push('  원문: ' + T(l)); });
      var g = c.gloss && C[c.gloss]; if (g && g.lines) g.lines.forEach(function (l) { out.push('  쉬운 말: ' + T(l)); });
    } else {
      out.push('- [창작 지문] ' + T(c.title || ''));
      (c.lines || []).forEach(function (l) { out.push('  ' + T(l)); });
    }
    return out.join('\n');
  }

  /* ───────── 1. 채점·분석 보고서를 쓰게 하는 프롬프트 ───────── */
  function prompt(Q, C, ACTS, E) {
    var o = [];
    o.push('# 역할');
    o.push('당신은 초등학교 5학년 국어 「추론하며 읽기」 단원의 평가를 돕는 조교입니다. 아래 [채점 기준 책]과 [학생 답]을 읽고, 선생님이 바로 쓸 수 있는 보고서를 한국어로 씁니다. 최종 판단은 선생님이 합니다. 당신의 채점은 초안입니다.');
    o.push('');
    o.push('# 배경');
    o.push('- 학생들은 1918~1923년 경성 종로를 배경으로 한 읽기 게임 「종로 지물포의 봄」을 하면서, 신문 제목·쪽지·편지 같은 짧은 글을 읽고 물음에 답했습니다.');
    o.push('- 단원에서 기르려는 힘은 일곱 가지입니다: ' + Object.keys(ACTS).map(function (k) { return ACTS[k]; }).join(' / '));
    o.push('- 학생은 만 10~11세입니다. 답이 짧고 맞춤법이 틀릴 수 있습니다. 길이나 맞춤법이 아니라 **추론의 질**(무엇을 근거로, 어떻게 이어서 짐작했는가)을 봅니다.');
    o.push('- 게임 속에서 학생은 답하기 전에 「도움말」을 보거나, 앞에서 듣고 겪은 일을 「회상」으로 다시 떠올리거나, 그 장면으로 「기억 다시 걷기」를 할 수 있습니다. 이것은 감점할 일이 아닙니다. 도움이 얼마나 필요했는지를 알려 주는 정보로만 씁니다.');
    o.push('');
    o.push('# 채점 원칙');
    o.push('1. 문항마다 [채점 기준 책]의 **상·중·하** 기준 문장에 비추어 등급을 매깁니다. 기준에 없는 잣대를 새로 만들지 않습니다.');
    o.push('2. ★ 표시가 있는 단계가 평가 대상입니다. ★가 없는 단계(고르기, 셈, 단서 표시 등)는 참고만 합니다.');
    o.push('3. 등급마다 **학생 답에서 그대로 옮긴 인용**을 한 군데 이상 근거로 붙입니다. 인용은 한 글자도 고치지 않습니다. 인용할 말이 없으면 그렇게 적습니다.');
    o.push('4. 정답이 하나로 정해지지 않은 물음이 많습니다. 「생각 넓히기」는 이야기가 향하는 쪽을 알려 줄 뿐 정답이 아닙니다. 다른 답이라도 글의 단서나 겪은 일과 이어져 있고 까닭이 통하면 높게 봅니다.');
    o.push('5. 글에 없는 사실을 지어내어 평가하지 않습니다. 지문과 기준에 없는 역사 지식으로 학생 답을 틀렸다고 하지 않습니다. 사실과 분명히 어긋나는 답은 「사실 확인 필요」로 따로 적습니다.');
    o.push('6. 답하지 않은 문항은 「미응답」으로 두고 등급을 매기지 않습니다. 뜻 없는 글자나 물음을 그대로 베낀 답은 「하」로 하되 「성의 없는 답으로 보임」이라고 적습니다.');
    o.push('7. 판단이 서지 않으면 억지로 정하지 말고 「판단 보류」로 두고 까닭을 적습니다.');
    o.push('8. 학생을 단정하는 말(「능력이 부족하다」 등)을 쓰지 않습니다. 이번 답에서 보인 것만 말합니다. 학생 번호 밖의 개인 정보를 짐작하거나 덧붙이지 않습니다.');
    o.push('');
    o.push('# 보고서 형식 (이 순서와 제목을 지켜 주세요)');
    o.push('## 1. 한눈에');
    o.push('- 자료에 들어 있는 학생 수, 문항 수, 답 수(미응답 수)');
    o.push('- 활동 일곱 가지마다 상·중·하·판단 보류·미응답이 몇 건인지 표로');
    o.push('- 반 전체로 잘된 점 세 가지, 어려워한 점 세 가지(각각 문항 이름과 대표 인용을 붙여서)');
    o.push('## 2. 문항별');
    o.push('- 문항마다: 등급 분포, 잘된 답의 본보기 인용 하나, 아쉬운 답의 본보기 인용 하나(학생 번호와 함께), 흔히 보인 생각의 틀, 다음 수업에서 해 볼 한 가지');
    o.push('## 3. 학생별');
    o.push('- 학생마다: 활동별 등급 요약, 돋보인 답 인용 하나, 더 도와줄 점 한 가지(구체적인 다음 활동으로), 도움말·회상·기억 다시 걷기를 쓴 정도');
    o.push('## 4. 살펴볼 학생');
    o.push('- 미응답이 많은 학생, 답이 매우 짧은 학생, 근거를 늘 한 가지만 고른 학생, 도움을 많이 쓰고도 답이 이어지지 않은 학생. 반드시 근거(문항과 인용)를 붙입니다.');
    o.push('## 5. 판단 보류와 사실 확인 필요');
    o.push('## 6. 채점표');
    o.push('- 아래 머리줄로 된 CSV를 코드 블록에 넣어 주세요. 한 줄에 학생 한 명의 문항 하나입니다.');
    o.push('```');
    o.push('학생,문항,등급,근거 인용,메모');
    o.push('```');
    o.push('## 7. 검수 기록 (보고서를 내기 전에 스스로 확인하고 그 결과를 적습니다)');
    o.push('- [ ] 자료의 학생 수 × 답한 문항 수와 채점표의 줄 수가 같은가 (숫자를 적어 대조)');
    o.push('- [ ] 인용한 말이 모두 [학생 답]에 그대로 있는가 (없는 인용을 발견하면 고치고 몇 건이었는지 적기)');
    o.push('- [ ] 등급의 까닭이 그 문항의 상·중·하 기준 문장과 맞는가');
    o.push('- [ ] 같은 수준의 답에 같은 등급을 주었는가 (문항마다 두 건 이상 견주어 확인)');
    o.push('- [ ] 지문과 기준에 없는 내용을 사실처럼 쓰지 않았는가');
    o.push('- 확인하지 못한 것이 있으면 숨기지 말고 적습니다.');
    o.push('');
    o.push('# 자료 읽는 법');
    o.push('- [학생 답]에서 학생은 「학생 01」처럼 번호로만 나옵니다. 이름을 묻거나 짐작하지 마세요.');
    o.push('- 문항 머리의 [q1_two] 같은 표시는 문항 번호입니다. [채점 기준 책]의 같은 번호를 찾아 봅니다.');
    o.push('- 단계 이름 앞의 ★는 평가 대상입니다.');
    o.push('- 「근거: 글 속 단서, 겪은 일 …」은 학생이 자기 답의 근거로 고른 것입니다(' + Object.keys(BASIS).map(function (k) { return BASIS[k]; }).join(', ') + ' 가운데).');
    o.push('');
    o.push('# [채점 기준 책]');
    var chName = { p: '서장', c1: '1장', c2: '2장', c3: '3장', c4: '4장', c5: '5장', e1: '에필로그 1', e2: '에필로그 2' };
    Object.keys(Q).forEach(function (id) {
      var q = Q[id];
      o.push('');
      o.push('## [' + id + '] ' + T(q.title) + ' — ' + (chName[q.ch] || q.ch) + ' · ' + (ACTS[q.act] || ''));
      if (q.cards && q.cards.length) { o.push('읽은 글:'); q.cards.forEach(function (cid) { var t = cardText(C, cid); if (t) o.push(t); }); }
      else o.push('읽은 글: 없음(방금 듣고 겪은 일을 떠올려 답하는 문항)');
      if (q.exps && q.exps.length && E) {
        o.push('이 문항 전에 학생이 게임에서 듣고 겪은 일(회상으로 다시 볼 수 있음):');
        q.exps.forEach(function (e) { if (E[e]) o.push('- ' + T(E[e].title) + ': ' + T(E[e].text) + (E[e].say ? ' (들은 말: 「' + T(E[e].say[2]) + '」)' : '')); });
      }
      o.push('물음:');
      q.steps.forEach(function (s) {
        var star = (q.grade || []).indexOf(s.k) >= 0 ? '★ ' : '';
        var line = '- ' + star + s.k + ' (' + (TYPE[s.t] || s.t) + '): ' + T(s.q || '');
        if (s.word) line += ' / 낱말: 「' + T(s.word) + '」 · ' + T(s.dict || '');
        if (s.opts) line += ' / 고를 것: ' + s.opts.map(T).join(' | ') + (s.correct != null ? ' (알맞은 것: ' + T(s.opts[s.correct]) + ')' : '');
        if (s.answer != null) line += ' / 답: ' + s.answer;
        o.push(line);
        if (s.after) o.push('  생각 넓히기(정답이 아니라 방향): ' + T(s.after));
      });
      var r = q.rubric || [];
      o.push('채점 기준: 상 — ' + T(r[0] || '') + ' / 중 — ' + T(r[1] || '') + ' / 하 — ' + T(r[2] || ''));
    });
    return o.join('\n');
  }

  /* ───────── 2. 그 보고서를 다시 검수하게 하는 프롬프트 ───────── */
  function reviewPrompt() {
    return [
      '# 역할',
      '당신은 다른 조교가 쓴 「추론하며 읽기」 채점 보고서를 검수하는 사람입니다. 아래에 [채점 기준 책], [학생 답], [검수할 보고서]가 차례로 주어집니다. 보고서를 믿고 시작하지 말고, 자료와 하나하나 대조해 틀린 곳을 찾습니다. 한국어로 씁니다.',
      '',
      '# 확인할 것',
      '1. **빠짐**: [학생 답]의 학생 × 답한 문항이 채점표에 모두 있는가. 수를 세어 적고, 빠진 줄과 남는 줄을 모두 적습니다.',
      '2. **인용**: 보고서의 인용이 [학생 답]에 글자 그대로 있는가. 없는 인용, 고쳐 쓴 인용, 다른 학생의 말을 붙인 인용을 찾아 적습니다.',
      '3. **기준**: 등급의 까닭이 그 문항의 상·중·하 기준 문장과 맞는가. 기준에 없는 잣대(길이, 맞춤법, 글씨, 도움말 사용)로 깎은 곳을 찾습니다.',
      '4. **한결같음**: 비슷한 답에 다른 등급을 준 곳이 있는가. 문항마다 등급이 갈린 답을 두 건씩 나란히 놓고 봅니다.',
      '5. **지어냄**: 지문과 기준에 없는 사실이나, 자료에 없는 학생 정보를 쓴 곳이 있는가.',
      '6. **말씨**: 학생을 단정하거나 깎아내리는 표현이 있는가.',
      '',
      '# 검수 보고서 형식',
      '## 1. 결론',
      '- 이 보고서를 그대로 써도 되는지: 「그대로 써도 됨 / 고쳐서 써야 함 / 다시 해야 함」 가운데 하나와 한 문장의 까닭',
      '## 2. 숫자 대조',
      '- 학생 수, 답 수, 채점표 줄 수를 자료와 보고서에서 각각 세어 나란히 적기',
      '## 3. 찾은 문제 (심각한 것부터)',
      '- 문제마다: 어디(학생 번호·문항), 무엇이 틀렸는지, 자료의 실제 내용 인용, 고친 등급이나 고친 문장',
      '## 4. 고친 채점표',
      '- 고친 줄만 CSV 코드 블록으로 (머리줄: 학생,문항,원래 등급,고친 등급,까닭)',
      '## 5. 확인하지 못한 것',
      '- 자료가 모자라거나 판단이 서지 않아 확인하지 못한 것을 숨기지 말고 적습니다.',
      '',
      '문제를 찾지 못했다면 억지로 만들지 말고 「찾지 못함」이라고 쓰되, 무엇을 어떻게 대조했는지는 적어 주세요.'
    ].join('\n');
  }

  /* ───────── 3. 학생 답 묶음 (이름은 번호로 가린다) ───────── */
  function data(students, Q, ACTS, E, stepText) {
    var ids = Object.keys(Q), o = [], map = [];
    o.push('# [학생 답]');
    o.push('학생 ' + students.length + '명 · 문항 ' + ids.length + '개. 이름은 가리고 번호만 붙였습니다.');
    students.forEach(function (st, i) {
      var tag = '학생 ' + (i + 1 < 10 ? '0' : '') + (i + 1);
      map.push([tag, st.cls, st.num, st.name]);
      var done = ids.filter(function (q) { return st.q[q]; });
      o.push(''); o.push('## ' + tag + ' — 답한 문항 ' + done.length + '/' + ids.length);
      ids.forEach(function (qid) {
        var q = Q[qid], r = st.q[qid];
        if (!r) { o.push('### [' + qid + '] ' + T(q.title) + ' — 미응답'); return; }
        o.push('### [' + qid + '] ' + T(q.title) + ' (' + (ACTS[q.act] || '') + ')');
        var name = function (list) { return String(list || '').split(',').filter(Boolean).map(function (e) { return E[e] ? T(E[e].title) : e; }).join(', '); };
        var meta = ['걸린 시간 ' + Math.round((r.ms || 0) / 1000) + '초'];
        if (r.tries > 1) meta.push(r.tries + '번째 답');
        if (r.hints) meta.push('도움말 본 단계: ' + r.hints);
        if (r.recall) meta.push('회상 떠올림: ' + name(r.recall));
        if (r.rewalk) meta.push('기억 다시 걷기: ' + name(r.rewalk));
        o.push('(' + meta.join(' · ') + ')');
        q.steps.forEach(function (s) {
          var t = stepText(q, s, (r.steps || {})[s.k]);
          var star = (q.grade || []).indexOf(s.k) >= 0 ? '★ ' : '';
          o.push('- ' + star + s.k + ': ' + (t ? String(t).replace(/\n/g, ' / ') : '(쓰지 않음)'));
        });
      });
    });
    return { text: o.join('\n'), map: map };
  }

  var api = { T: T, prompt: prompt, reviewPrompt: reviewPrompt, data: data, BASIS: BASIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AIKit = api;
})(typeof window !== 'undefined' ? window : this);

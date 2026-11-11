/**
 * @OnlyCurrentDoc
 * (위 한 줄: 이 프로그램이 읽고 쓸 수 있는 곳을 「이 스프레드시트 하나」로 묶어 둡니다. 지우지 마세요.)
 *
 * 「종로 지물포의 봄」 — 우리 반 답 모으기 (구글 Apps Script)
 * 연결 방법은 docs/설치와 운영 안내.md 와 「우리 반 연결 안내」(PPT)를 보세요.
 *
 * 시트 4장이 저절로 만들어집니다.
 *   설정 : 선생님 암호(B1). 선생님 화면에서 기록을 불러올 때 씁니다.
 *   답   : 학생이 문항에 답할 때마다 한 줄
 *   기록 : 시작, 장 시작·끝, 기억 다시 걷기 같은 진행 기록
 *   채점 : 선생님 화면에서 매긴 상·중·하
 *
 * 암호는 코드에 적지 않고 「설정」 시트에 둡니다. 스프레드시트를 사본으로 만들면
 * 사본마다 새 암호가 저절로 생기므로, 다른 선생님과 암호가 겹치지 않습니다.
 */
var SETUP = '설정';
var HEAD = {
  '답': ['받은 때', '반', '번호', '이름', '주인공 이름', '장', '문항', '활동', '몇 번째 답', '걸린 시간(초)', '도움말 본 단계', '기억 다시 걷기', '답(읽기용)', '답(원자료)', '회상 떠올림'],
  '기록': ['받은 때', '반', '번호', '이름', '주인공 이름', '종류', '내용'],
  '채점': ['매긴 때', '반', '번호', '이름', '문항', '등급', '메모']
};

/** 스프레드시트를 열면: 암호를 준비하고 메뉴를 붙인다 */
function onOpen() {
  key_();
  SpreadsheetApp.getUi().createMenu('종로 지물포').addItem('처음 준비하기', 'setup').addToUi();
}
/** 메뉴 「종로 지물포 → 처음 준비하기」: 시트를 미리 만들어 둔다(하지 않아도 첫 답이 들어올 때 저절로 만들어짐) */
function setup() {
  var k = key_(); ['답', '기록', '채점'].forEach(sheet_);
  SpreadsheetApp.getUi().alert('준비되었습니다.\n\n「설정」 시트의 선생님 암호: ' + k + '\n\n이제 [배포] → [새 배포] → [웹 앱]으로 배포하고, 나온 주소를 선생님 화면에 붙여 넣으세요.');
}

/** 선생님 암호: 「설정」 시트 B1. 없거나, 다른 스프레드시트에서 복사해 온 것이면 새로 만든다 */
function key_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SETUP), id = ss.getId();
  if (!sh) {
    sh = ss.insertSheet(SETUP, 0);
    sh.getRange('A1').setValue('선생님 암호');
    sh.getRange('A3').setValue('이 암호는 선생님 화면에서 우리 반 기록을 불러올 때 씁니다. 학생에게 알려 주지 마세요.');
    sh.getRange('A4').setValue('바꾸고 싶으면 B1 칸에 새 암호를 적으면 됩니다(8자 이상 권장).');
    sh.getRange('A1').setFontWeight('bold'); sh.setColumnWidth(1, 130); sh.setColumnWidth(2, 160);
  }
  var k = String(sh.getRange('B1').getValue() || '').trim(), owner = String(sh.getRange('D1').getValue() || '');
  if (!k || owner !== id) {
    k = makeKey_();
    sh.getRange('B1').setValue(k).setFontWeight('bold').setBackground('#fff2cc');
    sh.getRange('D1').setValue(id).setFontColor('#ffffff');      // 이 사본의 표시(눈에 띄지 않게)
  }
  return k;
}
function makeKey_() {
  var c = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
  for (var i = 0; i < 8; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(HEAD[name]); sh.setFrozenRows(1); }
  return sh;
}
/** 수식으로 읽히지 않도록 글 앞의 = + - @ 를 막는다 */
function safe_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function plain_(steps) {
  var out = [];
  Object.keys(steps || {}).forEach(function (k) {
    var v = steps[k], t;
    if (v === null || v === undefined) return;
    if (typeof v === 'string' || typeof v === 'number') t = String(v);
    else if (Array.isArray(v)) t = '단서: ' + v.join(' / ');
    else if (v.meaning !== undefined) t = v.meaning + ' [근거: ' + (v.basis || []).join(',') + (v.exps && v.exps.length ? ' · ' + v.exps.join(',') : '') + ']';
    else if (v.basis) t = '[근거: ' + v.basis.join(',') + (v.exps && v.exps.length ? ' · ' + v.exps.join(',') : '') + ']';
    else if (v.text !== undefined) t = v.text;
    else if (v.ok) t = '(맞힘)';
    else t = JSON.stringify(v);
    out.push(k + ': ' + t);
  });
  return out.join('\n');
}

/** 받기: 학생의 답·기록(암호 없이 보탤 수만 있음), 선생님의 채점·불러오기(암호 필요) */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents), ok = body.key !== undefined && String(body.key) === key_();
    if (body.action === 'ping' || body.action === 'read') {          // 선생님 화면: 연결 확인 / 기록 불러오기
      if (!ok) return json_({ error: '암호가 맞지 않습니다.' });
      return json_(body.action === 'ping' ? { ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName() } : read_());
    }
    (body.rows || []).forEach(function (r) {
      if (r.type === 'answer') {
        sheet_('답').appendRow([new Date(), safe_(r.cls), safe_(r.num), safe_(r.name), safe_(r.hero), safe_(r.ch), safe_(r.quiz), safe_(r.act), r.tries || 1,
          Math.round((r.ms || 0) / 1000), safe_(r.hints), safe_(r.rewalk), safe_(plain_(r.steps)), safe_(JSON.stringify(r.steps || {})), safe_(r.recall)]);
      } else {
        sheet_('기록').appendRow([new Date(), safe_(r.cls), safe_(r.num), safe_(r.name), safe_(r.hero), safe_(r.type), safe_(r.detail)]);
      }
    });
    if (ok) (body.grades || []).forEach(function (g) {
      sheet_('채점').appendRow([new Date(), safe_(g.cls), safe_(g.num), safe_(g.name), safe_(g.quiz), safe_(g.grade), safe_(g.memo)]);
    });
    return ContentService.createTextOutput('ok');
  } finally { lock.releaseLock(); }
}

/** 주소로 불러오기(예비용). 선생님 화면은 보통 doPost 의 read 를 씁니다. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.key === undefined || String(p.key) !== key_()) return json_({ error: '암호가 맞지 않습니다.' });
  if (p.ping) return json_({ ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
  return json_(read_());
}

function read_() {
  var rows = [], grades = [];
  var a = sheet_('답').getDataRange().getValues();
  for (var i = 1; i < a.length; i++) {
    var steps = {}; try { steps = JSON.parse(String(a[i][13]).replace(/^'/, '')); } catch (err) {}
    rows.push({ type: 'answer', ts: a[i][0], cls: String(a[i][1]), num: String(a[i][2]), name: String(a[i][3]), hero: String(a[i][4]), ch: String(a[i][5]), quiz: String(a[i][6]), act: a[i][7],
      tries: a[i][8], ms: a[i][9] * 1000, hints: String(a[i][10]), rewalk: String(a[i][11]), recall: String(a[i][14] || ''), steps: steps });
  }
  var ev = sheet_('기록').getDataRange().getValues();
  for (var j = 1; j < ev.length; j++) rows.push({ type: String(ev[j][5]), ts: ev[j][0], cls: String(ev[j][1]), num: String(ev[j][2]), name: String(ev[j][3]), hero: String(ev[j][4]), detail: String(ev[j][6]) });
  var gr = sheet_('채점').getDataRange().getValues();
  for (var k = 1; k < gr.length; k++) grades.push({ ts: gr[k][0], cls: String(gr[k][1]), num: String(gr[k][2]), name: String(gr[k][3]), quiz: String(gr[k][4]), grade: String(gr[k][5]), memo: String(gr[k][6]) });
  return { rows: rows, grades: grades };
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

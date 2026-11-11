/* 설정 — 보통은 고칠 필요가 없습니다. (docs/설치와 운영 안내.md 참고)

   학생 답을 선생님의 구글 시트로 보내는 방법은 두 가지입니다.
   ① 반 접속 주소(권장): 선생님 화면(teacher.html)의 「우리 반 연결하기」에서 만든 주소
      (…/index.html?s=○○○)로 학생이 들어오면, 그 주소에 적힌 선생님 시트로 답이 갑니다.
      게임 하나를 여러 선생님이 함께 써도 기록은 선생님마다 따로 모입니다.
   ② 아래 ENDPOINT에 주소를 직접 적기: 이 게임으로 들어오는 모든 답이 한 시트로 갑니다. */
window.CONFIG = {
  // 구글 Apps Script 웹앱 주소(…/exec). 비워 두면 반 접속 주소로 들어온 학생만 선생님께 답이 가고,
  // 그냥 들어온 학생의 답은 그 기기에만 저장됩니다(「내 기록 내려받기」로 파일을 낼 수 있음).
  ENDPOINT: '',
  // 다른 선생님이 「사본 만들기」로 가져갈 스프레드시트 주소(…/copy 로 끝남). 있으면 선생님 화면에 단추가 생깁니다.
  TEMPLATE_URL: '',
  // 첫 화면에서 「선생님」 버튼 → 이 암호를 넣으면 모든 장이 열립니다. (시트를 읽는 암호와는 다른 것입니다)
  TEACHER_CODE: '1919',
  // 배경음악: assets/audio 폴더의 mp3를 씁니다. 음악 없이 쓰려면 false 로 바꾸세요.
  BGM: true,
  VERSION: '1.1.0'
};

/* 반 접속 주소 읽기: ?s=배포ID (&d=학교 도메인) → 그 선생님의 시트 주소로 바꾼다.
   주소는 구글 Apps Script(script.google.com)로만 만들어지므로 다른 곳으로 답이 새지 않는다.
   한 번 들어온 기기는 기억해 두어, 다음에 그냥 들어와도 같은 선생님께 간다. */
(function () {
  var KEY = 'jongno1919:sheet', C = window.CONFIG;
  C.sheetUrl = function (id, d) {
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(id || '')) return '';
    return 'https://script.google.com/' + (d && /^[a-z0-9.-]{3,80}$/i.test(d) ? 'a/macros/' + d + '/' : 'macros/') + 's/' + id + '/exec';
  };
  /* 웹앱 주소(…/exec)에서 배포 ID와 도메인을 뽑는다 */
  C.sheetParts = function (url) {
    var m = /^https:\/\/script\.google\.com\/(?:a\/macros\/([a-z0-9.-]+)\/|macros\/)s\/([A-Za-z0-9_-]{20,200})\/exec\/?(?:[?#].*)?$/i.exec(String(url || '').trim());
    return m ? { id: m[2], d: m[1] || '' } : null;
  };
  try {
    var q = new URLSearchParams(location.search), id = q.get('s'), d = q.get('d') || '', saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (id && C.sheetUrl(id, d)) { saved = { id: id, d: d }; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} }
    if (saved && C.sheetUrl(saved.id, saved.d)) { C.ENDPOINT = C.sheetUrl(saved.id, saved.d); C.SHEET_MARK = saved.id.slice(-4); }
    else if (C.ENDPOINT) { var p = C.sheetParts(C.ENDPOINT); C.SHEET_MARK = p ? p.id.slice(-4) : ''; }
  } catch (e) {}
})();

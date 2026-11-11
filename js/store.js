/* 저장: 학생 기기(localStorage) + 선생님 구글 시트(선택) */
(function () {
  'use strict';
  const PRE = 'jongno1919:';
  const blank = () => ({ profile: null, chapters: {}, cards: [], exps: [], concepts: [], answers: {}, rewalks: [], queue: [], sent: 0, unlockAll: false, sound: true, started: Date.now() });
  const Store = {
    data: blank(),
    key() { const p = this.data.profile; return PRE + (p ? [p.cls, p.num, p.name].join('_') : 'guest'); },
    list() { return Object.keys(localStorage).filter(k => k.indexOf(PRE) === 0 && k !== PRE + 'last'); },
    last() { try { return localStorage.getItem(PRE + 'last'); } catch (e) { return null; } },
    open(profile) {
      const k = PRE + [profile.cls, profile.num, profile.name].join('_');
      let d = null;
      try { d = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { d = null; }
      this.data = d || blank();
      this.data.profile = Object.assign(this.data.profile || {}, profile);
      try { localStorage.setItem(PRE + 'last', k); } catch (e) {}
      this.save();
    },
    peek(profile) { try { return JSON.parse(localStorage.getItem(PRE + [profile.cls, profile.num, profile.name].join('_')) || 'null'); } catch (e) { return null; } },
    resume() {
      const k = this.last(); if (!k) return false;
      try { const d = JSON.parse(localStorage.getItem(k) || 'null'); if (d && d.profile) { this.data = Object.assign(blank(), d); return true; } } catch (e) {}
      return false;
    },
    save() { try { localStorage.setItem(this.key(), JSON.stringify(this.data)); } catch (e) { console.warn('저장 실패', e); } },
    reset() { try { localStorage.removeItem(this.key()); } catch (e) {} const p = this.data.profile; this.data = blank(); this.data.profile = p; this.save(); },

    has(kind, id) { return this.data[kind].indexOf(id) >= 0; },
    add(kind, id) { if (!this.has(kind, id)) { this.data[kind].push(id); this.save(); return true; } return false; },
    chap(id) { return this.data.chapters[id] || (this.data.chapters[id] = { done: false, scene: null, nodes: {} }); },

    /* 한 문항의 답을 저장하고 시트로 보낼 줄을 만든다 */
    answer(quizId, rec) {
      const prev = this.data.answers[quizId];
      rec.tries = (prev ? prev.tries || 1 : 0) + 1;
      rec.at = new Date().toISOString();
      this.data.answers[quizId] = rec;
      const p = this.data.profile || {}, q = (window.QUIZZES || {})[quizId] || {};
      this.data.queue.push({ type: 'answer', ts: rec.at, cls: p.cls, num: p.num, name: p.name, hero: p.hero, ch: q.ch, quiz: quizId, act: q.act, tries: rec.tries,
        ms: rec.ms, hints: (rec.hints || []).join(','), rewalk: (rec.rewalk || []).join(','), recall: (rec.recall || []).join(','), steps: rec.steps, ver: (window.CONFIG || {}).VERSION });
      this.save(); this.flush();
    },
    event(type, detail) {
      const p = this.data.profile || {};
      this.data.queue.push({ type: type, ts: new Date().toISOString(), cls: p.cls, num: p.num, name: p.name, hero: p.hero, detail: detail });
      this.save(); this.flush();
    },
    flushing: false,
    flush() {
      const url = (window.CONFIG || {}).ENDPOINT;
      if (!url || this.flushing || !this.data.queue.length) return;
      this.flushing = true;
      const batch = this.data.queue.slice(0, 20);
      fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ rows: batch }) })
        .then(() => { this.data.queue.splice(0, batch.length); this.data.sent += batch.length; this.save(); this.flushing = false; if (this.data.queue.length) this.flush(); })
        .catch(() => { this.flushing = false; });
    },
    exportFile() {
      const p = this.data.profile || {};
      const blob = new Blob([JSON.stringify({ app: 'jongno1919', ver: (window.CONFIG || {}).VERSION, exported: new Date().toISOString(), data: this.data }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = '종로지물포_' + [p.cls, p.num, p.name].join('_') + '.json';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  };
  window.addEventListener('online', () => Store.flush());
  setInterval(() => Store.flush(), 30000);
  window.Store = Store;
})();

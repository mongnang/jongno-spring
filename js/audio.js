/* 소리: 효과음은 직접 합성, 배경음악은 assets/audio/<이름>.mp3 가 있으면 재생(없으면 조용히 넘어감) */
(function () {
  'use strict';
  let ctx = null, master = null, bgm = null, bgmName = null, on = true;
  const missing = {};
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function noise(dur, freq, q, vol, type) {
    const c = ac(); if (!c || !on) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  function tone(freq, dur, vol, type, slide) {
    const c = ac(); if (!c || !on) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + dur + 0.02);
  }
  const SFX = {
    step() { noise(0.07, 420 + Math.random() * 160, 1.2, 0.10, 'lowpass'); },
    paper() { noise(0.22, 3200, 0.7, 0.16); setTimeout(() => noise(0.16, 4200, 0.8, 0.10), 90); },
    tick() { tone(660, 0.06, 0.05, 'triangle'); },
    next() { noise(0.04, 1800, 2, 0.06); },
    stamp() { tone(120, 0.22, 0.3, 'sine', 55); noise(0.09, 300, 1, 0.2, 'lowpass'); },
    get() { tone(392, 0.16, 0.08, 'triangle'); setTimeout(() => tone(587, 0.26, 0.08, 'triangle'), 110); },
    good() { tone(523, 0.12, 0.07, 'triangle'); setTimeout(() => tone(784, 0.2, 0.07, 'triangle'), 100); },
    no() { tone(196, 0.16, 0.06, 'triangle', 165); },
    door() { noise(0.3, 240, 1.5, 0.22, 'lowpass'); tone(90, 0.25, 0.12, 'sine', 60); },
    memory() { tone(330, 0.6, 0.05, 'sine', 220); }
  };
  let focusPrev = null, jingle = null;
  const Sound = {
    get on() { return on; },
    /* 소리 켜기·끄기: 끄면 음악을 완전히 멈추고, 이 기기에 기억해 둔다 */
    set(v) {
      on = !!v;
      try { localStorage.setItem('jongno1919:sound', on ? '1' : '0'); } catch (e) {}
      if (jingle && !on) jingle.pause();
      if (bgm) { if (on) { bgm.volume = 0.32; bgm.play().catch(() => {}); } else { bgm.volume = 0; bgm.pause(); } }
    },
    load() { try { on = localStorage.getItem('jongno1919:sound') !== '0'; } catch (e) { on = true; } return on; },
    state() { return { name: bgmName, playing: !!(bgm && !bgm.paused), vol: bgm ? +bgm.volume.toFixed(2) : 0, focus: focusPrev }; },
    unlock() { if (!on) return; ac(); if (bgm && bgm.paused) bgm.play().catch(() => {}); },
    sfx(n) { if (SFX[n]) try { SFX[n](); } catch (e) {} },
    /* 장 전환 징글: 길어도 8초 안에 잦아들게 */
    jingle() {
      if (!(window.CONFIG || {}).BGM || !on) return;
      try { if (jingle) jingle.pause(); const a = jingle = new Audio('assets/audio/jingle_chapter.mp3'); a.volume = 0.5; a.play().catch(() => {});
        setTimeout(() => { const t = setInterval(() => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume <= 0.01) { a.pause(); clearInterval(t); } }, 100); }, 6000); } catch (e) {}
    },
    /* 글 읽기·문항 화면에서는 잔잔한 음악으로 바꿨다가 끝나면 되돌린다 */
    focus(v) {
      if (v) { if (focusPrev === null) { focusPrev = bgmName || ''; this.bgm('bgm_reading_focus'); } }
      else if (focusPrev !== null) { const p = focusPrev; focusPrev = null; this.bgm(p || null); }
    },
    bgm(name) {
      if (focusPrev !== null && name !== 'bgm_reading_focus') { focusPrev = name || ''; return; }
      if (name === bgmName) return;
      bgmName = name;
      const old = bgm; bgm = null;
      if (old && !on) old.pause();
      else if (old) { const t = setInterval(() => { old.volume = Math.max(0, old.volume - 0.04); if (old.volume <= 0.01) { old.pause(); clearInterval(t); } }, 80); }
      if (!name || missing[name] || !(window.CONFIG || {}).BGM) return;
      const a = new Audio('assets/audio/' + name + '.mp3');
      a.loop = name !== 'bgm_attic_ending'; a.volume = 0;
      const up = setInterval(() => { if (bgm !== a) { clearInterval(up); return; } a.volume = Math.min(on ? 0.32 : 0, a.volume + 0.02); if (a.volume >= 0.32 || !on) clearInterval(up); }, 80);
      a.addEventListener('error', () => { missing[name] = true; if (bgm === a) bgm = null; });
      bgm = a; if (on) a.play().catch(() => {});
    }
  };
  window.Sound = Sound;
})();

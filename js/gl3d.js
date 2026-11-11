/* 아주 작은 WebGL 평면(컷아웃) 렌더러 — 외부 라이브러리 없음 */
(function () {
  'use strict';

  // ---------- 행렬 (열 우선 4x4) ----------
  const M = {
    ident() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; },
    mul(a, b) {
      const o = new Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
      }
      return o;
    },
    persp(fovy, aspect, n, f) {
      const t = 1 / Math.tan(fovy / 2);
      return [t/aspect,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0];
    },
    trans(x, y, z) { return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; },
    scale(x, y, z) { return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]; },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; },
    vec(m, x, y, z) {
      return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14], m[3]*x+m[7]*y+m[11]*z+m[15]];
    }
  };

  const VS = `
attribute vec2 aPos;
uniform mat4 uMVP; uniform mat4 uMV; uniform vec4 uUV;
varying vec2 vUV; varying vec3 vPos;
void main(){
  vec4 p = vec4(aPos.x, aPos.y, 0.0, 1.0);
  vUV = vec2(aPos.x + 0.5, 1.0 - aPos.y) * uUV.xy + uUV.zw;
  vPos = (uMV * p).xyz;
  gl_Position = uMVP * p;
}`;
  const FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uTint; uniform float uAlpha;
uniform vec3 uFogColor; uniform vec3 uFog; uniform vec4 uSolid; uniform float uCut; uniform vec4 uBack;
varying vec2 vUV; varying vec3 vPos;
void main(){
  vec4 c = uSolid.a > 0.5 ? vec4(uSolid.rgb, 1.0) : texture2D(uTex, vUV);
  if (c.a < uCut) discard;
  if (uBack.a > 0.5 && !gl_FrontFacing) c = vec4(uBack.rgb * c.a, c.a);
  c.rgb *= uTint;
  float f = smoothstep(uFog.x, uFog.y, length(vPos)) * uFog.z;
  c.rgb = mix(c.rgb, uFogColor * c.a, f);
  gl_FragColor = c * uAlpha;
}`;

  class GL3D {
    constructor(canvas) {
      this.canvas = canvas;
      const opt = { alpha: false, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' };
      this.gl2 = !!canvas.getContext && !!(this.gl = canvas.getContext('webgl2', opt));
      if (!this.gl) this.gl = canvas.getContext('webgl', opt) || canvas.getContext('experimental-webgl', opt);
      if (!this.gl) throw new Error('WebGL을 쓸 수 없습니다');
      const gl = this.gl;
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const p = this.prog = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      gl.useProgram(p);
      this.u = {};
      ['uMVP','uMV','uUV','uTex','uTint','uAlpha','uFogColor','uFog','uSolid','uCut','uBack'].forEach(n => this.u[n] = gl.getUniformLocation(p, n));
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5,0, 0.5,0, -0.5,1, 0.5,1]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(p, 'aPos');
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      this.tex = {};          // id -> {tex,w,h,avg,top,bottom}
      this.quads = [];
      this.cam = { x: 0, y: 1.45, z: 0, yaw: 0, pitch: 0, fov: 56 * Math.PI / 180 };
      this.fog = { color: [1,1,1], near: 30, far: 90, amt: 1 };
      this.clear = [0.8, 0.85, 0.9];
      this.tint = [1, 1, 1];
      this.resize();
    }

    resize() {
      const c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(2, Math.floor(c.clientWidth * dpr)), h = Math.max(2, Math.floor(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      this.gl.viewport(0, 0, w, h);
    }

    /* 이미지를 불러 텍스처로. opt: {trim:알파 여백 자르기, max:최대 변, repeat:'repeat'|'mirror'|false} */
    load(id, url, opt) {
      opt = opt || {};
      if (this.tex[id]) return Promise.resolve(this.tex[id]);
      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          try { res(this._upload(id, img, opt)); } catch (e) { rej(e); }
        };
        img.onerror = () => rej(new Error('그림을 불러오지 못했습니다: ' + url));
        img.src = url;
      });
    }

    _upload(id, img, opt) {
      const gl = this.gl;
      const NW = img.naturalWidth || img.width, NH = img.naturalHeight || img.height;
      let sx = 0, sy = 0, sw = NW, sh = NH;
      const probe = document.createElement('canvas');
      const pw = Math.min(256, sw), ph = Math.max(1, Math.round(sh * pw / sw));
      probe.width = pw; probe.height = ph;
      const pc = probe.getContext('2d', { willReadFrequently: true });
      pc.drawImage(img, 0, 0, pw, ph);
      const d = pc.getImageData(0, 0, pw, ph).data;
      if (opt.trim) {
        let x0 = pw, y0 = ph, x1 = -1, y1 = -1;
        for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
          if (d[(y*pw+x)*4+3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 >= x0) {
          const k = sw / pw;
          sx = Math.max(0, Math.floor(x0 * k) - 2); sy = Math.max(0, Math.floor(y0 * k) - 2);
          sw = Math.min(NW - sx, Math.ceil((x1 - x0 + 1) * k) + 4);
          sh = Math.min(NH - sy, Math.ceil((y1 - y0 + 1) * k) + 4);
        }
      }
      // 지붕과 벽의 경계(처마 아래), 벽의 좌우 끝, 재료 색을 그림에서 읽는다
      let split = null, wallL = 0, wallR = 1, top0 = 0, band = null, gate = null;
      const col = { plaster: [244, 239, 230], wood: [154, 108, 76], line: [62, 43, 33], tile: [111, 106, 110] };
      if (opt.roof) {
        let y0 = ph, y1 = -1, bx0 = pw, bx1 = -1; const wid = [], fst = [], lst = [], cnt = [];
        for (let y = 0; y < ph; y++) { let a0 = -1, a1 = -1, n = 0;
          for (let x = 0; x < pw; x++) { const al = d[(y*pw+x)*4+3]; if (al > 16) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; } if (al > 60) { if (a0 < 0) a0 = x; a1 = x; n++; } }
          fst[y] = a0; lst[y] = a1; cnt[y] = n; wid[y] = a0 < 0 ? 0 : a1 - a0 + 1; if (a0 >= 0) { if (y < y0) y0 = y; y1 = y; } }
        if (y1 > y0) {
          const hh = y1 - y0 + 1, top = y0 + Math.floor(hh * 0.62); let wmax = 0, ym = y0;
          // 줄마다 '실제 폭': 듬성듬성한 줄(나뭇가지뿐인 줄)은 0으로 치고,
          // 촘촘한 줄에서는 양 끝에서 2%씩의 점을 떼고 잰다(지붕 옆으로 삐져나온 가지에 속지 않게).
          let cm0 = 0; for (let y = y0; y <= y1; y++) if (cnt[y] > cm0) cm0 = cnt[y];
          const rw = [];
          for (let y = y0; y <= y1; y++) { rw[y] = 0; if (cnt[y] < cm0 * 0.5) continue;
            const k = Math.max(1, Math.round(cnt[y] * 0.02)); let n = 0, xl = fst[y], xr = lst[y];
            for (let x = fst[y]; x <= lst[y]; x++) if (d[(y*pw+x)*4+3] > 60 && ++n >= k) { xl = x; break; }
            n = 0; for (let x = lst[y]; x >= fst[y]; x--) if (d[(y*pw+x)*4+3] > 60 && ++n >= k) { xr = x; break; }
            rw[y] = xr - xl + 1; }
          for (let y = y0; y < top; y++) if (rw[y] && rw[y] >= wmax * 0.985) { if (rw[y] > wmax) wmax = rw[y]; ym = y; }
          for (let y = ym; y < top; y++) if (rw[y] && rw[y] < wmax * 0.95) { split = (y - y0 + 1) / hh; break; }
          if (split !== null && (split < 0.18 || split > 0.6)) split = null;
          // 그림 맨 위의 가느다란 장식(나뭇가지 등)을 빼고, 지붕이 실제로 시작하는 줄
          let wall0 = 0, cmax = 0; for (let y = y0; y <= y1; y++) { if (wid[y] > wall0) wall0 = wid[y]; if (cnt[y] > cmax) cmax = cnt[y]; }
          for (let y = y0; y < y0 + hh * 0.6; y++) if (wid[y] >= wall0 * 0.5 && cnt[y] >= cmax * 0.5) { top0 = (y - y0) / hh; break; }
          if (top0 < 0.04) top0 = 0;
          // 담장처럼 지붕과 벽의 폭이 같은 그림: 기와 띠 아래 첫 나무 도리 줄을 경계로 삼는다
          const kind = y => { let op = 0, wd = 0;
            for (let x = 0; x < pw; x++) { const i = (y*pw+x)*4; if (d[i+3] < 200) continue; op++;
              const r = d[i], gg = d[i+1], b = d[i+2], L = (r + gg + b) / 3, sat = Math.max(r, gg, b) - Math.min(r, gg, b);
              if (!(L > 60 && L < 175 && sat < 45) && !(L > 205 && sat < 45) && r > gg && gg > b && r - b > 35) wd++; }
            return op >= cmax * 0.75 && wd / op > 0.45; };
          for (let y = y0 + Math.round(hh * top0) + 2; y < y0 + hh * 0.7; y++) if (kind(y)) { band = (y - y0) / hh; break; }
          // 대문채처럼 가운데가 높고 양옆이 낮은 그림: 가운데 몸채와 양옆 담을 따로 세울 수 있게 경계를 읽는다.
          // 꽃가지처럼 듬성듬성한 것에 속지 않도록, 줄·칸이 얼마나 칠해졌는지(촘촘한 정도)로 판단한다.
          if (band) {
            const bw = bx1 - bx0 + 1, gmed = a => { a.sort((p, r) => p - r); return a[a.length >> 1]; };
            const op = (x, y) => d[(y*pw+x)*4+3] > 60;
            // 어떤 세로 띠(xs…xe)에서 처음으로 절반 넘게 칠해진 줄
            const denseTop = (xs, xe, from) => { for (let y = from; y <= y1; y++) { let n = 0; for (let x = xs; x <= xe; x++) if (op(x, y)) n++; if (n >= (xe - xs + 1) * 0.5) return (y - y0) / hh; } return 1; };
            const e6 = Math.round(bw * 0.06);
            const eL = denseTop(bx0, bx0 + e6, y0), eR = denseTop(bx1 - e6, bx1, y0), mid = denseTop(bx0 + Math.round(bw * 0.45), bx0 + Math.round(bw * 0.55), y0), low = Math.min(eL, eR);
            if (eL > 0.35 && eR > 0.35 && mid < 0.2 && low - band > 0.2) {
              // 가운데 지붕의 좌우 끝: 처마 줄(기와 끝과 그 아래 도리)에서 가장 바깥
              let rxa = bx1, rxb = bx0;
              for (let y = y0 + Math.round(hh * (band - 0.045)); y <= y0 + Math.round(hh * (band + 0.02)); y++) if (fst[y] >= 0) { if (fst[y] < rxa) rxa = fst[y]; if (lst[y] > rxb) rxb = lst[y]; }
              // 가운데 몸채의 좌우 끝: 처마 아래부터 옆 담 지붕 위까지, 위아래로 거의 다 칠해진 칸
              const ya = y0 + Math.round(hh * (band + 0.12)), yb = y0 + Math.round(hh * (low - 0.04));
              const colFill = x => { let n = 0; for (let y = ya; y <= yb; y++) if (op(x, y)) n++; return n / (yb - ya + 1); };
              let xa = -1, xb = -1;
              for (let x = bx0; x <= bx1; x++) if (colFill(x) > 0.7) { xa = x; break; }
              for (let x = bx1; x >= bx0; x--) if (colFill(x) > 0.7) { xb = x; break; }
              if (xa > bx0 && xb > xa) {
                const wingW = (xa - bx0) + (bx1 - xb);
                let wTop = null, wBand = null;          // 옆 담: 지붕이 시작하는 줄, 지붕과 벽의 경계(첫 나무 줄)
                for (let y = ya; y <= y1 && wBand === null; y++) { let n = 0, wd = 0;
                  for (let x = bx0; x <= bx1; x++) { if (x >= xa - 2 && x <= xb + 2) continue; const i = (y*pw+x)*4; if (d[i+3] < 200) continue; n++;
                    const r = d[i], gg = d[i+1], b = d[i+2], L = (r + gg + b) / 3, sat = Math.max(r, gg, b) - Math.min(r, gg, b);
                    if (!(L > 60 && L < 175 && sat < 45) && !(L > 205 && sat < 45) && r > gg && gg > b && r - b > 35) wd++; }
                  if (wTop === null) { if (n >= wingW * 0.3) wTop = (y - y0) / hh; }
                  else if ((y - y0) / hh > wTop + 0.03 && n >= wingW * 0.7 && wd / n > 0.45) wBand = (y - y0) / hh; }
                if (wTop !== null && wBand !== null) {
                  const yc = y0 + Math.round(hh * (wBand + 0.06)), yd = y0 + Math.round(hh * 0.9), Lw = [], Rw = [];
                  for (let y = yc; y <= yd; y++) if (fst[y] >= 0) { Lw.push(fst[y]); Rw.push(lst[y]); }
                  const cL = (xa - bx0) / bw, cR = (xb + 1 - bx0) / bw;
                  if (Lw.length && cL > 0.06 && cL < 0.42 && cR > 0.58 && cR < 0.94)
                    gate = { rL: Math.min(cL, (rxa - bx0) / bw), rR: Math.max(cR, (rxb + 1 - bx0) / bw), cL: cL, cR: cR, wTop: wTop, wBand: wBand, wL: (gmed(Lw) - bx0) / bw, wR: (gmed(Rw) + 1 - bx0) / bw };
                }
              }
            }
          }
          const ys = y0 + Math.round(hh * (split || band || 0.45)), wh = y1 - ys, Ls = [], Rs = [];
          for (let y = ys + Math.floor(wh * 0.25); y <= ys + Math.floor(wh * 0.8); y++) if (fst[y] >= 0) { Ls.push(fst[y]); Rs.push(lst[y]); }
          if (Ls.length && bx1 > bx0) { Ls.sort((a, b) => a - b); Rs.sort((a, b) => a - b); const bw = bx1 - bx0 + 1;
            wallL = (Ls[Ls.length >> 1] - bx0) / bw; wallR = (Rs[Rs.length >> 1] + 1 - bx0) / bw; }
          const acc = { plaster: [0, 0, 0, 0], wood: [0, 0, 0, 0], line: [0, 0, 0, 0], tile: [0, 0, 0, 0] };
          for (let y = y0; y <= y1; y++) for (let x = 0; x < pw; x += 2) { const i = (y*pw+x)*4; if (d[i+3] < 220) continue;
            const r = d[i], gg = d[i+1], b = d[i+2], L = (r + gg + b) / 3, sat = Math.max(r, gg, b) - Math.min(r, gg, b);
            let k = null;
            if (y < ys) { if (L > 70 && L < 175 && sat < 45) k = 'tile'; }
            else if (L > 205 && sat < 45) k = 'plaster'; else if (L < 80) k = 'line'; else if (r > gg && gg > b && r - b > 35 && L > 90 && L < 195) k = 'wood';
            if (k) { const a = acc[k]; a[0] += r; a[1] += gg; a[2] += b; a[3]++; } }
          Object.keys(acc).forEach(k => { const a = acc[k]; if (a[3] > 25) col[k] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
        }
      }
      const avgRow = (row) => {
        let r = 0, g = 0, b = 0, n = 0;
        for (let x = 0; x < pw; x++) { const i = (row*pw+x)*4; if (d[i+3] > 200) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; } }
        return n ? [r/n/255, g/n/255, b/n/255] : [1,1,1];
      };
      const info = { w: sw, h: sh, split: split, top0: top0, band: band, gate: gate, wallL: wallL, wallR: wallR, col: col, top: avgRow(1), bottom: avgRow(ph - 2), mid: avgRow(Math.floor(ph * 0.62)) };
      const max = opt.max || 1024;
      let tw = sw, th = sh;
      const k = Math.min(1, max / Math.max(sw, sh));
      tw = Math.max(1, Math.round(sw * k)); th = Math.max(1, Math.round(sh * k));
      const pot = v => Math.pow(2, Math.round(Math.log(v) / Math.LN2));
      if (opt.repeat) { tw = pot(tw); th = pot(th); }
      const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
      const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      if (opt.fade) { const gr = cx.createLinearGradient(0, th * 0.78, 0, th); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = gr; cx.fillRect(0, th * 0.78, tw, th * 0.22 + 1); cx.globalCompositeOperation = 'source-over'; }
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      const isPot = v => (v & (v - 1)) === 0;
      const mip = this.gl2 || (isPot(tw) && isPot(th));
      const wrap = opt.repeat === 'mirror' ? gl.MIRRORED_REPEAT : (opt.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opt.repeat === 'mirror' ? gl.CLAMP_TO_EDGE : wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(8, gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      info.tex = t;
      this.tex[id] = info;
      return info;
    }

    /* 캔버스로 직접 그린 그림을 텍스처로 */
    addCanvas(id, cv, opt) { if (this.tex[id]) return this.tex[id]; return this._upload(id, cv, opt || {}); }

    freeAll(keep) {
      const gl = this.gl;
      Object.keys(this.tex).forEach(id => {
        if (keep && keep.has(id)) return;
        gl.deleteTexture(this.tex[id].tex); delete this.tex[id];
      });
    }

    clearQuads() { this.quads = []; }

    /* q: {tex|color, x,y,z, w,h, ry, flat, uv:[sx,sy,ox,oy], layer, fog, alpha, tint, follow} */
    add(q) {
      q.ry = q.ry || 0; q.layer = q.layer || 0; q.alpha = q.alpha == null ? 1 : q.alpha;
      q.fog = q.fog == null ? 1 : q.fog; q.uv = q.uv || [1,1,0,0];
      this.quads.push(q); return q;
    }

    viewMatrix() {
      const c = this.cam;
      return M.mul(M.rotX(-c.pitch), M.mul(M.rotY(-c.yaw), M.trans(-c.x, -c.y, -c.z)));
    }

    /* 세계 좌표 -> 화면(CSS px). 카메라 뒤면 null */
    project(x, y, z) {
      const v = M.vec(this._vp || M.ident(), x, y, z);
      if (v[3] <= 0.05) return null;
      const c = this.canvas;
      return { x: (v[0] / v[3] * 0.5 + 0.5) * c.clientWidth, y: (1 - (v[1] / v[3] * 0.5 + 0.5)) * c.clientHeight, w: v[3] };
    }

    render() {
      const gl = this.gl, u = this.u, cam = this.cam;
      this.resize();
      gl.clearColor(this.clear[0], this.clear[1], this.clear[2], 1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const proj = M.persp(cam.fov, this.canvas.width / this.canvas.height, 0.3, 500);
      const view = this.viewMatrix();
      this._vp = M.mul(proj, view);
      gl.uniform3fv(u.uFogColor, this.fog.color);
      gl.uniform1i(u.uTex, 0);
      const list = this.quads.filter(q => !q.hidden);
      for (const q of list) {
        const qx = q.x + (q.follow ? cam.x : 0), qz = q.z + (q.follow ? cam.z : 0);
        q._d = (qx - cam.x) * (qx - cam.x) + (qz - cam.z) * (qz - cam.z);
        q._wx = qx; q._wz = qz;
      }
      list.sort((a, b) => (a.layer - b.layer) || (b._d - a._d));
      for (const q of list) {
        // 하늘은 깊이 없이 맨 뒤에, 나머지는 깊이 검사 + 알파 잘라내기
        if (q.sky) { gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.uniform1f(u.uCut, 0.0); }
        else { gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.uniform1f(u.uCut, q.cut != null ? q.cut : 0.4); }
        if (q.bb) q.ry = Math.atan2(cam.x - q._wx, cam.z - q._wz);
        let m;
        if (q.flat) m = M.mul(M.trans(q._wx, q.y, q._wz), M.mul(M.rotX(-Math.PI / 2), M.mul(M.scale(q.w, q.h, 1), M.trans(0, -0.5, 0))));
        else if (q.rx) m = M.mul(M.trans(q._wx, q.y, q._wz), M.mul(M.rotY(q.ry), M.mul(M.rotX(q.rx), M.scale(q.w, q.h, 1))));
        else m = M.mul(M.trans(q._wx, q.y, q._wz), M.mul(M.rotY(q.ry), M.scale(q.w, q.h, 1)));
        const mv = M.mul(view, m);
        gl.uniformMatrix4fv(u.uMV, false, new Float32Array(mv));
        gl.uniformMatrix4fv(u.uMVP, false, new Float32Array(M.mul(proj, mv)));
        gl.uniform4fv(u.uUV, q.uv);
        const t = q.tint || [1,1,1];
        gl.uniform3f(u.uTint, t[0] * this.tint[0], t[1] * this.tint[1], t[2] * this.tint[2]);
        gl.uniform1f(u.uAlpha, q.alpha);
        gl.uniform3f(u.uFog, this.fog.near, this.fog.far, this.fog.amt * q.fog);
        if (q.back) gl.uniform4f(u.uBack, q.back[0], q.back[1], q.back[2], 1); else gl.uniform4f(u.uBack, 0, 0, 0, 0);
        if (q.color) gl.uniform4f(u.uSolid, q.color[0], q.color[1], q.color[2], 1);
        else {
          const ti = this.tex[q.tex]; if (!ti) continue;
          gl.uniform4f(u.uSolid, 0, 0, 0, 0);
          gl.bindTexture(gl.TEXTURE_2D, ti.tex);
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }

  window.GL3D = GL3D;
})();

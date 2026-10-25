// Hero « Drop Viewer » : chaque pièce apparaît sous un projecteur qui suit le pointeur.
// Rendu WebGL fait main (aucune librairie) : ondulation liquide, décalage chromatique
// selon la vitesse, transition par dissolution avec un bord rouge incandescent.
// Repli automatique sur une simple image si WebGL n'est pas disponible.
import { reducedMotion } from './scroll';
import { quickAdd, type QuickProduct } from './quickadd';
import { formatPrice } from '../lib/shop';

interface DvProduct extends QuickProduct {
  word: string;
  short: string;
  category: string;
  hero: string;
  url: string;
}

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG = `
precision mediump float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uP;
uniform float uT;
uniform float uVel;
uniform float uSpot;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform vec4 uRect;
float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec4 tex(sampler2D t,vec2 uv){
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.);
  return texture2D(t,uv);
}
vec4 rgbSplit(sampler2D t,vec2 uv,float s){
  vec4 c=tex(t,uv);
  return vec4(tex(t,uv+vec2(s,0.)).r,c.g,tex(t,uv-vec2(s,0.)).b,c.a);
}
void main(){
  vec2 px=gl_FragCoord.xy;
  vec2 uv=(px-uRect.xy)/uRect.zw;
  uv.y=1.-uv.y;
  float d=distance(px,uMouse);
  vec2 dir=normalize(px-uMouse+.0001);
  float ripple=sin(d*.035-uT*3.2)*exp(-d*.005)*(.003+uVel*.03);
  uv+=dir*vec2(1.,-1.)*ripple;
  uv.x+=sin(uv.y*9.+uT*1.1)*.0022;
  uv.y+=cos(uv.x*7.+uT*.9)*.0016;
  float n=noise(uv*5.+uT*.1)*.65+noise(uv*17.)*.35;
  float nv=n*.62+(1.-uv.y)*.38;
  float e=1.12-uP*1.3;
  float reveal=smoothstep(e-.03,e+.03,nv);
  float trans=1.-abs(uP*2.-1.);
  float split=.0025+uVel*.02+trans*.01;
  vec4 a=rgbSplit(uA,uv+vec2(0.,reveal*.015),split);
  vec4 b=rgbSplit(uB,uv-vec2(0.,(1.-reveal)*.03),split);
  vec4 c=mix(a,b,reveal);
  float band=(1.-smoothstep(0.,.075,abs(nv-e)))*step(.001,uP)*step(uP,.999);
  vec3 holo=.62+.38*cos(6.2832*(uv.y*1.6+uv.x*.8+uT*.15+vec3(0.,.33,.67)));
  vec3 hot=mix(holo,vec3(1.),smoothstep(.6,1.,band));
  c.rgb+=hot*band*1.9*max(a.a,b.a);
  float spot=exp(-pow(d/(uRes.y*.55),2.));
  float light=mix(1.,.66+.55*spot,uSpot);
  c.rgb*=light*vec3(.97,.99,1.04);
  c.rgb+=(hash(px+uT)-.5)*.05*c.a;
  gl_FragColor=vec4(c.rgb*c.a,c.a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
  return sh;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*°#';
function scramble(el: HTMLElement, text: string, duration = 700) {
  if (reducedMotion) {
    el.textContent = text;
    return;
  }
  const start = performance.now();
  const from = el.textContent ?? '';
  const len = Math.max(from.length, text.length);
  const step = (t: number) => {
    const p = Math.min(1, (t - start) / duration);
    let out = '';
    for (let i = 0; i < len; i++) {
      const done = i / len < p;
      if (done) out += text[i] ?? '';
      else if (text[i] === ' ') out += ' ';
      else if (i < text.length) out += SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = text;
  };
  requestAnimationFrame(step);
}

export function initDropViewer(signal: AbortSignal, introDone: Promise<void>) {
  const root = document.querySelector<HTMLElement>('[data-dropviewer]');
  if (!root) return;
  const items = JSON.parse(root.querySelector('[data-dv-json]')!.textContent!) as DvProduct[];
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dv-canvas]')!;
  const fallback = root.querySelector<HTMLImageElement>('[data-dv-fallback]')!;
  const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
  const elName = $('[data-dv-name]');
  const elWord = $('[data-dv-word]');
  const elIndex = $('[data-dv-index]');
  const elCat = $('[data-dv-cat]');
  const elShort = $('[data-dv-short]');
  const elPrice = $('[data-dv-price]');
  const elStock = $('[data-dv-stock]');
  const elSizes = $('[data-dv-sizes]');
  const elLink = root.querySelector<HTMLAnchorElement>('[data-dv-link]')!;
  const rail = [...root.querySelectorAll<HTMLButtonElement>('[data-dv-go]')];
  const AUTOPLAY = 7000;

  let current = 0;
  let autoplay = !reducedMotion;

  /* ---------- Interface ---------- */
  function renderUI(i: number, first = false) {
    const p = items[i];
    const total = p.sizes.reduce((n, s) => n + s.stock, 0);
    if (first) {
      elName.textContent = p.name;
      elWord.textContent = p.word;
    } else {
      scramble(elName, p.name.toUpperCase(), 650);
      scramble(elWord, p.word, 900);
    }
    elIndex.textContent = String(i + 1).padStart(2, '0');
    elCat.textContent = p.category;
    elShort.textContent = p.short;
    elPrice.textContent = formatPrice(p.price);
    elLink.href = p.url;
    elStock.innerHTML =
      total === 0
        ? 'Épuisé'
        : total <= 15
          ? `<span class="dv__hot">Plus que ${total} pièces</span>`
          : `${total} pièces en stock`;
    elSizes.innerHTML = p.sizes
      .map(
        (s) =>
          `<button type="button" class="dv__size${s.stock > 0 && s.stock <= 3 ? ' is-low' : ''}" data-dv-size="${s.size}" ${s.stock === 0 ? 'disabled' : ''} aria-label="Ajouter ${p.name}, taille ${s.size}${s.stock === 0 ? ' (épuisé)' : ''}">${s.size}</button>`,
      )
      .join('');
    rail.forEach((b, j) => {
      b.classList.toggle('is-active', j === i);
      b.setAttribute('aria-current', j === i ? 'true' : 'false');
    });
    root!.style.setProperty('--dv-autoplay', `${AUTOPLAY}ms`);
    root!.classList.remove('is-cycling');
    void root!.offsetWidth;
    if (autoplay && root!.classList.contains('is-ready')) root!.classList.add('is-cycling');
  }

  // L'enchaînement suit la barre de progression (en pause au survol)
  function stopAutoplay() {
    autoplay = false;
    root!.classList.remove('is-cycling');
  }
  root.addEventListener(
    'animationend',
    (e) => {
      if (autoplay && e.animationName === 'dv-fill' && (e.target as HTMLElement).closest('.is-active')) go(current + 1);
    },
    { signal },
  );

  elSizes.addEventListener(
    'click',
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dv-size]');
      if (!b) return;
      stopAutoplay();
      quickAdd(items[current], b.dataset.dvSize!, b);
    },
    { signal },
  );
  rail.forEach((b) =>
    b.addEventListener(
      'click',
      () => {
        stopAutoplay();
        go(Number(b.dataset.dvGo));
      },
      { signal },
    ),
  );
  root.addEventListener('pointerenter', () => root.classList.add('is-paused'), { signal });
  root.addEventListener('pointerleave', () => root.classList.remove('is-paused'), { signal });
  document.addEventListener(
    'keydown',
    (e) => {
      if (root.getBoundingClientRect().bottom < 0 || (e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') {
        stopAutoplay();
        go(current + 1);
      } else if (e.key === 'ArrowLeft') {
        stopAutoplay();
        go(current - 1);
      }
    },
    { signal },
  );
  let touchX = 0;
  root.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true, signal });
  root.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 60) {
        stopAutoplay();
        go(current + (dx < 0 ? 1 : -1));
      }
    },
    { signal },
  );

  /* ---------- WebGL ---------- */
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }

  let go = (i: number) => {
    // Repli sans WebGL : fondu simple
    current = (i + items.length) % items.length;
    fallback.style.opacity = '0';
    setTimeout(() => {
      fallback.src = items[current].hero;
      fallback.style.opacity = '1';
    }, 250);
    renderUI(current);
  };

  introDone.then(() => {
    root.classList.add('is-ready');
    if (autoplay) root.classList.add('is-cycling');
  });
  renderUI(0, true);

  if (!gl) return;

  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
  } catch {
    return;
  }
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl!.getUniformLocation(program, n);
  const uA = U('uA'),
    uB = U('uB'),
    uP = U('uP'),
    uT = U('uT'),
    uVel = U('uVel'),
    uSpot = U('uSpot'),
    uMouse = U('uMouse'),
    uRes = U('uRes'),
    uRect = U('uRect');
  gl.uniform1i(uA, 0);
  gl.uniform1i(uB, 1);

  const textures: (WebGLTexture | null)[] = items.map(() => null);
  const makeTex = (img: HTMLImageElement) => {
    const t = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
    return t;
  };
  const loading = items.map((p, i) =>
    loadImage(p.hero)
      .then((img) => {
        textures[i] = makeTex(img);
      })
      .catch(() => {}),
  );

  let from = 0;
  let to = 0;
  let progress = 1;
  let transStart = 0;
  const TRANS = 1300;
  let mx = 0.5,
    my = 0.45,
    tmx = 0.5,
    tmy = 0.45,
    vel = 0,
    spot = 0;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let lastMove = 0;

  root.addEventListener(
    'pointermove',
    (e) => {
      const r = root.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      vel = Math.min(1, vel + Math.hypot(nx - tmx, ny - tmy) * 4);
      tmx = nx;
      tmy = ny;
      lastMove = performance.now();
    },
    { passive: true, signal },
  );

  go = (i: number) => {
    const next = (i + items.length) % items.length;
    if (next === current && progress >= 1) return;
    from = current;
    to = next;
    current = next;
    progress = reducedMotion ? 1 : 0;
    transStart = performance.now();
    renderUI(current);
  };

  let dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { signal });
  resize();

  let visible = true;
  let raf = 0;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(root);

  function frame(t: number) {
    raf = 0;
    if (!visible) return;
    const W = canvas.width;
    const H = canvas.height;
    if (!fine || t - lastMove > 2500) {
      // Projecteur en mouvement autonome quand le pointeur est absent
      tmx = 0.5 + Math.sin(t / 2600) * 0.22;
      tmy = 0.42 + Math.cos(t / 3100) * 0.14;
    }
    mx += (tmx - mx) * 0.08;
    my += (tmy - my) * 0.08;
    vel *= 0.92;
    spot += ((root!.classList.contains('is-ready') ? 1 : 0) - spot) * 0.04;
    if (progress < 1) progress = Math.min(1, (t - transStart) / TRANS);

    // Boîte de la pièce : centrée, légèrement remontée
    const mobile = W / dpr < 861;
    const h = Math.min(H * (mobile ? 0.6 : 0.86), W * (mobile ? 1.05 : 0.62) * 1.25);
    const w = h * 0.8;
    const cx = W / 2;
    const cy = H * (mobile ? 0.4 : 0.5);
    const rect = [cx - w / 2, H - (cy + h / 2), w, h];

    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    const ta = textures[progress < 1 ? from : to] ?? textures[to];
    const tb = textures[to] ?? ta;
    if (ta && tb) {
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, ta);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, tb);
      const eased = progress < 1 ? progress * progress * (3 - 2 * progress) : 1;
      gl!.uniform1f(uP, progress < 1 ? eased : 1);
      gl!.uniform1f(uT, t / 1000);
      gl!.uniform1f(uVel, vel);
      gl!.uniform1f(uSpot, spot);
      gl!.uniform2f(uMouse, mx * W, (1 - my) * H);
      gl!.uniform2f(uRes, W, H);
      gl!.uniform4f(uRect, rect[0], rect[1], rect[2], rect[3]);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      if (!root!.classList.contains('has-gl')) root!.classList.add('has-gl');
    }
    raf = requestAnimationFrame(frame);
  }
  Promise.all(loading).then(() => {
    if (!raf) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);

  signal.addEventListener('abort', () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    textures.forEach((tx) => tx && gl!.deleteTexture(tx));
    gl!.getExtension('WEBGL_lose_context')?.loseContext();
  });
}

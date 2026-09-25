/* 紙芝居 kamishibai — ガイド付きウォークスルーのエンジン
   内容は content/*.js 側に書く。ここは触らなくてよい。 */
(function(global){
'use strict';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ========== 内容を書くための部品 ========== */
const K = {
  /* 誰の視点か */
  who(p){ return `<div class="who"><span class="av" style="background:${p.color||'var(--blue)'}">${esc(p.initial||'◆')}</span><b>${esc(p.name)}</b>${p.note?`<span>${esc(p.note)}</span>`:''}</div>`; },
  /* 人ではなく仕組みの説明 */
  sys(t){ return K.who({name:t, initial:'◆', color:'linear-gradient(150deg,var(--blue),var(--pur))'}); },
  /* 大見出し。<em> で青、<mark class="o"> で橙、<mark class="r"> で赤の縁取り */
  head(html){ return `<h1 class="big">${html}</h1>`; },
  lead(html){ return `<p class="say">${html}</p>`; },
  tiny(html){ return `<p class="tiny">${html}</p>`; },
  /* 横に並ぶカード */
  cards(list){ return `<div class="cards">${list.map(c =>
    `<div class="card">${c.k?`<div class="k">${esc(c.k)}</div>`:''}<div class="v"${c.color?` style="color:${c.color}"`:''}>${c.v}</div>${c.d?`<div class="d">${c.d}</div>`:''}</div>`).join('')}</div>`; },
  /* 大きい数字。count:true でカウントアップ */
  nums(list){ return `<div class="nums">${list.map(n =>
    `<div class="num ${n.tone||''}"><div class="n"${n.count?` data-to="${n.count}"`:''}>${n.count?0:n.n}</div><div class="l">${n.label}</div></div>`).join('')}</div>`; },
  /* 黄色い吹き出し（確認ポイント） */
  ask(tag, q, items){ return `<div class="bubble"><span class="tag">${esc(tag)}</span><p>${q}</p>${
    items&&items.length?`<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}</div>`; },
  memo(html){ return `<div class="memo">${html}</div>`; },
  pill(t, tone){ return `<span class="pill ${tone||''}">${t}</span>`; },
  quote(t, cite){ return `<div class="quote"><p>${t}</p>${cite?`<cite>${esc(cite)}</cite>`:''}</div>`; },
  rule(){ return '<div class="rule"></div>'; },
  /* 番号つきの目標リスト */
  goals(list){ return `<div class="goals">${list.map((g,i)=>
    `<div class="goal"><span class="medal" style="background:${g.color||'var(--blue)'}">${i+1}</span><div><div class="gt">${g.title}</div><div class="gd">${g.body}</div></div></div>`).join('')}</div>`; },
  /* 行動導線（リンクにもできる） */
  todo(list){ return `<div class="todo">${list.map((t,i)=>{
    const inner = `<span class="no"${t.color?` style="background:${t.color}"`:''}>${i+1}</span><div><div class="tt">${t.title}</div><div class="td">${t.body}</div>${t.link?`<span class="lk">${t.link.label}</span>`:''}</div>`;
    return t.link?`<a class="tdo" href="${t.link.href}" target="_blank" rel="noopener">${inner}</a>`:`<div class="tdo">${inner}</div>`;
  }).join('')}</div>`; },
  callout(html){ return `<div class="callout">${html}</div>`; },
};

/* ========== 音（Web Audio でその場で合成。音源ファイルは要らない） ========== */
let AC = null, soundOn = true, voice = 'soft';
const SEQ = {
  next:[1046.5,1318.5,1568,2093], fin:[1046.5,1318.5,1568,2093,2637],
  tap:[1568,2093,2637], open:[1318.5,1760], back:[880,659.3]
};
/* ぴこぴこ（sound:'chip'）。矩形波・単音・短いゲート・余韻なし。
   ゲーム機の効果音の作り: 音を重ねず、切るときはスパッと切る。 */
const CHIP = {
  next:[1046.5,1318.5,1568,2093], fin:[784,1046.5,1318.5,1568,2093,2637,3136],
  tap:[1568,3136], open:[1318.5,2637], back:[1318.5,880]
};
function chipChime(kind){
  const t0 = AC.currentTime + 0.01, master = AC.createGain();
  master.gain.value = 0.06; master.connect(AC.destination);      /* 矩形波は大きいので絞る */
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
  lp.connect(master);                                            /* 高域の刺さりだけ落とす */
  const seq = CHIP[kind] || CHIP.next;
  const step = kind === 'fin' ? 0.07 : kind === 'tap' ? 0.045 : 0.06;
  const gate = step * 0.8;                                       /* 音の間に一瞬の無音 ＝ ぴこぴこ感 */
  seq.forEach((f, i) => {
    const t = t0 + i * step;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 0.002);                /* 立ち上がりは即 */
    g.gain.setValueAtTime(1, t + gate - 0.012);
    g.gain.linearRampToValueAtTime(0.0001, t + gate);            /* 余韻なし、スパッと */
    o.connect(g); g.connect(lp); o.start(t); o.stop(t + gate + 0.01);
  });
  if(kind === 'fin'){                                            /* 最後だけ、和音で「ジャン」 */
    const t = t0 + seq.length * step;
    [2093, 2637, 3136].forEach(f => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.7, t + 0.002);
      g.gain.setValueAtTime(0.7, t + 0.22);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + 0.28);
    });
  }
}
function chime(kind){
  if(!soundOn) return;
  try{
    AC = AC || new (global.AudioContext || global.webkitAudioContext)();
    if(AC.state === 'suspended') AC.resume();
    if(voice === 'chip'){ chipChime(kind); return; }
    const t0 = AC.currentTime + 0.01, master = AC.createGain();
    master.gain.value = 0.15; master.connect(AC.destination);
    const seq = SEQ[kind] || SEQ.next;
    const step = kind === 'fin' ? 0.075 : kind === 'tap' ? 0.04 : 0.055;
    seq.forEach((f, i) => {
      const t = t0 + i * step;
      [0, 8].forEach((det, k) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(k ? 0.3 : 1, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6);
      });
    });
    if(kind === 'next' || kind === 'fin'){            /* 最後の「リーン」 */
      const t = t0 + seq.length * step + 0.02;
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.value = kind === 'fin' ? 3136 : 2637;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.45, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 1.2);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3);
    }
  }catch(e){ /* 音が出せない環境でも本体は動かす */ }
}

/* ========== キラキラ ========== */
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 .8c1.15 6.9 4.15 9.9 11.2 11.2-7.05 1.3-10.05 4.3-11.2 11.2C10.85 16.3 7.85 13.3.8 12 7.85 10.7 10.85 7.7 12 .8Z" fill="#FBF08A" stroke="#250220" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 6.6c.6 2.9 1.9 4.2 4.8 4.8-2.9.6-4.2 1.9-4.8 4.8-.6-2.9-1.9-4.2-4.8-4.8 2.9-.6 4.2-1.9 4.8-4.8Z" fill="#FFFDF2"/></svg>';
let fx = null;
function burst(el, n, spread){
  if(reduce() || !el || !fx) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for(let i = 0; i < n; i++){
    const s = document.createElement('div');
    s.className = 'star'; s.innerHTML = STAR;
    const size = 13 + Math.random() * 22;
    s.style.left = cx + 'px'; s.style.top = cy + 'px';
    s.style.width = size + 'px'; s.style.height = size + 'px';
    fx.appendChild(s);
    const sp = spread || 170;
    const ang = (-90 + (Math.random() * sp - sp / 2)) * Math.PI / 180;
    const dist = 55 + Math.random() * 115;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    const rot = Math.random() * 200 - 100;
    s.animate([
      {transform:'translate(-50%,-50%) scale(0) rotate(0deg)', opacity:0},
      {transform:`translate(calc(-50% + ${dx*.5}px),calc(-50% + ${dy*.5}px)) scale(1.15) rotate(${rot*.55}deg)`, opacity:1, offset:.32},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.15) rotate(${rot}deg)`, opacity:0}
    ], {duration:600 + Math.random()*300, easing:'cubic-bezier(.2,.75,.3,1)', delay:Math.random()*90})
     .onfinish = () => s.remove();
  }
}

/* ========== 押された感じ ========== */
function squish(el, strong){
  if(!el || reduce()) return;
  const sx = strong ? 1.12 : 1.06, sy = strong ? .84 : .91;
  el.animate([
    {transform:'translateY(0) scale(1,1)'},
    {transform:`translateY(4px) scale(${sx},${sy})`, offset:.24},
    {transform:'translateY(-3px) scale(.96,1.06)', offset:.56},
    {transform:'translateY(0) scale(1,1)'}
  ], {duration:360, easing:'cubic-bezier(.25,.85,.3,1)'});
}

/* ========== 本体 ========== */
function init(cfg){
  const S = cfg.steps || [];
  const CH = cfg.chapters || [''];
  if(!S.length) throw new Error('kamishibai: steps が空です');
  soundOn = cfg.sound !== false;
  voice = cfg.sound === 'chip' ? 'chip' : 'soft';   /* true なら従来の音 */

  document.body.insertAdjacentHTML('afterbegin', `
<div id="fx" aria-hidden="true"></div>
<div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
<div class="app">
<div class="top"><div class="top-in">
  <div class="brand">${esc(cfg.brand?.name||'')}${cfg.brand?.sub?`<i>${esc(cfg.brand.sub)}</i>`:''}</div>
  <div class="chaps" id="k-chaps"></div>
  <button class="mute" id="k-mute" aria-pressed="false" aria-label="音のオン・オフ">🔊</button>
  <div class="stepn" id="k-stepn"></div>
</div></div>
<main><div class="pagetag" id="k-tag"></div><div id="k-stage"></div></main>
<div class="guide"><div class="guide-in">
  <div class="talkwrap" id="k-talkwrap" hidden>
    ${cfg.guide?.still ? `<button class="charwrap" id="k-charwrap" aria-label="ガイドをつつく"><img class="char" id="k-char" alt=""></button>` : ''}
    <div class="talk"><div class="t" id="k-talk"></div></div>
  </div>
  <div class="nav">
    <button class="gbtn" id="k-gbtn" aria-expanded="false" aria-controls="k-talkwrap" aria-label="解説を見る">
      ${cfg.guide?.loop ? '<video class="charSm" id="k-charsm" autoplay loop muted playsinline disablepictureinpicture aria-hidden="true"></video>'
        : cfg.guide?.face ? '<img class="charSm" id="k-charface" alt="">' : '<span class="face">◆</span>'}
      <span class="badge">?</span></button>
    <button class="btn" id="k-prev">${esc(cfg.labels?.prev||'もどる')}</button>
    <button class="btn go" id="k-next">${esc(cfg.labels?.next||'つぎへ')}</button>
  </div>
</div></div>
</div>`);

  fx = document.getElementById('fx');
  const stage = document.getElementById('k-stage'), chapsEl = document.getElementById('k-chaps'),
        stepn = document.getElementById('k-stepn'), tag = document.getElementById('k-tag'),
        wrap = document.getElementById('k-talkwrap'), talkT = document.getElementById('k-talk'),
        gbtn = document.getElementById('k-gbtn'), mute = document.getElementById('k-mute'),
        bPrev = document.getElementById('k-prev'), bNext = document.getElementById('k-next'),
        charwrap = document.getElementById('k-charwrap'), charImg = document.getElementById('k-char'),
        charSm = document.getElementById('k-charsm');

  if(charImg && cfg.guide?.still) charImg.src = cfg.guide.still;
  const charFace = document.getElementById('k-charface');
  if(charFace && cfg.guide?.face) charFace.src = cfg.guide.face;
  if(charSm && cfg.guide?.loop){ charSm.src = cfg.guide.loop; const po = cfg.guide.face || cfg.guide.still; if(po) charSm.poster = po; charSm.play().catch(()=>{}); }

  const body = s => s.cover
    ? `<div class="cover"><div class="num">${esc(s.cover.num)}</div><div class="ttl">${esc(s.cover.title)}</div>${s.cover.sub?`<div class="sub">${esc(s.cover.sub)}</div>`:''}</div>`
    : (s.html || '');
  stage.innerHTML = S.map((s,i) => `<div class="step" id="k-st${i}">${body(s)}</div>`).join('');

  chapsEl.innerHTML = CH.map((nm, ci) => {
    const n = S.filter(s => (s.ch|0) === ci).length;
    const first = S.findIndex(s => (s.ch|0) === ci);
    return `<div class="chap">` + Array.from({length:n}, (_,k) =>
      `<button class="b" data-g="${first+k}" aria-label="${esc(nm)} ${k+1}"></button>`).join('') + `</div>`;
  }).join('');
  chapsEl.querySelectorAll('[data-g]').forEach(b => b.onclick = () => go(+b.dataset.g));

  let cur = 0;
  function countUp(el){
    const to = +el.dataset.to; if(!to) return;
    const t0 = performance.now();
    (function t(n){
      const p = Math.min(1, (n - t0) / 1000), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if(p < 1) requestAnimationFrame(t);
      else el.animate([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:340,easing:'ease-out'});
    })(t0);
  }
  function go(i){
    cur = Math.max(0, Math.min(S.length - 1, i));
    document.querySelectorAll('.step').forEach((el, j) => el.classList.toggle('on', j === cur));
    chapsEl.querySelectorAll('[data-g]').forEach(b => {
      const g = +b.dataset.g; b.classList.toggle('on', g === cur); b.classList.toggle('done', g < cur);
    });
    stepn.textContent = (cur + 1) + ' / ' + S.length;
    tag.textContent = S[cur].tag || '';
    tag.style.animation = 'none'; void tag.offsetWidth; tag.style.animation = '';
    bPrev.disabled = cur === 0;
    bNext.textContent = cur === S.length - 1 ? (cfg.labels?.end || 'おわり！')
                      : (S[cur].cover ? (cfg.labels?.start || 'はじめる') : (cfg.labels?.next || 'つぎへ'));
    bNext.disabled = cur === S.length - 1;
    talkT.innerHTML = S[cur].talk || '';
    wrap.hidden = true; gbtn.setAttribute('aria-expanded','false');
    global.scrollTo({top:0, behavior:'instant'});
    const el = document.getElementById('k-st' + cur);
    el.querySelectorAll('[data-to]').forEach(countUp);
    if(typeof S[cur].onShow === 'function') S[cur].onShow(el, {chime, burst, squish});
  }

  mute.onclick = () => { soundOn = !soundOn; mute.setAttribute('aria-pressed', String(!soundOn));
    mute.textContent = soundOn ? '🔊' : '🔇'; squish(mute); if(soundOn) chime('open'); };
  gbtn.onclick = () => { const open = wrap.hidden; wrap.hidden = !open;
    gbtn.setAttribute('aria-expanded', String(open)); squish(gbtn);
    if(open){ chime('open'); burst(gbtn, 7, 200);
      wrap.style.animation='none'; void wrap.offsetWidth; wrap.style.animation='';
      if(charwrap){ charwrap.style.animation='none'; void charwrap.offsetWidth; charwrap.style.animation=''; } } };
  if(charwrap) charwrap.addEventListener('click', e => { e.preventDefault();
    squish(charImg, true); burst(charwrap, 13, 250); chime('tap'); });
  bNext.onclick = () => { const last = cur === S.length - 2;
    chime(last ? 'fin' : 'next'); burst(bNext, last ? 18 : 10, last ? 260 : 170); squish(bNext); go(cur + 1); };
  bPrev.onclick = () => { chime('back'); burst(bPrev, 5, 120); squish(bPrev); go(cur - 1); };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.tdo');
    if(a){ chime('tap'); burst(a, 8, 200); } }, true);
  /* ---------- 左右スワイプ ---------- */
  (function(){
    let x0=null, y0=null, t0=0, lock=false;
    const on=(t,f)=>document.addEventListener(t,f,{passive:true});
    const reset=()=>{ x0=null;
      stage.style.transition='transform .28s cubic-bezier(.2,.8,.3,1)';
      stage.style.transform=''; };
    on('touchstart', e=>{
      if(e.touches.length!==1){ x0=null; return; }
      const t=e.touches[0];
      x0=t.clientX; y0=t.clientY; t0=Date.now(); lock=false;
      stage.style.transition='none';
    });
    on('touchmove', e=>{
      if(x0===null || e.touches.length!==1) return;
      const t=e.touches[0], dx=t.clientX-x0, dy=t.clientY-y0;
      if(!lock && Math.abs(dx)>14 && Math.abs(dx)>Math.abs(dy)*1.4) lock=true;
      if(lock){
        const edge = (dx<0 && bNext.disabled) || (dx>0 && bPrev.disabled);
        stage.style.transform=`translateX(${dx*(edge?0.09:0.3)}px)`;
      }
    });
    on('touchend', e=>{
      if(x0===null) return;
      const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0, dt=Date.now()-t0;
      const go = lock && dt<800 && Math.abs(dx)>=58 && Math.abs(dx)>Math.abs(dy)*1.4;
      reset();
      if(!go) return;
      if(dx<0){ if(!bNext.disabled) bNext.click(); }
      else if(!bPrev.disabled) bPrev.click();
    });
    on('touchcancel', reset);
  })();

  addEventListener('keydown', e => {
    if(e.key === 'ArrowRight' || e.key === ' ') { bNext.disabled || bNext.click(); }
    if(e.key === 'ArrowLeft') { bPrev.disabled || bPrev.click(); } });

  go(0);
  return {go, chime, burst, squish};
}

global.Kamishibai = {init, K, chime, burst, squish};
global.K = K;
})(window);

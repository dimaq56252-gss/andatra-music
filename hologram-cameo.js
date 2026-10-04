(() => {
  'use strict';
  function init(){
    if(document.getElementById('hologram-cameo'))return;
    const style=document.createElement('style');
    style.textContent=`
      #hologram-cameo{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(24px + env(safe-area-inset-bottom));z-index:90;width:clamp(110px,12vw,170px);height:clamp(143px,15.6vw,220px);padding:0;border:0;background:transparent;cursor:zoom-in;touch-action:manipulation;filter:drop-shadow(0 0 13px #23ddffaa)}
      #hologram-cameo[hidden],#hologram-cameo-zoom[hidden]{display:none!important}
      #hologram-cameo svg{display:block;width:100%;height:100%;overflow:visible;pointer-events:none;animation:cameo-appear 3s ease both}
      .player-open #hologram-cameo{bottom:calc(145px + env(safe-area-inset-bottom))}
      #hologram-cameo:focus-visible{outline:2px solid #8cf9ff;outline-offset:5px;border-radius:50%}
      #hologram-cameo-zoom{position:fixed;inset:0;z-index:130;display:grid;place-items:center;padding:24px;background:#000b;backdrop-filter:blur(6px);font-family:Arial,sans-serif}
      #hologram-cameo-close{position:relative;display:grid;place-items:center;width:min(80vw,480px);height:min(80svh,620px);padding:0;border:0;background:transparent;color:#baf6ff;cursor:zoom-out;touch-action:manipulation}
      #hologram-cameo-close svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 25px #23ddffcc);animation:cameo-grow .25s ease-out both;pointer-events:none}
      #hologram-cameo-close span{position:absolute;bottom:0;padding:6px 12px;font-size:13px;background:#080d16bd;border-radius:20px}
      #hologram-cameo-close:focus-visible{outline:2px solid #8cf9ff;outline-offset:5px;border-radius:20px}
      @keyframes cameo-appear{0%{opacity:0;transform:translateY(12px) scale(.88)}8%,88%{opacity:.92;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-7px) scale(.95)}}
      @keyframes cameo-grow{from{opacity:.3;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
      @media(max-width:760px){.player-open #hologram-cameo{bottom:calc(165px + env(safe-area-inset-bottom))}}
      @media(prefers-reduced-motion:reduce){#hologram-cameo svg,#hologram-cameo-close svg{animation:none}}
    `;
    document.head.append(style);
    // Inline SVG keeps the native crop's linked photograph visible in all browsers.
    const face='<svg viewBox="525 90 170 220" aria-hidden="true" focusable="false"><defs><radialGradient id="cameo-edge"><stop offset="75%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="cameo-mask" maskUnits="userSpaceOnUse" x="525" y="90" width="170" height="220"><ellipse cx="605" cy="196" rx="77" ry="103" fill="url(#cameo-edge)"/></mask></defs><image href="/assets/images/sword-hologram.png" width="1254" height="1254" mask="url(#cameo-mask)"/></svg>';
    const small=document.createElement('button');small.id='hologram-cameo';small.type='button';small.hidden=true;small.setAttribute('aria-label','Увеличить лицо-голограмму');small.setAttribute('aria-haspopup','dialog');small.innerHTML=face;
    const zoom=document.createElement('div');zoom.id='hologram-cameo-zoom';zoom.hidden=true;zoom.setAttribute('role','dialog');zoom.setAttribute('aria-modal','true');zoom.setAttribute('aria-label','Лицо-голограмма');
    const close=document.createElement('button');close.id='hologram-cameo-close';close.type='button';close.setAttribute('aria-label','Уменьшить голограмму');close.innerHTML=face.replaceAll('cameo-edge','cameo-zoom-edge').replaceAll('cameo-mask','cameo-zoom-mask')+'<span>Нажми ещё раз, чтобы закрыть</span>';zoom.append(close);document.body.append(small,zoom);
    let cycle,hideTimer,previousFocus,previousOverflow;const inertStates=new Map();
    const blocked=()=>document.hidden||!!document.fullscreenElement||!!document.querySelector('[role="dialog"][aria-modal="true"]:not([hidden]),.hologram-zoom:not([hidden]),dialog[open],.lightbox.is-open,.lightbox.open');
    const clear=()=>{clearTimeout(cycle);clearTimeout(hideTimer);};
    const schedule=()=>{clearTimeout(cycle);cycle=setTimeout(show,20000);};
    function show(){
      if(!zoom.hidden||blocked()){schedule();return;}
      small.hidden=false;small.dataset.visible='true';
      hideTimer=setTimeout(()=>{small.hidden=true;delete small.dataset.visible;},3000);
      schedule();
    }
    function collapse(){
      if(zoom.hidden)return;zoom.hidden=true;document.body.style.overflow=previousOverflow;inertStates.forEach((value,element)=>{element.inert=value;});inertStates.clear();small.hidden=true;small.setAttribute('aria-expanded','false');delete small.dataset.visible;
      if(previousFocus?.isConnected&&previousFocus!==small)previousFocus.focus({preventScroll:true});
      schedule();
    }
    small.setAttribute('aria-expanded','false');small.addEventListener('click',()=>{
      if(small.hidden||blocked())return;clear();previousFocus=document.activeElement;small.hidden=true;small.setAttribute('aria-expanded','true');previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';for(const element of document.body.children){if(element!==small&&element!==zoom){inertStates.set(element,element.inert);element.inert=true;}}zoom.hidden=false;close.focus({preventScroll:true});
    });
    close.addEventListener('click',collapse);zoom.addEventListener('click',e=>{if(e.target===zoom)collapse();});
    document.addEventListener('keydown',e=>{if(zoom.hidden)return;if(e.key==='Escape'){e.preventDefault();collapse();}else if(e.key==='Tab'){e.preventDefault();close.focus();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();small.hidden=true;delete small.dataset.visible;}else if(zoom.hidden)schedule();});
    window.addEventListener('pagehide',()=>{clear();small.hidden=true;});window.addEventListener('pageshow',()=>{if(zoom.hidden)schedule();});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

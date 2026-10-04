(() => {
  'use strict';
  const KEY = 'andatra-access-v1';
  const START = 'andatra-preview-start-v1';
  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };
  const remembered = () => {
    try { if (localStorage.getItem(KEY) === 'unlocked') return true; } catch {}
    return read(KEY) === 'unlocked';
  };
  const remember = () => {
    try { localStorage.setItem(KEY, 'unlocked'); } catch {}
    write(KEY, 'unlocked');
  };
  // Preserve access for visitors who already unlocked this tab.
  if (remembered()) { remember(); return; }
  const saved = Number(read(START));
  const started = saved > 0 && saved <= Date.now() ? saved : Date.now();
  write(START, String(started));
  function init() {
    const style = document.createElement('style');
    style.textContent = `
      .andatra-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(5,6,9,.98);color:#f6f3ee;font-family:Arial,sans-serif;overflow:auto;overscroll-behavior:contain}
      .andatra-gate[hidden]{display:none}
      .andatra-gate-card{width:min(100%,420px);padding:32px;border:1px solid #34363c;border-radius:20px;background:#111218;box-shadow:0 24px 80px #0008}
      .andatra-gate h2{font-size:28px;line-height:1.15;margin:0 0 14px;letter-spacing:-.02em}
      .andatra-gate p{font-size:16px;line-height:1.5;margin:0 0 24px;color:#b9b9c1}
      .andatra-gate label{display:block;font-size:16px;margin-bottom:9px}
      .andatra-gate input{box-sizing:border-box;width:100%;min-height:50px;padding:12px 14px;border:1px solid #555862;border-radius:10px;background:#08090d;color:#fff;font:inherit;font-size:18px}
      .andatra-gate input:focus{outline:2px solid #d7ff47;outline-offset:2px}
      .andatra-gate button{width:100%;min-height:50px;padding:12px 16px;border:0;border-radius:10px;background:#d7ff47;color:#08090d;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
      .andatra-gate button:focus-visible{outline:2px solid #fff;outline-offset:3px}
      .andatra-gate .andatra-gate-error{min-height:24px;margin:10px 0 14px;color:#ffadad;font-size:14px}
      @media(max-width:480px){.andatra-gate-card{padding:24px}}
    `;
    document.head.append(style);
    const gate = document.createElement('div');
    gate.className = 'andatra-gate';
    gate.hidden = true;
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'andatra-gate-title');
    gate.innerHTML = `<form class="andatra-gate-card"><h2 id="andatra-gate-title">СЕРИЯ АНДАТРЫ</h2><p>Введите пароль, чтобы продолжить.</p><label for="andatra-gate-password">Пароль</label><input id="andatra-gate-password" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="andatra-gate-error"><p id="andatra-gate-error" class="andatra-gate-error" role="status" aria-live="polite"></p><button type="submit">Войти</button></form>`;
    document.body.append(gate);
    const input = gate.querySelector('input');
    const button = gate.querySelector('button');
    const error = gate.querySelector('.andatra-gate-error');
    const pausedMedia = () => {
      document.querySelectorAll('audio,video').forEach(media => media.pause());
      try { if (typeof audio !== 'undefined' && audio && typeof audio.pause === 'function') audio.pause(); } catch {}
    };
    let locked = false, timer, previousFocus, overflow;
    const inertStates = new Map();
    const trap = event => {
      if (!locked) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); }
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === input ? button : input).focus();
      }
    };
    document.addEventListener('keydown', trap, true);
    gate.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      if (input.value !== 'andatra') {
        error.textContent = 'Неверный пароль. Попробуйте ещё раз.';
        input.setAttribute('aria-invalid', 'true');
        input.value = '';
        input.focus();
        return;
      }
      remember();
      locked = false;
      clearInterval(timer);
      inertStates.forEach((value, element) => { element.inert = value; });
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', trap, true);
      gate.remove();
      style.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
    });
    setTimeout(() => {
      locked = true;
      previousFocus = document.activeElement;
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      for (const element of document.body.children) {
        if (element !== gate) { inertStates.set(element, element.inert); element.inert = true; }
      }
      pausedMedia();
      timer = setInterval(pausedMedia, 200);
      gate.hidden = false;
      input.focus();
    }, Math.max(0, 3000 - (Date.now() - started)));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

// Shared navigation for the site's sections and tools.
(() => {
  if (document.getElementById('andatra-navigation-script')) return;
  const script = document.createElement('script');
  script.id = 'andatra-navigation-script';
  script.src = '/site-navigation.js?v=20261004';
  document.head.append(script);
})();

// Timed face hologram, shared by every section.
(() => {
  if (document.getElementById('andatra-cameo-script')) return;
  const script = document.createElement('script');
  script.id = 'andatra-cameo-script';
  script.src = '/hologram-cameo.js?v=20261005';
  document.head.append(script);
})();


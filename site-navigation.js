(() => {
  'use strict';
  function init() {
    if (document.querySelector('[data-site-back]')) return;
    const style = document.createElement('style');
    style.textContent = `
      .site-back-row{display:block;grid-column:1 / -1;margin:0 0 22px}
      a.site-back{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:9px 16px;border:1px solid #34363c;border-radius:999px;background:#111218;color:#f6f3ee;font:700 15px/1.4 Arial,sans-serif;text-decoration:none;white-space:nowrap;touch-action:manipulation}
      a.site-back:hover{color:#d7ff47;border-color:#d7ff47}
      a.site-back:focus-visible{outline:2px solid #d7ff47;outline-offset:4px}
      .site-back svg{width:20px;height:20px;flex:none}
    `;
    document.head.append(style);
    function add(container, href, useHistory) {
      if (!container) return;
      const row = document.createElement('div');
      row.className = 'site-back-row';
      const link = document.createElement('a');
      link.className = 'site-back';
      link.dataset.siteBack = '';
      link.href = href;
      link.setAttribute('aria-label', useHistory ? 'Назад к предыдущей странице' : 'Назад к музыке');
      link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Назад</span>';
      if (useHistory) link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        let internal = false;
        try { internal = new URL(document.referrer).origin === location.origin; } catch {}
        if (internal && history.length > 1) { event.preventDefault(); history.back(); }
      });
      row.append(link);
      container.prepend(row);
    }
    const home = location.pathname === '/' || location.pathname === '/index.html';
    if (home) {
      ['karaoke', 'rappers', 'gallery', 'about'].forEach(id => {
        const section = document.getElementById(id);
        add(section?.querySelector('.wrap') || section, '/#music', false);
      });
    } else {
      const main = document.querySelector('main');
      add(main?.querySelector(':scope > .wrap') || main, '/#music', true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

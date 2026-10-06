(() => {
  const filenameFor = link => {
    const explicit = link.getAttribute("download");
    if (explicit && !link.dataset.autoFilename) return explicit.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
    const title = link.closest('[data-track-id]')?.querySelector('b')?.textContent
      || (link.id === 'playerDownload' ? document.getElementById('playerTitle')?.textContent : document.querySelector('h1')?.textContent)
      || 'Трек';
    return `${title.trim()} — СЕРИЯ АНДАТРЫ.mp3`.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
  };
  document.addEventListener('click', async event => {
    const link = event.target.closest('a[download]');
    if (!link || link.dataset.namedDownload === 'true' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    const filename = filenameFor(link);
    if (url.origin === location.origin) {
      if (!link.getAttribute('download') || link.dataset.autoFilename) link.dataset.autoFilename = 'true';
      link.download = filename;
      return;
    }
    event.preventDefault();
    if (link.dataset.downloading) return;
    const label = link.textContent;
    link.dataset.downloading = 'true';
    link.setAttribute('aria-busy', 'true');
    link.textContent = 'Скачивание…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(url.href, {signal: controller.signal, credentials: 'omit'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size < 1024 || /text\/html|application\/json/i.test(blob.type)) throw new Error('Invalid audio file');
      const blobUrl = URL.createObjectURL(blob);
      const save = document.createElement('a');
      save.dataset.namedDownload = 'true';
      save.href = blobUrl;
      save.download = filename;
      document.body.append(save);
      save.click();
      save.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      link.textContent = label;
      link.parentElement.querySelector('.download-note')?.remove();
    } catch (error) {
      link.textContent = 'Повторить скачивание';
      let note = link.parentElement.querySelector('.download-note');
      if (!note) {
        note = document.createElement('span');
        note.className = 'download-note';
        note.setAttribute('role', 'status');
        note.style.cssText = 'display:block;flex-basis:100%;font-size:14px;line-height:1.4;color:#c9cbd1';
        link.parentElement.append(note);
      }
      note.textContent = 'Не удалось скачать файл. Нажмите ещё раз, чтобы повторить.';
      console.warn('Direct download unavailable:', error.message);
    } finally {
      clearTimeout(timer);
      delete link.dataset.downloading;
      link.removeAttribute('aria-busy');
    }
  });
})();

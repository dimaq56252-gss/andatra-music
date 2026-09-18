import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const match = html.match(/const andatraTracks = (\[[\s\S]*?\]);\nconst tracksPerPage/);
if (!match) throw new Error('Track catalogue was not found');
const tracks = JSON.parse(match[1]);

const translit = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
};
const slugify = value => value.toLowerCase().split('').map(char => translit[char] ?? char).join('')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'track';
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');

const enriched = tracks.map(track => ({...track, slug: `${String(track.id).padStart(3, '0')}-${slugify(track.title)}`}));

html = html.replace(match[0], `const andatraTracks = ${JSON.stringify(enriched)};\nconst tracksPerPage`);
html = html.replace('<title>ANDATRA — Music</title>\n<meta name="description" content="ANDATRA — музыка, фотографии и атмосфера команды.">', `<title>СЕРИЯ АНДАТРЫ — слушать все песни онлайн | ANDATRA</title>
<meta name="description" content="Слушайте все песни музыкального коллектива СЕРИЯ АНДАТРЫ онлайн: Классика, Мангуст, Ядерная Зима, Ачивки и другие треки.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://andatra-music.ru/">
<meta property="og:type" content="music.musician">
<meta property="og:site_name" content="ANDATRA">
<meta property="og:title" content="СЕРИЯ АНДАТРЫ — все песни">
<meta property="og:description" content="Официальный музыкальный сайт коллектива СЕРИЯ АНДАТРЫ. Слушайте 136 треков онлайн.">
<meta property="og:url" content="https://andatra-music.ru/">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${safeJson({
  '@context':'https://schema.org', '@type':'MusicGroup', name:'СЕРИЯ АНДАТРЫ', alternateName:'ANDATRA', url:'https://andatra-music.ru/',
  track: enriched.map(track => ({'@type':'MusicRecording', name:track.title, url:`https://andatra-music.ru/track/${track.slug}/`, byArtist:{'@type':'MusicGroup',name:'СЕРИЯ АНДАТРЫ'}}))
})}</script>`);

html = html.replace('.track b{display:block}', '.track b{display:block}.track-title-link{display:inline-block}.track-title-link:hover{color:var(--accent)}');
html = html.replace("const trackShareUrl = track => { const url = new URL('https://andatra-music.ru/'); url.searchParams.set('track', track.id); url.hash = 'music'; return url.toString(); };", "const trackShareUrl = track => new URL('/track/' + track.slug + '/', 'https://andatra-music.ru/').toString();");
html = html.replace('<div><b>${escapeHtml(track.title)}</b><small>СЕРИЯ АНДАТРЫ</small></div>', '<div><a class="track-title-link" href="/track/${track.slug}/"><b>${escapeHtml(track.title)}</b></a><small>СЕРИЯ АНДАТРЫ</small></div>');

const crawlableLinks = enriched.map(track => `<li><a href="/track/${track.slug}/">${escapeHtml(track.title)} — СЕРИЯ АНДАТРЫ</a></li>`).join('');
html = html.replace('</body>', `<noscript><section class="section"><div class="wrap"><h2>Все песни СЕРИИ АНДАТРЫ</h2><ul>${crawlableLinks}</ul></div></section></noscript>\n</body>`);
fs.writeFileSync(indexPath, html);

const trackRoot = path.join(root, 'track');
fs.mkdirSync(trackRoot, {recursive:true});

const pageCss = `:root{--bg:#07080b;--panel:#111218;--text:#f6f3ee;--muted:#a6a4aa;--line:rgba(255,255,255,.14);--accent:#d7ff47}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 70% 15%,rgba(215,255,71,.12),transparent 28%),var(--bg);color:var(--text);font-family:Inter,Arial,sans-serif}a{color:inherit}.nav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;border-bottom:1px solid var(--line)}.logo{font-weight:900;letter-spacing:.2em;text-decoration:none}.back{color:var(--muted);text-decoration:none}.back:hover{color:var(--accent)}main{width:min(920px,90vw);margin:0 auto;padding:clamp(70px,12vw,150px) 0 90px}.kicker{color:var(--accent);font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}h1{margin:18px 0 8px;font-size:clamp(46px,9vw,100px);line-height:.94;letter-spacing:-.055em}h2{margin:0 0 42px;color:var(--muted);font-size:clamp(18px,3vw,28px);font-weight:600}.player{padding:clamp(22px,4vw,40px);border:1px solid var(--line);border-radius:24px;background:rgba(17,18,24,.9);box-shadow:0 30px 90px rgba(0,0,0,.45)}audio{display:block;width:100%}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid var(--line);border-radius:999px;text-decoration:none;font-weight:800}.btn.primary{background:var(--accent);border-color:var(--accent);color:#07080b}.meta{margin-top:44px;padding-top:24px;border-top:1px solid var(--line);color:var(--muted);line-height:1.7}.pager{display:flex;justify-content:space-between;gap:20px;margin-top:40px}.pager a{color:var(--accent);text-decoration:none}@media(max-width:600px){.nav{padding:0 20px}.back{font-size:14px}.pager{flex-direction:column}}`;

for (let index = 0; index < enriched.length; index++) {
  const track = enriched[index];
  const previous = enriched[index - 1];
  const next = enriched[index + 1];
  const canonical = `https://andatra-music.ru/track/${track.slug}/`;
  const title = `${track.title} — СЕРИЯ АНДАТРЫ | слушать онлайн`;
  const description = `Слушать песню «${track.title}» музыкального коллектива СЕРИЯ АНДАТРЫ онлайн. Бесплатное прослушивание и скачивание трека на официальном сайте.`;
  const schema = {
    '@context':'https://schema.org','@type':'MusicRecording','@id':canonical,name:track.title,url:canonical,
    byArtist:{'@type':'MusicGroup',name:'СЕРИЯ АНДАТРЫ',url:'https://andatra-music.ru/'},
    audio:{'@type':'AudioObject',contentUrl:track.src,encodingFormat:'audio/mpeg'},
    inAlbum:{'@type':'MusicAlbum',name:'СЕРИЯ АНДАТРЫ — все треки',url:'https://andatra-music.ru/#music'}
  };
  const page = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090d">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="music.song"><meta property="og:site_name" content="ANDATRA"><meta property="og:title" content="${escapeHtml(track.title)} — СЕРИЯ АНДАТРЫ"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:audio" content="${escapeHtml(track.src)}"><meta property="og:audio:type" content="audio/mpeg"><meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23d7ff47'/%3E%3Cpath d='M14 46 27 15h10l13 31H39l-2-7H27l-2 7Zm16-16h5l-2-8Z' fill='%2307080b'/%3E%3C/svg%3E"><style>${pageCss}</style><script type="application/ld+json">${safeJson(schema)}</script>
</head><body><nav class="nav"><a class="logo" href="/">ANDATRA</a><a class="back" href="/#music">← Все песни</a></nav><main><div class="kicker">Трек ${track.id} · официальный сайт</div><h1>${escapeHtml(track.title)}</h1><h2>СЕРИЯ АНДАТРЫ</h2><article class="player"><audio controls preload="metadata" src="${escapeHtml(track.src)}">Ваш браузер не поддерживает аудио.</audio><div class="actions"><a class="btn primary" href="${escapeHtml(track.src)}" download>Скачать MP3</a><a class="btn" href="/#music">Открыть каталог</a></div><div class="meta">Слушайте трек «${escapeHtml(track.title)}» коллектива СЕРИЯ АНДАТРЫ. На официальном сайте доступны все композиции, музыкальные видео и галерея проекта.</div></article><nav class="pager" aria-label="Другие песни">${previous ? `<a rel="prev" href="/track/${previous.slug}/">← ${escapeHtml(previous.title)}</a>` : '<span></span>'}${next ? `<a rel="next" href="/track/${next.slug}/">${escapeHtml(next.title)} →</a>` : '<span></span>'}</nav></main></body></html>`;
  const dir = path.join(trackRoot, track.slug);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), page);
}

const urls = ['https://andatra-music.ru/', ...enriched.map(track => `https://andatra-music.ru/track/${track.slug}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url,index) => `  <url><loc>${url}</loc><lastmod>2026-09-18</lastmod><changefreq>${index === 0 ? 'weekly' : 'monthly'}</changefreq><priority>${index === 0 ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: https://andatra-music.ru/sitemap.xml\n`);

console.log(`Generated ${enriched.length} track pages and sitemap with ${urls.length} URLs.`);

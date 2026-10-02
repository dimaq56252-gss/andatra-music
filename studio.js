const MAX_SECONDS = 600;
export function clipSchedule(duration, start, position) {
  const offset = Math.max(0, position - start);
  return offset >= duration ? null : { delay: Math.max(0, start - position), offset, length: duration - offset };
}
export function wavBytes(buffer) {
  const channels = Math.min(2, buffer.numberOfChannels), frames = buffer.length;
  const data = new ArrayBuffer(44 + frames * channels * 2), view = new DataView(data);
  const str = (at, value) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  str(0, 'RIFF'); view.setUint32(4, data.byteLength - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, frames * channels * 2, true);
  const arrays = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let at = 44;
  for (let i = 0; i < frames; i++) for (const samples of arrays) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(at, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); at += 2;
  }
  return data;
}

if (typeof document !== 'undefined') initStudio();
function initStudio() {
  const $ = id => document.getElementById(id);
  const tracks = []; let nextId = 1, ctx, mic, analyser, nodes = [], playing = false, recording = false;
  let busy = false, exporting = false, recorder, chunks = [], position = 0, origin = 0, startPosition = 0;
  let recordPosition = 0, recordLead = 0, recordingStarted = false, unsaved = false, masterNode;
  const time = value => { const n = Math.max(0, value); return `${String(Math.floor(n / 60)).padStart(2,'0')}:${String(Math.floor(n % 60)).padStart(2,'0')}`; };
  const status = (text, error = false) => { $('status').textContent = text; $('status').classList.toggle('error', error); };
  const endTime = () => Math.min(MAX_SECONDS, Math.max(0, ...tracks.map(t => t.start + t.offset / 1000 + t.buffer.duration)));
  const cursor = () => playing ? Math.min(MAX_SECONDS, startPosition + Math.max(0, ctx.currentTime - origin)) : position;
  const audio = async () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint:'interactive' });
    if (ctx.state !== 'running') await ctx.resume();
    return ctx;
  };
  function controls() {
    const locked = busy || exporting || recording;
    $('play').disabled = !tracks.length || locked;
    $('stop').disabled = !playing || busy || exporting;
    $('record').disabled = busy || exporting;
    $('record').textContent = recording ? '■ Закончить запись' : '● Записать голос';
    $('record').classList.toggle('is-recording', recording);
    $('play').textContent = playing && !recording ? '❚❚ Пауза' : '▶ Слушать';
    $('seek').disabled = locked;
    for (const id of ['beatFile','beatSelect','voiceFile','micSelect','micConnect']) $(id).disabled = locked || playing;
    $('exportMix').disabled = !tracks.some(t => !t.muted) || locked || playing;
    document.querySelectorAll('[data-track-control]').forEach(el => { el.disabled = locked || playing; });
    $('seek').max = Math.max(1, endTime(), position);
    $('duration').textContent = time(endTime());
  }
  function cleanNodes() {
    for (const node of nodes) { try { node.stop?.(); } catch {} try { node.disconnect(); } catch {} }
    nodes = []; masterNode = undefined;
  }
  function bus(context, destination) {
    const master = context.createGain(); master.gain.value = Number($('master').value);
    const limiter = context.createDynamicsCompressor(); limiter.threshold.value = -3; limiter.knee.value = 0;
    limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.15;
    master.connect(limiter); limiter.connect(destination); return {master, limiter};
  }
  function connectTrack(context, track, master, when, pos) {
    const schedule = clipSchedule(track.buffer.duration, track.start + track.offset / 1000, pos);
    if (!schedule || track.muted || schedule.delay >= MAX_SECONDS - pos) return [];
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = track.buffer; gain.gain.value = track.gain; source.connect(gain); gain.connect(master);
    const parts = [source,gain];
    const wet = Number($('echo').value);
    if (track.kind === 'voice' && wet > 0) {
      const delay = context.createDelay(1), echo = context.createGain(), feedback = context.createGain();
      delay.delayTime.value = 0.22; echo.gain.value = wet; feedback.gain.value = 0.23;
      gain.connect(delay); delay.connect(echo); echo.connect(master); delay.connect(feedback); feedback.connect(delay);
      parts.push(delay, echo, feedback);
    }
    source.start(when + schedule.delay, schedule.offset, Math.min(schedule.length, MAX_SECONDS - pos - schedule.delay));
    return parts;
  }
  function startAt(pos, when) {
    cleanNodes(); const output = bus(ctx,ctx.destination); masterNode = output.master; nodes.push(output.master,output.limiter);
    startPosition = pos; origin = when; position = pos;
    for (const track of tracks) nodes.push(...connectTrack(ctx, track, output.master, when, pos));
    playing = true; controls();
  }
  function pause() { position = cursor(); playing = false; cleanNodes(); controls(); }
  async function listen() {
    try {
      if (playing) { pause(); return; }
      await audio(); if (position >= endTime()) position = 0;
      startAt(position,ctx.currentTime + 0.05);
    } catch (error) { status('Не удалось воспроизвести: ' + error.message,true); }
  }
  function stop() {
    if (recording) { finishRecording(); return; }
    playing = false; position = 0; cleanNodes(); controls();
  }
  function download(buffer, name) {
    const blob = new Blob([wavBytes(buffer)], {type:'audio/wav'}), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name.replace(/[<>:"/\\|?*]/g,'_') + '.wav'; a.click();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  function waveform(canvas, track) {
    const context = canvas.getContext('2d'), width = canvas.width = Math.max(300,Math.round(canvas.clientWidth * devicePixelRatio));
    const height = canvas.height = Math.round(84 * devicePixelRatio), samples = track.buffer.getChannelData(0);
    context.fillStyle = '#0c0e13'; context.fillRect(0,0,width,height); context.strokeStyle = track.kind === 'beat' ? '#d7ff47' : '#73c8ff';
    context.beginPath(); const hop = Math.max(1,Math.floor(samples.length / width));
    for (let x = 0; x < width; x += 2) {
      let peak = 0; for (let i = x * hop; i < Math.min((x+2)*hop,samples.length); i+=Math.max(1,Math.floor(hop/32))) peak = Math.max(peak,Math.abs(samples[i]));
      const size = Math.max(1,peak * height * 0.44); context.moveTo(x,height/2-size); context.lineTo(x,height/2+size);
    }
    context.stroke();
  }
  function render() {
    $('tracks').replaceChildren();
    if (!tracks.length) { const empty = document.createElement('div'); empty.className='empty'; empty.innerHTML='<strong>Здесь будут твои дорожки</strong>Минус, основной голос и сколько угодно бэков.'; $('tracks').append(empty); }
    for (const track of tracks) {
      const row = document.createElement('article'); row.className='track';
      row.innerHTML = `<div class="track-head"><span class="track-name"></span><button data-track-control class="mute"></button>${track.kind==='voice'?'<button data-track-control class="save">Скачать дубль</button>':''}<button data-track-control class="remove danger" aria-label="Удалить дорожку">Удалить</button></div><canvas aria-label="Звуковая волна"></canvas><div class="track-controls"><label>Громкость <input data-track-control class="gain" type="range" min="0" max="1.5" step="0.01"><output></output></label><label>Сдвиг, мс <input data-track-control class="offset" type="number" min="-10000" max="10000" step="10"></label><span class="hint"></span></div>`;
      row.querySelector('.track-name').textContent = (track.kind==='beat'?'МИНУС · ':'ГОЛОС · ') + track.name;
      const mute = row.querySelector('.mute'); mute.textContent = track.muted ? 'Включить' : 'Выключить'; mute.setAttribute('aria-pressed',String(track.muted));
      mute.onclick = () => { track.muted=!track.muted; render(); };
      const slider = row.querySelector('.gain'), out = row.querySelector('output'); slider.value=track.gain; out.textContent=Math.round(track.gain*100)+'%';
      slider.oninput = () => { track.gain=Number(slider.value); out.textContent=Math.round(track.gain*100)+'%'; };
      const offset = row.querySelector('.offset'); offset.value=track.offset;
      offset.onchange=()=>{ track.offset=Math.max(-10000,Math.min(10000,Number(offset.value)||0)); offset.value=track.offset; controls(); };
      row.querySelector('.hint').textContent = `${time(track.buffer.duration)} · начало ${time(track.start)}`;
      row.querySelector('.remove').onclick=()=>{ if(confirm('Удалить эту дорожку? Сначала скачай дубль, если он нужен.')) { tracks.splice(tracks.indexOf(track),1); render(); } };
      const save=row.querySelector('.save'); if(save) save.onclick=()=>download(track.buffer,track.name);
      $('tracks').append(row); waveform(row.querySelector('canvas'),track);
    }
    controls();
  }
  async function decode(bytes) {
    await audio(); const result=await ctx.decodeAudioData(bytes);
    if(result.duration>MAX_SECONDS) throw new Error('Файл длиннее 10 минут. Обрежь его и загрузи снова.');
    return result;
  }
  function add(buffer,name,kind,start=0) {
    if(kind==='beat') { const old=tracks.findIndex(t=>t.kind==='beat'); if(old>=0) tracks.splice(old,1); }
    tracks.push({id:nextId++,buffer,name,kind,start,gain:kind==='beat'?0.65:1,offset:0,muted:false}); unsaved=true; render();
  }
  async function loadFile(file,kind) {
    if(file.size>100*1024*1024) throw new Error('Максимальный размер файла — 100 МБ.');
    const buffer=await decode(await file.arrayBuffer()); add(buffer,file.name.replace(/\.[^.]+$/,''),kind);
  }
  async function files(input,kind) {
    busy=true; controls(); status('Загружаю аудио…');
    try { for(const file of input.files) await loadFile(file,kind); status('Готово. Можно слушать или записывать голос.'); }
    catch(error) { status(error.message||'Не удалось прочитать файл. Попробуй MP3 или WAV.',true); }
    finally { input.value=''; busy=false; controls(); }
  }
  async function connectMic() {
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Запись недоступна. Открой сайт по HTTPS в свежем Chrome, Edge, Firefox или Safari.');
    await audio();
    if(mic) { for(const track of mic.getTracks()) track.stop(); mic=undefined; }
    const deviceId=$('micSelect').value;
    mic=await navigator.mediaDevices.getUserMedia({audio:{...(deviceId?{deviceId:{exact:deviceId}}:{}),echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    const source=ctx.createMediaStreamSource(mic); analyser=ctx.createAnalyser(); analyser.fftSize=512; source.connect(analyser);
    const devices=await navigator.mediaDevices.enumerateDevices(), chosen=mic.getAudioTracks()[0].getSettings().deviceId;
    $('micSelect').replaceChildren(new Option('По умолчанию',''));
    devices.filter(d=>d.kind==='audioinput').forEach((d,i)=>$('micSelect').add(new Option(d.label||`Микрофон ${i+1}`,d.deviceId)));
    if(chosen) $('micSelect').value=chosen;
    $('mic-label').textContent='Подключён · '+(mic.getAudioTracks()[0].label||'Микрофон'); $('micConnect').textContent='Переподключить микрофон';
    mic.getAudioTracks()[0].onended=()=>{ $('mic-label').textContent='Микрофон отключился'; if(recording) finishRecording(); mic=undefined; };
  }
  function micError(error) {
    const messages={NotAllowedError:'Доступ к микрофону запрещён. Разреши его в настройках сайта.',NotFoundError:'Микрофон не найден. Подключи его и попробуй ещё раз.',NotReadableError:'Микрофон занят другой программой или недоступен.'};
    return messages[error.name]||error.message||'Не удалось подключить микрофон.';
  }
  async function record() {
    if(recording) { finishRecording(); return; }
    busy=true; controls();
    try {
      await audio(); if(playing) pause();
      if(position>=MAX_SECONDS) position=0;
      if(!mic || !mic.active) await connectMic();
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
      recorder=new MediaRecorder(mic,mime?{mimeType:mime}:undefined); chunks=[]; recordingStarted=false;
      recordPosition=position; recordLead=0.1;
      recorder.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
      recorder.onstart=()=>{ recordingStarted=true; startAt(recordPosition,ctx.currentTime+recordLead); status('Идёт запись. Нажми «Закончить запись», когда закончишь дубль.'); };
      recorder.onerror=e=>{ status('Ошибка записи: '+(e.error?.message||'микрофон недоступен'),true); finishRecording(); };
      recorder.onstop=async()=>{
        playing=false; cleanNodes(); recording=false; busy=true; controls(); status('Обрабатываю дубль…');
        try {
          if(!chunks.length || !recordingStarted) throw new Error('Запись пустая. Попробуй ещё раз.');
          const buffer=await ctx.decodeAudioData(await new Blob(chunks,{type:recorder.mimeType}).arrayBuffer());
          const trim=Math.min(buffer.length-1,Math.round(recordLead*buffer.sampleRate));
          const length=Math.min(buffer.length-trim,Math.floor((MAX_SECONDS-recordPosition)*buffer.sampleRate));
          if(length<buffer.sampleRate*0.15) throw new Error('Дубль слишком короткий. Запиши хотя бы секунду.');
          const trimmed=ctx.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
          for(let c=0;c<buffer.numberOfChannels;c++) trimmed.copyToChannel(buffer.getChannelData(c).subarray(trim,trim+length),c);
          add(trimmed,`Дубль ${tracks.filter(t=>t.kind==='voice').length+1}`,'voice',recordPosition); position=recordPosition;
          status('Дубль готов. Прослушай его или запиши следующий. При необходимости поправь сдвиг.');
        } catch(error) { status(error.message,true); }
        finally { busy=false; controls(); }
      };
      recording=true; recorder.start(250);
    } catch(error) { recording=false; status(micError(error),true); }
    finally { busy=false; controls(); }
  }
  function finishRecording() {
    if(!recording || !recorder || recorder.state==='inactive') return;
    position=cursor(); playing=false; cleanNodes(); busy=true; controls(); recorder.stop();
  }
  async function exportMix() {
    exporting=true; controls(); status('Собираю WAV…');
    try {
      const duration=Math.min(MAX_SECONDS,endTime()+(Number($('echo').value)>0?1.5:0));
      if(duration<=0) throw new Error('Нет аудио для экспорта.');
      const offline=new OfflineAudioContext(2,Math.ceil(duration*44100),44100), output=bus(offline,offline.destination);
      for(const track of tracks) connectTrack(offline,track,output.master,0,0);
      download(await offline.startRendering(),'СЕРИЯ АНДАТРЫ — студия');
      unsaved=false; status('Трек скачан в WAV. Отдельные дубли доступны на дорожках.');
    } catch(error) { status('Не удалось собрать трек: '+error.message,true); }
    finally { exporting=false; controls(); }
  }
  const library=[['Классика','klassika'],['Мангуст','mangust'],['Ядерная зима','yadernaya-zima'],['Ачивки','achivki'],['Забито','zabito'],['Оболонь','obolon'],['Падшая женщина','padshaya-zhenschina'],['Летопись','letopis'],['Заебался','zaebalsya'],['Осуждаю','osuzhdayu']];
  library.forEach(([title,slug])=>$('beatSelect').add(new Option(title,`/assets/audio/${slug}-instrumental.mp3`)));
  $('beatSelect').onchange=async()=>{
    const select=$('beatSelect'); if(!select.value)return; busy=true; controls(); status('Загружаю минус…');
    try { const response=await fetch(select.value); if(!response.ok) throw new Error('Не удалось загрузить минус. Попробуй ещё раз или загрузи свой файл.'); const bytes=await response.arrayBuffer(); add(await decode(bytes),select.selectedOptions[0].textContent,'beat'); position=0; status('Минус готов. Подключи микрофон и запиши первый дубль.'); }
    catch(error) { status(error.message,true); } finally { select.value=''; busy=false; controls(); }
  };
  $('beatFile').onchange=()=>files($('beatFile'),'beat'); $('voiceFile').onchange=()=>files($('voiceFile'),'voice');
  $('play').onclick=listen; $('stop').onclick=stop; $('record').onclick=record; $('exportMix').onclick=exportMix;
  $('micConnect').onclick=async()=>{ busy=true; controls(); try { await connectMic(); status('Микрофон готов к записи.'); } catch(error) { status(micError(error),true); } finally { busy=false; controls(); } };
  $('micSelect').onchange=()=>{ if(mic) $('micConnect').click(); };
  $('seek').oninput=()=>{ const wasPlaying=playing; if(wasPlaying)pause(); position=Number($('seek').value); if(wasPlaying)startAt(position,ctx.currentTime+0.03); };
  $('master').oninput=()=>{ $('masterValue').textContent=Math.round(Number($('master').value)*100)+'%'; if(masterNode)masterNode.gain.value=Number($('master').value); };
  $('echo').oninput=()=>{ $('echoValue').textContent=Math.round(Number($('echo').value)*100)+'%'; if(playing&&!recording){const pos=cursor(); startAt(pos,ctx.currentTime+0.03);} };
  window.addEventListener('beforeunload',e=>{ if(unsaved||recording){ e.preventDefault(); e.returnValue=''; } });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&recording){ finishRecording(); status('Запись остановлена: вкладка была скрыта.'); } });
  window.addEventListener('resize',()=>document.querySelectorAll('.track canvas').forEach((canvas,i)=>waveform(canvas,tracks[i])));
  function tick() {
    const pos=cursor(); $('clock').textContent=time(pos)+'.'+Math.floor(pos%1*10); $('seek').value=pos;
    if(playing){ if(pos>=MAX_SECONDS){ if(recording)finishRecording(); else pause(); } else if(!recording&&pos>=endTime()+(Number($('echo').value)>0?1.5:0)){pause();position=0;} }
    if(analyser&&mic?.active){ const values=new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(values); const peak=Math.max(...values.map(Math.abs)); $('meter').style.width=Math.min(100,peak*180)+'%'; $('meter').style.background=peak>0.95?'#ff636f':'#d7ff47'; }
    else $('meter').style.width='0%'; requestAnimationFrame(tick);
  }
  render(); tick();
}

import {estimateTempo,estimateKey,NOTE_NAMES,generateInstrumental,mixRemix,validateSettings} from './music.js?v=finite-2';
import {separateChannels} from './separation.js?v=finite-2';
import {wavBytes,measure} from '../audio-processing.js';
import {downloadBlob} from '../studio-project.js';
export function initRemixer(){
  const $=id=>document.getElementById(id),status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
  let file,cache,result,busy=false,generation=0,abort,urls=[],originalURL='',variation=0,transferred=false;
  for(let root=0;root<12;root++)for(const mode of ['minor','major']){const option=document.createElement('option');option.value=root+':'+mode;option.textContent=NOTE_NAMES[root]+(mode==='minor'?' minor':' major');$('key').append(option);}
  const players=['original','remix','vocals','instrumental'];
  function clearResults(){for(const id of players.slice(1)){$(id).pause();$(id).removeAttribute('src');$(id).load();}urls.forEach(u=>URL.revokeObjectURL(u));urls=[];result=null;$('results').hidden=true;}
  function lock(value){busy=value;for(const id of ['file','inputMode','scope','backend','style','bpm','offset','key','harmony','autoTempo','voiceGain','beatGain'])$(id).disabled=value;$('run').disabled=value||!file;$('variant').disabled=value||!cache;$('cancel').hidden=!value;}
  function resetCache(){generation++;abort?.abort();cache=undefined;variation=0;clearResults();$('analysis').textContent='Темп и тональность появятся после анализа. Вокал сохраняет исходную скорость.';$('run').textContent='Создать ремикс';lock(false);status(file?'Нажми «Создать ремикс».':'Выбери песню, чтобы начать.');}
  $('file').onchange=()=>{resetCache();file=$('file').files[0];if(originalURL)URL.revokeObjectURL(originalURL);$('original').pause();$('original').removeAttribute('src');$('original').load();originalURL=file?URL.createObjectURL(file):'';if(originalURL)$('original').src=originalURL;$('original').hidden=!file;$('filename').textContent=file?file.name:'Песня не выбрана';transferred=false;lock(false);status(file?'Готово. Выбери стиль и создай ремикс.':'Выбери песню, чтобы начать.');};
  for(const id of ['scope','inputMode','backend'])$(id).onchange=resetCache;
  function changed(){clearResults();$('run').textContent=cache?'Пересобрать ремикс':'Создать ремикс';status(cache?'Настройки изменились. Пересобери ремикс — голос уже готов.':'Настройки выбраны. Загрузи песню и создай ремикс.');}
  for(const id of ['style','offset','key','harmony'])$(id).onchange=changed;
  $('autoTempo').onchange=()=>{if(cache&&$('autoTempo').checked){$('bpm').value=cache.tempo.bpm;$('offset').value=Math.round(cache.tempo.offset*1000);}changed();};
  $('bpm').onchange=()=>{$('autoTempo').checked=false;const s=validateSettings({bpm:$('bpm').value});$('bpm').value=s.bpm;changed();};
  for(const [id,out]of [['voiceGain','voiceOut'],['beatGain','beatOut']])$(id).oninput=()=>{$(out).textContent=$(id).value+'%';changed();};
  function settings(){const key=$('key').value==='auto'?cache.key:{root:Number($('key').value.split(':')[0]),mode:$('key').value.split(':')[1]};return validateSettings({style:$('style').value,bpm:$('bpm').value,offset:Number($('offset').value)/1000,root:key.root,mode:key.mode,harmony:$('harmony').checked,voice:Number($('voiceGain').value)/100,beat:Number($('beatGain').value)/100,variation});}
  function progress(data){
    if(data.type==='status'){status(data.text);$('progress').removeAttribute('value');}
    if(data.type==='download'){$('progress').value=Math.min(1,data.loaded/data.total)*.3;status('Загружаю модель отделения: '+Math.round(data.loaded/1048576)+' МБ…');}
    if(data.type==='progress'){$('progress').value=.3+.45*data.step/data.total;status(`Отделяю твой голос: ${data.step} из ${data.total} фрагментов. Оставь вкладку открытой.`);}
  }
  async function run(newVariant=false){
    if(!file||busy)return;if(newVariant&&!cache)return;if(newVariant)variation++;
    const token=++generation;abort=new AbortController();transferred=false;lock(true);clearResults();$('original').pause();$('progress').hidden=false;$('progress').removeAttribute('value');let context,stage='загрузка песни';
    try{
      if(!cache){
        if(file.size>100*1024*1024)throw Error('Файл больше 100 МБ.');
        status('Читаю песню…');context=new AudioContext({sampleRate:44100});const decoded=await context.decodeAudioData(await file.arrayBuffer());if(token!==generation)return;
        const full=$('scope').value==='full';if(full&&decoded.duration>300)throw Error('Для целой песни максимум 5 минут. Выбери пробу на 30 секунд.');
        const seconds=Math.min(decoded.duration,full?300:30);if(seconds<1)throw Error('Запись должна быть длиннее одной секунды.');
        const offline=new OfflineAudioContext(2,Math.ceil(seconds*44100),44100),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const input=await offline.startRendering();if(token!==generation)return;
        if(measure(input).peak<1e-6)throw Error('В файле только тишина.');
        status('Подбираю темп…');const tempo=estimateTempo(input);let vocals,key;
        if($('inputMode').value==='vocals'){vocals=input;key=estimateKey(input);}else{
          stage='отделение голоса';status('Отделяю твой голос от старого минуса…');
          const data=await separateChannels([new Float32Array(input.getChannelData(0)),new Float32Array(input.getChannelData(1))],{signal:abort.signal,onProgress:progress,backend:$('backend').value});if(token!==generation)return;
          vocals=context.createBuffer(2,data.vocals[0].length,44100);for(let c=0;c<2;c++)vocals.copyToChannel(data.vocals[c],c);
          const accompaniment=context.createBuffer(2,data.instrumental[0].length,44100);for(let c=0;c<2;c++)accompaniment.copyToChannel(data.instrumental[c],c);key=estimateKey(accompaniment);
        }
        if(measure(vocals).peak<1e-6)throw Error('Не найден слышимый вокал. Попробуй другой фрагмент или загрузи отдельный голос.');
        cache={vocals,tempo,key};if($('autoTempo').checked){$('bpm').value=tempo.bpm;$('offset').value=Math.round(tempo.offset*1000);}
        $('analysis').textContent=`Автотемп: ${tempo.bpm} BPM${tempo.confidence<.25?' — проверь вручную':''}. Тональность: ${key.label}${key.score<.4?' — приблизительно':''}. Фрагмент: ${Math.round(vocals.duration)} с. ${$('inputMode').value==='vocals'?'Для речевого вокала тональность лучше выбрать вручную.':''}`;
      }
      if(token!==generation)return;
      stage='генерация нового минуса';const s=settings();$('bpm').value=s.bpm;$('offset').value=Math.round(s.offset*1000);$('progress').value=.8;status('Создаю новый минус: ударные, бас и аккорды…');
      const instrumental=await generateInstrumental(cache.vocals.duration,s);if(token!==generation)return;
      $('progress').value=.92;stage='сборка ремикса';status('Собираю ремикс с твоим голосом…');const mix=await mixRemix(cache.vocals,instrumental,s);if(token!==generation)return;
      result={mix:new Blob([wavBytes(mix)],{type:'audio/wav'}),beat:new Blob([wavBytes(instrumental)],{type:'audio/wav'}),voice:new Blob([wavBytes(cache.vocals)],{type:'audio/wav'}),settings:s};
      for(const [id,blob]of [['remix',result.mix],['instrumental',result.beat],['vocals',result.voice]]){const url=URL.createObjectURL(blob);urls.push(url);$(id).src=url;}
      $('results').hidden=false;$('progress').value=1;$('run').textContent='Пересобрать ремикс';status('Готово. Прослушай ремикс. Для другого рисунка нажми «Другой вариант минуса».');
    }catch(e){if(token===generation)status(e.name==='AbortError'?'Обработка остановлена.':('Ошибка: '+stage+'. '+e.message),true);}
    finally{await context?.close();if(token===generation){lock(false);$('progress').hidden=true;}}
  }
  $('run').onclick=()=>run();$('variant').onclick=()=>run(true);
  $('cancel').onclick=()=>{generation++;abort?.abort();lock(false);$('progress').hidden=true;status('Обработка остановлена. Можно запустить заново.');};
  const basename=()=>file?.name.replace(/\.[^.]+$/,'')||'ANDATRA';
  for(const [id,part,suffix]of [['saveMix','mix',' — ремикс'],['saveBeat','beat',' — новый минус'],['saveVoice','voice',' — вокал']])$(id).onclick=()=>{if(result)downloadBlob(result[part],basename()+suffix+'.wav');};
  $('toStudio').onclick=async()=>{
    if(!result)return;const button=$('toStudio');button.disabled=true;
    try{await new Promise((resolve,reject)=>{const request=indexedDB.open('andatra-audio-transfer',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('files','readwrite');tx.objectStore('files').put({beat:{blob:result.beat,name:basename()+' — новый минус.wav',gain:result.settings.beat},voice:{blob:result.voice,name:basename()+' — вокал.wav',gain:result.settings.voice}},'remix-project');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error);};};});transferred=true;location.href='/studio.html?import=remix';}
    catch(e){status('Не удалось открыть в студии. Скачай голос и минус и загрузи вручную.',true);}finally{button.disabled=false;}
  };
  for(const id of players)$(id).onplay=()=>{for(const other of players)if(other!==id)$(other).pause();};
  window.addEventListener('beforeunload',e=>{if(busy||result&&!transferred){e.preventDefault();e.returnValue='';}});
  window.addEventListener('pagehide',()=>{abort?.abort();urls.forEach(u=>URL.revokeObjectURL(u));if(originalURL)URL.revokeObjectURL(originalURL);});
  lock(false);
}
if(typeof document!=='undefined')initRemixer();

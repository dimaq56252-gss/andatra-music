import {attachSampleCredits} from './sample-engine.js?v=remix-6';
import {analyzeVocal,alignVocalBeat,estimateVocalTempo} from './adaptation.js?v=remix-6';
import {estimateTempo,estimateKey,NOTE_NAMES,generateInstrumental,mixRemix,validateSettings,melodySelection,cropAudio,remixChoices} from './music.js?v=variation-9';
import {separateChannels} from './separation.js?v=remix-6';
import {wavBytes,measure} from '../audio-processing.js';
import {downloadBlob} from '../studio-project.js';
export function initRemixer(){
  const $=id=>document.getElementById(id),status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
  let file,cache,result,busy=false,generation=0,abort,urls=[],originalURL='',variation=0,settingsDirty=false,transferred=false,manualOffset=false,variants=[],chosen=0,tapTimes=[],edits=[];
  for(let root=0;root<12;root++)for(const mode of ['minor','major']){const option=document.createElement('option');option.value=root+':'+mode;option.textContent=NOTE_NAMES[root]+(mode==='minor'?' minor':' major');$('key').append(option);}
  const audioBlob=(buffer,sampled=false)=>new Blob([sampled?attachSampleCredits(wavBytes(buffer)):wavBytes(buffer)],{type:'audio/wav'});
  const players=['original','remix','vocals','instrumental','preview0'];
  function clearResults(){for(const id of players.slice(1)){$(id).pause();$(id).removeAttribute('src');$(id).load();}urls.forEach(u=>URL.revokeObjectURL(u));urls=[];result=null;variants=[];$('results').hidden=true;$('audition').hidden=true;$('build').disabled=true;}
  function lock(value){busy=value;for(const id of ['file','scope','style','bpm','offset','key','harmony','autoTempo','adaptive','fit','voiceGain','beatGain','melody','instrument','polish','samples','structure','tapTempo','offsetEarlier','offsetLater','offsetEarlierBig','offsetLaterBig'])$(id).disabled=value;$('run').disabled=value||!file;$('variant').disabled=value||!cache;$('cancel').hidden=!value;$('build').disabled=value||!variants.length;document.querySelectorAll('[name=choice]').forEach(el=>el.disabled=value);}
  function resetCache(){generation++;abort?.abort();cache=undefined;edits=[];variation=0;settingsDirty=false;manualOffset=false;clearResults();$('analysis').textContent='Темп и тональность появятся после анализа. Вокал сохраняет исходную скорость.';$('run').textContent='Подготовить пробу';lock(false);status(file?'Нажми «Подготовить пробу».':'Загрузи отдельный вокал, чтобы начать.');}
  $('file').onchange=()=>{resetCache();file=$('file').files[0];if(originalURL)URL.revokeObjectURL(originalURL);$('original').pause();$('original').removeAttribute('src');$('original').load();originalURL=file?URL.createObjectURL(file):'';if(originalURL)$('original').src=originalURL;$('original').hidden=!file;$('filename').textContent=file?file.name:'Вокал не выбран';transferred=false;lock(false);status(file?'Вокал загружен. Выбери стиль и создай ремикс.':'Загрузи отдельный вокал, чтобы начать.');};
  $('scope').onchange=resetCache;
  function changed(){settingsDirty=true;clearResults();$('run').textContent=cache?'Обновить пробу':'Подготовить пробу';status(cache?'Настройки изменились. Пересобери ремикс — голос уже готов.':'Настройки выбраны. Загрузи песню и создай ремикс.');}
  for(const id of ['style','key','harmony','instrument','polish','samples','structure'])$(id).onchange=()=>{changed();analysis();};
  $('offset').onchange=()=>{manualOffset=true;changed();analysis();};
  function automaticTempo(){if(!cache||!$('autoTempo').checked)return;$('bpm').value=cache.tempo.bpm;const fit=$('adaptive').checked?Number($('fit').value)/100:0;const aligned=alignVocalBeat(cache.profile,cache.tempo.bpm,cache.tempo.offset,true);const offset=cache.tempo.offset+(aligned-cache.tempo.offset)*fit;if(!manualOffset)$('offset').value=Math.round(offset*1000);}
  function analysis(){if(!cache)return;const s=settings(),key=$('key').value==='auto'?($('adaptive').checked&&s.fit>0&&cache.profile.key?cache.profile.key:cache.key):{label:NOTE_NAMES[s.root]+(s.mode==='minor'?' minor':' major')};
    const selection=melodySelection(cache.vocals.duration,s,cache.profile),source=cache.profile.key&&$('key').value==='auto'&&s.adaptive&&s.fit>0?'по нотам голоса':'по песне / выбранной настройке';
    $('analysis').textContent=`Темп: ${cache.tempo.bpm} BPM${cache.tempo.confidence<.35?' — уверенность низкая, проверь вручную':''}. ${key?`Тональность: ${key.label} (${source}). `:''}Найдено фраз: ${cache.profile.phrases.length}, нот: ${cache.profile.pitches.length}. Мелодия: ${s.melody>0?selection.preset.genre+' · '+selection.preset.name:'выключена'}. ${s.adaptive&&s.fit>0?`Аккорды учитывают вокал, мелодия оставляет место в фразах и отвечает в паузах. Подстройка: ${Math.round(s.fit*100)}%. `:''}${s.polish?'Автобаланс и обработка вокала включены. ':''}${!cache.profile.key?'Надёжная тональность голоса не найдена — аккорды стоит проверить на слух. ':''}Голос сохраняет исходную скорость.`;
  }
  $('autoTempo').onchange=()=>{if($('autoTempo').checked)manualOffset=false;automaticTempo();changed();analysis();};
  $('adaptive').onchange=()=>{automaticTempo();changed();analysis();};
  $('fit').oninput=()=>{$('fitOut').textContent=$('fit').value+'%';automaticTempo();changed();analysis();};
  $('bpm').onchange=()=>{$('autoTempo').checked=false;const s=validateSettings({bpm:$('bpm').value});$('bpm').value=s.bpm;edits=[];changed();};
  for(const [id,out]of [['voiceGain','voiceOut'],['beatGain','beatOut'],['melody','melodyOut']])$(id).oninput=()=>{$(out).textContent=$(id).value+'%';changed();};
  function settings(){const key=$('key').value==='auto'?($('adaptive').checked&&Number($('fit').value)>0&&cache.profile.key?cache.profile.key:cache.key):{root:Number($('key').value.split(':')[0]),mode:$('key').value.split(':')[1]};return validateSettings({style:$('style').value,bpm:$('bpm').value,offset:Number($('offset').value)/1000,root:key.root,mode:key.mode,harmony:$('harmony').checked,adaptive:$('adaptive').checked,fit:Number($('fit').value)/100,voice:Number($('voiceGain').value)/100,beat:Number($('beatGain').value)/100,melody:Number($('melody').value)/100,instrument:$('instrument').value,polish:$('polish').checked,samples:$('samples').value==='sample',structure:$('structure').checked,variation,edits});}
  function progress(data){
    if(data.type==='status'){status(data.text);$('progress').removeAttribute('value');}
    if(data.type==='download'){$('progress').value=Math.min(1,data.loaded/data.total)*.3;status('Загружаю модель отделения: '+Math.round(data.loaded/1048576)+' МБ…');}
    if(data.type==='progress'){$('progress').value=.3+.45*data.step/data.total;status(`Отделяю твой голос: ${data.step} из ${data.total} фрагментов. Оставь вкладку открытой.`);}
  }
  async function run(newVariant=false){
    if(!file||busy)return;if(newVariant&&!cache)return;if(cache&&(newVariant||!settingsDirty))variation+=7;
    const token=++generation;abort=new AbortController();transferred=false;lock(true);clearResults();$('original').pause();$('progress').hidden=false;$('progress').removeAttribute('value');let context,stage='загрузка песни';
    try{
      if(!cache){
        if(file.size>100*1024*1024)throw Error('Файл больше 100 МБ.');
        status('Читаю вокал…');context=new AudioContext({sampleRate:44100});const decoded=await context.decodeAudioData(await file.arrayBuffer());if(token!==generation)return;
        const full=$('scope').value==='full';if(full&&decoded.duration>300)throw Error('Для целой песни максимум 5 минут. Выбери пробу на 30 секунд.');
        const seconds=Math.min(decoded.duration,full?300:30);if(seconds<1)throw Error('Запись должна быть длиннее одной секунды.');
        const offline=new OfflineAudioContext(2,Math.ceil(seconds*44100),44100),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const input=await offline.startRendering();if(token!==generation)return;
        if(measure(input).peak<1e-6)throw Error('В файле только тишина.');
        status('Подбираю темп…');let tempo=estimateTempo(input);let vocals,key;
        stage='отделение голоса';status('Отделяю голос от старого минуса…');
        const data=await separateChannels([new Float32Array(input.getChannelData(0)),new Float32Array(input.getChannelData(1))],{signal:abort.signal,onProgress:progress,backend:'wasm'});if(token!==generation)return;
        vocals=context.createBuffer(2,data.vocals[0].length,44100);for(let c=0;c<2;c++)vocals.copyToChannel(data.vocals[c],c);
        const accompaniment=context.createBuffer(2,data.instrumental[0].length,44100);for(let c=0;c<2;c++)accompaniment.copyToChannel(data.instrumental[c],c);key=estimateKey(accompaniment);
        if(measure(vocals).peak<1e-6)throw Error('Не найден слышимый вокал. Попробуй другой фрагмент или загрузи отдельный голос.');
        stage='анализ вокала';status('Анализирую акценты, паузы и ноты голоса…');const profile=analyzeVocal(vocals);tempo=estimateVocalTempo(profile,tempo);
        cache={vocals,tempo,key,profile,alignedOffset:alignVocalBeat(profile,tempo.bpm,tempo.offset,true)};automaticTempo();analysis();

      }
      if(token!==generation)return;
      stage='подготовка проб';const s=settings();$('bpm').value=s.bpm;$('offset').value=Math.round(s.offset*1000);
      const start=Math.min(Math.max(0,cache.vocals.duration-30),Math.max(0,(cache.profile.phrases[0]?.start||0)-.25)),length=Math.min(30,cache.vocals.duration-start),previewContext=new OfflineAudioContext(2,Math.ceil(length*44100),44100),voice=cropAudio(previewContext,cache.vocals,start,length),choices=[remixChoices(s)[1]],prepared=[];
      for(let i=0;i<choices.length;i++){stage='проба '+choices[i].name;status(`Готовлю пробу: ${choices[i].name}${s.samples?' · загружаю и использую сэмплы':''}…`);$('progress').value=.78+i*.065;const instrumental=await generateInstrumental(cache.vocals.duration,choices[i].settings,cache.profile,{start,length});if(token!==generation)return;const mix=await mixRemix(voice,instrumental,choices[i].settings);if(token!==generation)return;prepared.push(choices[i]);const url=URL.createObjectURL(audioBlob(mix,s.samples));urls.push(url);$('preview'+i).src=url;}
      settingsDirty=false;variants=prepared;chosen=0;document.querySelectorAll('[name=choice]').forEach((radio,i)=>radio.checked=i===chosen);$('audition').hidden=false;$('previewRange').textContent=`Один фрагмент голоса: ${start.toFixed(1)}–${(start+length).toFixed(1)} с. Поправь BPM и сдвиг выше, затем обнови пробу.`;
      analysis();$('progress').value=1;$('run').textContent='Обновить пробу';status('Проба готова. Послушай и нажми «Собрать ремикс» или обнови минус.');
    }catch(e){if(token===generation)status(e.name==='AbortError'?'Обработка остановлена.':('Ошибка: '+stage+'. '+e.message),true);}
    finally{await context?.close();if(token===generation){lock(false);$('progress').hidden=true;}}
  }

  $('run').onclick=()=>run();$('variant').onclick=()=>run(true);
  document.querySelectorAll('[name=choice]').forEach((radio,i)=>radio.onchange=()=>{chosen=i;result=null;$('results').hidden=true;for(const id of ['remix','vocals','instrumental'])$(id).pause();status('Выбран вариант: '+variants[i]?.name+'. Нажми «Собрать выбранный ремикс».');});
  $('build').onclick=async()=>{
    if(busy||!cache||!variants.length)return;const token=++generation,choice=variants[chosen];abort=new AbortController();lock(true);players.forEach(id=>$(id).pause());$('progress').hidden=false;status('Собираю выбранный вариант: '+choice.name+'…');
    try{const instrumental=await generateInstrumental(cache.vocals.duration,choice.settings,cache.profile);if(token!==generation)return;const mix=await mixRemix(cache.vocals,instrumental,choice.settings);if(token!==generation)return;result={mix:audioBlob(mix,choice.settings.samples),beat:audioBlob(instrumental,choice.settings.samples),voice:audioBlob(cache.vocals),settings:choice.settings};for(const[id,blob]of [['remix',result.mix],['instrumental',result.beat],['vocals',result.voice]]){const url=URL.createObjectURL(blob);urls.push(url);$(id).src=url;}$('results').hidden=false;status('Готово: '+choice.name+'. Можно слушать, скачать WAV или открыть дорожки в студии.');}
    catch(e){if(token===generation)status('Не удалось собрать ремикс: '+e.message,true);}finally{if(token===generation){lock(false);$('progress').hidden=true;}}
  };
  for(const[id,amount]of [['offsetEarlier',-10],['offsetLater',10],['offsetEarlierBig',-100],['offsetLaterBig',100]])$(id).onclick=()=>{$('offset').value=Math.max(-2000,Math.min(4000,(Number($('offset').value)||0)+amount));$('offset').onchange();};
  $('tapTempo').onclick=()=>{const now=performance.now();if(tapTimes.length&&now-tapTimes.at(-1)>2000)tapTimes=[],edits=[];if(tapTimes.length&&now-tapTimes.at(-1)<150)return;tapTimes.push(now);tapTimes=tapTimes.slice(-9);if(tapTimes.length<4){status('Tap: нажми минимум 4 раза в такт голосу.');return;}const intervals=tapTimes.slice(1).map((t,i)=>t-tapTimes[i]).sort((a,b)=>a-b),median=intervals[Math.floor(intervals.length/2)],regular=intervals.filter(x=>Math.abs(x-median)<median*.25),period=regular.reduce((a,b)=>a+b,0)/regular.length;$('bpm').value=Math.max(40,Math.min(240,Math.round(60000/period)));$('bpm').onchange();status('Темп задан вручную: '+$('bpm').value+' BPM. Обнови пробы.');};
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


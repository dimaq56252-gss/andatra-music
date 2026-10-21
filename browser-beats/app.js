import {generationOptions,validateResult,durationFits,MODEL_BYTES} from './core.js?v=fluid-42';
const $=id=>document.getElementById(id),ids=['style','bpm','duration','description','recheck','clearCache'];
let compatible=false,maxBuffer=0,busy=false,engine,abort,result,objectURL='',previousSeed=-1,probeId=0;
const gb=n=>(n/1e9).toFixed(1)+' ГБ';
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function lock(value){busy=value;for(const id of ids)$(id).disabled=value;$('generate').disabled=value||!compatible;$('cancel').hidden=!value;$('save').disabled=value||!result;$('studio').disabled=value||!result;}
async function probe(){
 if(busy)return;const id=++probeId;compatible=false;lock(true);$('cancel').hidden=true;$('device').textContent='Проверяю WebGPU…';
 try{if(!globalThis.isSecureContext)throw Error('Для WebGPU нужен HTTPS.');
  const data=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./probe.worker.js?v=fluid-42',import.meta.url),{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(Error('Проверка видеокарты не ответила. Перезапусти браузер и проверь аппаратное ускорение.'));},20000);worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve(e.data);};worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(Error('Не удалось запустить проверку устройства. Перезагрузи страницу.'));};worker.postMessage({type:'probe'});});
  if(id!==probeId)return;if(!data.ok)throw Error(data.error);maxBuffer=data.maxBufferSize;compatible=true;
  $('device').textContent=data.name+'. WebGPU доступен; совместимость самой модели ещё предстоит проверить.';
  $('storage').textContent=data.storage?.quota?`Квота браузера: ${gb(data.storage.quota)}; занято: ${gb(data.storage.usage||0)}. Для новой загрузки нужно около ${gb(MODEL_BYTES)} плюс запас.`:'Браузер не сообщил квоту хранилища. Модель проверит её перед загрузкой.';
  for(const option of $('duration').options)option.disabled=!durationFits(Number(option.value),maxBuffer);
  if($('duration').selectedOptions[0].disabled)$('duration').value='10';
  if(!durationFits(10,maxBuffer))throw Error('Видеокарта не предоставляет достаточно большой буфер даже для 10 секунд.');
  status('Устройство прошло предварительную проверку. Начни с пробы на 10 секунд.');
 }catch(e){if(id!==probeId)return;compatible=false;$('device').textContent=e.message;status('Локальная нейрогенерация на этом устройстве пока недоступна.',true);}
 finally{if(id===probeId)lock(false);}
}
function update(data){
 if(data.type==='progress'){$('progress').value=Math.min(1,Math.max(0,data.progress));status('Подготовка и генерация: '+Math.round(data.progress*100)+'%. При первом запуске загрузка и подготовка могут занять много времени.');}
 if(data.type==='download')$('downloadProgress').textContent=(data.cached?'Из кэша: ':'Загрузка: ')+data.label+' · '+gb(data.loaded)+' / '+gb(data.total);
 if(data.type==='stage'){$('details').textContent=(data.stage+': '+data.detail+'\n'+$('details').textContent).slice(0,5000);}
 if(data.type==='compatibility'&&!data.ok)status(data.message,true);
}
async function runtime(){if(!engine){const {createEngine}=await import('./engine.js?v=fluid-42');engine=await createEngine(update);}return engine;}
$('recheck').onclick=probe;
$('generate').onclick=async()=>{
 if(busy||!compatible)return;let options;
 try{let seed=crypto.getRandomValues(new Uint32Array(1))[0]&2147483647;if(seed===previousSeed)seed=(seed+1)&2147483647;previousSeed=seed;options=generationOptions({style:$('style').value,bpm:$('bpm').value,duration:$('duration').value,description:$('description').value},seed);if(!durationFits(options.durationSeconds,maxBuffer))throw Error('Выбери более короткую длительность для этой видеокарты.');}catch(e){status(e.message,true);return;}
 lock(true);abort=new AbortController();$('progress').hidden=false;$('progress').value=0;$('details').textContent='';$('downloadProgress').textContent='';status('Загружаю среду выполнения. Затем браузер скачает недостающие файлы модели…');
 try{const worker=await runtime();abort.signal.throwIfAborted();const next=await worker.generate({...options,signal:abort.signal});const stats=validateResult(next,options.durationSeconds);result={...next,stats};if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(result.wav);$('player').src=objectURL;$('result').hidden=false;$('resultInfo').textContent=`${stats.duration.toFixed(1)} с · вариант ${result.seed} · ${result.audioBuffer.sampleRate/1000} кГц. Прослушай всю пробу: техническая проверка не оценивает музыкальность.`;$('generate').textContent='Создать новый инструментал';status('Аудио готово. Оно создано на твоём устройстве.');}
 catch(e){engine?.dispose();engine=undefined;status(e.name==='AbortError'?'Обработка остановлена. Завершённые загрузки модели остаются в кэше.':'Не удалось создать минус: '+e.message,true);}
 finally{abort=undefined;lock(false);$('progress').hidden=true;}
};
$('cancel').onclick=()=>{abort?.abort();engine?.cancel();};
$('save').onclick=()=>{if(!result||busy)return;const a=document.createElement('a');a.href=objectURL;a.download='ANDATRA — новый минус — '+result.seed+'.wav';a.click();};
$('studio').onclick=async()=>{
 if(!result||busy)return;lock(true);
 try{await new Promise((resolve,reject)=>{const req=indexedDB.open('andatra-audio-transfer',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('files','readwrite');tx.objectStore('files').put({beat:{blob:result.wav,name:'Новый минус — '+result.seed+'.wav',gain:.7}},'remix-project');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error);};};});location.href='/studio.html?import=remix';}
 catch(e){status('Не удалось передать минус в студию. Скачай WAV и загрузи его вручную.',true);lock(false);}
};
$('clearCache').onclick=async()=>{if(busy)return;lock(true);try{const worker=await runtime();await worker.clearCache();status('Скачанная музыкальная модель удалена. При следующем запуске потребуется загрузка заново.');}catch(e){status('Не удалось удалить модель: '+e.message,true);}finally{engine?.dispose();engine=undefined;lock(false);}};
window.addEventListener('pagehide',()=>{abort?.abort();engine?.dispose();if(objectURL)URL.revokeObjectURL(objectURL);});
probe();

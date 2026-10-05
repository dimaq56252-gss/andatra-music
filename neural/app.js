const $=id=>document.getElementById(id);
let supported=false,busy=false,music,abort,url;
const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
function lock(value){busy=value;for(const id of ['check','prompt','duration','seed','another'])$(id).disabled=value;$('generate').disabled=value||!supported;$('cancel').hidden=!value;}
export async function check(){
 supported=false;$('generate').disabled=true;
 try{
  if(!navigator.gpu)throw Error('WebGPU недоступен. Открой страницу на компьютере в актуальном Chrome или Edge и включи аппаратное ускорение.');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  if(!adapter)throw Error('Браузер не предоставил видеокарту. Проверь аппаратное ускорение.');
  if(!adapter.features.has('shader-f16'))throw Error('Видеокарта не поддерживает нужные вычисления shader-f16 в этом браузере.');
  const storage=await navigator.storage?.estimate?.(),free=storage?(storage.quota||0)-(storage.usage||0):null;
  if(free!==null&&free<6.5e9)throw Error('Недостаточно доступного места в хранилище браузера: нужно минимум 6,5 ГБ.');
  const info=adapter.info||{};
  $('hardware').textContent='WebGPU доступен · '+(info.description||info.vendor||'видеокарта найдена')+(free!==null?' · доступно '+(free/1e9).toFixed(1)+' ГБ в хранилище браузера':'')+'. Объём видеопамяти браузер не сообщает; работоспособность проверим генерацией.';
  supported=true;status('Можно начать пробу на 10 секунд. Первая загрузка — около 5,6 ГБ.');$('generate').disabled=false;
 }catch(e){$('hardware').textContent=e.message;status(e.message,true);}
 return supported;
}
$('check').onclick=check;
function update(u){
 if(u.type==='progress'){$('progress').value=u.progress;status('Создание инструментала · '+Math.round(u.progress*100)+'%');}
 if(u.type==='download')status('Загрузка '+u.label+' · '+(u.loaded/1e6).toFixed(0)+' / '+(u.total/1e6).toFixed(0)+' МБ');
 if(u.type==='stage')status('Этап: '+u.stage+(u.detail?' · '+u.detail:''));
 if(u.type==='compatibility'&&!u.ok)status('Видеокарта: '+u.message,true);
}
export async function generate(){
 if(busy||!supported)return;
 const prompt=$('prompt').value.trim();if(!prompt){status('Добавь описание инструментала.',true);return;}
 lock(true);abort=new AbortController();$('progress').hidden=false;$('progress').value=0;$('result').hidden=true;$('audio').pause();status('Загружаю движок…');
 try{
  if(!music){const {AceStepWebGpu}=await import('./vendor/index.js');music=new AceStepWebGpu({allowWasmFallback:false,onUpdate:update});}
  const seed=Math.max(0,Math.min(4294967295,Number($('seed').value)||0)),durationSeconds=Number($('duration').value),started=performance.now();
  const result=await music.generate({prompt,lyrics:'[Instrumental]',audioQuality:'standard',plannerQuality:'turbo',seed,durationSeconds,sampler:'euler',signal:abort.signal});
  if(abort.signal.aborted)return;
  const buffer=result.audioBuffer;let peak=0;
  if(!buffer||buffer.duration<durationSeconds-.5)throw Error('Движок вернул слишком короткий звук.');
  for(let c=0;c<buffer.numberOfChannels;c++)for(const value of buffer.getChannelData(c)){if(!Number.isFinite(value))throw Error('Модель вернула повреждённый звук.');peak=Math.max(peak,Math.abs(value));}
  if(peak<1e-5)throw Error('Модель вернула тишину. Попробуй другой вариант.');
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(result.wav);$('audio').src=url;$('download').href=url;$('download').download='ANDATRA-neural-'+seed+'.wav';$('result').hidden=false;$('generate').textContent='Создать инструментал';$('timing').textContent=durationSeconds+' секунд музыки · вариант '+seed+' · генерация '+((performance.now()-started)/1000).toFixed(1)+' с';status('Готово. Послушай результат целиком и оцени качество.');
 }catch(e){status(e.name==='AbortError'?'Остановлено. Загруженные части модели остаются в кэше.':'Не удалось создать инструментал: '+e.message,true);music?.dispose();music=undefined;}
 finally{lock(false);$('progress').hidden=true;}
}
$('generate').onclick=generate;
$('another').onclick=()=>{$('seed').value=(Number($('seed').value)+1)>>>0;return generate();};
$('cancel').onclick=()=>{abort?.abort();music?.cancel();};
window.addEventListener('pagehide',()=>{abort?.abort();music?.dispose();if(url)URL.revokeObjectURL(url);});

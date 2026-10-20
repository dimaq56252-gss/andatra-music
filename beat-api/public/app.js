const $=id=>document.getElementById(id),endpoint='/.netlify/functions/instrumentals';
let job=sessionStorage.getItem('beat-job')||'',timer,busy=false,audio='',audioBlob;
$('access').value=sessionStorage.getItem('beat-access')||'';
$('access').oninput=()=>sessionStorage.setItem('beat-access',$('access').value);
const status=text=>$('status').textContent=text;
const cost=()=>{$('cost').textContent='Ориентировочно $'+(Number($('duration').value)*.0002).toFixed(3)+' за запуск по опубликованному тарифу fal.ai. Тариф проверяется в аккаунте сервиса.';};cost();$('duration').onchange=cost;
function controls(){ $('create').disabled=busy||!!job;$('check').hidden=!job;$('cancel').hidden=!job;$('check').disabled=busy;$('cancel').disabled=busy; }
async function call(method,body){const r=await fetch(endpoint+(job?'?job='+encodeURIComponent(job):''),{method,headers:{authorization:'Bearer '+$('access').value,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error||'Сервис недоступен.');return data;}
function finish(){job='';sessionStorage.removeItem('beat-job');clearTimeout(timer);controls();}
async function check(){
 if(!job||busy)return;busy=true;controls();
 try{const data=await call('GET');
  if(data.status==='COMPLETED'){audio=data.audio;audioBlob=undefined;$('player').src=audio;$('result').hidden=false;finish();status('Минус готов. Послушай результат и скачай его.');}
  else{status(data.status==='IN_QUEUE'?'Задание в очереди'+(Number.isFinite(data.position)?' · позиция '+data.position:''):'Нейросеть создаёт инструментал…');timer=setTimeout(check,4000);}
 }catch(e){status(e.message+' Задание сохранено: можно проверить его снова без нового платного запуска.');}
 finally{busy=false;controls();}
}
$('create').onclick=async()=>{
 if(busy||job)return;if(!$('access').value.trim()){status('Введи код доступа к генератору.');return;}if(!$('description').value.trim()){status('Опиши желаемый минус.');return;}
 busy=true;controls();$('result').hidden=true;status('Отправляю новое задание…');
 try{const data=await call('POST',{description:$('description').value,duration:Number($('duration').value)});job=data.job;sessionStorage.setItem('beat-job',job);status('Задание принято.');timer=setTimeout(check,1000);}
 catch(e){status(e.message+' Не запускай повторно сразу: если связь оборвалась после отправки, проверь историю заданий в fal.ai.');}
 finally{busy=false;controls();}
};
$('check').onclick=()=>{clearTimeout(timer);check();};
$('cancel').onclick=async()=>{if(busy)return;busy=true;controls();clearTimeout(timer);try{await call('DELETE');finish();status('Запрос на отмену отправлен. Уже начатая генерация может быть оплачена.');}catch(e){status(e.message);}finally{busy=false;controls();}};
$('download').onclick=async()=>{try{if(!audioBlob){const r=await fetch(audio);if(!r.ok)throw Error('Файл недоступен.');audioBlob=await r.blob();}const url=URL.createObjectURL(audioBlob),a=document.createElement('a');a.href=url;a.download='ANDATRA — новый минус.'+(audioBlob.type.includes('mpeg')?'mp3':'wav');a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){status('Не удалось скачать аудио: '+e.message);}};
try{const r=await fetch(endpoint+'?action=health'),health=await r.json();if(!r.ok||!health.ready)throw Error('Нейрогенерация пока не подключена. Владелец сайта должен настроить облачный сервис.');controls();status(job?'Предыдущее задание сохранено. Нажми «Проверить задание».':'Готово к новой инструментальной генерации.');}catch(e){$('create').disabled=true;status(e.message);}

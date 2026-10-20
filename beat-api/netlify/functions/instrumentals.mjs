import {createHmac,randomInt,timingSafeEqual} from 'node:crypto';

const MODEL='fal-ai/ace-step/prompt-to-audio';
const QUEUE='https://queue.fal.run/fal-ai/ace-step';
const send=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);};
export function musicInput(data){
 if(typeof data.description!=='string'||!data.description.trim()||data.description.length>1500)throw Error('Опиши желаемый минус: от 1 до 1500 символов.');
 if(![30,60,120,180].includes(data.duration))throw Error('Выбери длительность 30, 60, 120 или 180 секунд.');
 return {prompt:'Create an original instrumental beat for rapping. No vocals, no singing, no spoken words, no chants, no vocal chops. Leave space for a rapper. Develop a coherent musical theme, contrasting verse and hook, transitions, a clear ending. '+data.description.trim(),instrumental:true,duration:data.duration,number_of_steps:50,seed:randomInt(0,2147483647)};
}
const sign=(text,secret)=>createHmac('sha256',secret).update(text).digest('base64url');
function receipt(id,secret,now){const payload=Buffer.from(JSON.stringify({id,expires:now+86400000})).toString('base64url');return payload+'.'+sign(payload,secret);}
function readReceipt(value,secret,now){
 const [payload,signature,...extra]=String(value||'').split('.');
 if(extra.length||!payload||!equal(signature,sign(payload,secret)))throw Error('Недействительное задание.');
 const data=JSON.parse(Buffer.from(payload,'base64url').toString());
 if(!/^[a-zA-Z0-9-]{8,100}$/.test(data.id)||!Number.isFinite(data.expires)||data.expires<now)throw Error('Задание истекло.');
 return data.id;
}
function audioURL(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||!(url.hostname==='fal.media'||url.hostname.endsWith('.fal.media')||url.hostname==='storage.googleapis.com'&&url.pathname.startsWith('/falserverless/')))throw Error('Сервис вернул неизвестный адрес аудио.');
 return url.href;
}
// Injectable transport lets protocol tests run without billing the model.
export function createHandler({env,fetcher=fetch,now=Date.now}){
 return async function handler(request){
  const url=new URL(request.url),key=env('FAL_KEY'),access=env('BEAT_ACCESS_TOKEN');
  if(request.method==='GET'&&url.searchParams.get('action')==='health')return send({ready:!!(key&&access),provider:'fal',model:MODEL,instrumental:true});
  if(!key||!access)return send({error:'Нейрогенерация ещё не подключена: настрой FAL_KEY и BEAT_ACCESS_TOKEN на сервере.'},503);
  if(!equal(request.headers.get('authorization'),'Bearer '+access))return send({error:'Введи код доступа к генератору.'},401);
  if(!['GET','POST','DELETE'].includes(request.method))return send({error:'Метод не поддерживается.'},405);
  const call=async(path,options={})=>{
   const response=await fetcher(path,{...options,headers:{authorization:'Key '+key,'content-type':'application/json'},signal:AbortSignal.timeout(25000)});
   if(!response.ok){const status=response.status;throw Object.assign(Error(status===401||status===403?'Сервис не принял API-ключ.':status===402?'Недостаточно средств в аккаунте генерации.':status===429?'Сервис перегружен. Подожди перед следующим запросом.':'Ошибка музыкального сервиса ('+status+').'),{providerStatus:status});}
   return response.json();
  };
  try{
   if(request.method==='POST'){
    if(Number(request.headers.get('content-length'))>8192)return send({error:'Слишком большой запрос.'},413);
    const raw=await request.text();if(raw.length>4096)return send({error:'Слишком большой запрос.'},413);
    let input;try{input=musicInput(JSON.parse(raw));}catch(e){return send({error:e.message},400);}
    // No uploaded audio, reference tracks or source URLs are sent to the model.
    const job=await call('https://queue.fal.run/'+MODEL,{method:'POST',body:JSON.stringify(input)});
    if(!/^[a-zA-Z0-9-]{8,100}$/.test(job.request_id))throw Error('Сервис не вернул номер задания.');
    return send({job:receipt(job.request_id,access,now()),status:'IN_QUEUE',seed:input.seed},202);
   }
   let id;try{id=readReceipt(url.searchParams.get('job'),access,now());}catch(e){return send({error:e.message},400);}
   if(request.method==='DELETE'){await call(QUEUE+'/requests/'+id+'/cancel',{method:'PUT'});return send({status:'CANCEL_REQUESTED'});}
   const status=await call(QUEUE+'/requests/'+id+'/status');
   if(!['IN_QUEUE','IN_PROGRESS','COMPLETED'].includes(status.status))throw Error('Неизвестное состояние задания.');
   if(status.status!=='COMPLETED')return send({status:status.status,position:status.queue_position});
   if(status.error)return send({error:'Модель не смогла создать минус. Попробуй другое описание.'},502);
   const result=await call(QUEUE+'/requests/'+id);
   if(result.lyrics&&!/^\s*(\[inst\]|\[instrumental\])?\s*$/i.test(result.lyrics))return send({error:'Модель вернула текст вместо инструментального режима. Результат не принят.'},502);
   return send({status:'COMPLETED',audio:audioURL(result.audio?.url),seed:result.seed});
  }catch(e){return send({error:e.providerStatus?e.message:'Не удалось связаться с генератором. Повтори проверку задания; создание заново оплачивается отдельно.'},502);}
 };
}
export default request=>createHandler({env:name=>Netlify.env.get(name)})(request);
export const config={rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:40}};

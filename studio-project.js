import {zip,unzip,strToU8,strFromU8} from './vendor/fflate.js';
import {MAX_DURATION,MAX_PCM_BYTES,wavBytes} from './audio-processing.js';
const MB=1024*1024,MAX_ARCHIVE=200*MB,MAX_TRACKS=32;
const audioName=name=>/\.(wav|mp3|flac|ogg|m4a|aac|aif|aiff|opus|webm)$/i.test(name)&&!/(^|\/)__MACOSX\/|(^|\/)\._/.test(name);
function number(value,min,max,fallback){return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;}
export function validateManifest(value){
  if(value?.format!=='andatra-studio'||value.version!==1||!Array.isArray(value.tracks)||!value.tracks.length||value.tracks.length>MAX_TRACKS)throw Error('Неподдерживаемый проект студии.');
  const files=new Set();
  const tracks=value.tracks.map(t=>{
    if(typeof t.file!=='string'||!audioName(t.file)||t.file.startsWith('/')||t.file.split('/').includes('..')||files.has(t.file))throw Error('Некорректная дорожка проекта.');
    files.add(t.file);
    return {file:t.file,name:typeof t.name==='string'?t.name.slice(0,160):t.file,kind:['beat','voice','stem'].includes(t.kind)?t.kind:'stem',start:number(t.start,0,MAX_DURATION,0),offset:number(t.offset,-10000,10000,0),gain:number(t.gain,0,1.5,1),muted:t.muted===true};
  });
  return {tracks,master:number(value.master,0,1,.8),echo:number(value.echo,0,.5,0)};
}
export async function saveProject({tracks,master=.8,echo=0}){
  if(!tracks.length)throw Error('Проект пока пустой.');if(tracks.length>MAX_TRACKS)throw Error('В проекте можно сохранить до 32 дорожек.');
  const files=Object.create(null),manifest={format:'andatra-studio',version:1,master,echo,tracks:[]};let bytes=0;
  for(let i=0;i<tracks.length;i++){
    const t=tracks[i],file=`audio/track-${String(i+1).padStart(2,'0')}.wav`;
    const size=44+t.buffer.length*Math.min(2,t.buffer.numberOfChannels)*2;bytes+=size;
    if(bytes>MAX_ARCHIVE-2*MB)throw Error('Проект больше 200 МБ. Удали лишние дорожки или сократи записи.');
    files[file]=new Uint8Array(wavBytes(t.buffer));
    manifest.tracks.push({file,name:t.name,kind:t.kind,start:t.start,offset:t.offset,gain:t.gain,muted:t.muted});
  }
  files['andatra-project.json']=strToU8(JSON.stringify(manifest));
  const packed=await new Promise((resolve,reject)=>zip(files,{level:0},(e,data)=>e?reject(e):resolve(data)));
  return new Blob([packed],{type:'application/zip'});
}
export async function loadProject(file,context,onProgress=()=>{}){
  if(file.size>MAX_ARCHIVE)throw Error('Архив должен быть не больше 200 МБ.');
  if(!/\.zip$/i.test(file.name))throw Error('Нужен ZIP проекта ANDATRA или архив с аудиодорожками. FLP нужно экспортировать в отдельные WAV.');
  onProgress('Распаковываю проект…');let expanded=0,count=0;
  const bytes=new Uint8Array(await file.arrayBuffer());
  const entries=await new Promise((resolve,reject)=>{
    try{unzip(bytes,{filter:entry=>{
      const keep=audioName(entry.name)||/(^|\/)andatra-project\.json$/.test(entry.name);
      if(!keep)return false;
      expanded+=entry.originalSize;count++;
      if(entry.originalSize>MAX_ARCHIVE||(!audioName(entry.name)&&entry.originalSize>MB)||expanded>MAX_ARCHIVE||count>MAX_TRACKS+1)throw Error('В ZIP слишком много дорожек или распакованных данных.');
      return true;
    }},(e,data)=>e?reject(e):resolve(data));}catch(e){reject(e);}
  });
  const manifestName=Object.keys(entries).find(n=>/(^|\/)andatra-project\.json$/.test(n));let meta;
  if(manifestName){
    if(entries[manifestName].length>MB)throw Error('Файл настроек проекта слишком большой.');
    meta=validateManifest(JSON.parse(strFromU8(entries[manifestName])));
    const prefix=manifestName.slice(0,manifestName.length-'andatra-project.json'.length);
    meta.tracks=meta.tracks.map(t=>({...t,file:prefix+t.file}));
  }else{
    const names=Object.keys(entries).filter(audioName).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    if(names.length>MAX_TRACKS)throw Error('В проекте максимум 32 дорожки.');
    if(!names.length)throw Error('В архиве нет аудиодорожек. Экспортируй из DAW дорожки WAV с общим началом.');
    meta={master:1,echo:0,tracks:names.map(name=>({file:name,name:name.split('/').at(-1).replace(/\.[^.]+$/,''),kind:'stem',start:0,offset:0,gain:1,muted:false}))};
  }
  const tracks=[];let pcm=0;
  for(let i=0;i<meta.tracks.length;i++){
    const t=meta.tracks[i],data=entries[t.file];if(!data)throw Error('Не найдена дорожка: '+t.file);
    onProgress(`Читаю дорожку ${i+1} из ${meta.tracks.length}…`);
    let buffer;try{buffer=await context.decodeAudioData(data.slice().buffer);}catch{throw Error('Не удалось прочитать '+t.name+'. Попробуй WAV или MP3.');}
    if(buffer.duration>MAX_DURATION||t.start+t.offset/1000+buffer.duration>MAX_DURATION+.01)throw Error('Дорожка или проект длиннее 10 минут.');
    pcm+=buffer.length*buffer.numberOfChannels*4;if(pcm>MAX_PCM_BYTES)throw Error('Проект слишком большой для обработки в браузере. Сократи число дорожек.');
    const {file:unused,...settings}=t;tracks.push({...settings,buffer});delete entries[t.file];
  }
  return {tracks,master:meta.master,echo:meta.echo,native:!!manifestName};
}
export function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

import {processAudio,renderProject,measure,db,wavBytes,MAX_DURATION,MAX_PCM_BYTES} from './audio-processing.js';
import {loadProject,downloadBlob} from './studio-project.js';
export function initMastering(api){
  const $=id=>document.getElementById(id),status=(s,error=false)=>{$('masteringStatus').textContent=s;$('masteringStatus').classList.toggle('error',error);};
  let source=null,result=null,busy=false,urls=[],selected='after';
  function release(){ $('masteringPlayer').onloadedmetadata=null;$('masteringPlayer').pause();$('masteringPlayer').removeAttribute('src');$('masteringPlayer').load();urls.forEach(u=>URL.revokeObjectURL(u));urls=[];result=null;$('masteringPreview').hidden=true;$('masteringDownload').disabled=true;$('masteringStats').textContent=''; }
  function invalidate(){release();status(source?'Настройки изменились. Нажми «Обработать».':'Загрузи трек или проект.');}
  function lock(value){busy=value;api.lock(value);for(const id of ['masteringAudio','masteringProject','masteringCurrent','masteringProcess','masteringMode','masteringStrength','masteringBalance'])$(id).disabled=value;$('masteringDownload').disabled=value||!result;}
  function available(){if(busy)return false;if(api.isLocked()){status('Останови воспроизведение или запись в студии и дождись завершения операции.',true);return false;}return true;}
  function setSource(value,name){release();source=value;$('masteringName').textContent=name;$('masteringBalance').disabled=value.type!=='project';$('masteringBalance').checked=false;status('Готово к обработке. Выбери режим и нажми «Обработать».');}
  async function audioFile(file){
    if(!file||!available())return;lock(true);status('Читаю аудио…');
    try{
      if(file.size>100*1024*1024)throw Error('Файл должен быть не больше 100 МБ.');
      const context=await api.audio();const buffer=await context.decodeAudioData(await file.arrayBuffer());
      if(buffer.duration>MAX_DURATION)throw Error('Максимальная длительность — 10 минут.');
      if(buffer.length*buffer.numberOfChannels*4>MAX_PCM_BYTES)throw Error('Файл слишком большой для браузера.');
      setSource({type:'audio',buffer},file.name);
    }catch(e){status('Не удалось загрузить: '+e.message,true);}finally{lock(false);$('masteringAudio').value='';$('masteringBalance').disabled=source?.type!=='project';}
  }
  $('masteringAudio').onchange=()=>audioFile($('masteringAudio').files[0]);
  $('masteringProject').onchange=async()=>{
    const file=$('masteringProject').files[0];if(!file||!available())return;lock(true);
    try{const p=await loadProject(file,await api.audio(),status);setSource({type:'project',project:p},file.name+' · '+p.tracks.length+' дорожек');}
    catch(e){status('Не удалось загрузить проект: '+e.message,true);}finally{lock(false);$('masteringProject').value='';$('masteringBalance').disabled=source?.type!=='project';}
  };
  $('masteringCurrent').onclick=()=>{if(!available())return;const p=api.snapshot();if(!p.tracks.some(t=>!t.muted&&t.gain>0)){status('В студии нет слышимых дорожек.',true);return;}setSource({type:'project',project:p},'Текущий проект студии · '+p.tracks.length+' дорожек');};
  for(const id of ['masteringMode','masteringBalance'])$(id).onchange=invalidate;
  $('masteringStrength').oninput=()=>{$('masteringStrengthValue').textContent=$('masteringStrength').value+'%';invalidate();};
  function volume(){if(!result)return;const match=$('masteringMatch').checked,min=Math.min(result.before.rms,result.after.rms);$('masteringPlayer').volume=match?Math.max(0,Math.min(1,min/Math.max(1e-9,result[selected].rms))):1;}
  function show(which){
    if(!result)return;const player=$('masteringPlayer'),position=player.currentTime||0,resume=!player.paused;player.pause();selected=which;
    player.src=urls[which==='before'?0:1];volume();
    $('masteringBefore').setAttribute('aria-pressed',String(which==='before'));$('masteringAfter').setAttribute('aria-pressed',String(which==='after'));
    player.onloadedmetadata=()=>{player.currentTime=Math.min(position,Number.isFinite(player.duration)?player.duration:position);if(resume)player.play().catch(()=>{});};
  }
  $('masteringPlayer').onplay=()=>{if(api.isLocked()){$('masteringPlayer').pause();status('Сначала останови воспроизведение или запись в студии.',true);}};
  $('masteringBefore').onclick=()=>show('before');$('masteringAfter').onclick=()=>show('after');$('masteringMatch').onchange=volume;
  $('masteringProcess').onclick=async()=>{
    if(!available())return;if(!source){status('Сначала загрузи аудио или проект.',true);return;}
    lock(true);release();status('Обрабатываю звук… Для длинного проекта потребуется немного времени.');
    try{
      let original,working;
      if(source.type==='audio'){original=working=source.buffer;}else{
        const p=source.project;status('Собираю дорожки проекта…');original=await renderProject(p.tracks,p);
        working=$('masteringBalance').checked?await renderProject(p.tracks,{...p,automatic:true}):original;
      }
      status('Корректирую частоты, динамику и пики…');
      const processed=await processAudio(working,$('masteringMode').value,Number($('masteringStrength').value)/100);
      const before=measure(original),after=processed.after;
      result={before,after};
      const originalBlob=new Blob([wavBytes(original)],{type:'audio/wav'}),blob=new Blob([wavBytes(processed.buffer)],{type:'audio/wav'});
      result.blob=blob;urls=[URL.createObjectURL(originalBlob),URL.createObjectURL(blob)];
      $('masteringPreview').hidden=false;selected='after';$('masteringPlayer').src=urls[1];volume();
      $('masteringBefore').setAttribute('aria-pressed','false');$('masteringAfter').setAttribute('aria-pressed','true');
      $('masteringStats').textContent=`Средний уровень (RMS): ${db(before.rms).toFixed(1)} → ${db(after.rms).toFixed(1)} дБ · пик: ${db(before.peak).toFixed(1)} → ${db(after.peak).toFixed(1)} дБFS`;
      status('Готово. Сравни «До / После» и скачай понравившийся результат.');
    }catch(e){release();status('Не удалось обработать: '+e.message,true);}finally{lock(false);$('masteringBalance').disabled=source?.type!=='project';}
  };
  $('masteringDownload').onclick=()=>{if(result)downloadBlob(result.blob,'ANDATRA-master-'+$('masteringMode').value+'.wav');};
  window.addEventListener('pagehide',()=>urls.forEach(u=>URL.revokeObjectURL(u)));
}

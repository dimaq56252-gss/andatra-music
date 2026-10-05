import {copyRange,editRange,makePattern} from './studio-edit-audio.js?v=1';
export function initTrackEditor(api){
 const $=id=>document.getElementById(id),roles=['kick','snare','hat','bass'],names={kick:'Кик',snare:'Снейр',hat:'Хэт',bass:'Бас'},steps={kick:[0,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14],bass:[0,6,8,14]};
 const pattern=Object.fromEntries(roles.map(r=>[r,Array.from({length:16},(_,i)=>steps[r].includes(i))]));
 let selected,undo=[],redo=[],locked=false;
 const message=(text,error=false)=>{$('editStatus').textContent=text;$('editStatus').classList.toggle('error',error);};
 const current=()=>api.tracks.find(t=>t.id===Number($('editTrack').value));
 const base=t=>t.start+t.offset/1000;
 const bpm=()=>Math.max(40,Math.min(240,Number($('editBpm').value)||100));
 const snap=v=>$('editSnap').checked?Math.round(v/(60/bpm()/4))*(60/bpm()/4):v;
 const snapshot=()=>api.tracks.map(t=>({...t}));
 const remember=()=>{undo.push(snapshot());if(undo.length>12)undo.shift();redo=[];};
 function selection(t){const start=Math.max(base(t),Number($('editFrom').value)||0),end=Math.min(base(t)+t.buffer.duration,Number($('editTo').value)||0);if(end-start<.001)throw Error('Выдели участок внутри дорожки: начало меньше конца.');return {start,end,from:start-base(t),to:end-base(t)};}
 function refresh(){
  const old=selected??Number($('editTrack').value);$('editTrack').replaceChildren();
  for(const t of api.tracks){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;$('editTrack').append(option);}
  if(api.tracks.some(t=>t.id===old))$('editTrack').value=old;selected=Number($('editTrack').value);
  document.querySelectorAll('[data-track-id]').forEach(row=>{
   const track=api.tracks.find(t=>t.id===Number(row.dataset.trackId));row.classList.toggle('is-selected',track.id===selected);
   const canvas=row.querySelector('canvas');let down;
   canvas.style.touchAction='none';
   canvas.onpointerdown=e=>{if(api.isLocked())return;selected=track.id;$('editTrack').value=track.id;down=clampTime(e,canvas);canvas.setPointerCapture(e.pointerId);};
   canvas.onpointerup=e=>{if(down===undefined)return;const end=clampTime(e,canvas);$('editFrom').value=Math.min(down,end).toFixed(3);$('editTo').value=Math.max(down,end).toFixed(3);if(Math.abs(end-down)<.02){api.setPosition(end);$('editTo').value=Math.min(base(track)+track.buffer.duration,end+60/bpm()).toFixed(3);}down=undefined;api.render();message('Выделение задано на общей шкале времени.');};
   canvas.onpointercancel=()=>{down=undefined;};
  });lock(api.isLocked());
 }
 function clampTime(e,canvas){const r=canvas.getBoundingClientRect(),v=(e.clientX-r.left)/r.width*Math.max(1,api.endTime());return Math.max(0,Math.min(600,snap(v)));}
 function lock(value){locked=value;document.querySelectorAll('#trackEditor button,#trackEditor input,#trackEditor select').forEach(el=>el.disabled=value);$('editUndo').disabled=value||!undo.length;$('editRedo').disabled=value||!redo.length;for(const id of ['editKeep','editSilence','editSplit','editDuplicate','editFadeIn','editFadeOut','editNormalize','editMove'])$(id).disabled=value||!api.tracks.length;}
 async function change(action){if(api.isLocked())return;try{const ctx=await api.audio();if(api.isLocked())return;const t=current();if(!t)throw Error('Выбери или загрузи дорожку.');await action(ctx,t);api.markChanged();api.render();message('Правка применена. Её можно отменить; при экспорте и сохранении ZIP она сохранится.');}catch(e){message(e.message,true);}}
 $('editTrack').onchange=()=>{selected=Number($('editTrack').value);api.render();};
 $('editAll').onclick=()=>{const t=current();if(!t)return;$('editFrom').value=Math.max(0,base(t)).toFixed(3);$('editTo').value=(base(t)+t.buffer.duration).toFixed(3);api.render();};
 $('editCursor').onclick=()=>{$('editFrom').value=api.getPosition().toFixed(3);$('editTo').value=Math.min(600,api.getPosition()+60/bpm()).toFixed(3);api.render();};
 for(const id of ['editFrom','editTo'])$(id).onchange=()=>api.render();
 $('editKeep').onclick=()=>change((ctx,t)=>{const s=selection(t),buffer=copyRange(ctx,t.buffer,s.from,s.to);remember();t.buffer=buffer;t.start=s.start;t.offset=0;});
 for(const [id,mode]of [['editSilence','silence'],['editFadeIn','fadeIn'],['editFadeOut','fadeOut'],['editNormalize','normalize']])$(id).onclick=()=>change((ctx,t)=>{const s=selection(t),buffer=editRange(ctx,t.buffer,s.from,s.to,mode);remember();t.buffer=buffer;});
 $('editSplit').onclick=()=>change((ctx,t)=>{const point=Number($('editFrom').value)-base(t);if(point<=.001||point>=t.buffer.duration-.001)throw Error('Начало выделения должно быть внутри дорожки — это точка разреза.');if(api.tracks.length>=32)throw Error('Максимум 32 дорожки.');const left=copyRange(ctx,t.buffer,0,point),right=copyRange(ctx,t.buffer,point,t.buffer.duration);remember();const newTrack={...t,id:api.nextId(),buffer:right,start:base(t)+point,offset:0,name:t.name+' · часть 2',kind:t.kind==='beat'?'stem':t.kind};t.buffer=left;api.tracks.push(newTrack);});
 $('editDuplicate').onclick=()=>change((ctx,t)=>{const s=selection(t);if(api.tracks.length>=32||s.end+(s.end-s.start)>600)throw Error('Не хватает места: максимум 32 дорожки и 10 минут.');const buffer=copyRange(ctx,t.buffer,s.from,s.to);remember();api.tracks.push({...t,id:api.nextId(),buffer,start:s.end,offset:0,kind:t.kind==='beat'?'stem':t.kind,name:t.name+' · копия фрагмента'});});
 $('editMove').onclick=()=>change((ctx,t)=>{const start=Number($('editFrom').value);if(start<0||start+t.buffer.duration>600)throw Error('Начало дорожки должно укладываться в 10 минут.');remember();t.start=start;t.offset=0;});
 function restore(from,to){if(api.isLocked()||!from.length)return;to.push(snapshot());api.tracks.splice(0,api.tracks.length,...from.pop().map(t=>({...t})));api.markChanged();api.render();message('История правок применена.');}
 $('editUndo').onclick=()=>restore(undo,redo);$('editRedo').onclick=()=>restore(redo,undo);
 const grid=$('editPattern');for(const role of roles){const label=document.createElement('strong');label.textContent=names[role];grid.append(label);for(let i=0;i<16;i++){const b=document.createElement('button');b.type='button';b.className='pattern-step';b.setAttribute('aria-label',names[role]+' · шаг '+(i+1));const update=()=>{b.setAttribute('aria-pressed',String(pattern[role][i]));b.classList.toggle('active',pattern[role][i]);b.textContent=String(i+1);};b.onclick=()=>{pattern[role][i]=!pattern[role][i];update();};update();grid.append(b);}}
 async function insert(single){
  if(api.isLocked())return;
  try{if(api.tracks.length>=32)throw Error('Максимум 32 дорожки.');const ctx=await api.audio();if(api.isLocked())return;const start=Math.max(0,snap(Number($('editFrom').value)||0)),p=single?Object.fromEntries(roles.map(r=>[r,Array.from({length:16},(_,i)=>r===single&&i===0)])):pattern;
   const buffer=makePattern(ctx,{bpm:$('editBpm').value,bars:single?1:$('editBars').value,steps:p,note:Number($('editNote').value)});
   if(start+buffer.duration>600)throw Error('Партия выходит за пределы 10 минут.');
   remember();api.tracks.push({id:api.nextId(),buffer,name:single?names[single]:'Кик / снейр / хэт / бас · паттерн',kind:'stem',start,offset:0,gain:.7,muted:false});api.markChanged();api.render();message('Добавлена отдельная дорожка. Настрой её громкость и положение.');
  }catch(e){message(e.message,true);}
 }
 $('editInsert').onclick=()=>insert();$('editKick').onclick=()=>insert('kick');$('editBass').onclick=()=>insert('bass');
 return {refresh,lock,checkpoint:remember,clearHistory(){undo=[];redo=[];refresh();},drawSelection(context,track,width,height){if(track.id!==selected)return;const from=Number($('editFrom').value)||0,to=Number($('editTo').value)||0;if(to<=from)return;const duration=Math.max(1,api.endTime());context.fillStyle='rgba(215,255,71,.18)';context.fillRect(from/duration*width,0,(to-from)/duration*width,height);}};
}

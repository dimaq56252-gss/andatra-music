// Original procedural phrases: eight harmonic/rhythmic styles, twelve distinct motifs each.
export const instruments={piano:'Пианино',epiano:'Электропиано',bell:'Колокольчики',pluck:'Плаки',guitar:'Гитара',strings:'Струнные',pad:'Атмосферный пэд',lead:'Синтезатор',organ:'Орган',chip:'8-bit'};
const styles=[
 ['boom','Boom bap',90,'minor',[0,5,3,4], 'epiano',0],
 ['trap','Trap',140,'minor',[0,0,5,4],'bell',1],
 ['drill','Drill',142,'phrygian',[0,1,0,6],'strings',2],
 ['lofi','Lo-fi',78,'major',[0,5,1,4],'epiano',3],
 ['house','House',124,'minor',[0,3,5,4],'pluck',4],
 ['synth','Synthwave',105,'minor',[0,5,3,6],'lead',5],
 ['ambient','Ambient',72,'dorian',[0,3,1,4],'pad',6],
 ['funk','Funk / R&B',98,'dorian',[0,3,4,0],'organ',7]
];
const names=['Первый свет','По крышам','Пульс','Сумерки','Спираль','Встречный ветер','Орбита','Искры','На повторе','Дальний берег','Ночной маршрут','Эхо'];
const motifs=[
 [0,2,4,2,1,3,2,0], [4,3,1,0,2,1,-1,0], [0,0,4,5,4,2,1,2], [2,4,6,4,3,2,0,-1],
 [0,1,2,4,5,4,2,1], [4,2,0,-1,0,3,2,0], [0,4,2,6,4,1,3,0], [2,1,4,3,6,4,2,0],
 [0,2,0,4,3,1,2,4], [4,5,3,2,0,-1,1,0], [0,3,4,2,5,6,4,2], [6,4,3,1,2,0,-1,0]
];
const rhythms=[[0,2,4,6,8,10,12,14],[0,3,6,7,8,11,12,15],[0,2,5,6,8,10,13,15],[0,3,5,7,8,11,13,14],[0,2,4,7,8,10,12,15],[0,1,4,6,8,9,12,14],[0,4,6,8,10,12,14,15],[0,3,4,7,9,10,12,15]];
export const scales={minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10]};
export const catalog=styles.flatMap(([style,genre,bpm,mode,progression,instrument,s],si)=>motifs.map((motif,m)=>({id:style+'-'+m,style,genre,name:names[m]+' · '+String(m+1).padStart(2,'0'),bpm,mode,progression,instrument,motif,rhythm:rhythms[(s+m)%rhythms.length],variant:m,offset:si%3})));
export const genres=styles.map(([id,name])=>({id,name}));
export function melodyConfig(value={}){const preset=catalog.find(p=>p.id===value.preset);const clamp=(v,a,b,f)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):f;return {preset:preset?.id||catalog[0].id,enabled:value.enabled===true,root:clamp(value.root,0,11,0)|0,octave:clamp(value.octave,3,6,4)|0,instrument:instruments[value.instrument]?value.instrument:(preset?.instrument||'epiano'),volume:clamp(value.volume,0,1,.55),bass:value.bass!==false,chords:value.chords!==false};}
function degreeMidi(degree,scale,root,octave){const index=((degree%7)+7)%7;return 12*(octave+1)+root+scale[index]+12*Math.floor(degree/7);}
export function melodyNotes(config,bar){const p=catalog.find(p=>p.id===config.preset);if(!p||!config.enabled)return [];const b=((bar%4)+4)%4,chord=p.progression[b],scale=scales[p.mode],notes=[];
 p.rhythm.forEach((step,i)=>{let degree=p.motif[(i+b*(p.variant%3))%8]+chord+p.offset;if(b===3&&i===7)degree=0;const next=p.rhythm[i+1]??16;notes.push({step,midi:degreeMidi(degree,scale,config.root,config.octave),length:Math.max(.6,(next-step)*(p.style==='ambient'?.95:.72)),velocity:i%3===0?.85:.62,instrument:config.instrument,level:config.volume*.65});});
 if(config.chords)for(const step of [0,8])for(const degree of [chord,chord+2,chord+4])notes.push({step,midi:degreeMidi(degree,scale,config.root,3),length:7.4,velocity:.6,instrument:'pad',level:config.volume*.22});
 if(config.bass)for(const step of [0,6,8,14])notes.push({step,midi:degreeMidi(chord+(step===14?4:0),scale,config.root,2),length:step===0||step===8?4.8:1.6,velocity:.8,instrument:'bass',level:config.volume*.6});
 return notes;
}
export function note(c,destination,midi,when,duration,velocity,instrument,level){const g=c.createGain(),f=c.createBiquadFilter(),nodes=[g,f],frequency=440*Math.pow(2,(midi-69)/12),sustain=Math.max(.04,duration),attack=instrument==='pad'||instrument==='strings'?.09:.006,release=instrument==='pad'?.28:.12,end=when+sustain+release;
 f.type='lowpass';f.frequency.setValueAtTime(instrument==='bass'?500:instrument==='chip'?9000:instrument==='bell'?7000:3500,when);f.frequency.exponentialRampToValueAtTime(instrument==='bass'?240:instrument==='lead'?1800:900,end);f.Q.value=instrument==='lead'?2:.5;
 const peak=Math.max(.0001,velocity*level*.32);g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(peak,when+attack);g.gain.exponentialRampToValueAtTime(peak*(['piano','epiano','bell','pluck','guitar'].includes(instrument)?.16:.7),when+sustain);g.gain.exponentialRampToValueAtTime(.0001,end);f.connect(g).connect(destination);
 const type={piano:'triangle',epiano:'sine',bell:'sine',pluck:'sawtooth',guitar:'triangle',strings:'sawtooth',pad:'triangle',lead:'sawtooth',organ:'sine',chip:'square',bass:'sine'}[instrument]||'triangle';const layers={piano:[[1,1],[2,.18]],epiano:[[1,1],[3,.18]],bell:[[1,1],[2.76,.3]],pluck:[[1,1],[2,.14]],guitar:[[1,1],[3,.12]],strings:[[1,.55],[1.006,.45]],pad:[[1,.6],[.997,.4]],lead:[[1,.65],[1.008,.35]],organ:[[1,.65],[2,.22],[4,.13]],chip:[[1,1]],bass:[[1,1]]}[instrument]||[[1,1]];
 layers.forEach(([ratio,volume])=>{const o=c.createOscillator(),part=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency*ratio,when);part.gain.value=volume;o.connect(part).connect(f);o.start(when);o.stop(end);nodes.push(o,part);});const last=nodes.filter(n=>typeof n.start==='function').at(-1);last.onended=()=>nodes.forEach(n=>{try{n.disconnect();}catch{}});return {end,nodes};}
export function scheduleMelody(c,out,config,bar,step,when,bpm){return melodyNotes(config,bar).filter(n=>n.step===step).map(n=>note(c,out,n.midi,when,n.length*60/bpm/4,n.velocity,n.instrument,n.level));}

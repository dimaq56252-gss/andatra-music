import assert from 'node:assert/strict';
import {createArrangement,STYLES,validateSettings} from '../remix/music.js?v=melody-25';
import {inventPhrase,phraseSignature} from '../remix/phrases.js?v=melody-25';
const base={bpm:100,root:9,mode:'minor',seed:734829,samples:false,instrument:'piano',structure:false,adaptive:false,melody:.7};
for(const style of Object.keys(STYLES)){
 const shapes=new Set(),pitches=new Set(),rhythms=new Set();
 for(let variation=0;variation<40;variation++){
  const s=validateSettings({...base,style,variation}),phrase=inventPhrase(s),lead=createArrangement(30,s).filter(e=>e.kind==='lead');
  assert.deepEqual(lead,createArrangement(30,s).filter(e=>e.kind==='lead'));
  assert.ok(lead.every(e=>Number.isFinite(e.note)&&e.note>=48&&e.note<=79&&e.duration>0));
  const signature=phraseSignature(lead,s.bpm);assert.ok(signature);shapes.add(signature);
  pitches.add(JSON.stringify(lead.map(e=>e.note-lead[0].note)));
  rhythms.add(JSON.stringify(phrase.steps.map((t,i)=>[t-phrase.steps[0],+phrase.lengths[i].toFixed(2)])));
 }
 assert.ok(shapes.size>=38,style+': repeated melody shapes '+shapes.size);
 assert.ok(pitches.size>=35,style+': repeated note intervals '+pitches.size);
 assert.ok(rhythms.size>=38,style+': repeated rhythms '+rhythms.size);
}
const profile={accents:[],rate:20,duration:30,active:new Float32Array(600).fill(.9),rms:new Float32Array(600).fill(.1),key:{root:9,mode:'minor'},pitches:Array.from({length:150},(_,i)=>({time:i*.2,midi:57,note:9,weight:1})),phrases:[{start:0,end:30}],peak:.2};
const vocalShapes=new Set();
for(let variation=0;variation<30;variation++){const s={...base,style:'rap',variation,adaptive:true,fit:1};vocalShapes.add(phraseSignature(createArrangement(30,s,profile).filter(e=>e.kind==='lead'),s.bpm));}
assert.ok(vocalShapes.size>=28,'Vocal adaptation collapsed different melodies');
console.log('PASS: same key/BPM/instrument, 40 note/rhythm variants per style, deterministic rebuilds, vocal adaptation preserves variety');

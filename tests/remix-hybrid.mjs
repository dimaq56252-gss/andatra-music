import assert from 'node:assert/strict';
import {LOOP_PACKS} from '../remix/loops/catalog.js?v=hybrid-39';
import {hybridPlan,stretchLoop,selectLoopPack} from '../remix/hybrid.js?v=hybrid-39';
import {validateSettings} from '../remix/music.js?v=hybrid-39';
assert.equal(LOOP_PACKS.length,16);
assert.equal(LOOP_PACKS.flatMap(p=>p.clips).length,32);
for(const mode of ['minor','major'])for(const bpm of [60,94,132,180]){
 const packs=new Set();
 for(let seed=1;seed<=24;seed++){
  const s=validateSettings({hybrid:true,style:'rap',seed,bpm,mode,root:9,offset:.123});
  const p=hybridPlan(120,s);packs.add(p.pack.id);assert.equal(p.pack.mode,mode);
  assert.deepEqual(p,hybridPlan(120,s));
  assert.ok(p.events.every(e=>e.root>=0&&e.root<12&&e.duration>0&&e.when<120&&e.gain>=0));
  const verse=p.events.find(e=>e.section==='verse'),hook=p.events.find(e=>e.section==='chorus');
  assert.notEqual(verse.clip,hook.clip);assert.ok(hook.gain>verse.gain);
  assert.equal(selectLoopPack({...s,loopPack:p.pack.id}).id,p.pack.id);
 }
 assert.ok(packs.size>=4,'varied phrase packs');
}
// A tone is stretched in time without changing its pitch; explicit pitch shift
// then changes the frequency independently of the requested duration.
const sr=22050,input=Float32Array.from({length:sr*2},(_,i)=>Math.sin(2*Math.PI*220*i/sr)*.2);
const frequency=a=>{let crossings=0;const start=Math.round(a.length*.2),end=Math.round(a.length*.8);for(let i=start+1;i<end;i++)if(a[i-1]<=0&&a[i]>0)crossings++;return crossings*sr/(end-start);};
for(const ratio of [.65,1,1.6])for(const pitch of [1,2**(3/12)]){
 const a=stretchLoop(input,Math.round(input.length*ratio),pitch,sr);
 assert.ok(a.every(Number.isFinite));assert.equal(a.length,Math.round(input.length*ratio));
 assert.ok(Math.abs(frequency(a)-220*pitch)<5,JSON.stringify({ratio,pitch,hz:frequency(a)}));
 assert.deepEqual(a,stretchLoop(input,a.length,pitch,sr));
}
console.log('PASS: 16 instrumental packs / 32 loops; varied harmony, verse/hook contrast, deterministic selection, independent tempo and pitch');

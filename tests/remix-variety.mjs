import assert from 'node:assert/strict';
import {createArrangement,validateSettings} from '../remix/music.js?v=variety-38';
import {getConcept} from '../remix/concepts.js?v=variety-38';
for(const style of ['rap','boom','trap','drill','lofi','bounce','phonk','rnb']){
 const sets={concept:new Set(),lead:new Set(),rhythm:new Set(),chord:new Set(),bass:new Set()};
 for(let variation=0;variation<6;variation++){
  const s=validateSettings({style,variation,seed:734829,bpm:100,adaptive:false,structure:false,instrument:'auto'}),events=createArrangement(60,s),lead=events.filter(e=>e.kind==='lead');
  sets.concept.add(getConcept(s).name);sets.lead.add(JSON.stringify(lead.slice(0,20).map(e=>e.note)));sets.rhythm.add(JSON.stringify(lead.slice(0,20).map(e=>Math.round(e.when*100))));sets.chord.add(events.filter(e=>e.kind==='note'&&e.role==='chord').length);sets.bass.add(events.find(e=>e.role==='bass').instrument);
  assert.ok(events.every(e=>Number.isFinite(e.when)&&Number.isFinite(e.level)&&e.when>=0&&e.when<60&&(!e.duration||Number.isFinite(e.duration)&&e.duration>0)));
  assert.deepEqual(events,createArrangement(60,s));
  const manual=createArrangement(30,{...s,instrument:'piano',autoInstrument:false,bassTone:'808',drumKit:'classic'});
  assert.ok(manual.filter(e=>e.kind==='lead').every(e=>e.instrument==='piano'));
  assert.ok(manual.filter(e=>e.role==='bass').every(e=>e.instrument==='808'));
  assert.ok(manual.filter(e=>e.kind==='drum').every(e=>e.kit==='classic'));
 }
 assert.equal(sets.concept.size,6);assert.ok(sets.lead.size>=5&&sets.rhythm.size>=5&&sets.chord.size>=3&&sets.bass.size>=4,style);
}
assert.equal(new Set(Array.from({length:24},(_,seed)=>getConcept({style:'rap',variation:0,seed}).name)).size,6);
console.log('PASS: six structurally distinct directions in eight rap styles; deterministic arrangements, varied initial beats and preserved manual controls');

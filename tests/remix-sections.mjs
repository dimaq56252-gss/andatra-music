import assert from 'node:assert/strict';
import {createArrangement,validateSettings,STYLES,describeStructure} from '../remix/music.js?v=composition-37';
import {soundSet} from '../remix/production.js?v=composition-37';
import {structurePlan} from '../remix/structure.js?v=composition-37';
const profile={accents:[],rate:20,duration:120,active:new Float32Array(2400).fill(.8),rms:new Float32Array(2400).fill(.1),pitches:[],phrases:[{start:0,end:120}],peak:.2};
const base={seed:734829,bpm:100,root:9,instrument:'piano',autoInstrument:false,adaptive:true,fit:.85,structure:true};
for(const style of Object.keys(STYLES)){
 const s=validateSettings({...base,style}),plan=structurePlan(120,s,profile),events=createArrangement(120,s,profile),bar=240/s.bpm;
 const summaries=describeStructure(120,s,profile),verse=summaries.find(p=>p.type==='verse'&&p.end-p.start>=4*bar),chorus=summaries.find(p=>p.type==='chorus'&&p.end-p.start>=4*bar);
 assert.ok(verse&&chorus,style+': no alternating sections with constant vocal energy');
 assert.ok(plan.filter(p=>p.type==='chorus').length<plan.length*.6,style+': whole song classified as chorus');
 const part=(segment,filter)=>events.filter(e=>e.when>=segment.start&&e.when<segment.start+4*bar&&filter(e));
 const shape=(segment,filter)=>{const values=part(segment,filter);return values.map(e=>[+((e.when-segment.start)/bar).toFixed(3),e.note??e.index,+(e.duration||0).toFixed(3)]);};
 assert.notDeepEqual(shape(verse,e=>e.kind==='lead'),shape(chorus,e=>e.kind==='lead'),style+': same lead content');
 assert.notDeepEqual(shape(verse,e=>e.role==='bass'),shape(chorus,e=>e.role==='bass'),style+': same bass content');
 assert.notDeepEqual(shape(verse,e=>e.kind==='drum'),shape(chorus,e=>e.kind==='drum'),style+': same drum content');
 assert.ok(part(chorus,e=>e.kind==='atmosphere').length>part(verse,e=>e.kind==='atmosphere').length,style+': hook background not expanded');
 assert.ok(events.filter(e=>e.kind==='lead').every(e=>e.instrument==='piano'),style+': manual instrument changed');
 const flat=createArrangement(120,{...s,structure:false},profile);assert.ok(flat.every(e=>!e.theme||e.theme==='verse-1'));
 assert.deepEqual(events,createArrangement(120,s,profile));
}
const automatic=createArrangement(120,{...base,style:'rap',autoInstrument:true,instrument:'guitar'},profile);
assert.ok(automatic.some(e=>e.theme==='hook'&&e.instrument===soundSet(validateSettings({...base,style:'rap'})).answer));
console.log('PASS: distinct verse/hook notes, bass, drums and atmosphere; bounded chorus with constant-energy voice; manual timbre and structure-off controls; deterministic rebuild');

const longForm=describeStructure(300,validateSettings({...base,adaptive:false,bpm:120}));
assert.ok(longForm.filter(p=>p.type==='chorus').length>=3);
assert.ok(longForm.filter(p=>p.type==='verse').every(p=>p.end-p.start<=16*2+.01));
console.log('PASS: long tracks alternate bounded verses and hooks instead of stretching one loop');

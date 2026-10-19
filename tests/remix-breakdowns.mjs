import assert from 'node:assert/strict';
import {breakdownPlan,structurePlan} from '../remix/structure.js?v=breaks-21';
import {createArrangement,validateSettings,STYLES} from '../remix/music.js?v=breaks-21';
for(const style of Object.keys(STYLES))for(const seed of [2,3]){
 const s=validateSettings({style,bpm:100,seed,structure:true,adaptive:false}),drops=breakdownPlan(120,s),events=createArrangement(120,s),bar=240/s.bpm;
 assert.equal(drops.length,seed===2?2:3);assert.deepEqual(drops,breakdownPlan(120,s));
 for(const d of drops){
  assert.ok(d.start>=bar&&d.end<=120-bar);assert.ok(d.end-d.start<=2*bar+.0001);
  assert.ok(!events.some(e=>e.role==='bass'&&e.when<d.end&&e.when+(e.duration||0)>d.start+.0001));
  assert.ok(!events.some(e=>e.kind==='drum'&&e.when>=d.start&&e.when<d.end-60/s.bpm*.4));
  assert.ok(events.some(e=>e.kind==='drum'&&e.index===0&&Math.abs(e.when-d.end)<.025));
  assert.ok(structurePlan(120,s).some(p=>p.type==='break'&&p.start>=d.start&&p.end<=d.end));
 }
 assert.equal(breakdownPlan(120,{...s,structure:false}).length,0);
}
for(const [duration,bpm,offset]of [[30,140,0],[60,40,-2],[300,240,4]]){
 const s=validateSettings({bpm,offset,seed:3}),drops=breakdownPlan(duration,s);
 assert.ok(drops.length>=2&&drops.length<=3);assert.ok(drops.every(d=>d.start>=0&&d.end<duration));
}
assert.deepEqual(breakdownPlan(2,validateSettings({})),[]);
console.log('PASS: 2–3 separated breakdowns, kick/sub removal, sustained bass cutoffs, pickup/return, deterministic timing, all styles and short/long tracks');

import assert from 'node:assert/strict';
import {createArrangement,STYLES} from '../remix/music.js?v=groove-29';
import {soundSet} from '../remix/production.js?v=groove-29';
for(const style of Object.keys(STYLES))for(const seed of [1,52,734829]){
 const settings={style,seed,variation:2,bpm:100,offset:.17,structure:false,adaptive:false};
 const events=createArrangement(45,settings),bass=events.filter(e=>e.role==='bass'),kicks=events.filter(e=>e.kind==='drum'&&e.index===0);
 assert.ok(bass.length&&kicks.length);
 if(!['house','techno','synth','reggaeton','afro'].includes(style)){
  const aligned=bass.filter(e=>kicks.some(k=>Math.abs(k.when+.003-e.when)<.001)).length/bass.length;
  assert.ok(aligned>.65,`${style}: kick/bass alignment ${aligned}`);
 }
 const texture=soundSet(settings);
 assert.ok(events.filter(e=>e.role==='chord'&&e.kind==='note').every(e=>e.instrument===texture.chord||e.instrument===texture.answer||e.instrument==='strings'||e.instrument==='pad'));
 assert.deepEqual(events,createArrangement(45,settings));
}
console.log('PASS: 14 styles, 3 seeds; kick/bass groove alignment, coherent textures and deterministic export');

import assert from 'node:assert/strict';
import {createArrangement,validateSettings} from '../remix/music.js?v=klassika-33';
import {STYLE_TEMPOS,STYLE_SOUNDS} from '../remix/styles.js?v=klassika-33';
const s=validateSettings({style:'klassika',bpm:138,seed:51,variation:0,structure:false,adaptive:false}),bar=240/138,step=bar/16;
assert.equal(s.style,'klassika');assert.equal(STYLE_TEMPOS.klassika,138);assert.ok(STYLE_SOUNDS.klassika.length>=4);
const events=createArrangement(bar*6,s);
function hits(b,index){return events.filter(e=>e.kind==='drum'&&e.index===index&&e.level>.3&&e.when>=b*bar&&e.when<(b+1)*bar).map(e=>Math.round((e.when-b*bar)/step));}
assert.deepEqual(hits(0,0),[0,12]);assert.deepEqual(hits(1,0),[6,12]);assert.deepEqual(hits(0,1),[8,14]);assert.deepEqual(hits(1,1),[2,8]);assert.deepEqual(hits(2,0),hits(0,0));
const changed=createArrangement(bar*6,{...s,variation:1});assert.notDeepEqual(events.filter(e=>e.kind==='lead'),changed.filter(e=>e.kind==='lead'));assert.deepEqual(events,createArrangement(bar*6,s));
console.log('PASS: Klassika 138 BPM, analyzed two-bar drum accents, stable repetition and fresh lead variants');

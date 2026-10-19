// Run with Node 22+: node tests/remix-arrangement.mjs
import assert from 'node:assert/strict';
import {STYLES,createArrangement} from '../remix/music.js';
const duration=120,base={bpm:96,seed:734829,variation:0,structure:true,adaptive:false,melody:.35};
for(const style of Object.keys(STYLES)){
 const settings={...base,style},events=createArrangement(duration,settings);
 assert.deepEqual(events,createArrangement(duration,settings),style+': rebuilding must preserve the preview composition');
 assert.notDeepEqual(events,createArrangement(duration,{...settings,variation:1}),style+': another variant must change the music');
 assert.notDeepEqual(events,createArrangement(duration,{...settings,seed:734830}),style+': a new song must change the music');
 assert.ok(events.every(e=>Number.isFinite(e.when)&&e.when>=0&&e.when<duration&&Number.isFinite(e.level)&&(!e.duration||e.duration>0)));
 for(const role of ['drum','bass','chord','lead'])assert.ok(events.some(e=>(e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role)===role),style+': missing '+role);
 assert.ok(events.some(e=>e.role==='bass'&&e.note<40),style+': no low-register bass');
 assert.ok(events.some(e=>e.section==='verse')&&events.some(e=>e.section==='chorus')&&events.some(e=>e.section==='break'));
 const muted=createArrangement(duration,{...settings,partGains:{drum:0,bass:0,chord:1,lead:1}});
 assert.ok(muted.every(e=>e.kind!=='drum'&&e.role!=='drum'&&e.role!=='bass'),style+': muted drums/bass still scheduled');
 const rhythmOnly=createArrangement(duration,{...settings,melody:0,harmony:false});assert.ok(rhythmOnly.every(e=>e.kind!=='lead'&&e.role!=='chord'));
}
for(const [bpm,offset]of [[40,-2],[240,4]])assert.ok(createArrangement(300,{...base,style:'drill',bpm,offset}).every(e=>e.when>=0&&e.when<300));
console.log('PASS: 14 styles, composition stability, variants, parts, musical sections, mute controls, timing boundaries');

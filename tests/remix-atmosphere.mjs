import assert from 'node:assert/strict';
import {createArrangement,STYLES} from '../remix/music.js?v=library-30';
import {STYLE_SOUNDS} from '../remix/styles.js?v=library-30';
for(const style of Object.keys(STYLES))for(let variation=0;variation<8;variation++){
 const settings={style,bpm:100,seed:734829,variation,adaptive:false,instrument:STYLE_SOUNDS[style][variation%STYLE_SOUNDS[style].length]},events=createArrangement(60,settings);
 assert.ok(!events.some(e=>e.instrument==='piano'),style+': auto acoustic piano still present');
 const beds=events.filter(e=>e.kind==='atmosphere');assert.ok(beds.length>8,style+': background missing');
 assert.ok(beds.some(e=>e.when<10)&&beds.some(e=>e.when>30),style+': pad only appears in one section');
 assert.ok(beds.every(e=>e.duration>=2||e.when+e.duration>=59.99));
 assert.ok(!createArrangement(60,{...settings,atmosphere:0}).some(e=>e.kind==='atmosphere'));
 assert.ok(!createArrangement(60,{...settings,harmony:false}).some(e=>e.kind==='atmosphere'));
}
assert.ok(createArrangement(30,{style:'rap',instrument:'piano'}).some(e=>e.kind==='lead'&&e.instrument==='piano'));
console.log('PASS: no automatic acoustic piano in 14 styles; sustained beds across sections; atmosphere/harmony controls; manual piano preserved');

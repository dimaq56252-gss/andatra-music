import assert from 'node:assert/strict';
import {STYLES,createArrangement,validateSettings} from '../remix/music.js?v=karaoke-35';
import {STYLE_SOUNDS,RAP_TEMPOS,pickAutoTempo} from '../remix/styles.js?v=karaoke-35';
import {sharedRapGroove} from '../remix/production.js?v=karaoke-35';
assert.ok(!('klassika' in STYLES));assert.equal(Object.keys(STYLES).length,14);
for(const style of ['rap','boom','trap','drill','bounce','phonk']){
 assert.ok(RAP_TEMPOS[style].includes(138));assert.ok(STYLE_SOUNDS[style].includes('mutedguitar'));
 const bpms=new Set(Array.from({length:16},(_,seed)=>pickAutoTempo(style,seed)));assert.ok(bpms.has(138)&&bpms.size>1);
 const s=validateSettings({style,seed:1,variation:0,bpm:138,adaptive:false,structure:false});
 const a=sharedRapGroove(s,0,STYLES[style]),b=sharedRapGroove(s,1,STYLES[style]);assert.deepEqual(a.kick,[0,12]);assert.deepEqual(b.kick,[6,12]);assert.deepEqual(a.snare,[8,14]);assert.deepEqual(b.snare,[2,8]);
 const events=createArrangement(30,s);assert.ok(events.some(e=>e.kind==='lead'));assert.deepEqual(events,createArrangement(30,s));
 assert.notDeepEqual(events,createArrangement(30,{...s,seed:2}));
}
console.log('PASS: no separate song category; shared two-bar grooves, palettes and 138 BPM in normal rap generation; variety and determinism');

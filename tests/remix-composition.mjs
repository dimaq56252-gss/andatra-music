import assert from 'node:assert/strict';
import {validateSettings,createArrangement} from '../remix/music.js?v=composition-37';
import {composeMelody} from '../remix/composer.js?v=composition-37';
import {inventPhrase,RAP_STYLES} from '../remix/phrases.js?v=composition-37';
import {isChordDegree,fitThemeNote} from '../remix/harmony.js?v=composition-37';
import {soundSet} from '../remix/production.js?v=composition-37';
for(const style of RAP_STYLES)for(const seed of [1,51,300,734829]){
 const s=validateSettings({style,seed,bpm:132,adaptive:false,instrument:'auto'}),phrase=inventPhrase(s),composition=composeMelody(null,s,100),ensemble=soundSet(s);
 assert.ok(ensemble.lead&&ensemble.chord&&ensemble.answer);assert.notEqual(ensemble.lead,ensemble.chord);assert.notEqual(ensemble.lead,ensemble.answer);
 assert.ok(phrase.cadences.filter(Boolean).length>=2);assert.equal(phrase.degrees.at(-1),phrase.anchor);
 assert.ok(composition.events.length);for(const e of composition.events){
  if(e.strong){assert.ok(isChordDegree(e.scaleDegree,e.chordDegree));const pcs=[0,2,4].map(d=>(s.root+composition.scale[(e.chordDegree+d)%7])%12);assert.ok(pcs.includes(e.note%12));}
  assert.ok(e.note>=48&&e.note<=79);
 }
 const events=createArrangement(100,s);assert.deepEqual(events,createArrangement(100,s));
 const manual=createArrangement(100,{...s,instrument:'piano',autoInstrument:false});assert.ok(manual.filter(e=>e.kind==='lead').every(e=>e.instrument==='piano'));
}
assert.ok(Math.abs(fitThemeNote(7,4,4,false)-4)<=3);
console.log('PASS: 32 composed themes; chord-tone anchors, resolved phrase endings, connected instrument roles, manual timbres and deterministic rebuilds');

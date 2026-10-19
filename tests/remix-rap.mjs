import assert from 'node:assert/strict';
import {createArrangement,validateSettings} from '../remix/music.js?v=catalog-36';
import {inventPhrase,RAP_STYLES} from '../remix/phrases.js?v=catalog-36';
for(const style of RAP_STYLES)for(const seed of [1,51,734829]){
 const s=validateSettings({style,seed,bpm:100,variation:2,structure:false,adaptive:false}),phrase=inventPhrase(s),bar=240/s.bpm,step=bar/16;
 const first=phrase.steps.filter(t=>t<32),second=phrase.steps.filter(t=>t>=32).map(t=>t-32);assert.deepEqual(first,second,style+' repeated rhythm cell');
 assert.ok(phrase.lengths.reduce((a,b)=>a+b,0)<phrase.bars*16*.5,style+' room for rap');
 const events=createArrangement(bar*8,s);
 const kicks=b=>events.filter(e=>e.kind==='drum'&&e.index===0&&e.when>=b*bar&&e.when<(b+1)*bar).map(e=>Math.round((e.when-b*bar)/step));
 assert.deepEqual(kicks(0),kicks(2),style+' steady kick anchors');assert.deepEqual(kicks(0),kicks(4));
 const chords=events.filter(e=>e.role==='chord'&&e.kind==='note'&&e.when<bar*2);assert.ok(chords.length<=8,style+' sparse harmony');
}
console.log('PASS: 8 rap styles, 3 seeds: repeated motif rhythm, phrase rests, stable kick anchors and sparse harmony');

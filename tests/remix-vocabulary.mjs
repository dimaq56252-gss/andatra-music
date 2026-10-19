import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GROOVE_VOCABULARY,PHRASE_ONSETS,TEMPO_VOCABULARY,TEXTURE_SHAPES} from '../remix/vocabulary.js?v=catalog-36';
import {STYLES,createArrangement} from '../remix/music.js?v=catalog-36';
import {sharedRapGroove} from '../remix/production.js?v=catalog-36';
const analysis=JSON.parse(readFileSync(new URL('../scripts/karaoke-reference-analysis.json',import.meta.url)));
const inventory=JSON.parse(readFileSync(new URL('../scripts/karaoke-source-inventory.json',import.meta.url))),audit=JSON.parse(readFileSync(new URL('../scripts/karaoke-reference-audit.json',import.meta.url))),baseline=JSON.parse(readFileSync(new URL('../scripts/approved-reference-vocabulary.json',import.meta.url)));
assert.equal(analysis.length,inventory.length);assert.equal(new Set(analysis.map(x=>x.source)).size,inventory.length);assert.equal(audit.errors.length,0);assert.ok(analysis.every(x=>Number.isFinite(x.gridConfidence)&&x.duration>=6));assert.ok(audit.acceptedCount>=100);
for(const g of baseline.GROOVE_VOCABULARY)assert.ok(GROOVE_VOCABULARY.some(x=>JSON.stringify(x)===JSON.stringify(g)));
assert.equal(audit.acceptedCount+audit.excluded.length,analysis.length);
assert.ok(GROOVE_VOCABULARY.length>50);assert.ok(PHRASE_ONSETS.length>30);assert.ok(TEXTURE_SHAPES.length>=10);
for(const g of GROOVE_VOCABULARY)for(const a of [g.kick,g.snare])assert.ok(a.length&&a.every((v,i)=>Number.isInteger(v)&&v>=0&&v<32&&(!i||v>a[i-1])));
for(const cell of PHRASE_ONSETS)assert.ok(cell.length>=3&&cell.length<=6&&cell.every(i=>i<30));
assert.ok(TEMPO_VOCABULARY.includes(138)&&TEMPO_VOCABULARY.includes(80)&&TEMPO_VOCABULARY.includes(150));assert.equal(Object.keys(STYLES).length,14);
for(const bpm of [80,138]){const signatures=new Set();for(let seed=0;seed<200;seed++)signatures.add(JSON.stringify([0,1].map(b=>sharedRapGroove({bpm,seed,variation:0},b,STYLES.rap))));assert.ok(signatures.size>=5);}
for(const style of ['rap','boom','trap','drill','lofi','bounce','phonk','rnb'])for(let seed=0;seed<48;seed++){
 const settings={style,seed,bpm:seed%2?138:80,variation:0,structure:true},events=createArrangement(45,settings);assert.ok(events.some(e=>e.kind==='drum'&&e.index===0));assert.ok(events.some(e=>e.role==='bass'));assert.ok(events.some(e=>e.kind==='lead'));
 assert.ok(events.every(e=>Number.isFinite(e.when)&&e.when>=0&&e.when<45&&Number.isFinite(e.level)));assert.deepEqual(events,createArrangement(45,settings));
}
console.log('PASS: complete linked catalog analyzed; confidence filtering and retained baseline; diverse shared pools; 384 bounded deterministic rap arrangements; no added categories');

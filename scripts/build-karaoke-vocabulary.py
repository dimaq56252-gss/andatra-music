"""Compile deduplicated shared pools from the complete reference analysis."""
from pathlib import Path
import json,math
root=Path(__file__).resolve().parents[1];rows=json.loads((root/'scripts/karaoke-reference-analysis.json').read_text())
baseline=json.loads((root/'scripts/approved-reference-vocabulary.json').read_text())
grooves=list(baseline['GROOVE_VOCABULARY']);cells=list(baseline['PHRASE_ONSETS']);textures=list(baseline['TEXTURE_SHAPES']);accepted=[];excluded=[];seen_audio=set()
for row in rows:
 digest=row.get('audioHash',row['source'])
 reason='duplicate_audio' if digest in seen_audio else 'low_grid_confidence' if row['gridConfidence']<.45 else 'invalid_features' if not all(math.isfinite(float(v)) for v in row['balance']) or not row['kick32'] or not row['snare32'] else None
 if reason:excluded.append({'id':row.get('id'),'source':row['source'],'reason':reason,'confidence':row['gridConfidence']});continue
 seen_audio.add(digest);accepted.append(row)
 snare=row['snare32'];shift=1 if snare and all(i%2==1 for i in snare) else 0
 kick=sorted((i-shift)%32 for i in row['kick32']);snare=sorted((i-shift)%32 for i in snare)
 groove={'bpm':row['bpm'],'kick':kick,'snare':snare}
 # Keep a rhythm once per slow/fast beat spacing, even when multiple songs use it.
 if not any(g['kick']==kick and g['snare']==snare and (g['bpm']>=115)==(row['bpm']>=115) for g in grooves):grooves.append(groove)
 cell=sorted(set((i-shift)%32 for i in row['motifOnsets32'] if (i-shift)%32<30))
 if 3<=len(cell)<=6 and cell not in cells:cells.append(cell)
 low,mid,high=row['balance'];shape={'brightness':round(max(.68,min(1.05,.7+.4*high/(mid+high+.001))),2),'bassBody':round(.23+.12*low,2)}
 if shape not in textures:textures.append(shape)
tempos=sorted(set(baseline['TEMPO_VOCABULARY'])|set(round(row['bpm']*2)/2 for row in accepted))
assert grooves and cells and textures and tempos
text='// Shared numeric vocabulary compiled from the complete linked karaoke inventory.\n// Independent pools, confidence filtering and deduplication; no song audio or categories.\n'
for name,value in [('GROOVE_VOCABULARY',grooves),('PHRASE_ONSETS',cells),('TEMPO_VOCABULARY',tempos),('TEXTURE_SHAPES',textures)]:text+='export const '+name+'='+json.dumps(value,separators=(',',':'))+';\n'
(root/'remix/vocabulary.js').write_text(text)
audit_path=root/'scripts/karaoke-reference-audit.json';audit=json.loads(audit_path.read_text()) if audit_path.exists() else {}
audit.update({'acceptedCount':len(accepted),'retainedBaselineGrooves':len(baseline['GROOVE_VOCABULARY']),'excluded':excluded,'poolCounts':{'grooves':len(grooves),'phraseCells':len(cells),'tempos':len(tempos),'textures':len(textures)}});audit_path.write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print(json.dumps({k:audit[k] for k in ['analyzedCount','acceptedCount','poolCounts']},ensure_ascii=False));print('Excluded:',len(excluded))

from pathlib import Path
import json,math
root=Path(__file__).resolve().parents[1];rows=json.loads((root/'scripts/karaoke-reference-analysis.json').read_text())
grooves=[];cells=[];textures=[]
for row in rows:
 # Grid origin is fractional-step only; align a consistent late snare offset to the beat.
 snare=row['snare32'];shift=1 if snare and all(i%2==1 for i in snare) else 0
 kick=sorted((i-shift)%32 for i in row['kick32']);snare=sorted((i-shift)%32 for i in snare)
 grooves.append({'bpm':row['bpm'],'kick':kick,'snare':snare})
 cell=sorted(set((i-shift)%32 for i in row['motifOnsets32'] if (i-shift)%32<30))
 if len(cell)>=3 and cell not in cells:cells.append(cell)
 low,mid,high=row['balance'];textures.append({'brightness':round(max(.68,min(1.05,.7+.4*high/(mid+high+.001))),3),'bassBody':round(.23+.12*low,3)})
text='// Numeric vocabulary derived from ten ANDATRA karaoke instrumentals.\n// Independent onset/tempo/timbre-envelope pools; no song audio, categories or instrument identification.\n'
for name,value in [('GROOVE_VOCABULARY',grooves),('PHRASE_ONSETS',cells),('TEMPO_VOCABULARY',sorted(set(row['bpm'] for row in rows))),('TEXTURE_SHAPES',textures)]:text+='export const '+name+'='+json.dumps(value,separators=(',',':'))+';\n'
(root/'remix/vocabulary.js').write_text(text)
print(len(grooves),'grooves;',len(cells),'onset cells;',len(textures),'texture envelopes')

"""Rebuild local FluidR3 sample subsets from attributed upstream recordings."""
import concurrent.futures,json,re,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'remix/samples'
banks={'nylon':'acoustic_guitar_nylon','steel':'acoustic_guitar_steel','jazzguitar':'electric_guitar_jazz','cleanguitar':'electric_guitar_clean','mutedguitar':'electric_guitar_muted','rhodes':'electric_piano_1','fmkeys':'electric_piano_2','drawbar':'drawbar_organ','churchorgan':'church_organ','choir':'choir_aahs','voices':'voice_oohs','cello':'cello','violin':'violin','pizzicato':'pizzicato_strings','harp':'orchestral_harp','flute':'flute','sax':'tenor_sax','trumpet':'trumpet','brass':'brass_section','vibes':'vibraphone','marimba':'marimba','musicbox':'music_box','sitar':'sitar','koto':'koto','pickedbass':'electric_bass_pick','fingerbass':'electric_bass_finger','slapbass':'slap_bass_1','synthstrings':'synth_strings_1'}
def midi(name):
 m=re.fullmatch(r'([A-G])([b#]?)(\d)',name);return (int(m[3])+1)*12+dict(C=0,D=2,E=4,F=5,G=7,A=9,B=11)[m[1]]+({'b':-1,'#':1}.get(m[2],0))
def fetch(item):
 bank,source=item;dest=root/(bank+'.json')
 if dest.exists():return bank,len(json.loads(dest.read_text())['notes'])
 url=f'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/{source}-mp3.js'
 for attempt in range(3):
  try:
   text=urllib.request.urlopen(url,timeout=45).read().decode();break
  except Exception:
   if attempt==2:raise
 notes=json.loads(re.sub(r',\s*}', '}', text[text.index('{',text.index('MIDI.Soundfont.' )):text.rfind('}')+1]))
 lo,hi=(28,64) if 'bass' in bank else (44,84)
 wanted=set(range(lo,hi+1,4))
 selected={k:v.split('base64,',1)[1] for k,v in notes.items() if midi(k) in wanted}
 assert len(selected)>=9,(bank,len(selected))
 dest.write_text(json.dumps({'source':url,'license':'CC BY 3.0 US','notes':selected},separators=(',',':')))
 return bank,len(selected)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
  for bank,n in pool.map(fetch,banks.items()):print(bank,n,flush=True)

"""Analyze rhythm vocabulary from the current ANDATRA karaoke inventory.
Requires Python numpy/scipy and ffmpeg. No audio is included in the generated vocabulary.
"""
from pathlib import Path
import concurrent.futures,urllib.request,subprocess,json,hashlib,time
import numpy as np
from scipy import signal
ROOT=Path(__file__).resolve().parents[1]
def analyze(item):
 url=item['url'];path=ROOT/'qa/references'/Path(url).name;path.parent.mkdir(parents=True,exist_ok=True)
 cache=ROOT/'qa/reference-cache'/(str(item['id'])+'.json');cache.parent.mkdir(parents=True,exist_ok=True)
 if cache.exists():
  prior=json.loads(cache.read_text())
  if prior.get('source')==url:return prior
 if not path.exists():
  for attempt in range(3):
   try:
    data=urllib.request.urlopen(url,timeout=40).read()
    if len(data)<1000 or data[:50].lstrip().lower().startswith(b'<!doctype'):raise ValueError('Not an audio file')
    path.write_bytes(data);break
   except Exception:
    if attempt==2:raise
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar','16000','-ac','1','-f','f32le','pipe:1']);x=np.frombuffer(raw,dtype=np.float32);duration=len(x)/16000
 if duration<6 or not np.isfinite(x).all() or np.max(np.abs(x))<1e-5:raise ValueError('Empty, short or invalid audio')
 f,t,z=signal.stft(x,16000,nperseg=1024,noverlap=864);p=abs(z)**2
 bands=[]
 for lo,hi in [(35,160),(180,1400),(2500,7500)]:
  env=np.sqrt(p[(f>=lo)&(f<hi)].sum(axis=0));bands.append(np.maximum(0,env-np.roll(env,2)))
 flux=bands[0]+bands[2];mask=(t>max(min(10,duration*.15),duration*.12))&(t<min(duration-5,duration*.88));peaks,_=signal.find_peaks(flux,distance=6,prominence=max(.002,float(np.percentile(flux[mask],80))));ix=peaks[mask[peaks]];ts=t[ix];w=flux[ix]
 candidates=[]
 for bpm in np.arange(60,181,.05):
  step=15/bpm;c=np.sum(w*np.exp(2j*np.pi*ts/step))/(w.sum()+1e-9);candidates.append((float(abs(c)),float(bpm),float(np.angle(c)*step/(2*np.pi)%step)))
 confidence,bpm,phase=max(candidates);bpm=round(bpm,1);step=15/bpm
 # Fold independent low, high and pitched-band transients into two bars.
 folds=[]
 for v in bands:
  fold=[]
  for i in range(32):
   times=np.arange(phase+i*step,duration,32*step);times=times[(times>max(min(10,duration*.15),duration*.12))&(times<duration*.88)]
   fold.append(float(np.mean([max(np.interp(tt+dt,t,v) for dt in [-.015,0,.015]) for tt in times])))
  folds.append(np.array(fold))
 low,mid,high=folds
 def selected(v,count,gap=2):
  result=[]
  for i in np.argsort(v)[::-1]:
   i=int(i)
   if v[i]<v.max()*.27:continue
   if all(min(abs(i-j),32-abs(i-j))>=gap for j in result):result.append(i)
   if len(result)>=count:break
  return sorted(result)
 kick=selected(low,7);snare=selected(high,4,4)
 # Exclude loud drum positions from the pitched-band onset vocabulary.
 pitched=mid.copy()
 for i in set(kick+snare):pitched[i]*=.2
 motif=selected(pitched,6,3);motif=[i for i in motif if i<30]
 if len(motif)<3:motif=[0,6,12,20,26]
 # Normalized balance is descriptive, not an instrument classifier.
 energies=np.array([p[(f>=a)&(f<b),:][:,mask].sum() for a,b in [(35,180),(180,2000),(2000,7500)]],dtype=float);energies/=energies.sum()
 rms=[]
 for start in np.arange(0,duration,240/bpm*4):
  a=x[int(start*16000):int(min(duration,start+240/bpm*4)*16000)];rms.append(round(float(np.sqrt(np.mean(a*a))),4))
 row={'id':item['id'],'audioHash':hashlib.sha256(raw).hexdigest(),'source':url,'duration':round(duration,2),'bpm':bpm,'gridConfidence':round(confidence,3),'kick32':kick,'snare32':snare,'motifOnsets32':motif,'balance':np.round(energies,3).tolist(),'fourBarRms':rms}
 cache.write_text(json.dumps(row));return row
if __name__=='__main__':
 inventory=json.loads((ROOT/'scripts/karaoke-source-inventory.json').read_text());rows=[];errors=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  pending={pool.submit(analyze,item):item for item in inventory}
  for future in concurrent.futures.as_completed(pending):
   item=pending[future]
   try:
    row=future.result();rows.append(row);print('OK',item['id'],row['bpm'],row['gridConfidence'],'completed',len(rows)+len(errors),'/',len(inventory),flush=True)
   except Exception as error:
    errors.append({'id':item['id'],'source':item['url'],'error':str(error)});print('ERROR',item['id'],str(error),flush=True)
 rows.sort(key=lambda r:r['id']);(ROOT/'scripts/karaoke-reference-analysis.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 (ROOT/'scripts/karaoke-reference-audit.json').write_text(json.dumps({'inventoryCount':len(inventory),'analyzedCount':len(rows),'errors':errors},ensure_ascii=False,indent=2))
 print('FINISHED',len(rows),'analyzed;',len(errors),'errors',flush=True)

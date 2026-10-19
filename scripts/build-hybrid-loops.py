"""Build a reproducible, beat-aligned musical layer from ANDATRA instrumentals.

No neural generation is claimed: source provenance is recorded in the manifest.
Keep each source's related phrases together; never combine unrelated harmony.
"""
import json, hashlib, subprocess, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from scipy import signal, ndimage

BASE = Path(__file__).resolve().parents[1]
OUT = BASE / 'remix/loops'
CACHE = BASE / 'qa/loop-sources'
OUT.mkdir(exist_ok=True); CACHE.mkdir(exist_ok=True)
SR = 22050
IDS = [2,3,4,22,26,29,32,35,49,69,84,95,100,103,106,115]
analysis = {r['id']:r for r in json.loads((BASE/'scripts/karaoke-reference-analysis.json').read_text())}

def chroma(x):
    _,_,z = signal.stft(x, SR, nperseg=4096, noverlap=3072)
    mag = np.abs(z)
    freq = np.fft.rfftfreq(4096,1/SR)
    good = (freq>90)&(freq<3200)
    midi = np.rint(69+12*np.log2(np.maximum(1,freq)/440)).astype(int)
    # Whitening reduces timbre's influence on harmonic identification.
    power = np.sqrt(mag / (ndimage.median_filter(mag,size=(31,1))+.00003)) * mag**.35
    return np.array([power[good & (midi%12==pc)].sum() for pc in range(12)])

major=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
minor=np.array([6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
def key(c):
    c=c-c.mean()
    scores=[(np.dot(c,np.roll(p-p.mean(),r))/(np.linalg.norm(p-p.mean())+1e-9),r,m) for m,p in [('major',major),('minor',minor)] for r in range(12)]
    _,root,mode=max(scores)
    return root,mode

def build(i):
    row=analysis[i]; path=CACHE/f'{i:03}.mp3'
    source=row['source'].replace('https://andatra-music.ru/','https://raw.githubusercontent.com/dimaq56252-gss/andatra-music/8bac3826ca53bc94c3edde1639d3a48d39868b5a/')
    if not path.exists():
        path.write_bytes(urllib.request.urlopen(source,timeout=90).read())
    pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-t','105','-ar',str(SR),'-ac','1','-f','f32le','pipe:1'])
    x=np.frombuffer(pcm,dtype='<f4').copy()
    _,times,z=signal.stft(x,SR,nperseg=2048,noverlap=1536)
    mag=np.abs(z); flux=np.maximum(0,np.diff(mag,axis=1)).sum(axis=0)
    ft=times[1:]; good=(ft>4)&(ft<min(90,len(x)/SR-2)); flux=flux[good]; ft=ft[good]
    # Refine tempo and downbeat phase; timestamps come from original audio.
    best=(-1,None,None)
    for bpm in np.arange(row['bpm']-1,row['bpm']+1.001,.05):
        period=60/bpm
        for phase in np.arange(0,period,.012):
            distance=np.abs((ft-phase+period/2)%period-period/2)
            score=float(np.dot(flux,np.exp(-(distance/.035)**2)))
            if score>best[0]:best=(score,bpm,phase)
    _,bpm,phase=best; bar=240/bpm
    # Soft harmonic/percussive separation, then remove the old kick/sub range.
    h=ndimage.median_filter(mag,size=(1,25));p=ndimage.median_filter(mag,size=(25,1))
    mask=h**2/(h**2+p**2+1e-12)
    _,harmonic=signal.istft(z*mask,SR,nperseg=2048,noverlap=1536)
    harmonic=signal.sosfiltfilt(signal.butter(3,180,fs=SR,btype='highpass',output='sos'),harmonic)
    candidates=[]
    for n in range(1,int((len(harmonic)/SR-8*bar-phase)/bar)):
        start=phase+n*bar
        clip=harmonic[round(start*SR):round((start+8*bar)*SR)]
        energies=[np.sqrt(np.mean(c*c)) for c in np.array_split(clip,8)]
        if min(energies)>.009:
            # Prefer stable, audible phrases to intros, silence and fade-outs.
            score=np.mean(energies)/(1+np.std(energies)/(np.mean(energies)+1e-9))
            candidates.append((score,start))
    if not candidates:raise RuntimeError(f'No complete phrase: {i}')
    _,start=max(candidates)
    full=harmonic[round(start*SR):round((start+8*bar)*SR)]
    root,mode=key(chroma(full))
    clips=[]
    scale=[0,2,4,5,7,9,11] if mode=='major' else [0,2,3,5,7,8,10]
    for part in range(2):
        a=start+part*4*bar; clip=harmonic[round(a*SR):round((a+4*bar)*SR)].copy()
        roots=[]
        for b in range(4):
            c=chroma(clip[round(b*bar*SR):round((b+1)*bar*SR)])
            scores=[]
            for degree in range(7):
                notes=[(root+scale[(degree+d)%7])%12 for d in [0,2,4]]
                scores.append(sum(c[n] for n in notes)+c[notes[0]]*.1)
            roots.append((root+scale[int(np.argmax(scores))])%12)
        rms=np.sqrt(np.mean(clip*clip));clip*=min(4,.14/max(.001,rms),.85/max(.001,np.max(np.abs(clip))))
        fade=round(.005*SR);clip[:fade]*=np.linspace(0,1,fade);clip[-fade:]*=np.linspace(1,0,fade)
        name=f'{i:03}-{part}.mp3'
        subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','96k',str(OUT/name)],input=clip.astype('<f4').tobytes(),check=True)
        clips.append({'url':'/remix/loops/'+name,'bars':4,'roots':roots,'rms':round(float(np.sqrt(np.mean(clip*clip))),4)})
    result={'id':f'andatra-{i:03}','source':row['source'].replace('https://andatra-music.ru',''),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceStart':round(start,4),'bpm':round(float(bpm),3),'root':int(root),'mode':mode,'clips':clips}
    print(json.dumps({k:v for k,v in result.items() if k not in ['clips','sourceSha256']},ensure_ascii=False),flush=True)
    return result

with ThreadPoolExecutor(max_workers=4) as pool:
    packs=list(pool.map(build,IDS))
(OUT/'manifest.json').write_text(json.dumps({'version':1,'origin':'ANDATRA instrumental harmonic excerpts; not AI-generated','packs':packs},ensure_ascii=False,indent=2)+'\n')
print('Built',len(packs),'packs /',len(packs)*2,'loops',flush=True)

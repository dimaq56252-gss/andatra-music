"""Generate karaoke assets for the owner's ANDATRA recordings."""
import argparse, hashlib, json, math, re, subprocess, tempfile, time, sys
from pathlib import Path
import numpy as np
import os
os.environ['ORT_DISABLE_TELEMETRY']='1'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
from faster_whisper import WhisperModel

DONE={32,63,67,68,72,79,81,111,112,128}

def command(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def pcm(path):
    result=command(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar','16000','-ac','1','pipe:1'],capture_output=True)
    return np.frombuffer(result.stdout,dtype='<f4')

def timestamp(seconds):
    centiseconds=round(max(0,seconds)*100)
    return f'[{centiseconds//6000:02d}:{centiseconds//100%60:02d}.{centiseconds%100:02d}]'

def timed_text(segments, duration, title):
    cues=[];groups=[];probabilities=[];last=-1
    for segment in segments:
        if segment.avg_logprob < -1.15 or segment.no_speech_prob > .8:
            continue
        words=[]
        for word in segment.words or []:
            text=re.sub(r'гашиш\w*','[цензура]',word.word.strip(),flags=re.I)
            if not text or not re.search(r'[А-Яа-яA-Za-z0-9]',text):continue
            start=max(0,float(word.start));end=min(duration,float(word.end))
            if not math.isfinite(start) or not math.isfinite(end) or end<=start or start>=duration:continue
            words.append((start,end,text,float(word.probability)))
        # 2–3 words per highlight and up to 9 words per displayed row.
        row=[]
        for offset in range(0,len(words),3):
            chunk=words[offset:offset+3]
            start=max(chunk[0][0],last+.01)
            if start>=duration-.03:continue
            if row and (len(row)>=3 or start-cues[row[-1]]['end']>.8):
                groups.append(row);row=[]
            index=len(cues);row.append(index)
            cues.append({'time':start,'end':chunk[-1][1],'text':' '.join(w[2] for w in chunk)})
            probabilities.extend(w[3] for w in chunk);last=start
        if row:groups.append(row)
    if len(probabilities)<30:
        raise ValueError('Недостаточно распознанных слов для полноценного караоке')
    end=min(duration-.01,max(cues[-1]['end']+.2,cues[-1]['time']+.05))
    cues.append({'time':end,'end':duration,'text':'♪ '+title})
    return {
        'text':'\n'.join(timestamp(c['time'])+c['text'] for c in cues),
        'groups':groups,'cues':cues,'words':len(probabilities),
        'meanWordProbability':float(np.mean(probabilities)),
        'lowConfidenceWords':sum(p<.4 for p in probabilities)
    }

def process(track,model,output):
    key=f"{track['id']:03d}"
    metadata=output/'karaoke'/'auto'/f'{key}.json'
    minus=output/'assets'/'karaoke'/f'{key}-instrumental.mp3'
    if metadata.exists() and minus.exists():return
    metadata.parent.mkdir(parents=True,exist_ok=True);minus.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='andatra-karaoke-') as directory:
        root=Path(directory);source=root/f'track-{key}.mp3'
        print('START',key,track['title'],flush=True);started=time.time()
        command(['curl','--fail','--location','--retry','3','--max-time','180','--silent','--show-error','--output',str(source),track['src']])
        duration=float(command(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(source)],capture_output=True,text=True).stdout)
        if not 1<duration<900:raise ValueError('Invalid song duration')
        with open(root/'separation.log','w') as log:
            command([sys.executable,'-m','demucs.separate','-d','cpu','-n','htdemucs','--two-stems','vocals','--shifts','0','-o',str(root/'stems'),str(source)],stdout=log,stderr=log)
        stems=root/'stems'/'htdemucs'/source.stem;voice=stems/'vocals.wav';instrumental=stems/'no_vocals.wav'
        for audio in [voice,instrumental]:
            data=pcm(audio)
            if not np.isfinite(data).all() or abs(len(data)/16000-duration)>.15 or np.sqrt(np.mean(data*data))<1e-5:
                raise ValueError('Invalid separated audio')
        segments,_=model.transcribe(pcm(voice).copy(),language='ru',word_timestamps=True,beam_size=5,condition_on_previous_text=False,vad_filter=True,vad_parameters={'min_silence_duration_ms':350},temperature=0)
        lyrics=timed_text(list(segments),duration,track['title'])
        temporary=minus.with_suffix('.tmp.mp3')
        command(['ffmpeg','-v','error','-y','-i',str(instrumental),'-codec:a','libmp3lame','-b:a','160k','-metadata','title='+track['title']+' — караоке','-metadata','artist=СЕРИЯ АНДАТРЫ',str(temporary)])
        encoded=pcm(temporary)
        if not np.isfinite(encoded).all() or abs(len(encoded)/16000-duration)>.15:raise ValueError('Invalid encoded instrumental')
        temporary.replace(minus)
        data={'id':track['id'],'title':track['title'],'duration':duration,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'instrumental':'/'+minus.relative_to(output).as_posix(),'automatic':True,'recognitionModel':'Whisper large-v3-turbo','separationModel':'htdemucs',**lyrics}
        metadata.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
        print('READY',key,'words',lyrics['words'],'seconds',round(time.time()-started),flush=True)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--manifest',default='karaoke/tracks.json');parser.add_argument('--output',default='karaoke-output');parser.add_argument('--batch',type=int,default=0);parser.add_argument('--batches',type=int,default=1);parser.add_argument('--only',type=int);args=parser.parse_args()
    tracks=[t for t in json.loads(Path(args.manifest).read_text()) if t['id'] not in DONE]
    selected=[t for i,t in enumerate(tracks) if (t['id']==args.only if args.only else i%args.batches==args.batch)]
    model=WhisperModel('turbo',device='cpu',compute_type='int8',cpu_threads=4)
    errors=[]
    for track in selected:
        try:process(track,model,Path(args.output))
        except Exception as error:
            errors.append({'id':track['id'],'title':track['title'],'error':str(error)});print('FAILED',track['id'],str(error),flush=True)
    Path(args.output).mkdir(parents=True,exist_ok=True)
    (Path(args.output)/f'errors-{args.batch}.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
    if errors:raise SystemExit(1)
if __name__=='__main__':main()

// Protocol integration test: real FFmpeg wrapper, test Worker transport and native codec oracle.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {wavBytes} from '../audio-processing.js';
const dir=mkdtempSync(join(tmpdir(),'andatra-mp3-')),files=new Map(),created=[],revoked=[];
let failDownload=true,failEncoding=false,workers=0,fetches=0;
globalThis.fetch=async url=>{fetches++;return {ok:!(url.endsWith('.wasm')&&failDownload),arrayBuffer:async()=>new Uint8Array([1,2]).buffer};};
URL.createObjectURL=()=>{const url='blob:test-'+created.length;created.push(url);return url;};URL.revokeObjectURL=url=>revoked.push(url);
globalThis.Worker=class{
 constructor(url,options){assert.equal(url.protocol,'file:');assert.ok(url.pathname.endsWith('/remix/vendor/ffmpeg/worker.js'));assert.equal(options.type,'module');workers++;}
 terminate(){}
 postMessage({id,type,data}){queueMicrotask(()=>{try{let result=true;
  if(type==='WRITE_FILE')files.set(data.path,new Uint8Array(data.data));
  if(type==='EXEC'){if(failEncoding)result=1;else{writeFileSync(join(dir,'remix.wav'),files.get('remix.wav'));execFileSync('ffmpeg',data.args,{cwd:dir,stdio:'ignore'});files.set('remix.mp3',new Uint8Array(readFileSync(join(dir,'remix.mp3'))));result=0;}}
  if(type==='READ_FILE')result=files.get(data.path);
  if(type==='DELETE_FILE')files.delete(data.path);
  this.onmessage({data:{id,type,data:result}});
 }catch(error){this.onmessage({data:{id,type:'ERROR',data:error.message}});}});}
};
try{
 const {encodeMp3}=await import('../remix/export.js');
 const data=Float32Array.from({length:44100},(_,i)=>.2*Math.sin(2*Math.PI*440*i/44100));
 const wav=new Blob([wavBytes({sampleRate:44100,numberOfChannels:1,length:data.length,getChannelData:()=>data})],{type:'audio/wav'});
 await assert.rejects(encodeMp3(wav),/загрузить/);assert.deepEqual(revoked,created);assert.equal(workers,0);
 failDownload=false;const first=await encodeMp3(wav);assert.equal(first.type,'audio/mpeg');assert.ok(first.size>1000);assert.equal(files.size,0);assert.deepEqual(revoked,created);
 const count=fetches;await Promise.all([encodeMp3(wav),encodeMp3(wav)]);assert.equal(workers,1);assert.equal(fetches,count);assert.equal(files.size,0);
 failEncoding=true;await assert.rejects(encodeMp3(wav),/кодирования/);assert.equal(files.size,0);failEncoding=false;await encodeMp3(wav);
 writeFileSync(join(dir,'result.mp3'),new Uint8Array(await first.arrayBuffer()));const info=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-of','json',join(dir,'result.mp3')]));assert.equal(info.streams[0].codec_name,'mp3');assert.equal(info.streams[0].bit_rate,'192000');
 console.log('PASS: local-origin Worker URL; failed load retries and blob cleanup; repeated/queued exports; failed encoding recovery; MP3 decode/192 kbps via native codec oracle (browser WASM not exercised)');
}finally{rmSync(dir,{recursive:true,force:true});}

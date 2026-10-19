// Worker wrapper is hosted on our own origin. The large core is fetched as blobs.
let engine,loading;
async function blobURL(url,type){
 const response=await fetch(url);if(!response.ok)throw Error('Не удалось загрузить MP3-кодировщик. Проверь соединение и повтори.');
 return URL.createObjectURL(new Blob([await response.arrayBuffer()],{type}));
}
async function getEngine(){
 if(engine)return engine;
 if(!loading)loading=(async()=>{
  const {FFmpeg}=await import('./vendor/ffmpeg/index.js');
  const instance=new FFmpeg(),base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm',urls=[];
  try{
   // Keep every fulfilled URL even when the other download fails, so retries do not leak memory.
   const results=await Promise.allSettled([blobURL(base+'/ffmpeg-core.js','text/javascript'),blobURL(base+'/ffmpeg-core.wasm','application/wasm')]);
   for(const result of results)if(result.status==='fulfilled')urls.push(result.value);
   const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
   await instance.load({coreURL:results[0].value,wasmURL:results[1].value});engine=instance;return instance;
  }catch(error){instance.terminate();throw error;}
  finally{for(const url of urls)URL.revokeObjectURL(url);}
 })().finally(()=>{loading=null;});
 return loading;
}
let queue=Promise.resolve();
export function encodeMp3(blob){
 const task=queue.then(()=>encode(blob));queue=task.catch(()=>{});return task;
}
async function encode(blob){
 const instance=await getEngine();
 try{
  await instance.writeFile('remix.wav',new Uint8Array(await blob.arrayBuffer()));
  const code=await instance.exec(['-y','-i','remix.wav','-vn','-c:a','libmp3lame','-b:a','192k','-metadata','comment=Instrument samples: FluidR3_GM by Frank Wen and contributors, CC BY 3.0; https://creativecommons.org/licenses/by/3.0/','remix.mp3']);
  if(code!==0)throw Error('Ошибка кодирования MP3.');
  const data=await instance.readFile('remix.mp3');return new Blob([data],{type:'audio/mpeg'});
 }finally{for(const name of ['remix.wav','remix.mp3'])try{await instance.deleteFile(name);}catch{}}
}

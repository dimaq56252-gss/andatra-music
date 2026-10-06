let engine;
export async function encodeMp3(blob){
  const [{FFmpeg},{toBlobURL}]=await Promise.all([import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js'),import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js')]);
  if(!engine){const instance=new FFmpeg(),base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';try{await instance.load({coreURL:await toBlobURL(base+'/ffmpeg-core.js','text/javascript'),wasmURL:await toBlobURL(base+'/ffmpeg-core.wasm','application/wasm')});engine=instance;}catch(e){instance.terminate();throw e;}}
  try{await engine.writeFile('remix.wav',new Uint8Array(await blob.arrayBuffer()));const code=await engine.exec(['-y','-i','remix.wav','-vn','-c:a','libmp3lame','-b:a','192k','-metadata','comment=Instrument samples: FluidR3_GM by Frank Wen, CC BY 3.0; https://creativecommons.org/licenses/by/3.0/','remix.mp3']);if(code!==0)throw Error('Ошибка кодирования.');const data=await engine.readFile('remix.mp3');return new Blob([data],{type:'audio/mpeg'});}finally{for(const name of ['remix.wav','remix.mp3'])try{await engine.deleteFile(name);}catch{}}
}

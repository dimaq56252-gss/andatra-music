// Independent FluidAudio WebGPU runtime; prompts and audio stay on this device.
export function fluidRequest(options){
 if(typeof options.prompt!=='string'||options.prompt.length>512)throw Error('Сократи описание: общий запрос модели ограничен 512 символами.');
 return {generationProfile:'ace-turbo-v1-correctness',prompt:options.prompt,lyrics:'',instrumental:true,durationSeconds:options.durationSeconds,seed:BigInt(options.seed).toString(16).padStart(16,'0'),planner:{mode:'disabled'},metadata:{bpm:options.bpm,timeSignature:'4/4'}};
}
export async function createEngine(onUpdate){
 const {AceStepMusicClient,deleteAceModelCache,releaseAceAudioOutput,assertAceGenerationRequest}=await import('./fluid/client.js?v=fluid-42');
 const client=new AceStepMusicClient();
 function stage(p){onUpdate({type:'stage',stage:p.stage,detail:p.message||`${p.completedUnits}/${p.totalUnits}`});onUpdate({type:'progress',progress:p.overallFraction||0});}
 return {
  async generate(options){
   const request=fluidRequest(options);assertAceGenerationRequest(request);
   const stop=()=>client.cancel();options.signal?.throwIfAborted();options.signal?.addEventListener('abort',stop,{once:true});
   let raw;
   try{
    raw=await client.generate(request,{onDownloadProgress:p=>onUpdate({type:'download',label:'Музыкальная модель',loaded:p.completed,total:p.total}),onInitializationProgress:stage,onGenerationProgress:stage,onDiagnostic:d=>onUpdate({type:'stage',stage:'GPU',detail:d?.message||d?.code||'diagnostic'})});
    options.signal?.throwIfAborted();
    if(raw.mimeType!=='audio/wav'||raw.sampleRateHz!==48000||raw.channelCount!==2)throw Error('Модель вернула неподдерживаемый формат звука.');
    const bytes=await raw.audio.arrayBuffer(),wav=new Blob([bytes],{type:'audio/wav'});
    const context=new OfflineAudioContext(2,1,48000),audioBuffer=await context.decodeAudioData(bytes);
    options.signal?.throwIfAborted();
    return {wav,audioBuffer,instrumental:true,lyrics:'',seed:options.seed};
   }finally{options.signal?.removeEventListener('abort',stop);if(raw?.audioStorageId)await releaseAceAudioOutput(raw.audioStorageId).catch(()=>{});}
  },
  cancel:()=>client.cancel(),dispose:()=>client.terminate(),
  async clearCache(){await client.dispose();await deleteAceModelCache();},
 };
}

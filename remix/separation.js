export function separateChannels(channels,{signal,onProgress=()=>{},WorkerClass=Worker}={}){
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('Остановлено','AbortError'));return;}
    const expected=channels[0].length;
    const worker=new WorkerClass('/separate/engine.js',{type:'module'});
    let done=false;
    function finish(error,result){if(done)return;done=true;signal?.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(result);}
    function abort(){finish(new DOMException('Остановлено','AbortError'));}
    signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage=({data})=>{
      if(done)return;
      if(data.type==='done'){
        if(data.sampleRate!==44100||[data.vocals,data.instrumental].some(part=>!Array.isArray(part)||part.length!==2||part.some(c=>c.length!==expected))){finish(Error('Отделение вернуло некорректный голос.'));return;}
        finish(null,data);
      }else if(data.type==='error')finish(Error(data.message||'Не удалось отделить голос.'));
      else onProgress(data);
    };
    worker.onerror=()=>finish(Error('Не удалось запустить отделение голоса. Проверь интернет и попробуй Chrome или Edge.'));
    try{worker.postMessage({audio:{channelData:channels,sampleRate:44100}},channels.map(c=>c.buffer));}catch(e){finish(e);}
  });
}

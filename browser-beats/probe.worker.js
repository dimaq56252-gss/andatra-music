// Compatibility probe only. No model, runtime or weight downloads here.
self.onmessage=async()=>{
 try{
  if(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent))throw Error('Этот экспериментальный режим рассчитан на настольный Chrome или Edge. Телефоны пока не поддерживаются.');
  if(!navigator.gpu)throw Error('WebGPU недоступен. Открой сайт в обновлённом Chrome или Edge на компьютере и включи аппаратное ускорение.');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  if(!adapter)throw Error('Браузер не предоставил видеокарту. Проверь аппаратное ускорение и драйвер видеокарты.');
  const info=[adapter.info?.description,adapter.info?.vendor,adapter.info?.architecture].filter(Boolean).join(' ');
  if(adapter.isFallbackAdapter||/swiftshader|llvmpipe|software/i.test(info))throw Error('Браузер предоставил программный видеодрайвер. Для этой модели нужен аппаратный GPU: проверь ускорение и драйверы видеокарты.');
  if(!adapter.features.has('shader-f16'))throw Error('Для этой модели требуется WebGPU shader-f16. Обнови браузер и драйвер видеокарты.');
  if(!navigator.storage?.getDirectory||!navigator.locks)throw Error('Браузер не поддерживает необходимое хранилище OPFS и Web Locks. Используй Chrome или Edge.');
  const storage=await navigator.storage?.estimate?.();
  self.postMessage({ok:true,name:adapter.info?.description||adapter.info?.vendor||'Видеокарта доступна',maxBufferSize:Number(adapter.limits.maxBufferSize),storage:storage?{quota:storage.quota,usage:storage.usage}:null});
 }catch(error){self.postMessage({ok:false,error:error.message});}
};

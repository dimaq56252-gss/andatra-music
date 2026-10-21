export const MODEL_BYTES=5747730175;
export const STYLE_PROMPTS={boom:'boom bap, expressive soulful motif, dusty punchy drums, warm bass',trap:'melodic trap, deep 808 bass, crisp hats, dark spacious synth textures',gfunk:'West Coast G-funk, syncopated funk bass, warm analog synths, laid-back groove',cinematic:'cinematic hip hop, expressive strings, dramatic harmonic movement, deep rhythmic drums',lofi:'lo-fi hip hop, warm guitar and electric keys, relaxed drums, intimate atmosphere'};
export function generationOptions({style,bpm,description,duration},seed){
 const seconds=Number(duration),tempo=Number(bpm);
 if(![10,20,30,60,120].includes(seconds))throw Error('Выбери длительность от 10 секунд до 2 минут.');
 if(!Number.isFinite(tempo)||tempo<60||tempo>180)throw Error('Укажи темп от 60 до 180 BPM.');
 if(typeof description!=='string'||description.length>150)throw Error('Описание должно быть не длиннее 150 символов.');
 if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw Error('Некорректный номер варианта.');
 return {prompt:`Instrumental rap beat, ${STYLE_PROMPTS[style]||STYLE_PROMPTS.boom}, ${Math.round(tempo)} BPM. Expressive harmony, space for rap, contrasting verse and hook, evolving arrangement. No singing, speech, chants or vocal chops. ${description.trim()}`,bpm:Math.round(tempo),lyrics:'',writeLyrics:false,semanticPlanning:false,plannerQuality:'turbo',audioQuality:'standard',durationSeconds:seconds,seed};
}
export function validateResult(result,expectedDuration){
 if(!result?.instrumental||result.lyrics?.trim())throw Error('Результат не соответствует инструментальному режиму.');
 const b=result.audioBuffer;if(!b||b.numberOfChannels<1||!b.length||!Number.isFinite(b.sampleRate))throw Error('Модель не вернула аудио.');
 let energy=0,peak=0,count=0;
 for(let ch=0;ch<b.numberOfChannels;ch++)for(const value of b.getChannelData(ch)){if(!Number.isFinite(value))throw Error('Модель вернула повреждённый звук. Попробуй 10 секунд после перезагрузки страницы.');peak=Math.max(peak,Math.abs(value));energy+=value*value;count++;}
 const rms=Math.sqrt(energy/Math.max(1,count));
 if(peak<1e-5||rms<1e-6)throw Error('Модель вернула тишину. Попробуй другую пробу на 10 секунд.');
 if(peak>1.01)throw Error('У результата слишком высокий уровень. Этот вариант не сохранён.');
 if(!result.wav?.size||result.wav.type!=='audio/wav')throw Error('Модель не вернула WAV-файл.');
 const duration=b.length/b.sampleRate;if(Number.isFinite(expectedDuration)&&Math.abs(duration-expectedDuration)>Math.max(.15,expectedDuration*.01))throw Error('Модель вернула фрагмент неверной длины. Попробуй короткую пробу.');
 return {rms,peak,duration};
}
export function durationFits(seconds,limit){return Number.isFinite(limit)&&32*Math.ceil(Number(seconds)*25/2)**2*4<=limit;}

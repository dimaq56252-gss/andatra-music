const RAP=new Set(['rap','boom','trap','drill','lofi','bounce','phonk','rnb']);
export const CONCEPTS=[
 {name:'Гитарный рифф',lead:'nylon',chord:'pad',answer:'choir',bass:'round',kit:'classic',harmonicBars:2,chordEvery:2,comp:[0],length:8,noteLength:1,octave:3,density:[4,5],cells:[[0,6,12,20,26],[0,7,14,24]],contours:[[0,2,1,0],[0,4,2,0]],progressions:[[0,0,5,3],[0,3,0,4]],hat:[0,2,4,6,8,10,12,14],kick:[[0,6,8,14],[0,3,8,11]],snare:[4,12]},
 {name:'Рубленые клавиши',lead:'rhodes',chord:'mutedguitar',answer:'vibes',bass:'fingerbass',kit:'classic',harmonicBars:1,chordEvery:1,comp:[2,6,10,14],length:1.3,noteLength:.45,octave:3,density:[5,6],cells:[[2,5,10,18,22,28],[0,3,7,14,20,27]],contours:[[0,0,2,-1,0],[0,2,4,2,0]],progressions:[[0,5,1,4],[0,3,5,4]],hat:[2,6,10,14],kick:[[0,3,8,11],[0,6,10,14]],snare:[4,12]},
 {name:'Темная оркестровая тема',lead:'pizzicato',chord:'synthstrings',answer:'cello',bass:'808',kit:'trap',harmonicBars:4,chordEvery:4,comp:[0],length:14,noteLength:1.3,octave:3,density:[3,4],cells:[[0,12,26],[2,14,24,28]],contours:[[0,-1,-2,0],[0,4,2,0]],progressions:[[0,6,5,3],[0,0,3,0]],hat:[0,2,4,6,8,10,12,14,15],kick:[[0,7,10],[0,6,12]],snare:[8]},
 {name:'Синтезаторный фанк',lead:'analog',chord:'drawbar',answer:'sax',bass:'funk',kit:'electro',harmonicBars:1,chordEvery:1,comp:[0,6,10],length:2.2,noteLength:.7,octave:3,density:[5,6],cells:[[0,3,7,14,20,26],[2,6,11,18,23,28]],contours:[[0,4,2,-1,0],[0,-2,0,2,0]],progressions:[[0,3,4,0],[0,5,3,4]],hat:[2,6,10,14,15],kick:[[0,3,8,10,14],[0,6,8,11]],snare:[4,12]},
 {name:'Воздушная медленная тема',lead:'shimmer',chord:'choir',answer:'glass',bass:'round',kit:'trap',harmonicBars:4,chordEvery:4,comp:[0],length:15,noteLength:1.6,octave:4,density:[3,3],cells:[[0,14,26],[4,16,28]],contours:[[0,2,0],[0,-2,0]],progressions:[[0,5,2,4],[0,3,1,4]],hat:[0,4,8,12],kick:[[0,10],[0,7,12]],snare:[8]},
 {name:'Упругий ритмический плак',lead:'softpluck',chord:'fm',answer:'karplus',bass:'pulse',kit:'electro',harmonicBars:2,chordEvery:1,comp:[3,11],length:1.5,noteLength:.5,octave:4,density:[5,6],cells:[[2,6,11,18,22,28],[0,5,10,19,24,29]],contours:[[0,2,0,4,0],[0,-2,0,2,0]],progressions:[[0,2,5,4],[0,4,5,3]],hat:[0,2,6,8,10,14],kick:[[0,5,8,14],[0,6,10,15]],snare:[4,12]}
];
export function getConcept(s){
 if(!RAP.has(s.style))return null;
 const salt=[...s.style].reduce((n,c)=>n+c.charCodeAt(0),0);
 return CONCEPTS[((((s.seed||0)>>>0)+(s.variation||0)+salt)%CONCEPTS.length+CONCEPTS.length)%CONCEPTS.length];
}

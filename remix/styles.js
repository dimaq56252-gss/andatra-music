// Original rhythm and melody presets, authored for ANDATRA.
export const EXTRA_STYLES={
 boom:{name:'Boom bap · жёсткие барабаны',kit:'classic',kick:[0,6,8,11],snare:[4,12],clap:[],hat:[0,2,4,6,8,10,12,14],open:[15],bass:[0,6,8,11],swing:.16,instruments:['epiano','guitar','piano'],motif:[0,2,4,1,0,3,2,0],rhythm:[0,3,6,8,11,12,14,15],progression:[0,5,3,4]},
 bounce:{name:'West Coast / G-funk',kit:'classic',kick:[0,3,8,10,14],snare:[4,12],clap:[12],hat:[0,2,4,6,8,10,12,14],open:[7],bass:[0,3,6,8,10,14],swing:.12,instruments:['organ','guitar','epiano'],motif:[0,4,3,2,0,2,1,-1],rhythm:[0,2,5,7,8,10,13,15],progression:[0,3,4,0]},
 phonk:{name:'Phonk · тяжёлый бас',kit:'trap',kick:[0,3,7,8,11,14],snare:[4,12],clap:[4,12],hat:[0,2,4,6,8,10,12,14,15],open:[10],bass:[0,3,7,8,11,14],swing:.02,instruments:['epiano','organ','strings'],motif:[0,-1,0,2,1,0,-2,-1],rhythm:[0,2,4,7,8,10,12,15],progression:[0,0,5,4]},
 dnb:{name:'Drum & Bass · ломаный ритм',kit:'electro',kick:[0,6,10],snare:[4,12],clap:[],hat:[0,1,2,3,6,7,8,9,10,11,14,15],open:[2,10],bass:[0,3,6,8,10,15],swing:0,instruments:['pad','strings','epiano'],motif:[0,4,5,2,0,3,4,1],rhythm:[0,3,6,7,8,11,14,15],progression:[0,5,1,4]},
 techno:{name:'Techno · плотная бочка',kit:'electro',kick:[0,4,8,12],snare:[],clap:[4,12],hat:[2,6,10,14],open:[6,14],bass:[2,6,10,14],swing:0,instruments:['pad','organ','strings'],motif:[0,0,1,0,0,2,1,0],rhythm:[0,2,4,6,8,10,12,14],progression:[0,0,3,0]},
 reggaeton:{name:'Reggaeton · дембоу',kit:'classic',kick:[0,8],snare:[3,6,11,14],clap:[6,14],hat:[0,2,4,6,8,10,12,14],open:[7,15],bass:[0,6,8,14],swing:.02,instruments:['guitar','piano','epiano'],motif:[0,2,4,5,4,2,1,0],rhythm:[0,3,6,7,8,11,14,15],progression:[0,5,3,4]},
 afro:{name:'Afrobeats · перкуссия',kit:'classic',kick:[0,7,10],snare:[4,12],clap:[6,14],hat:[0,3,6,8,11,14],open:[15],bass:[0,3,7,10,14],swing:.08,instruments:['guitar','epiano','piano'],motif:[0,2,1,4,2,5,3,1],rhythm:[0,3,5,6,8,11,13,14],progression:[0,3,1,4]},
 rnb:{name:'R&B · мягкий грув',kit:'classic',kick:[0,7,10],snare:[4,12],clap:[],hat:[0,2,5,6,8,10,13,14],open:[],bass:[0,7,8,10],swing:.2,instruments:['epiano','guitar','strings'],motif:[0,2,4,6,5,3,2,0],rhythm:[0,3,6,7,8,11,13,15],progression:[0,5,1,4]}
};
export const STYLE_SOUNDS={rap:['epiano','guitar','piano'],trap:['strings','epiano','pad'],drill:['strings','piano','guitar'],lofi:['epiano','guitar','piano'],house:['organ','epiano','pad'],synth:['pad','strings','organ'],...Object.fromEntries(Object.entries(EXTRA_STYLES).map(([key,value])=>[key,value.instruments]))};
export const extraMelodies=Object.entries(EXTRA_STYLES).flatMap(([style,p])=>Array.from({length:12},(_,variant)=>({
 id:style+'-'+variant,style,genre:p.name,name:'Грув '+(variant+1),mode:'minor',instrument:p.instruments[variant%p.instruments.length],
 motif:p.motif.map((_,i)=>p.motif[(i+variant%4)%8]+(variant>=8&&i%3===0?-1:variant>=4&&i%3===1?1:0)),
 rhythm:p.rhythm.map((r,i)=>variant%3===1&&i%2===1?Math.min(15,r+1):variant%3===2&&i%2===0?Math.max(0,r-1):r),
 progression:variant%2?[p.progression[0],p.progression[2],p.progression[1],p.progression[3]]:p.progression
})));

// Compose against the current harmony, keeping the motif's contour and register.
export function fitThemeNote(target,chord,previous,strong){
 if(!strong)return previous===undefined?target:Math.max(previous-3,Math.min(previous+3,target));
 const candidates=[];for(let octave=-2;octave<=2;octave++)for(const tone of [0,2,4])candidates.push(chord+tone+octave*7);
 return candidates.sort((a,b)=>score(a)-score(b)||a-b)[0];
 function score(n){return Math.abs(n-target)+(previous===undefined?0:Math.abs(n-previous)*.28);}
}
export function isChordDegree(note,chord){return [0,2,4].includes(((note-chord)%7+7)%7);}

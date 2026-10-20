import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,musicInput} from '../netlify/functions/instrumentals.mjs';

test('text-only original instrumental requests, durations and fresh seeds',()=>{
 const input=musicInput({description:'Slow dark rap, guitar, 92 BPM',duration:120});
 assert.equal(input.instrumental,true);assert.equal(input.duration,120);
 assert.ok(!Object.keys(input).some(k=>/audio|url|lyric/.test(k)));
 assert.match(input.prompt,/No vocals/);assert.match(input.prompt,/Slow dark rap/);
 assert.ok(new Set(Array.from({length:10},()=>musicInput({description:'rap',duration:30}).seed)).size>1);
 assert.throws(()=>musicInput({description:'',duration:30}));
 assert.throws(()=>musicInput({description:'rap',duration:999}));
});
const settings={FAL_KEY:'provider-secret',BEAT_ACCESS_TOKEN:'private-generator-code'};
const req=(method,job,body,token=settings.BEAT_ACCESS_TOKEN)=>new Request('https://generator.example/.netlify/functions/instrumentals'+(job?'?job='+encodeURIComponent(job):''),{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('unconfigured and unauthorized calls cannot spend credits or expose keys',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('must not call');};
 const absent=createHandler({env:()=>undefined,fetcher});
 assert.equal((await absent(req('POST',null,{description:'rap',duration:30}))).status,503);
 const handler=createHandler({env:k=>settings[k],fetcher});
 assert.equal((await handler(req('POST',null,{description:'rap',duration:30},'bad'))).status,401);
 assert.equal(calls,0);
 const health=await handler(new Request('https://example/?action=health'));
 const text=await health.text();assert.ok(!text.includes(settings.FAL_KEY));assert.ok(!text.includes(settings.BEAT_ACCESS_TOKEN));
});
test('queue submission, signed receipts, correct status/result paths and download URL',async()=>{
 const calls=[];let progress=true;
 const fetcher=async(url,options)=>{
  calls.push({url,options});assert.equal(options.headers.authorization,'Key '+settings.FAL_KEY);
  if(options.method==='POST'){const input=JSON.parse(options.body);assert.equal(input.instrumental,true);return Response.json({request_id:'job-12345678'});}
  if(options.method==='PUT')return Response.json({status:'CANCELLATION_REQUESTED'});
  if(url.endsWith('/status'))return Response.json({status:progress?'IN_PROGRESS':'COMPLETED'});
  return Response.json({audio:{url:'https://v3.fal.media/files/new-beat.wav'},lyrics:'[inst]',seed:42});
 };
 const handler=createHandler({env:k=>settings[k],fetcher,now:()=>1000});
 const submitted=await handler(req('POST',null,{description:'rap',duration:30}));assert.equal(submitted.status,202);
 const {job}=await submitted.json();assert.ok(!job.includes(settings.FAL_KEY));
 assert.equal((await (await handler(req('GET',job))).json()).status,'IN_PROGRESS');
 progress=false;const result=await (await handler(req('GET',job))).json();assert.equal(result.status,'COMPLETED');assert.equal(result.seed,42);
 assert.ok(calls.some(c=>c.url==='https://queue.fal.run/fal-ai/ace-step/requests/job-12345678/status'));
 assert.ok(!calls.some(c=>c.url.includes('prompt-to-audio/requests')));
 assert.equal((await handler(req('GET',job+'tampered'))).status,400);
 assert.equal((await handler(req('DELETE',job))).status,200);
 assert.ok(calls.at(-1).url.endsWith('/cancel'));assert.equal(calls.at(-1).options.method,'PUT');
 const expired=createHandler({env:k=>settings[k],fetcher,now:()=>86402000});
 assert.equal((await expired(req('GET',job))).status,400);
});
test('rejects lyrics and untrusted audio URLs, propagates provider failures safely',async()=>{
 for(const result of [{lyrics:'a sung verse',audio:{url:'https://fal.media/beat.wav'}},{lyrics:'[inst]',audio:{url:'http://127.0.0.1/private'}}]){
  const fetcher=async(url,options)=>Response.json(options.method==='POST'?{request_id:'job-12345678'}:url.endsWith('/status')?{status:'COMPLETED'}:result);
  const handler=createHandler({env:k=>settings[k],fetcher});const {job}=await (await handler(req('POST',null,{description:'rap',duration:30}))).json();
  assert.equal((await handler(req('GET',job))).status,502);
 }
 const handler=createHandler({env:k=>settings[k],fetcher:async()=>new Response('private upstream detail',{status:402})});
 const response=await handler(req('POST',null,{description:'rap',duration:30}));const text=await response.text();
 assert.match(text,/Недостаточно/);assert.ok(!text.includes('private upstream detail'));
});

export const LIVE_SPEEDS=[.5,1,2,4,8];
export const LIVE_INTERVAL=200;
const keys=['attacks','dangerous','shots','onTarget','saves','goals'];
export function matchEnd(m){return m.extra?120:90;}
export function playbackDuration(matches){return Math.max(...matches.map(m=>matchEnd(m)+(m.penalties?(m.penalties.kicks?.length??10):0)));}
export function visibleMatch(m,minute){
 const end=matchEnd(m),events=(m.events??[]).filter(e=>e.minute<=minute);
 const frame=m.frames?.findLast(f=>f[0]<=minute),finished=minute>=end+(m.penalties?(m.penalties.kicks?.length??10):0);
 const result={...m,live:true,elapsed:Math.min(minute,end),finished,hg:events.filter(e=>e.team===m.home).length,ag:events.filter(e=>e.team===m.away).length,events,expectationAvailable:!!frame};
 delete result.penalties;delete result.extra;delete result.frames;
 if(frame){result.hg=frame[1];result.ag=frame[2];result.lambdaHome=frame[3];result.lambdaAway=frame[4];result.stats={home:Object.fromEntries(keys.map((k,i)=>[k,frame[5+i]])),away:Object.fromEntries(keys.map((k,i)=>[k,frame[11+i]]))};}
 else {delete result.stats;delete result.lambdaHome;delete result.lambdaAway;}
 if(minute>=end){result.hg=m.hg;result.ag=m.ag;if(m.extra)result.extra=m.extra;}
 if(m.penalties&&minute>end){const kicks=m.penalties.kicks?.slice(0,minute-end);if(kicks){const last=kicks.at(-1);result.penalties={home:last?.home??0,away:last?.away??0,kicks};}else if(finished)result.penalties=m.penalties;}
 return result;
}

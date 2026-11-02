import {profileForTeam} from './simulation-v6.js';
export const DRAW_INTERVAL={league:650,knockout:1100};
export const drawPending=t=>!!t?.draw&&!t.draw.done;
export function powersFor(t){return t.initialPowers??Object.fromEntries(t.teams.map(team=>[team.id,profileForTeam(team,t.simulationVersion??1).rating]));}
export function leagueDrawEntries(t){
 const potOf=new Map(t.pots.flatMap((ids,i)=>ids.map(id=>[id,i]))),entries=[];
 for(const team of t.teams.filter(t=>t.human)){
  const fixtures=t.weeks.flatMap((week,i)=>week.filter(m=>m.home===team.id||m.away===team.id).map(m=>({team:team.id,opponent:m.home===team.id?m.away:m.home,home:m.home===team.id,week:i+1,pot:potOf.get(m.home===team.id?m.away:m.home)})));
  entries.push(...fixtures.sort((a,b)=>a.pot-b.pot||a.week-b.week));
 }return entries;
}
export function drawComparison(t,revealed=Infinity){
 const powers=powersFor(t),entries=leagueDrawEntries(t).map((entry,i)=>({...entry,revealed:i<revealed}));
 return t.teams.filter(team=>team.human).map(team=>{const fixtures=entries.filter(e=>e.team===team.id),known=fixtures.filter(e=>e.revealed);return {team,fixtures,difficulty:known.length?known.reduce((s,e)=>s+powers[e.opponent],0)/known.length:null};}).sort((a,b)=>(b.difficulty??-Infinity)-(a.difficulty??-Infinity)||a.team.id.localeCompare(b.team.id));
}
export function createDraw(t,kind){return {kind,stage:t.stage,revealed:0,total:kind==='league'?t.teams.filter(x=>x.human).length*8:t.bracket.at(-1).ties.length*2,done:false};}

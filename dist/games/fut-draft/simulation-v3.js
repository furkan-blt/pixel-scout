import {expectedGoals as legacyExpectedGoals,teamProfile as legacyProfile} from './simulation.js';
// Design constants for this game; not player attributes or real-world predictions.
export const SIMULATION_VERSION=3;
export const MODEL=Object.freeze({elite:.15,clubChemistry:2.6,nationChemistry:1.6,spreadAllowance:4,spreadWeight:.16,rangeAllowance:14,rangeWeight:.015,maxBalancePenalty:1});
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const known=v=>v!==null&&v!==undefined&&v!=='';
function chemistry(roster,key){return mean(roster.map(p=>!known(p[key])?0:Math.min(3,roster.filter(q=>q.id!==p.id&&q[key]===p[key]).length)/3));}
export function teamProfile(roster,version=3,{clubEligible=true}={}){
  if(version<3)return legacyProfile(roster);
  if(roster.length!==11)throw new Error('Takım gücü için 11 futbolcu gerekli.');
  const values=roster.map(p=>p.overall),overall=mean(values),deviation=Math.sqrt(mean(values.map(v=>(v-overall)**2)));
  const range=Math.max(...values)-Math.min(...values),eliteCount=values.filter(v=>v>=85).length,eliteBonus=eliteCount*MODEL.elite;
  const clubChemistry=chemistry(roster,'clubId'),nationChemistry=chemistry(roster,'country');
  const clubBonus=(clubEligible?clubChemistry:0)*MODEL.clubChemistry,nationBonus=nationChemistry*MODEL.nationChemistry;
  const balancePenalty=Math.min(MODEL.maxBalancePenalty,Math.max(0,deviation-MODEL.spreadAllowance)*MODEL.spreadWeight+Math.max(0,range-MODEL.rangeAllowance)*MODEL.rangeWeight);
  const lines=Object.fromEntries(['GK','DEF','MID','ATT'].map(pos=>[pos,mean(roster.filter(p=>p.position===pos).map(p=>p.overall))]));
  // A weak footballer primarily affects their own line.
  const lineQuality=Object.fromEntries(['GK','DEF','MID','ATT'].map(pos=>{const v=roster.filter(p=>p.position===pos).map(p=>p.overall);return [pos,mean(v)*.86+Math.min(...v)*.14];}));
  return {overall,eliteCount,eliteBonus,deviation,range,clubChemistry,nationChemistry,clubBonus,nationBonus,balancePenalty,clubEligible,rating:overall+eliteBonus+clubBonus+nationBonus-balancePenalty,lines,lineQuality};
}
export const profileForTeam=(team,version=3)=>teamProfile(team.roster,version,{clubEligible:team.human===true});

// Freeze the table before a matchday; never use later matches' outcomes.
export function qualificationRisk(table,id,played){
  const index=table.findIndex(r=>r.id===id),row=table[index],remaining=8-played;
  if(!row||table.length!==36||remaining<=0||played<3)return {risk:0,reason:'normal',needsWin:false};
  const cutoff=table[23].pts,challengers=table.filter(r=>r.id!==id&&r.pts+3*remaining>=row.pts).length;
  if(challengers<24)return {risk:0,reason:'qualified',needsWin:false};
  if(row.pts+3*remaining<cutoff)return {risk:0,reason:'eliminated',needsWin:false};
  const gap=cutoff-row.pts,urgency=clamp((played-2)/5,0,1);
  if(index>=24){const needsWin=remaining===1&&row.pts+1<cutoff;return {risk:clamp(.24+.40*urgency+Math.max(0,gap)*.055+(needsWin?.20:0),0,.95),reason:needsWin?'must-win':'chasing-24',needsWin};}
  if(row.pts-cutoff<=3)return {risk:.08+.18*urgency,reason:'at-risk',needsWin:false};
  return {risk:.02,reason:'protect-position',needsWin:false};
}
export function tacticalRisk(plan={},ownGoals=0,otherGoals=0,minute=0){
  let risk=plan.risk??0;
  if(minute>=60){if(ownGoals<otherGoals)risk+=.25+(minute-60)/30*.15;else if(ownGoals===otherGoals&&plan.needsWin)risk+=.25;else if(ownGoals>otherGoals)risk=risk*.35-.06;}
  return clamp(risk,0,.95);
}
export function opportunityRates(h,a,neutral=false,{homeRisk=0,awayRisk=0,tempo=1}={}){
  const hl=h.lineQuality,al=a.lineQuality,gap=h.rating-a.rating;
  function side(own,other,delta,chem,risk,opponentRisk,home){return {
    entry:clamp((.66+(own.MID-other.MID)*.011+delta*.003+(home?.035:0)+risk*.065+opponentRisk*.035)*tempo,.18,.94),
    dangerous:clamp(.56+(own.ATT-other.DEF)*.013+chem*.003+opponentRisk*.10,.25,.84),
    shot:clamp(.86+(own.MID-other.DEF)*.002+risk*.02,.68,.95),
    conversion:clamp(.245+(own.ATT-other.GK)*.01+chem*.002,.10,.43),
  };}
  return {home:side(hl,al,gap,h.clubBonus+h.nationBonus,homeRisk,awayRisk,!neutral),away:side(al,hl,-gap,a.clubBonus+a.nationBonus,awayRisk,homeRisk,false)};
}
export function expectedGoals(home,away,neutral=false,version=3,context={}){
  if(version<3)return legacyExpectedGoals(home,away,neutral,version);
  const h=profileForTeam(home),a=profileForTeam(away),r=opportunityRates(h,a,neutral,{homeRisk:context.home?.risk??0,awayRisk:context.away?.risk??0});
  const goals=p=>18*p.entry*p.dangerous*p.shot*p.conversion;
  return {lambdaHome:goals(r.home),lambdaAway:goals(r.away),homePower:h.rating,awayPower:a.rating,modelVersion:3};
}
export function simulateOpportunities(next,home,away,neutral=false,context={},duration=90,startMinute=0){
  const hp=profileForTeam(home),ap=profileForTeam(away),tempo=.84+(next()+next())*.16;
  const stats=()=>({attacks:0,dangerous:0,shots:0,goals:0});
  const result={home:home.id,away:away.id,neutral,hg:0,ag:0,lambdaHome:0,lambdaAway:0,homePower:hp.rating,awayPower:ap.rating,modelVersion:3,tempo,stats:{home:stats(),away:stats()},events:[],tactics:{home:context.home??{risk:0,reason:'normal'},away:context.away??{risk:0,reason:'normal'},maxHomeRisk:0,maxAwayRisk:0}};
  for(let minute=startMinute;minute<startMinute+duration;minute+=5){
    const hs=(context.initialHome??0)+(context.aggregateHome??0)+result.hg,as=(context.initialAway??0)+(context.aggregateAway??0)+result.ag;
    const hr=tacticalRisk(context.home,hs,as,minute),ar=tacticalRisk(context.away,as,hs,minute);
    result.tactics.maxHomeRisk=Math.max(result.tactics.maxHomeRisk,hr);result.tactics.maxAwayRisk=Math.max(result.tactics.maxAwayRisk,ar);
    // Both sides react to the same score snapshot in each interval.
    const rates=opportunityRates(hp,ap,neutral,{homeRisk:hr,awayRisk:ar,tempo});
    for(const side of ['home','away']){
      const r=rates[side],s=result.stats[side];result[side==='home'?'lambdaHome':'lambdaAway']+=r.entry*r.dangerous*r.shot*r.conversion;
      if(next()>=r.entry)continue;s.attacks++;
      if(next()>=r.dangerous)continue;s.dangerous++;
      if(next()>=r.shot)continue;s.shots++;
      if(next()>=r.conversion)continue;s.goals++;result[side==='home'?'hg':'ag']++;
      result.events.push({minute:minute+1+Math.floor(next()*5),team:side==='home'?home.id:away.id});
    }
  }
  result.events.sort((a,b)=>a.minute-b.minute);return result;
}

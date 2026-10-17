import {expectedGoals as oldExpected,profileForTeam as oldTeamProfile,teamProfile as oldProfile,tacticalRisk,qualificationRisk} from './simulation-v3.js';
import {ATTRIBUTE_KEYS,PLAYER_ATTRIBUTES} from './player-attributes.js';
import {TEMPOS,DEFAULT_PLAN} from './match-plans.js';
export {qualificationRisk};
export const SIMULATION_VERSION=4;
export const MODEL=Object.freeze({elite:.15,humanClubChemistry:4,humanNationChemistry:2.5,botNationChemistry:1.6,maxBalancePenalty:1});
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const column=Object.fromEntries(ATTRIBUTE_KEYS.map((key,i)=>[key,i]));
function attribute(player,key){const n=PLAYER_ATTRIBUTES[player.id]?.[column[key]];return Number.isFinite(n)?n:player.overall;}
export function attributeCoverage(roster){return roster.filter(p=>PLAYER_ATTRIBUTES[p.id]).length/roster.length;}
export function teamProfile(roster,version=4,{clubEligible=true,nationBoost=clubEligible}={}){
  if(version<4)return oldProfile(roster,version,{clubEligible});
  const base=oldProfile(roster,3,{clubEligible});
  const clubBonus=clubEligible?base.clubChemistry*MODEL.humanClubChemistry:0,nationBonus=base.nationChemistry*(nationBoost?MODEL.humanNationChemistry:MODEL.botNationChemistry);
  const group=pos=>roster.filter(p=>p.position===pos);
  const weighted=(players,keys)=>mean(players.map(p=>keys.reduce((sum,[key,w])=>sum+attribute(p,key)*w,0)));
  const outfield=roster.filter(p=>p.position!=='GK');
  const attributes={
    finishing:weighted(group('ATT'),[['finishing',.5],['positioning',.2],['composure',.15],['shotPower',.15]]),
    passing:weighted(group('MID'),[['shortPassing',.45],['vision',.30],['ballControl',.25]]),
    defending:weighted(group('DEF'),[['defensiveAwareness',.4],['interceptions',.3],['standingTackle',.3]]),
    keeping:weighted(group('GK'),[['gkReflexes',.35],['gkPositioning',.25],['gkHandling',.25],['gkDiving',.15]]),
    attackingPace:weighted(group('ATT'),[['sprintSpeed',1]]),defensivePace:weighted(group('DEF'),[['sprintSpeed',1]]),
    stamina:weighted(outfield,[['stamina',1]]),
    penalties:mean(outfield.map(p=>attribute(p,'penalties')).sort((a,b)=>b-a).slice(0,5)),
  };
  return {...base,clubBonus,nationBonus,rating:base.overall+base.eliteBonus+clubBonus+nationBonus-base.balancePenalty,attributes,attributeCoverage:attributeCoverage(roster),clubEligible};
}
export function profileForTeam(team,version=4){return version<4?oldTeamProfile(team,version):teamProfile(team.roster,4,{clubEligible:team.human===true,nationBoost:team.human===true});}
export function fatigue(profile,plan=DEFAULT_PLAN,minute=0){return clamp(minute/90*(100-profile.attributes.stamina)/100*4.5*(plan.style==='press'?1.6:plan.style==='counter'?.85:1)*(TEMPOS[plan.tempo]?.load??1),0,4);}
const normalized=plan=>({tempo:TEMPOS[plan?.tempo]?plan.tempo:'normal',style:['balanced','press','counter'].includes(plan?.style)?plan.style:'balanced'});
export function opportunityRates(home,away,neutral=false,{homeRisk=0,awayRisk=0,ambient=1,homePlan=DEFAULT_PLAN,awayPlan=DEFAULT_PLAN,minute=0}={}){
  const hp=normalized(homePlan),ap=normalized(awayPlan),gap=home.rating-away.rating;
  function signals(p,plan){const tired=fatigue(p,plan,minute);return {mid:p.lineQuality.MID*.65+p.attributes.passing*.35-tired,attack:p.lineQuality.ATT*.65+p.attributes.finishing*.35-tired,defense:p.lineQuality.DEF*.65+p.attributes.defending*.35-tired,keeper:p.lineQuality.GK*.55+p.attributes.keeping*.45};}
  const hs=signals(home,hp),as=signals(away,ap);
  function side(own,opponent,p,other,plan,otherPlan,delta,risk,otherRisk,isHome){
    const press=plan.style==='press',counter=plan.style==='counter',otherPress=otherPlan.style==='press',otherCounter=otherPlan.style==='counter';
    const chemistry=p.clubBonus+p.nationBonus;
    const speedEdge=clamp((p.attributes.attackingPace-other.attributes.defensivePace)*.003,-.035,.045);
    const vulnerability=(otherPress?.045:0)+(otherPlan.tempo==='high'?.015:0);
    return {
      entry:clamp((.70+(own.mid-opponent.mid)*.008+delta*.012+(isHome?.025:0)+risk*.04+otherRisk*.025+(press?.045:counter?-.05:0))*TEMPOS[plan.tempo].volume*ambient/5,.025,.30),
      dangerous:clamp(.55+(own.attack-opponent.defense)*.012+delta*.006+otherRisk*.09+vulnerability+(counter?.02+(otherPress?.04:0)+speedEdge:0)-(otherCounter?.025:0),.20,.86),
      shot:clamp(.84+(own.mid-opponent.defense)*.0015+(press?.015:0),.64,.95),
      onTarget:clamp(.58+(own.attack-opponent.defense)*.004+chemistry*.001,.34,.83),
      conversion:clamp(.39+(own.attack-opponent.keeper)*.010+delta*.004+chemistry*.0015+(counter&&otherPress?.015:0),.12,.68),
    };
  }
  return {home:side(hs,as,home,away,hp,ap,gap,homeRisk,awayRisk,!neutral),away:side(as,hs,away,home,ap,hp,-gap,awayRisk,homeRisk,false)};
}
export function expectedGoals(home,away,neutral=false,version=4,context={}){
  if(version<4)return oldExpected(home,away,neutral,version,context);
  const h=profileForTeam(home),a=profileForTeam(away),r=opportunityRates(h,a,neutral,{homeRisk:context.home?.risk??0,awayRisk:context.away?.risk??0,homePlan:context.homePlan,awayPlan:context.awayPlan});
  const goals=x=>90*x.entry*x.dangerous*x.shot*x.onTarget*x.conversion;
  return {lambdaHome:goals(r.home),lambdaAway:goals(r.away),homePower:h.rating,awayPower:a.rating,modelVersion:4};
}
export function simulateOpportunities(next,home,away,neutral=false,context={},duration=90,startMinute=0){
  const h=profileForTeam(home),a=profileForTeam(away),ambient=.965+(next()+next())*.035;
  const homePlan=normalized(context.homePlan),awayPlan=normalized(context.awayPlan);
  const stats=()=>({attacks:0,dangerous:0,shots:0,onTarget:0,saves:0,goals:0});
  const m={home:home.id,away:away.id,neutral,hg:0,ag:0,lambdaHome:0,lambdaAway:0,homePower:h.rating,awayPower:a.rating,modelVersion:4,tempo:ambient*(TEMPOS[homePlan.tempo].volume+TEMPOS[awayPlan.tempo].volume)/2,ambient,plans:{home:homePlan,away:awayPlan},stats:{home:stats(),away:stats()},events:[],tactics:{home:context.home??{risk:0,reason:'normal'},away:context.away??{risk:0,reason:'normal'},maxHomeRisk:0,maxAwayRisk:0}};
  for(let minute=startMinute;minute<startMinute+duration;minute++){
    const hs=(context.initialHome??0)+(context.aggregateHome??0)+m.hg,as=(context.initialAway??0)+(context.aggregateAway??0)+m.ag;
    const hr=tacticalRisk(context.home,hs,as,minute),ar=tacticalRisk(context.away,as,hs,minute);
    m.tactics.maxHomeRisk=Math.max(m.tactics.maxHomeRisk,hr);m.tactics.maxAwayRisk=Math.max(m.tactics.maxAwayRisk,ar);
    const rates=opportunityRates(h,a,neutral,{homeRisk:hr,awayRisk:ar,ambient,homePlan,awayPlan,minute});
    for(const side of ['home','away']){
      const r=rates[side],s=m.stats[side],opponent=m.stats[side==='home'?'away':'home'];
      m[side==='home'?'lambdaHome':'lambdaAway']+=r.entry*r.dangerous*r.shot*r.onTarget*r.conversion;
      if(next()>=r.entry)continue;s.attacks++;
      if(next()>=r.dangerous)continue;s.dangerous++;
      if(next()>=r.shot)continue;s.shots++;
      if(next()>=r.onTarget)continue;s.onTarget++;
      if(next()>=r.conversion){opponent.saves++;continue;}
      s.goals++;m[side==='home'?'hg':'ag']++;m.events.push({minute:minute+1,team:side==='home'?home.id:away.id});
    }
  }
  m.events.sort((x,y)=>x.minute-y.minute);return m;
}
export function penaltyProbability(team,opponent){const own=profileForTeam(team),other=profileForTeam(opponent);return clamp(.75+(own.attributes.penalties-other.attributes.keeping)*.004,.58,.90);}

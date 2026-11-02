import {profileForTeam as previousProfile,teamProfile as previousTeamProfile,opportunityRates as previousRates,penaltyProbability,qualificationRisk} from './simulation-v4.js';
import {tacticalRisk} from './simulation-v3.js';
import {PLAYER_ATTRIBUTES,ATTRIBUTE_KEYS} from './player-attributes.js';
import {DEFAULT_PLAN,TEMPOS} from './match-plans.js';
export {penaltyProbability,qualificationRisk};
export const SIMULATION_VERSION=5;
export const MODEL=Object.freeze({powerWeight:.80,featureWeight:.20,finishingFormMin:.65,finishingFormMax:1.35});
export const profileForTeam=(team,version=5)=>previousProfile(team,version>=5?4:version);
export const teamProfile=(roster,version=5,options)=>previousTeamProfile(roster,version>=5?4:version,options);
const normalized=p=>({tempo:TEMPOS[p?.tempo]?p.tempo:'normal',style:['balanced','press','counter'].includes(p?.style)?p.style:'balanced'});
function blended(profile){
  const mix=x=>profile.rating*MODEL.powerWeight+x*MODEL.featureWeight;
  return {...profile,lineQuality:Object.fromEntries(Object.entries(profile.lineQuality).map(([k,v])=>[k,mix(v)])),attributes:{...profile.attributes,passing:mix(profile.attributes.passing),finishing:mix(profile.attributes.finishing),defending:mix(profile.attributes.defending),keeping:mix(profile.attributes.keeping)}};
}
export function opportunityRates(home,away,neutral=false,options={}){return blendedRates(blended(home),blended(away),neutral,options);}
function blendedRates(home,away,neutral=false,options={}){
  const r=previousRates(home,away,neutral,options),gap=home.rating-away.rating;
  r.home.entry=Math.min(.30,r.home.entry*Math.exp(gap*.035));r.away.entry=Math.min(.30,r.away.entry*Math.exp(-gap*.035));
  for(const side of ['home','away']){const x=r[side],chance=x.entry*x.dangerous*x.shot*x.onTarget*x.conversion;if(chance>4.2/90)x.conversion*=4.2/90/chance;}
  return r;
}
export function expectedGoals(home,away,neutral=false,version=5,context={}){
  const h=profileForTeam(home),a=profileForTeam(away),r=opportunityRates(h,a,neutral,{homeRisk:context.home?.risk??0,awayRisk:context.away?.risk??0,homePlan:context.homePlan,awayPlan:context.awayPlan});
  const goals=x=>90*x.entry*x.dangerous*x.shot*x.onTarget*x.conversion;
  return {lambdaHome:goals(r.home),lambdaAway:goals(r.away),homePower:h.rating,awayPower:a.rating,modelVersion:5};
}
const finishingIndex=ATTRIBUTE_KEYS.indexOf('finishing'),positioningIndex=ATTRIBUTE_KEYS.indexOf('positioning');
export function selectScorer(next,team){
  const weights=team.roster.map(p=>{const finishing=PLAYER_ATTRIBUTES[p.id]?.[finishingIndex]??p.overall,positioning=PLAYER_ATTRIBUTES[p.id]?.[positioningIndex]??p.overall;return (p.position==='ATT'?6:p.position==='MID'?2:p.position==='DEF'?.45:.005)*Math.max(1,finishing*.65+positioning*.35);});
  let draw=next()*weights.reduce((s,n)=>s+n,0);for(let i=0;i<weights.length;i++){draw-=weights[i];if(draw<0)return {playerId:team.roster[i].id,playerName:team.roster[i].name};}const p=team.roster.at(-1);return {playerId:p.id,playerName:p.name};
}
export function simulateOpportunities(next,home,away,neutral=false,context={},duration=90,startMinute=0){
  const h=profileForTeam(home),a=profileForTeam(away),bh=blended(h),ba=blended(a),homePlan=normalized(context.homePlan),awayPlan=normalized(context.awayPlan);
  const stats=()=>({attacks:0,dangerous:0,shots:0,onTarget:0,saves:0,goals:0});
  // Randomized rounding of a bounded goal budget replaces independent goal trials.
  // The displayed expectation stays separate from this finishing variation.
  const forms={home:.65+(next()+next())*.35,away:.65+(next()+next())*.35};
  const thresholds={home:next(),away:next()},budgets={home:0,away:0};
  const m={home:home.id,away:away.id,neutral,hg:0,ag:0,lambdaHome:0,lambdaAway:0,homePower:h.rating,awayPower:a.rating,modelVersion:5,ambient:1,tempo:(TEMPOS[homePlan.tempo].volume+TEMPOS[awayPlan.tempo].volume)/2,plans:{home:homePlan,away:awayPlan},stats:{home:stats(),away:stats()},events:[],tactics:{home:context.home??{risk:0,reason:'normal'},away:context.away??{risk:0,reason:'normal'},maxHomeRisk:0,maxAwayRisk:0},finishingForm:forms};
  for(let minute=startMinute;minute<startMinute+duration;minute++){
    const hs=(context.initialHome??0)+(context.aggregateHome??0)+m.hg,as=(context.initialAway??0)+(context.aggregateAway??0)+m.ag;
    const hr=tacticalRisk(context.home,hs,as,minute),ar=tacticalRisk(context.away,as,hs,minute);m.tactics.maxHomeRisk=Math.max(m.tactics.maxHomeRisk,hr);m.tactics.maxAwayRisk=Math.max(m.tactics.maxAwayRisk,ar);
    const rates=blendedRates(bh,ba,neutral,{homeRisk:hr,awayRisk:ar,homePlan,awayPlan,minute});
    for(const side of ['home','away']){
      const r=rates[side],s=m.stats[side],other=m.stats[side==='home'?'away':'home'];
      const chance=r.entry*r.dangerous*r.shot*r.onTarget*r.conversion;
      m[side==='home'?'lambdaHome':'lambdaAway']+=chance;budgets[side]+=chance*forms[side];
      if(budgets[side]>=thresholds[side]){
        thresholds[side]++;s.attacks++;s.dangerous++;s.shots++;s.onTarget++;s.goals++;m[side==='home'?'hg':'ag']++;
        const team=side==='home'?home:away;m.events.push({minute:minute+1,team:team.id,...selectScorer(next,team)});continue;
      }
      // Non-scoring opportunities provide the timeline's remaining shot/save stats.
      if(next()>=r.entry*(1-r.dangerous*r.shot*r.onTarget*r.conversion))continue;s.attacks++;
      if(next()>=r.dangerous)continue;s.dangerous++;if(next()>=r.shot)continue;s.shots++;if(next()>=r.onTarget)continue;s.onTarget++;other.saves++;
    }
  }
  m.events.sort((x,y)=>x.minute-y.minute);return m;
}

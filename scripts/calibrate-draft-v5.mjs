import fs from 'node:fs';
import {createGame,createTournament,transition,activeSeat,LIMITS,simulateMatch,computerTeams,profileForTeam,standings} from '../dist/games/fut-draft/rules.js';
import {pendingMatchPlans} from '../dist/games/fut-draft/match-plans.js';
import {pendingUpgrades,upgradeOptions} from '../dist/games/fut-draft/upgrades.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
const clubs=computerTeams(data),paris=clubs.find(t=>t.clubId===73),united=clubs.find(t=>t.clubId===11);
const positions=['GK',...Array(4).fill('DEF'),...Array(3).fill('MID'),...Array(3).fill('ATT')];
const synthetic=(id,rating)=>({id,human:false,roster:positions.map((position,i)=>({id:9000000+i,name:`P${i}`,position,overall:rating,clubId:4,country:'Türkiye'}))});
const pairs=[];
for(const [label,h,a] of [['Paris–United',paris,united],['Equal power',synthetic('h',83),synthetic('a',83)],['2.4 power gap',synthetic('h',83),synthetic('a',80.6)]])for(const version of [4,5]){
 const rng={rng:0x9e3779b9};let wins=0,draws=0,losses=0,largeMargins=0,goals=0,deviation=0,threeGoalXgMiss=0;
 for(let i=0;i<10000;i++){const m=simulateMatch(rng,h,a,true,version);wins+=m.hg>m.ag;losses+=m.hg<m.ag;draws+=m.hg===m.ag;largeMargins+=Math.abs(m.hg-m.ag)>=3;goals+=m.hg+m.ag;deviation+=Math.abs(m.hg-m.lambdaHome)+Math.abs(m.ag-m.lambdaAway);threeGoalXgMiss+=Math.max(Math.abs(m.hg-m.lambdaHome),Math.abs(m.ag-m.lambdaAway))>=3;}
 pairs.push({label,version,matches:10000,winPercent:wins/100,drawPercent:draws/100,lossPercent:losses/100,threePlusMarginPercent:largeMargins/100,meanGoals:goals/10000,meanAbsoluteGoalsVsExpectationError:deviation/20000,threePlusGoalsVsExpectationErrorPercent:threeGoalXgMiss/100});
}
let base=createGame(['Draft A','Draft B','Draft C'],undefined,97231);
while(base.phase==='draft'){const t=base.teams[activeSeat(base)],position=Object.keys(LIMITS).find(p=>t.roster.filter(x=>x.position===p).length<LIMITS[p]);base=transition(base,data,{type:'open',position,joker:t.joker});base=transition(base,data,{type:'pick',id:[...base.pack.options].sort((a,b)=>b.overall-a.overall)[0].id});}
const cups=[];
for(const version of [4,5]){
 let rankError=0,rho=0,matches=0,goals=0,threeMargins=0,upgrades=0;const champions={};
 for(let i=0;i<100;i++){
  let s=structuredClone(base);s.rng=((0x9e3779b9^Math.imul(i+1,2654435761))>>>0)||1;s.phase='tournament';s.tournament=createTournament(s,data,{version,upgradePolicy:1});
  const ranking=[...s.tournament.teams].sort((a,b)=>profileForTeam(b,version).rating-profileForTeam(a,version).rating||a.id.localeCompare(b.id)).map(t=>t.id);
  while(s.tournament.stage!=='done'){
   for(const t of pendingUpgrades(s.tournament)){const options=upgradeOptions(s,data,t.id);if(!options.length){s=transition(s,data,{type:'upgrade-skip',team:t.id});continue;}const old=[...options].sort((a,b)=>a.overall-b.overall)[0];s=transition(s,data,{type:'upgrade-open',team:t.id,player:old.id});const pack=s.tournament.upgrades[s.tournament.stage][t.id].pack;s=transition(s,data,{type:'upgrade-pick',team:t.id,id:[...pack.options].sort((a,b)=>b.overall-a.overall)[0].id});upgrades++;}
   for(const t of pendingMatchPlans(s.tournament))s=transition(s,data,{type:'match-plan',team:t.id,tempo:'normal',style:'balanced'});
   s=transition(s,data,{type:'simulate'});
  }
  const table=standings(s.tournament);let squared=0;for(let j=0;j<36;j++){const delta=j-ranking.indexOf(table[j].id);rankError+=Math.abs(delta);squared+=delta*delta;}rho+=1-6*squared/(36*(36*36-1));
  const champion=s.tournament.teams.find(t=>t.id===s.tournament.champion).name;champions[champion]=(champions[champion]??0)+1;
  for(const m of s.tournament.history.flatMap(h=>h.matches)){matches++;goals+=m.hg+m.ag;threeMargins+=Math.abs(m.hg-m.ag)>=3;}
 }
 cups.push({version,cups:100,matches,meanGoals:goals/matches,threePlusMarginPercent:threeMargins/matches*100,meanAbsoluteLeagueRankError:rankError/(100*36),meanSpearmanPowerVsLeagueRanking:rho/100,upgrades,champions});console.log(`Model ${version}: 100 cups complete`);
}
const report={description:'Game design calibration, not real-world probabilities. Same three-user highest-OVR draft and same seed set per model, steals skipped. V5 rewards choose lowest eligible outgoing player and highest OVR from the opened pack; human plans normal/balanced. Initial power ranking is frozen before all upgrades; league table uses eight games per team. Knockout scores include extra time.',pairs,cups};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('../research/fut-draft-balance-v5.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));

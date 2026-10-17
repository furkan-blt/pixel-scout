import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createGame,transition,activeSeat,LIMITS,createTournament,computerTeams,simulateMatch,profileForTeam} from '../dist/games/fut-draft/rules.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
const clubs=computerTeams(data,{legacy:true}),psg=clubs.find(t=>t.name==='Paris SG'),utd=clubs.find(t=>t.name==='Man Utd');
const comparisons=[];
for(const version of [1,2,3]){
  const rng={rng:0x9e3779b9};let wins=0,draws=0,losses=0,goals=0,large=0;
  for(let i=0;i<20000;i++){const m=simulateMatch(rng,psg,utd,true,version);if(m.hg>m.ag)wins++;else if(m.hg<m.ag)losses++;else draws++;goals+=m.hg+m.ag;if(m.hg+m.ag>=8)large++;}
  comparisons.push({version,games:20000,strongWinPercent:wins/200,drawPercent:draws/200,underdogWinPercent:losses/200,meanGoals:goals/20000,eightPlusGoalsPercent:large/200});
}
let base=createGame(['Draft A','Draft B','Draft C'],undefined,97231);
while(base.phase==='draft'){
  const t=base.teams[activeSeat(base)],position=Object.keys(LIMITS).find(p=>t.roster.filter(x=>x.position===p).length<LIMITS[p]);
  base=transition(base,data,{type:'open',position,joker:t.joker});
  const best=[...base.pack.options].sort((a,b)=>b.overall-a.overall)[0];base=transition(base,data,{type:'pick',id:best.id});
}
const cups=200,champions={},scoreCounts={},tacticalCounts={},gapBins={};let totalMatches=0,totalGoals=0,extraTime=0;
for(let i=0;i<cups;i++){
  let s=structuredClone(base);s.rng=((0x9e3779b9^Math.imul(i+1,2654435761))>>>0)||1;s.phase='tournament';s.tournament=createTournament(s,data,{version:3,legacyClubPool:true});
  while(s.tournament.stage!=='done')s=transition(s,data,{type:'simulate'});
  const t=s.tournament,name=t.teams.find(x=>x.id===t.champion).name;champions[name]=(champions[name]||0)+1;
  for(const m of t.history.flatMap(w=>w.matches)){
    totalMatches++;totalGoals+=m.hg+m.ag;if(m.extra)extraTime++;
    const key=`${m.hg}-${m.ag}`;scoreCounts[key]=(scoreCounts[key]||0)+1;
    for(const side of ['home','away']){const r=m.tactics[side].reason;tacticalCounts[r]=(tacticalCounts[r]||0)+1;}
    const gap=Math.abs(m.homePower-m.awayPower),bin=gap<2?'0–2':gap<5?'2–5':gap<8?'5–8':'8+';
    gapBins[bin]??={matches:0,strongWins:0,draws:0,weakWins:0};gapBins[bin].matches++;
    if(m.hg===m.ag)gapBins[bin].draws++;else if((m.hg>m.ag)===(m.homePower>m.awayPower))gapBins[bin].strongWins++;else gapBins[bin].weakWins++;
  }
  if((i+1)%50===0)console.log(`Completed ${i+1}/${cups} cups`);
}
const report={description:'Game-design validation only, not real-world odds. Pair experiments are neutral. 200 full cups reuse one seeded 3-user draft, choosing highest OVR per pack and skipping steals; fixture/match seeds vary. Cup score counts include extra time.',comparisons,cups:{count:cups,matches:totalMatches,meanGoals:totalGoals/totalMatches,extraTimeMatches:extraTime,champions:Object.fromEntries(Object.entries(champions).sort((a,b)=>b[1]-a[1])),tacticalCounts,gapBins,mostCommonScores:Object.entries(scoreCounts).sort((a,b)=>b[1]-a[1]).slice(0,15)},teams:[psg,utd,...base.teams.map(t=>({...t,human:true}))].map(t=>({name:t.name,human:t.human,profile:profileForTeam(t,3)}))};
if(process.argv.includes('--write'))fs.writeFileSync(fileURLToPath(new URL('../research/fut-draft-balance-v3.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({comparisons,cups:report.cups},null,2));

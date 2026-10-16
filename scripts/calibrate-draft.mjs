import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {computerTeams,simulateMatch,teamProfile} from '../dist/games/fut-draft/rules.js';
const catalogue=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
const teams=computerTeams(catalogue),strong=teams.find(t=>t.name==='Paris SG'),underdog=teams.find(t=>t.name==='Man Utd');
const runs=20000;
const comparisons=[1,2].map(version=>{
  const seed={rng:0x9e3779b9};let wins=0,draws=0,losses=0,homeGoals=0,awayGoals=0;
  for(let i=0;i<runs;i++){
    const match=simulateMatch(seed,strong,underdog,true,version);
    homeGoals+=match.hg;awayGoals+=match.ag;
    if(match.hg>match.ag)wins++;else if(match.hg===match.ag)draws++;else losses++;
  }
  return {version,runs,strongWinPercent:wins/runs*100,drawPercent:draws/runs*100,underdogWinPercent:losses/runs*100,meanGoals:[homeGoals/runs,awayGoals/runs]};
});
const report={description:'Deterministic game-balance check on the committed FC27 snapshot. Not real-world odds. Neutral field; 20,000 independent score samples per model.',seed:0x9e3779b9,teams:[strong,underdog].map(t=>({name:t.name,profile:teamProfile(t.roster)})),comparisons};
if(process.argv.includes('--write'))fs.writeFileSync(fileURLToPath(new URL('../research/fut-draft-balance-v2.json',import.meta.url)),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

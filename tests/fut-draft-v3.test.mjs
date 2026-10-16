import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL,teamProfile,profileForTeam,qualificationRisk,tacticalRisk,opportunityRates,expectedGoals} from '../dist/games/fut-draft/simulation-v3.js';
import {chemistryPairs,formationSlots,chemistryNetwork} from '../dist/games/fut-draft/chemistry.js';
import {ODDS,LIMITS,createGame,createTournament,transition,simulateMatch,standings,migrateSaved} from '../dist/games/fut-draft/rules.js';
const positions=['GK',...Array(4).fill('DEF'),...Array(3).fill('MID'),...Array(3).fill('ATT')];
const roster=(rating=82)=>positions.map((position,id)=>({id,position,overall:rating,clubId:4,country:'Türkiye'}));
const team=(id,human=false,rating=82)=>({id,human,roster:roster(rating)});
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
function cup(seed=77){
  const state=createGame(['A','B','C'],undefined,seed),used=new Set();
  for(const t of state.teams)for(const [pos,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===pos&&!used.has(p.id)).slice(0,n)){used.add(p.id);t.roster.push(p);}
  state.picks=33;state.phase='tournament';state.tournament=createTournament(state,data);return state;
}
test('v3 club bonus belongs only to human teams; nation chemistry applies to both',()=>{
  const human=profileForTeam(team('h',true)),bot=profileForTeam(team('b'));
  assert.equal(human.clubBonus,2.6);assert.equal(bot.clubBonus,0);assert.equal(human.nationBonus,1.6);assert.equal(bot.nationBonus,1.6);
  assert.equal(Number((human.rating-bot.rating).toFixed(2)),2.6);
  assert.equal(profileForTeam(team('old-bot'),2).clubBonus,2); // Legacy matches keep their model.
  const noClub=team('h2',true);noClub.roster=noClub.roster.map((p,i)=>({...p,clubId:i}));
  assert.ok(expectedGoals(team('h',true),team('b'),true).lambdaHome>expectedGoals(noClub,team('b'),true).lambdaHome);
});
test('chemistry importance increases while overall spread and duplicate elite weighting decrease',()=>{
  const p=roster(),v2=teamProfile(p,2),v3=teamProfile(p);
  assert.ok(v3.clubBonus>v2.clubBonus);assert.ok(v3.nationBonus>v2.nationBonus);
  const uneven=p.map((p,i)=>({...p,overall:i===0?70:i===1?94:82}));
  assert.equal(teamProfile(uneven).overall,teamProfile(p).overall);
  assert.ok(teamProfile(uneven).balancePenalty<teamProfile(uneven,2).balancePenalty);
  assert.equal(MODEL.maxBalancePenalty,1);assert.ok(MODEL.elite<.30);
  const missing=p.map(x=>({...x,clubId:null,country:null}));assert.equal(teamProfile(missing).clubBonus,0);assert.equal(teamProfile(missing).nationBonus,0);
});
test('chemistry graph retains formation slots and connects known groups without invented links',()=>{
  const players=roster(),slots=formationSlots(players),links=chemistryNetwork(slots);
  assert.equal(slots.length,11);assert.equal(new Set(slots.map(s=>s.key)).size,11);
  assert.equal(links.length,10);assert.ok(links.every(e=>e.club&&e.nation));
  const reachable=new Set([players[0].id]);for(let i=0;i<11;i++)for(const e of links){if(reachable.has(e.a))reachable.add(e.b);if(reachable.has(e.b))reachable.add(e.a);}assert.equal(reachable.size,11);
  const botLinks=chemistryNetwork(slots,{clubEligible:false});assert.ok(botLinks.every(e=>!e.club&&e.nation));
  const diverse=players.map((p,i)=>({...p,country:`N${i}`}));assert.equal(chemistryNetwork(formationSlots(diverse),{clubEligible:false}).length,0);
  assert.equal(chemistryPairs(diverse,{clubEligible:false}).length,0);
  const unknown=players.map(p=>({...p,clubId:null,country:null}));assert.equal(chemistryPairs(unknown).length,0);
  assert.equal(formationSlots([]).filter(s=>s.player).length,0);
});
test('first-24 urgency uses actual cutoff, remaining games and mathematical qualification',()=>{
  const table=Array.from({length:36},(_,i)=>({id:`t${i}`,pts:i<8?21:i<24?10:8}));
  const chasing=qualificationRisk(table,'t24',7),safe=qualificationRisk(table,'t0',7);
  assert.equal(chasing.reason,'must-win');assert.ok(chasing.risk>.7);assert.equal(chasing.needsWin,true);
  assert.equal(safe.reason,'qualified');assert.equal(safe.risk,0);
  const eliminated=structuredClone(table);eliminated[35].pts=0;assert.equal(qualificationRisk(eliminated,'t35',7).reason,'eliminated');
  assert.equal(qualificationRisk(table,'t24',2).risk,0);
  assert.ok(qualificationRisk(table,'t24',6).risk<chasing.risk);
  assert.equal(qualificationRisk(table,'missing',7).risk,0);
  assert.ok(tacticalRisk(chasing,0,0,75)>tacticalRisk(chasing,1,0,75));
  assert.ok(tacticalRisk({risk:0},0,1,80)>tacticalRisk({risk:0},0,0,80));
  const h=profileForTeam(team('h',true)),a=profileForTeam(team('a'));
  const normal=opportunityRates(h,a,true),risk=opportunityRates(h,a,true,{homeRisk:.9});
  assert.ok(risk.home.entry>normal.home.entry);assert.ok(risk.away.dangerous>normal.away.dangerous);
});
test('opportunity simulation has bounded shared tempo, consistent stages, goals and timeline',()=>{
  const rng={rng:56789};const h=team('h',true,86),a=team('a',false,81);
  let wins=0,losses=0,draws=0,goals=0,big=0;
  for(let i=0;i<3000;i++){
    const m=simulateMatch(rng,h,a,true);assert.equal(m.modelVersion,3);assert.ok(m.tempo>=.84&&m.tempo<=1.16);
    for(const side of ['home','away']){const s=m.stats[side];assert.ok(s.attacks>=s.dangerous&&s.dangerous>=s.shots&&s.shots>=s.goals);assert.equal(s.goals,side==='home'?m.hg:m.ag);}
    assert.equal(m.events.length,m.hg+m.ag);assert.ok(m.events.every(e=>e.minute>=1&&e.minute<=90));assert.ok(m.lambdaHome>0&&m.lambdaAway>0);
    if(m.hg>m.ag)wins++;else if(m.hg<m.ag)losses++;else draws++;
    goals+=m.hg+m.ag;if(m.hg+m.ag>=8)big++;
  }
  assert.ok(wins>losses*2);assert.ok(losses>0&&draws>0);assert.ok(goals/3000>1.8&&goals/3000<4.3);assert.ok(big/3000<.05);
  const identical=team('x',true,82),reversed=team('y',true,82),e=expectedGoals(identical,reversed,true);assert.equal(e.lambdaHome,e.lambdaAway);
  const strongerKeeper=team('a',false,81);strongerKeeper.roster[0].overall=91;
  assert.ok(expectedGoals(h,strongerKeeper,true).lambdaHome<expectedGoals(h,a,true).lambdaHome);
});
test('matchday qualification plans are frozen before all 18 games and no club bot receives a club bonus',()=>{
  let s=cup();const t=s.tournament;
  for(let i=0;i<7;i++)t.history.push({stage:'league',number:i+1,label:`${i+1}`,matches:t.weeks[i].map((m,j)=>({...m,hg:(i+j)%3,ag:j%2}))});t.week=7;
  const table=standings(t),plans=new Map(table.map(r=>[r.id,qualificationRisk(table,r.id,7)]));
  s=transition(s,data,{type:'simulate'});
  for(const m of s.tournament.history.at(-1).matches){assert.deepEqual(m.tactics.home,plans.get(m.home));assert.deepEqual(m.tactics.away,plans.get(m.away));}
  assert.ok(s.tournament.teams.filter(t=>!t.human).every(t=>profileForTeam(t).clubBonus===0));
});
test('full event-model cup keeps extra time, stats, winners and save migration consistent',()=>{
  let sawExtra=false;
  for(const seed of [11,22,33,44]){
    let s=cup(seed);while(s.tournament.stage!=='done')s=transition(s,data,{type:'simulate'});
    assert.ok(s.tournament.gameWinner);assert.ok(s.tournament.champion);
    for(const m of s.tournament.history.flatMap(w=>w.matches)){
      assert.equal(m.events.length,m.hg+m.ag);assert.equal(m.stats.home.goals,m.hg);assert.equal(m.stats.away.goals,m.ag);
      if(m.extra){sawExtra=true;assert.ok(m.events.every(e=>e.minute<=120));}
      if(m.penalties)assert.notEqual(m.penalties.home,m.penalties.away);
    }
  }
  assert.ok(sawExtra);
  const old=cup();old.tournament.simulationVersion=2;old.tournament.history=[{stage:'league',matches:[]}];assert.equal(migrateSaved(old).tournament.simulationVersion,2);
  old.tournament.history=[];assert.equal(migrateSaved(old).tournament.simulationVersion,3);
  const oldDraft=createGame(['A','B','C'],[20,30,30,15,5]);assert.deepEqual(migrateSaved(oldDraft).odds,[20,40,25,10,5]);
  oldDraft.odds=[10,20,30,20,20];assert.deepEqual(migrateSaved(oldDraft).odds,oldDraft.odds);assert.deepEqual(ODDS,[20,40,25,10,5]);
});

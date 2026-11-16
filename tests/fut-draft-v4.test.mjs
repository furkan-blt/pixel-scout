import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {teamProfile,profileForTeam,expectedGoals,opportunityRates,fatigue,penaltyProbability} from '../dist/games/fut-draft/simulation-v4.js';
import {PLAYER_ATTRIBUTES,ATTRIBUTE_KEYS} from '../dist/games/fut-draft/player-attributes.js';
import {SEASON_TEAMS,UNAVAILABLE_CLUBS} from '../dist/games/fut-draft/season-data.js';
import {createGame,createTournament,computerTeams,transition,simulateMatch,LIMITS,migrateSaved} from '../dist/games/fut-draft/rules.js';
import {pendingMatchPlans,planKey,computerPlan} from '../dist/games/fut-draft/match-plans.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
const positions=['GK',...Array(4).fill('DEF'),...Array(3).fill('MID'),...Array(3).fill('ATT')];
const team=(id,rating=82,human=false)=>({id,human,roster:positions.map((position,i)=>({id:9000000+i,position,overall:rating,clubId:4,country:'Türkiye'}))});
function cup(seed=77){const s=createGame(['A','B','C'],undefined,seed),used=new Set();for(const t of s.teams)for(const [pos,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===pos&&!used.has(p.id)).slice(0,n)){used.add(p.id);t.roster.push(p);}s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data,{version:4});return s;}
test('v4 club pool contains only verified season participants, with factual full XIs and at most five English clubs',()=>{
 const clubs=computerTeams(data);assert.equal(clubs.length,34);assert.equal(clubs.filter(t=>t.association==='ENG').length,5);assert.equal(UNAVAILABLE_CLUBS.length,2);
 assert.ok(!clubs.some(t=>/Chelsea|Everton|Tottenham/.test(t.name)));
 for(const t of clubs){assert.equal(t.roster.length,11);assert.equal(new Set(t.roster.map(p=>p.id)).size,11);assert.ok(t.roster.every(p=>p.clubId===t.clubId));for(const [pos,n] of Object.entries(LIMITS))assert.equal(t.roster.filter(p=>p.position===pos).length,n);}
 for(const count of [3,4,5]){const s=cup();s.teams=Array.from({length:count},(_,i)=>({...s.teams[i%3],id:`human-${i}`}));const t=createTournament(s,data,{version:4});assert.equal(t.teams.length,36);assert.ok(t.teams.filter(t=>!t.human).every(t=>SEASON_TEAMS.some(c=>c.id===t.id)));}
});
test('EA feature table covers every actual draft and season player; important role fields are factual',()=>{
 const roleKeys={GK:['gkDiving','gkHandling','gkPositioning','gkReflexes'],DEF:['defensiveAwareness','interceptions','standingTackle','stamina'],MID:['vision','shortPassing','ballControl','stamina'],ATT:['finishing','positioning','composure','shotPower','stamina']};
 for(const p of [...data.players,...SEASON_TEAMS.flatMap(t=>t.roster)])for(const key of roleKeys[p.position])assert.ok(Number.isFinite(PLAYER_ATTRIBUTES[p.id]?.[ATTRIBUTE_KEYS.indexOf(key)]),`${p.name}: ${key}`);
});
test('human chemistry is stronger, AI club chemistry is always zero, and spread remains capped at one',()=>{
 const h=profileForTeam(team('h',82,true)),a=profileForTeam(team('a'));
 assert.equal(h.clubBonus,4);assert.equal(h.nationBonus,2.5);assert.equal(a.clubBonus,0);assert.equal(a.nationBonus,1.6);
 assert.ok(h.rating>profileForTeam(team('h',82,true),3).rating);
 const uneven=team('u',82,true).roster.map((p,i)=>({...p,overall:i?90:40}));assert.ok(teamProfile(uneven).balancePenalty<=1);
 assert.ok(expectedGoals(team('h',82,true),team('a'),true).lambdaHome>expectedGoals(team('h',82,false),team('a'),true).lambdaHome);
});
test('line attributes, opposing keeper, styles and stamina affect chances without changing the overall rating',()=>{
 const h=profileForTeam(team('h')),a=profileForTeam(team('a')),normal=opportunityRates(h,a,true);
 const fin=structuredClone(h);fin.attributes.finishing+=12;assert.ok(opportunityRates(fin,a,true).home.conversion>normal.home.conversion);
 const keeper=structuredClone(a);keeper.attributes.keeping+=12;assert.ok(opportunityRates(h,keeper,true).home.conversion<normal.home.conversion);
 const passer=structuredClone(h);passer.attributes.passing+=12;assert.ok(opportunityRates(passer,a,true).home.entry>normal.home.entry);
 const defender=structuredClone(a);defender.attributes.defending+=12;assert.ok(opportunityRates(h,defender,true).home.dangerous<normal.home.dangerous);
 const press={tempo:'high',style:'press'},counter={tempo:'normal',style:'counter'};
 const aggressive=opportunityRates(h,a,true,{homePlan:press});assert.ok(aggressive.home.entry>normal.home.entry);assert.ok(aggressive.away.dangerous>normal.away.dangerous);
 const response=opportunityRates(h,a,true,{homePlan:counter,awayPlan:press});assert.ok(response.home.dangerous>opportunityRates(h,a,true,{homePlan:counter}).home.dangerous);
 assert.ok(fatigue(h,press,90)>fatigue(h,counter,90));assert.ok(opportunityRates(h,a,true,{homePlan:press,minute:90}).home.entry<aggressive.home.entry);
 assert.ok(penaltyProbability(team('h',90),team('a',75))>penaltyProbability(team('h',75),team('a',90)));
 assert.deepEqual(computerPlan(h,a),{tempo:'normal',style:'balanced'});
});
test('v4 minute events maintain shot/save/goal accounting and reduced ambient randomness; power is more decisive',()=>{
 const h=team('h',87),a=team('a',80);const results=[];
 for(const version of [3,4]){const rng={rng:987654};let wins=0,losses=0,goals=0;for(let i=0;i<4000;i++){const m=simulateMatch(rng,h,a,true,version);wins+=m.hg>m.ag;losses+=m.hg<m.ag;goals+=m.hg+m.ag;if(version===4){assert.ok(m.ambient>=.965&&m.ambient<=1.035);for(const side of ['home','away']){const x=m.stats[side],y=m.stats[side==='home'?'away':'home'];assert.ok(x.attacks>=x.dangerous&&x.dangerous>=x.shots&&x.shots>=x.onTarget);assert.equal(x.onTarget,x.goals+y.saves);}assert.equal(m.events.length,m.hg+m.ag);assert.ok(m.events.every(e=>e.minute>=1&&e.minute<=90));}}results.push({wins,losses,goals});}
 assert.ok(results[1].wins>results[0].wins);assert.ok(results[1].losses<results[0].losses);assert.ok(results[1].goals/4000>2&&results[1].goals/4000<5);
});
test('quarterfinal onward requires eligible human plans for every leg, persists locks, rejects invalid or repeated picks',()=>{
 let s=cup();const t=s.tournament;const ids=t.teams.slice(0,4).map(t=>t.id);t.stage='quarter';t.bracket=[{stage:'quarter',leg:0,ties:[{a:ids[0],b:ids[1],matches:[]},{a:ids[2],b:ids[3],matches:[]}]}];t.leagueRanking=t.teams.map(t=>t.id);
 assert.equal(pendingMatchPlans(t).length,3);assert.throws(()=>transition(s,data,{type:'simulate'}),/kilitlemeli/);
 assert.throws(()=>transition(s,data,{type:'match-plan',team:ids[0],tempo:'bad',style:'press'}));
 for(const h of pendingMatchPlans(t))s=transition(s,data,{type:'match-plan',team:h.id,tempo:'high',style:'counter'});
 assert.deepEqual(migrateSaved(s).tournament.matchPlans,s.tournament.matchPlans);
 assert.throws(()=>transition(s,data,{type:'match-plan',team:ids[0],tempo:'normal',style:'balanced'}));
 s=transition(s,data,{type:'simulate'});assert.equal(s.tournament.bracket.at(-1).leg,1);assert.equal(pendingMatchPlans(s.tournament).length,3);assert.equal(planKey(s.tournament),'quarter:2');
 for(const m of s.tournament.history.at(-1).matches){for(const side of ['home','away'])if(m[side].startsWith('human'))assert.deepEqual(m.plans[side],{tempo:'high',style:'counter'});}
 s.tournament.simulationVersion=3;assert.equal(pendingMatchPlans(s.tournament).length,0);
});
test('v4 full cup keeps extra-time statistics consistent and locked choices survive serialization',()=>{
 let extras=0;for(let seed=1;seed<=8;seed++){let s=cup(seed);while(s.tournament.stage!=='done'){for(const t of pendingMatchPlans(s.tournament))s=transition(s,data,{type:'match-plan',team:t.id,tempo:'normal',style:'balanced'});s=transition(s,data,{type:'simulate'});}
 for(const m of s.tournament.history.flatMap(w=>w.matches)){assert.equal(m.stats.home.goals,m.hg);assert.equal(m.stats.away.goals,m.ag);assert.equal(m.stats.home.onTarget,m.hg+m.stats.away.saves);assert.equal(m.stats.away.onTarget,m.ag+m.stats.home.saves);if(m.extra){extras++;assert.ok(m.events.every(e=>e.minute<=120));}if(m.penalties)assert.notEqual(m.penalties.home,m.penalties.away);}}
 assert.ok(extras>0);
});

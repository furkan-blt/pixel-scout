import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL,profileForTeam,selectScorer} from '../dist/games/fut-draft/simulation-v5.js';
import {createGame,createTournament,simulateMatch,transition,LIMITS,validateSaved,migrateSaved} from '../dist/games/fut-draft/rules.js';
import {pendingUpgrades,upgradeOptions,UPGRADE_LEVELS} from '../dist/games/fut-draft/upgrades.js';
import {pendingMatchPlans} from '../dist/games/fut-draft/match-plans.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
function cup(stage='r16',seed=31){const s=createGame(['A','B','C'],undefined,seed),used=new Set();for(const t of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&p.overall<=76&&!used.has(p.id)).slice(0,n)){t.roster.push(p);used.add(p.id);}s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data);const t=s.tournament;t.stage=stage;t.leagueRanking=t.teams.map(t=>t.id);t.history=[{stage:'league',number:1,label:'Lig',matches:[]}];t.bracket=[{stage,leg:0,ties:Array.from({length:4},(_,i)=>({a:t.teams[i*2].id,b:t.teams[i*2+1].id,matches:[]}))}];return s;}
const positions=['GK',...Array(4).fill('DEF'),...Array(3).fill('MID'),...Array(3).fill('ATT')];
const synthetic=(id,rating)=>({id,human:false,roster:positions.map((position,i)=>({id:9000000+i,name:`Oyuncu ${i}`,position,overall:rating,clubId:4,country:'Türkiye'}))});
test('v5 assigns over 75% weight to power and bounds goal divergence from expected goals',()=>{
 assert.ok(MODEL.powerWeight>.75);assert.equal(MODEL.powerWeight+MODEL.featureWeight,1);const h=synthetic('h',83),a=synthetic('a',83),rng={rng:95281};let lopsided=0;
 for(let i=0;i<5000;i++){const m=simulateMatch(rng,h,a,true,5);assert.equal(m.modelVersion,5);if(Math.abs(m.hg-m.ag)>=3)lopsided++;for(const side of ['home','away']){const goals=side==='home'?m.hg:m.ag,lambda=side==='home'?m.lambdaHome:m.lambdaAway;assert.ok(goals<=lambda*1.35+1);assert.ok(goals>=lambda*.65-1);const x=m.stats[side],y=m.stats[side==='home'?'away':'home'];assert.equal(x.onTarget,goals+y.saves);assert.equal(x.goals,goals);assert.ok(x.attacks>=x.dangerous&&x.dangerous>=x.shots&&x.shots>=x.onTarget);}assert.equal(m.events.length,m.hg+m.ag);for(const e of m.events){assert.ok((e.team==='h'?h:a).roster.some(p=>p.id===e.playerId&&p.name===e.playerName));assert.ok(e.minute>=1&&e.minute<=90);}}
 assert.equal(lopsided,0);
});
test('v5 same matchup has fewer unexpected defeats than v4 while still allowing close-game variation',()=>{
 const h=synthetic('h',85),a=synthetic('a',81);const counts=[];for(const version of [4,5]){const rng={rng:1234567};let losses=0,wins=0,draws=0;for(let i=0;i<3000;i++){const m=simulateMatch(rng,h,a,true,version);losses+=m.hg<m.ag;wins+=m.hg>m.ag;draws+=m.hg===m.ag;}counts.push({losses,wins,draws});}assert.ok(counts[1].losses<counts[0].losses/3);assert.ok(counts[1].wins>counts[0].wins);assert.ok(counts[1].draws>0);
});
for(const stage of ['r16','quarter','semi'])test(`${stage} reward uses its exact two levels, swaps one better same-position player and persists`,()=>{
 let s=cup(stage);assert.deepEqual(UPGRADE_LEVELS[stage],stage==='quarter'?[2,3]:[1,2]);const team=pendingUpgrades(s.tournament)[0];const old=upgradeOptions(s,data,team.id)[0];const before=s.teams.find(t=>t.id===team.id).roster;
 assert.throws(()=>transition(s,data,{type:'simulate'}),/yükseltme|kilitlemeli/);
 assert.throws(()=>transition(s,data,{type:'upgrade-open',team:'human-1',player:old.id}));
 s=transition(s,data,{type:'upgrade-open',team:team.id,player:old.id});const pack=s.tournament.upgrades[stage][team.id].pack;assert.equal(pack.options.length,3);assert.ok(UPGRADE_LEVELS[stage].includes(pack.level));assert.ok(pack.options.every(p=>p.position===old.position&&p.overall>old.overall));
 assert.throws(()=>transition(s,data,{type:'upgrade-open',team:team.id,player:old.id}));assert.ok(validateSaved(s,data));assert.deepEqual(migrateSaved(JSON.parse(JSON.stringify(s))).tournament.upgrades,s.tournament.upgrades);
 s=transition(s,data,{type:'upgrade-pick',team:team.id,id:pack.options[0].id});const roster=s.teams.find(t=>t.id===team.id).roster;assert.equal(roster.length,11);assert.ok(!roster.some(p=>p.id===old.id));assert.equal(roster.filter(p=>!before.some(q=>q.id===p.id)).length,1);assert.deepEqual(roster,s.tournament.teams.find(t=>t.id===team.id).roster);assert.ok(validateSaved(s,data));
 assert.throws(()=>transition(s,data,{type:'upgrade-open',team:team.id,player:roster[0].id}));
 for(const next of pendingUpgrades(s.tournament))s=transition(s,data,{type:'upgrade-skip',team:next.id});
 for(const next of pendingMatchPlans(s.tournament))s=transition(s,data,{type:'match-plan',team:next.id,tempo:'normal',style:'balanced'});
 s=transition(s,data,{type:'simulate'});assert.equal(s.tournament.bracket.at(-1).leg,1);assert.equal(pendingUpgrades(s.tournament).length,0);
});
test('reward levels remain a fair coin; capped squads can skip and no final/legacy rewards exist',()=>{
 const levels={1:0,2:0};for(let seed=1;seed<=300;seed++){let s=cup('r16',seed*74591);const t=pendingUpgrades(s.tournament)[0],p=upgradeOptions(s,data,t.id)[0];s=transition(s,data,{type:'upgrade-open',team:t.id,player:p.id});levels[s.tournament.upgrades.r16[t.id].pack.level]++;}assert.ok(levels[1]>110&&levels[1]<190);
 const s=cup('final');assert.equal(pendingUpgrades(s.tournament).length,0);s.tournament.stage='r16';s.tournament.simulationVersion=4;assert.equal(pendingUpgrades(s.tournament).length,0);
 const full=cup();full.teams[0].roster=full.teams[0].roster.map(p=>({...p,overall:99}));assert.equal(upgradeOptions(full,data,'human-0').length,0);assert.doesNotThrow(()=>transition(full,data,{type:'upgrade-skip',team:'human-0'}));
});
test('scorer selection uses a current XI member and favors forwards without inventing identities',()=>{
 const t=synthetic('h',82);assert.equal(selectScorer(()=>0,t).playerId,t.roster[0].id);assert.equal(selectScorer(()=>.999999,t).playerId,t.roster.at(-1).id);assert.ok(profileForTeam(t).rating>0);
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createGame,createTournament,transition,LIMITS,validateSaved,migrateSaved} from '../dist/games/fut-draft/rules.js';
import {upgradeOptions,UPGRADE_LEVELS} from '../dist/games/fut-draft/upgrades.js';
import {playbackDuration,focusedPenalty,penaltySequenceEnd} from '../dist/games/fut-draft/live.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
function cup(){const s=createGame(['Controls A','Controls B','Controls C'],undefined,35719),used=new Set();for(const team of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&!used.has(p.id)).slice(0,n)){used.add(p.id);team.roster.push(p);}s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data);s.tournament.draw.done=true;s.tournament.draw.revealed=s.tournament.draw.total;return s;}
function knockout(){let s=cup();for(let i=0;i<9;i++)s=transition(s,data,{type:'simulate'});s=transition(s,data,{type:'draw-all'});return transition(s,data,{type:'draw-finish'});}
test('all eleven high-rated players can open tier 1/2 rewards in every stage; keeping the old player consumes only that reward',()=>{
 for(const stage of ['r16','quarter','semi']){let s=cup();s.tournament.stage=stage;s.tournament.bracket=[{stage,leg:0,ties:[{a:'human-0',b:'human-1',matches:[]}]}];s.tournament.history=[{stage:'league',number:1,matches:[]}];
 assert.deepEqual(UPGRADE_LEVELS[stage],[1,2]);const before=structuredClone(s.teams[0].roster);assert.equal(upgradeOptions(s,data,'human-0').length,11);
 for(const old of before){const opened=transition(s,data,{type:'upgrade-open',team:'human-0',player:old.id}),pack=opened.tournament.upgrades[stage]['human-0'].pack;assert.ok([1,2].includes(pack.level));assert.equal(pack.options.length,3);assert.ok(pack.options.every(p=>p.position===old.position));assert.ok(validateSaved(opened,data));}
 s=transition(s,data,{type:'upgrade-open',team:'human-0',player:before[0].id});s=transition(s,data,{type:'upgrade-skip',team:'human-0'});assert.deepEqual(s.teams[0].roster,before);assert.equal(s.tournament.upgrades[stage]['human-0'].done,true);assert.throws(()=>transition(s,data,{type:'upgrade-open',team:'human-0',player:before[1].id}));
 }
});
test('league presentation keeps all results pending until revealed, survives refresh and direct simulation preserves RNG/results',()=>{
 let s=cup(),reference=transition(s,data,{type:'simulate'});s=transition(s,data,{type:'live-start'});assert.equal(s.tournament.live.mode,'league');assert.equal(s.tournament.live.duration,18);assert.equal(s.tournament.week,0);assert.equal(s.tournament.history.length,0);assert.ok(validateSaved(s,data));
 for(let i=0;i<3;i++)s=transition(s,data,{type:'live-tick'});assert.equal(migrateSaved(JSON.parse(JSON.stringify(s))).tournament.live.minute,3);assert.equal(s.tournament.history.length,0);
 s=transition(s,data,{type:'live-instant'});assert.deepEqual(s,reference);
});
test('instant knockout playback commits the same saved result without any new draws',()=>{
 let s=knockout(),reference=transition(s,data,{type:'simulate'});for(const h of reference.tournament.history)for(const m of h.matches)delete m.frames;
 s=transition(s,data,{type:'live-start'});s=transition(s,data,{type:'live-instant'});assert.deepEqual(s,reference);
});
test('human shootouts focus sequentially at a fixed cadence; instant playback stops before their first kick',()=>{
 const a={home:'human-0',away:'club-1',extra:{home:0,away:0},penalties:{home:2,away:1,kicks:[{side:'home',round:1,scored:true,home:1,away:0},{side:'away',round:1,scored:true,home:1,away:1},{side:'home',round:2,scored:true,home:2,away:1}]}};
 const b={...a,home:'human-1',away:'club-2'},ai={...a,home:'club-3',away:'club-4'};const matches=[ai,a,b],humans=['human-0','human-1'];assert.equal(playbackDuration(matches,humans),130);assert.equal(penaltySequenceEnd(matches,humans),130);
 const live={mode:'knockout',minute:120,result:{history:[{matches}]}};assert.equal(focusedPenalty(live,humans).match.home,'human-0');assert.equal(focusedPenalty(live,humans).shown,0);live.minute=125;assert.equal(focusedPenalty(live,humans).match.home,'human-1');assert.equal(focusedPenalty(live,humans).shown,0);
 let s=cup();s.tournament.stage='final';s.tournament.live={...live,minute:119,speed:8,paused:false,duration:130,rng:s.rng};s=transition(s,data,{type:'live-instant'});assert.equal(s.tournament.live.minute,120);assert.equal(focusedPenalty(s.tournament.live,humans).shown,0);s=transition(s,data,{type:'live-tick'});assert.equal(focusedPenalty(s.tournament.live,humans).shown,1);
});

test('a top-rated player may take a tier-2 replacement or keep the original without blocking the reward',()=>{
 let found=false;for(let i=1;i<20&&!found;i++){let s=cup();s.rng=i*74591;s.tournament.stage='quarter';s.tournament.bracket=[{stage:'quarter',leg:0,ties:[{a:'human-0',b:'human-1',matches:[]}]}];const old=s.teams[0].roster[0];s=transition(s,data,{type:'upgrade-open',team:'human-0',player:old.id});const pack=s.tournament.upgrades.quarter['human-0'].pack;if(pack.level!==2)continue;found=true;assert.ok(pack.options.every(p=>p.overall<old.overall));s=transition(s,data,{type:'upgrade-pick',team:'human-0',id:pack.options[0].id});assert.equal(s.teams[0].roster[0].id,pack.options[0].id);assert.ok(validateSaved(s,data));}assert.ok(found);
});

test('five all-elite squads still get three defender options by offering their own selected card as keep',()=>{
 let base=createGame(['Elite A','Elite B','Elite C','Elite D','Elite E'],undefined,33),used=new Set();for(const team of base.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&p.overall>=85&&!used.has(p.id)).slice(0,n)){team.roster.push(p);used.add(p.id);}base.picks=55;base.phase='tournament';base.tournament=createTournament(base,data);base.tournament.stage='quarter';base.tournament.bracket=[{stage:'quarter',leg:0,ties:[{a:'human-0',b:'human-1',matches:[]}]}];const old=base.teams[0].roster.find(p=>p.position==='DEF');
 let found=false;for(let i=1;i<20&&!found;i++){let s=structuredClone(base);s.rng=i*74591;s=transition(s,data,{type:'upgrade-open',team:'human-0',player:old.id});const pack=s.tournament.upgrades.quarter['human-0'].pack;if(pack.level!==1)continue;found=true;assert.equal(pack.options.length,3);assert.equal(new Set(pack.options.map(p=>p.id)).size,3);assert.ok(pack.options.some(p=>p.id===old.id));s=transition(s,data,{type:'upgrade-pick',team:'human-0',id:old.id});assert.deepEqual(s.teams[0].roster,base.teams[0].roster);assert.ok(validateSaved(s,data));}assert.ok(found);
});

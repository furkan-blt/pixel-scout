import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {teamProfile,MODEL,expectedGoals} from '../dist/games/fut-draft/simulation.js';
import {computerTeams,simulateMatch} from '../dist/games/fut-draft/rules.js';
import {createPackReveal,REVEAL_TIMES} from '../dist/games/fut-draft/pack-reveal.js';
const positions=['GK',...Array(4).fill('DEF'),...Array(3).fill('MID'),...Array(3).fill('ATT')];
function roster(overall=82){return positions.map((position,i)=>({id:i,position,overall,clubId:i,country:`Nation ${i}`}));}
const team=(id,players)=>({id,roster:players});
test('each requested power factor changes the rating in the intended direction and has bounded influence',()=>{
  const base=roster(),p=teamProfile(base);
  assert.equal(p.rating,82);assert.equal(p.eliteBonus,0);assert.equal(p.clubBonus,0);assert.equal(p.nationBonus,0);assert.equal(p.balancePenalty,0);
  const club=base.map(x=>({...x,clubId:8})),nation=base.map(x=>({...x,country:'Türkiye'}));
  assert.equal(teamProfile(club).rating,84);assert.equal(teamProfile(nation).rating,83.2);
  const both=base.map(x=>({...x,clubId:8,country:'Türkiye'}));
  assert.equal(teamProfile(both).rating,85.2);
  const elite=teamProfile(roster(85));assert.equal(elite.eliteCount,11);assert.ok(Math.abs(elite.eliteBonus-3.3)<1e-9);
  const spread=base.map((p,i)=>({...p,overall:i===0?70:i===1?94:82}));
  assert.equal(teamProfile(spread).overall,82);assert.ok(teamProfile(spread).rating<p.rating);
  assert.ok(teamProfile(spread).balancePenalty<=MODEL.maxBalancePenalty);
  const missing=base.map(x=>({...x,clubId:null,country:null}));assert.equal(teamProfile(missing).clubBonus,0);assert.equal(teamProfile(missing).nationBonus,0);
  assert.ok(teamProfile(roster(84)).rating>p.rating);
});
test('power gaps consistently change goal expectations, home advantage is symmetric on neutral ground',()=>{
  const low=team('low',roster(78)),high=team('high',roster(88));
  const expected=expectedGoals(high,low,true);
  assert.ok(expected.lambdaHome>expected.lambdaAway*5);
  const reverse=expectedGoals(low,high,true);
  assert.equal(expected.lambdaHome,reverse.lambdaAway);assert.equal(expected.lambdaAway,reverse.lambdaHome);
  const neutral=expectedGoals(high,high,true),home=expectedGoals(high,high,false);
  assert.equal(neutral.lambdaHome,neutral.lambdaAway);assert.ok(home.lambdaHome>home.lambdaAway);
  const betterKeeper={...low,roster:low.roster.map(p=>p.position==='GK'?{...p,overall:88}:p)};
  assert.ok(expectedGoals(high,betterKeeper,true).lambdaHome<expected.lambdaHome);
});
test('strong real snapshot squad wins more often than in v1 without a club-name handicap',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
  const teams=computerTeams(data),strong=teams.find(t=>t.name==='Paris SG'),weak=teams.find(t=>t.name==='Man Utd');
  const outcomes=[];
  for(const version of [1,2]){
    const state={rng:0x9e3779b9};let weakWins=0,strongWins=0;
    for(let i=0;i<10000;i++){const m=simulateMatch(state,strong,weak,true,version);if(m.hg<m.ag)weakWins++;if(m.hg>m.ag)strongWins++;assert.ok(Number.isInteger(m.hg)&&m.hg>=0&&Number.isInteger(m.ag)&&m.ag>=0);}
    outcomes.push({weakWins,strongWins});
  }
  assert.ok(outcomes[1].strongWins>outcomes[0].strongWins+1800);
  assert.ok(outcomes[1].weakWins<outcomes[0].weakWins*.55);
  assert.ok(outcomes[1].weakWins>0); // Upsets remain possible.
  const a={rng:12},b={rng:12};
  assert.deepEqual(simulateMatch(a,strong,weak,true),simulateMatch(b,{...strong,name:'Unrelated A'},{...weak,name:'Unrelated B'},true));
});
test('sequential reveal locks picking for 880ms and cancellation suppresses stale callbacks',()=>{
  const pending=new Map(),events=[];let id=0;
  const controller=createPackReveal((count,running)=>events.push([count,running]),{schedule:(fn,ms)=>{pending.set(++id,{fn,ms});return id;},cancel:key=>pending.delete(key)});
  controller.start();assert.deepEqual(events,[[0,true]]);
  assert.deepEqual([...pending.values()].map(x=>x.ms),REVEAL_TIMES);
  const old=[...pending.values()];old.forEach(x=>x.fn());
  assert.deepEqual(events,[[0,true],[1,true],[2,true],[3,true],[3,false]]);
  controller.start();const size=events.length;old.forEach(x=>x.fn());assert.equal(events.length,size);
  controller.stop();assert.equal(pending.size,0);
});

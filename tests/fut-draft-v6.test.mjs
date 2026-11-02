import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,createTournament,transition,simulateMatch,profileForTeam,LIMITS,validateSaved,migrateSaved} from '../dist/games/fut-draft/rules.js';
import {leagueDrawEntries,drawComparison,drawPending} from '../dist/games/fut-draft/draw.js';
import {drawScreen} from '../dist/games/fut-draft/draw-ui.js';
import {visibleMatch} from '../dist/games/fut-draft/live.js';
import {opportunityRates} from '../dist/games/fut-draft/simulation-v6.js';
import {pendingMatchPlans} from '../dist/games/fut-draft/match-plans.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
function cup(n=3,seed=77){const s=createGame(Array.from({length:n},(_,i)=>`Kura ${i+1}`),undefined,seed),used=new Set();for(const t of s.teams)for(const [pos,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===pos&&!used.has(p.id)).slice(0,n)){used.add(p.id);t.roster.push(p);}s.picks=n*11;s.phase='tournament';s.tournament=createTournament(s,data);return s;}
function finishDraw(s){if(drawPending(s.tournament)){s=transition(s,data,{type:'draw-all'});s=transition(s,data,{type:'draw-finish'});}return s;}
function playoff(){let s=finishDraw(cup());for(let i=0;i<9;i++)s=transition(s,data,{type:'simulate'});return finishDraw(s);}
for(const n of [3,4,5])test(`${n} users: pots follow full power and reveal exactly two per pot; difficulty compares revealed fixtures only`,()=>{
 let s=cup(n),t=s.tournament;const power=t.initialPowers;for(let pot=1;pot<4;pot++)assert.ok(Math.min(...t.pots[pot-1].map(id=>power[id]))>=Math.max(...t.pots[pot].map(id=>power[id])));
 const entries=leagueDrawEntries(t);assert.equal(entries.length,n*8);for(const team of s.teams)for(let pot=0;pot<4;pot++)assert.equal(entries.filter(e=>e.team===team.id&&e.pot===pot).length,2);
 assert.ok(drawComparison(t,0).every(x=>x.difficulty===null));assert.throws(()=>transition(s,data,{type:'simulate'}),/kura/);assert.throws(()=>transition(s,data,{type:'draw-finish'}));
 const rng=s.rng;s=transition(s,data,{type:'draw-next'});assert.equal(s.rng,rng);assert.equal(drawComparison(s.tournament,1).flatMap(x=>x.fixtures).filter(f=>f.revealed).length,1);assert.equal(migrateSaved(s).tournament.draw.revealed,1);assert.ok(validateSaved(s,data));
 s=finishDraw(s);const result=drawComparison(s.tournament);assert.ok(result.every((r,i)=>i===0||result[i-1].difficulty>=r.difficulty));assert.ok(result.every(r=>r.fixtures.length===8));assert.equal(s.rng,rng);
});
test('knockout draw hides future endpoints and reveals each ball without rerolling',()=>{
 let s=finishDraw(cup());for(let i=0;i<9;i++)s=transition(s,data,{type:'simulate'});const t=s.tournament,rng=s.rng;assert.equal(t.draw.kind,'knockout');assert.equal(t.draw.total,16);
 const name=t.teams.find(team=>team.id===t.bracket.at(-1).ties[0].a).name;const zero=drawScreen(t,{dot:()=>'',color:()=>'',stageLabel:'Play-off'});assert.ok(!zero.includes(name));
 s=transition(s,data,{type:'draw-next'});const one=drawScreen(s.tournament,{dot:()=>'',color:()=>'',stageLabel:'Play-off'});assert.ok(one.includes(name));assert.equal(s.rng,rng);
});
test('live clock persists and pauses, never reveals future events, commits identical results regardless of speed',()=>{
 let s=playoff(),reference=transition(s,data,{type:'simulate'});s=transition(s,data,{type:'live-start'});assert.equal(s.tournament.history.length,8);assert.ok(validateSaved(s,data));assert.throws(()=>transition(s,data,{type:'simulate'}),/devam eden/);assert.throws(()=>transition(s,data,{type:'live-finish'}),/bitmedi/);
 for(let i=0;i<30;i++)s=transition(s,data,{type:'live-tick'});const live=s.tournament.live;for(const m of live.result.history.at(-1).matches){const shown=visibleMatch(m,30);assert.ok(shown.events.every(e=>e.minute<=30));assert.equal(shown.hg,shown.events.filter(e=>e.team===m.home).length);assert.ok(!shown.penalties);assert.ok(!shown.extra);}
 s=transition(s,data,{type:'live-toggle'});assert.throws(()=>transition(s,data,{type:'live-tick'}),/duraklat/);assert.equal(migrateSaved(JSON.parse(JSON.stringify(s))).tournament.live.minute,30);
 s=transition(s,data,{type:'live-speed',speed:8});assert.throws(()=>transition(s,data,{type:'live-speed',speed:99}));s=transition(s,data,{type:'live-toggle'});
 while(s.tournament.live.minute<s.tournament.live.duration)s=transition(s,data,{type:'live-tick'});s=transition(s,data,{type:'live-finish'});
 for(const h of reference.tournament.history)for(const m of h.matches)delete m.frames;assert.deepEqual(s,reference);
});
test('extra-time frames continue the regulation score and shootouts remain hidden until their kick',()=>{
 let found=false;for(let seed=1;seed<=35&&!found;seed++){
  let s=finishDraw(cup(3,seed));s.tournament.stage='final';s.tournament.leagueRanking=s.tournament.teams.map(t=>t.id);const ai=s.tournament.teams.filter(t=>!t.human);s.tournament.bracket=[{stage:'final',leg:0,ties:[{a:ai[0].id,b:ai[1].id,matches:[]}]}];
  s=transition(s,data,{type:'live-start'});const m=s.tournament.live.result.history.at(-1).matches[0];if(!m.extra)continue;found=true;
  const regulation=visibleMatch(m,90),extra=visibleMatch(m,91);assert.ok(extra.hg>=regulation.hg&&extra.ag>=regulation.ag);assert.ok(extra.lambdaHome>=regulation.lambdaHome-.0002);assert.ok(extra.stats.home.attacks>=regulation.stats.home.attacks);assert.ok(!regulation.extra);assert.ok(!visibleMatch(m,120).penalties);
  if(m.penalties){assert.equal(visibleMatch(m,121).penalties.kicks.length,1);assert.equal(visibleMatch(m,s.tournament.live.duration).penalties.home,m.penalties.home);}
 }
 assert.ok(found);
});
test('close power increases chemistry and star influence; identical teams no longer draw most games',()=>{
 const base=cup().tournament.teams[0],p=profileForTeam(base),other={...p,rating:p.rating,clubBonus:0,nationBonus:0,star:p.overall,topThree:p.overall};const chem={...other,clubBonus:4,nationBonus:2.5},star={...other,star:95,topThree:91};
 assert.ok(opportunityRates(chem,other,true).home.entry>opportunityRates(other,other,true).home.entry);assert.ok(opportunityRates(star,other,true).home.entry>opportunityRates(other,other,true).home.entry);
 const far={...other,rating:other.rating-4};assert.equal(opportunityRates(star,far,true).home.entry,opportunityRates(other,far,true).home.entry);
 const totals=[];for(const version of [5,6]){const rng={rng:812398};let draws=0,goals=0,big=0;for(let i=0;i<5000;i++){const m=simulateMatch(rng,base,{...base,id:'other'},true,version);draws+=m.hg===m.ag;goals+=m.hg+m.ag;big+=Math.abs(m.hg-m.ag)>=3;}totals.push({draws,goals,big});}
 assert.ok(totals[1].draws<2000);assert.ok(totals[1].draws<totals[0].draws*.8);assert.ok(Math.abs(totals[1].goals-totals[0].goals)<500);assert.equal(totals[1].big,0);
});

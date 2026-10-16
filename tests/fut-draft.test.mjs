import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,transition,activeSeat,POSITIONS,LIMITS,tierOf,compensationOptions,assertSquads,createTournament,standings,computerTeams,validateSaved,stealVictim,stealAttacker,COLORS,migrateSaved} from '../dist/games/fut-draft/rules.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
function draft(n,seed=123,odds=[20,30,30,15,5]){
  let s=createGame(Array.from({length:n},(_,i)=>`Takım ${i+1}`),odds,seed);
  const order=[];
  while(s.phase==='draft'){
    const seat=activeSeat(s),t=s.teams[seat];order.push(seat);
    const position=Object.keys(LIMITS).find(pos=>t.roster.filter(p=>p.position===pos).length<LIMITS[pos]);
    s=transition(s,data,{type:'open',position,joker:t.joker});
    assert.equal(s.pack.options.length,3);
    s=transition(s,data,{type:'pick',id:s.pack.options[0].id});
  }
  return {s,order};
}
function lockRound(s,blocked=false){
  const snapshot=s.stealSnapshot;
  const targets=s.teams.map((_,i)=>snapshot[stealVictim(s,i)][0].id);
  const protects=s.teams.map((_,i)=>snapshot[i][blocked?0:1].id);
  while(s.phase==='steal'){
    const i=activeSeat(s);
    s=transition(s,data,{type:'lock',protect:protects[i],target:targets[i]});
  }
  return s;
}
function exchange(s){
  s=transition(s,data,{type:'exchange-start'});
  while(s.phase==='exchange'){
    const opts=compensationOptions(s);assert.ok(opts.length);
    s=transition(s,data,{type:'compensate',id:opts[0].id});
  }
  assertSquads(s.teams);return s;
}
test('FC27 factual snapshot has unique players and deep pools for every position/tier',()=>{
  assert.equal(data.edition,'EA SPORTS FC 27');
  assert.equal(new Set(data.players.map(p=>p.id)).size,data.players.length);
  for(const pos of Object.keys(POSITIONS))for(let l=1;l<=5;l++)assert.ok(data.players.filter(p=>p.position===pos&&tierOf(p.overall)===l).length>=LIMITS[pos]*5+2,`${pos} tier ${l}`);
  assert.ok(computerTeams(data).length>=33);
});
for(const n of [3,4,5])test(`${n} participants: rotating draft, unique XI, one joker, both steal rounds and full cup`,()=>{
  let {s,order}=draft(n,n*13);
  for(let r=0;r<11;r++)assert.deepEqual(order.slice(r*n,(r+1)*n),Array.from({length:n},(_,i)=>(s.first+r+i)%n));
  assertSquads(s.teams);assert.ok(s.teams.every(t=>!t.joker));
  for(let r=0;r<2;r++){
    s=lockRound(s);assert.ok(s.results.every(x=>x.success));s=exchange(s);
    s=transition(s,data,{type:'steal-next'});
  }
  assert.equal(s.phase,'tournament');assert.equal(s.tournament.teams.length,36);
  assert.equal(s.stealHistory.length,2);
  let clicks=0;
  while(s.tournament.stage!=='done'){
    s=transition(s,data,{type:'simulate'});assert.ok(++clicks<30);
    assert.ok(validateSaved(JSON.parse(JSON.stringify(s)),data));
  }
  const t=s.tournament,table=standings(t);
  assert.ok(table.every(r=>r.p===8));assert.equal(table.reduce((a,b)=>a+b.gf,0),table.reduce((a,b)=>a+b.ga,0));
  assert.equal(t.history.filter(h=>h.stage==='league').flatMap(h=>h.matches).length,144);
  assert.deepEqual(t.bracket.map(r=>r.ties.length),[8,8,4,2,1]);
  assert.equal(t.history.length,17);assert.ok(t.champion);assert.ok(t.gameWinner.startsWith('human-'));
  assert.equal(t.eliminated[t.champion],'champion');
});
test('protection is checked only after all simultaneous choices; blocked attempts consume the round',()=>{
  let {s}=draft(4);
  const before=structuredClone(s.teams);
  const i=activeSeat(s);
  s=transition(s,data,{type:'lock',protect:s.stealSnapshot[i][0].id,target:s.stealSnapshot[(i+1)%4][0].id});
  assert.equal(s.phase,'steal');assert.equal(s.results,undefined);assert.deepEqual(s.teams,before);
  s=lockRound(s,true);assert.ok(s.results.every(r=>!r.success));
  s=exchange(s);assert.deepEqual(s.teams,before);assert.equal(s.phase,'steal-summary');
});
test('same-position reserved targets cannot be paid away; sole GK uses incoming fallback',()=>{
  let {s}=draft(5);
  s=lockRound(s); // GK is first in every roster: all five steal keepers.
  s=transition(s,data,{type:'exchange-start'});
  while(s.phase==='exchange'){
    const m=s.moves[s.cursor],opts=compensationOptions(s);
    assert.equal(opts.length,1);assert.equal(opts[0].id,m.target);
    assert.throws(()=>transition(s,data,{type:'compensate',id:s.teams[m.thief].roster.find(p=>p.position==='ATT').id}),/aynı mevkiden/i);
    s=transition(s,data,{type:'compensate',id:opts[0].id});
  }
  assertSquads(s.teams);
});
test('mixed successful/blocked steals retain 11 and position counts for 100 randomized cases',()=>{
  for(let seed=1;seed<=100;seed++){
    let {s}=draft(3+seed%3,seed);
    for(let round=0;round<2;round++){
      const snapshots=s.stealSnapshot;
      while(s.phase==='steal'){
        const i=activeSeat(s),v=stealVictim(s,i);
        s=transition(s,data,{type:'lock',protect:snapshots[i][(seed+i+round)%11].id,target:snapshots[v][(seed*3+i+round)%11].id});
      }
      s=exchange(s);
      if(!round)s=transition(s,data,{type:'steal-next'});
    }
  }
});
test('every league draw has 8 distinct opponents, 2 per pot, 4 home/4 away and no repeated teams per week',()=>{
  const {s}=draft(3);
  for(let seed=1;seed<=30;seed++){
    const tmp={...structuredClone(s),rng:seed};const t=createTournament(tmp,data),pot=new Map(t.pots.flatMap((ids,i)=>ids.map(id=>[id,i])));
    assert.equal(t.weeks.length,8);
    for(const week of t.weeks){assert.equal(week.length,18);assert.equal(new Set(week.flatMap(m=>[m.home,m.away])).size,36);}
    for(const team of t.teams){
      const matches=t.weeks.flat().filter(m=>m.home===team.id||m.away===team.id),opponents=matches.map(m=>m.home===team.id?m.away:m.home);
      assert.equal(new Set(opponents).size,8);assert.equal(matches.filter(m=>m.home===team.id).length,4);
      assert.deepEqual([0,1,2,3].map(i=>opponents.filter(id=>pot.get(id)===i).length),[2,2,2,2]);
    }
  }
});
test('100% tier weighting and joker override, invalid actions never mutate the prior state',()=>{
  let s=createGame(['A','B','C'],[0,0,0,0,100],90),before=structuredClone(s);
  assert.throws(()=>transition(s,data,{type:'pick',id:123}));assert.deepEqual(s,before);
  s=transition(s,data,{type:'open',position:'DEF'});assert.equal(s.pack.level,5);
  const opened=structuredClone(s);assert.throws(()=>transition(s,data,{type:'open',position:'ATT'}));assert.deepEqual(s,opened);
  s=transition(s,data,{type:'pick',id:s.pack.options[0].id});
  s=transition(s,data,{type:'open',position:'MID',joker:true});assert.equal(s.pack.level,1);
  assert.throws(()=>createGame(['A','B','C'],[20,20,20,20,10]),/100/);
});
test('reload accepts valid states and rejects corrupt or foreign player facts',()=>{
  let s=createGame(['A','B','C']);assert.ok(validateSaved(s,data));
  s=transition(s,data,{type:'open',position:'GK',joker:true});assert.ok(validateSaved(s,data));
  s=transition(s,data,{type:'pick',id:s.pack.options[0].id});assert.ok(validateSaved(s,data));
  const broken=structuredClone(s);broken.teams[0].roster=[{id:-1}];assert.equal(validateSaved(broken,data),false);
});

for(const n of [3,4,5])test(`${n} seats change steal opponents in round 2 and retain a unique incoming attacker`,()=>{
  let {s}=draft(n,777);
  const first=s.teams.map((_,i)=>stealVictim(s,i));
  s=exchange(lockRound(s));s=transition(s,data,{type:'steal-next'});
  const second=s.teams.map((_,i)=>stealVictim(s,i));
  assert.equal(new Set(second).size,n);
  second.forEach((victim,thief)=>{assert.notEqual(victim,first[thief]);assert.notEqual(thief,victim);assert.equal(stealAttacker(s,victim),thief);});
  const invalidTarget=s.stealSnapshot[first[activeSeat(s)]][0].id;
  assert.throws(()=>transition(s,data,{type:'lock',protect:s.stealSnapshot[activeSeat(s)][0].id,target:invalidTarget}),/Çalacağın/);
});
test('eight unique color choices persist into tournament and cannot be duplicated',()=>{
  assert.equal(COLORS.length,8);
  assert.throws(()=>createGame(['A','B','C'],undefined,5,['red','red','blue']),/farklı/);
  let {s}=draft(3);s=transition(s,data,{type:'color',team:'human-0',color:'pink'});
  assert.equal(s.teams[0].color,'pink');assert.ok(validateSaved(s,data));
  assert.throws(()=>transition(s,data,{type:'color',team:'human-1',color:'pink'}));
  s=exchange(lockRound(s));s=transition(s,data,{type:'steal-next'});s=exchange(lockRound(s));s=transition(s,data,{type:'steal-next'});
  s=transition(s,data,{type:'color',team:'human-0',color:'red'});
  assert.equal(s.tournament.teams[0].color,'red');
});
test('migration retains legacy results/model and already locked opponents, but upgrades untouched rounds',()=>{
  let {s}=draft(3);
  delete s.rulesVersion;delete s.stealOffset;s.teams.forEach(t=>delete t.color);
  const old=structuredClone(s),upgraded=migrateSaved(s);
  assert.ok(validateSaved(upgraded,data));assert.equal(new Set(upgraded.teams.map(t=>t.color)).size,3);
  assert.deepEqual(s,old);
  s.stealRound=1;assert.equal(migrateSaved(s).stealOffset,2);
  s.cursor=1;assert.equal(migrateSaved(s).stealOffset,1);
  const t=createTournament(upgraded,data);delete t.simulationVersion;
  t.history=[{stage:'league',number:1,matches:[{home:t.teams[0].id,away:t.teams[1].id,hg:2,ag:1}]}];
  s.tournament=t;s.phase='tournament';
  const migrated=migrateSaved(s);assert.equal(migrated.tournament.simulationVersion,1);assert.deepEqual(migrated.tournament.history,t.history);
});

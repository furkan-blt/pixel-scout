import {drawPending} from '../dist/games/fut-draft/draw.js';
import {pendingUpgrades} from '../dist/games/fut-draft/upgrades.js';
import {pendingMatchPlans} from '../dist/games/fut-draft/match-plans.js';
// Application event/render smoke tests with a DOM boundary stub; no browser layout claims.
import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LIMITS,activeSeat,STORAGE_KEY,stealVictim} from '../dist/games/fut-draft/rules.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
let bootId=0;
const actualTimeout=setTimeout,actualClearTimeout=clearTimeout;
afterEach(()=>{globalThis.setTimeout=actualTimeout;globalThis.clearTimeout=actualClearTimeout;});
async function environment(saved=null,brokenStorage=false){
  const nodes=new Map(),listeners=new Map(),storage=new Map(saved?[[STORAGE_KEY,JSON.stringify(saved)]]:[]);
  let now=0,timerId=0;const timers=new Map();
  globalThis.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,at:now+ms});return timerId;};globalThis.clearTimeout=id=>timers.delete(id);
  function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',hidden:false,textContent:'',style:{},offsetHeight:800,dataset:{},attributes:{},classes:new Set(),classList:{toggle(name,enabled){const classes=node(selector).classes;if(enabled)classes.add(name);else classes.delete(name);}},setAttribute(k,v){this.attributes[k]=v;},focus(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){},elements:{}});return nodes.get(selector);}
  node('#setup-form').elements=Object.fromEntries([...Array.from({length:5},(_,i)=>[`team-${i}`,{value:`UI ${i+1}`}]),...[20,40,25,10,5].map((n,i)=>[`odds-${i}`,{value:String(n)}])]);
  globalThis.document={querySelector:node,querySelectorAll:()=>[0,1,2].map(i=>{const n=node(`card-${i}`);n.dataset.revealIndex=String(i);return n;}),addEventListener:(event,fn)=>listeners.set(event,fn)};
  globalThis.window={scrollY:0,scrollTo(options){this.scrollY=options.top;}};
  globalThis.localStorage={getItem:key=>{if(brokenStorage)throw Error('Storage denied');return storage.get(key)||null;},setItem:(key,v)=>{if(brokenStorage)throw Error('Storage denied');storage.set(key,v);},removeItem:key=>storage.delete(key)};
  globalThis.fetch=async()=>({ok:true,json:async()=>data});
  await import(`../dist/games/fut-draft/app.js?smoke=${++bootId}`);
  await new Promise(resolve=>setImmediate(resolve));
  return {
    html:()=>node('#main').innerHTML.replace(/<!--live-content-start-->[\s\S]*?<!--live-content-end-->/,original=>node('#live-content').innerHTML||original),
    state:()=>JSON.parse(storage.get(STORAGE_KEY)),
    submit:()=>listeners.get('submit')({target:{id:'setup-form'},preventDefault(){}}),
    click:(id='',dataset={})=>listeners.get('click')({target:{closest:()=>({id,dataset,disabled:false,hasAttribute:attr=>attr==='data-new-game'&&dataset.newGame!==undefined})}}),
    change:(id,value)=>listeners.get('change')({target:{id,value}}),
    input:(id,value)=>listeners.get('input')({target:{id,value}}),
    advance:ms=>{const end=now+ms;let count=0;while(timers.size){const [id,timer]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(timer.at>end)break;assert.ok(++count<10000);timers.delete(id);now=timer.at;timer.fn();}now=end;},
    node,
  };
}
test('UI event flow reaches cup, hides locked choices and resumes behind handoff screen',async()=>{
  let ui=await environment();assert.match(ui.html(),/Masayı kur/);ui.submit();
  let s=ui.state();assert.equal(s.phase,'draft');
  for(let pick=0;pick<33;pick++){
    const t=s.teams[activeSeat(s)],position=Object.keys(LIMITS).find(pos=>t.roster.filter(p=>p.position===pos).length<LIMITS[pos]);
    ui.click('',{position});
    if(t.joker)ui.click('toggle-joker');
    ui.click('open-pack');ui.advance(900);s=ui.state();assert.equal(s.pack.options.length,3);
    ui.click('',{pick:String(s.pack.options[0].id)});s=ui.state();
  }
  assert.match(ui.html(),/Cihazı/);assert.doesNotMatch(ui.html(),/data-protect=/);
  for(let round=0;round<2;round++){
    while(s.phase==='steal'){
      ui.click('private-ready');assert.match(ui.html(),/data-protect=/);assert.match(ui.html(),/data-target=/);
      const i=activeSeat(s),v=stealVictim(s,i);
      assert.equal((ui.html().match(/class="panel steal-team/g)||[]).length,3);
      assert.match(ui.html(),/SENDEN ÇALACAK RAKİP/);
      ui.click('',{protect:String(s.stealSnapshot[i][1].id)});ui.click('',{target:String(s.stealSnapshot[v][0].id)});
      assert.doesNotMatch(ui.html(),/id="lock-choices" disabled/);
      ui.click('lock-choices');s=ui.state();
      if(s.phase==='steal'){
        assert.doesNotMatch(ui.html(),/data-protect=|data-target=/);
        ui=await environment(s);assert.match(ui.html(),/Cihazı/);assert.doesNotMatch(ui.html(),/data-protect=/);
      }
    }
    assert.match(ui.html(),/Kim kimi hedefledi/);ui.click('exchange-start');s=ui.state();
    while(s.phase==='exchange'){
      const option=ui.html().match(/data-compensation="(\d+)"/);assert.ok(option);
      ui.click('',{compensation:option[1]});s=ui.state();
    }
    ui.click('steal-next');s=ui.state();
  }
  assert.equal(s.phase,'tournament');assert.match(ui.html(),/KURA GECESİ/);ui.click('draw-all');ui.click('draw-finish');assert.match(ui.html(),/1\. HAFTAYI SİMÜLE ET/);
  ui.click('simulate');ui.advance(200000);s=ui.state();assert.equal(s.tournament.week,1);assert.match(ui.html(),/Lig · 1\. hafta/);
  assert.match(ui.html(),/Maçın akışı ve pozisyonlar/);assert.match(ui.html(),/Tehlikeli fırsat/);
  ui=await environment(s);assert.match(ui.html(),/2\. HAFTAYI SİMÜLE ET/);
  ui.click('',{cupView:'table'});assert.match(ui.html(),/<table>/);assert.match(ui.html(),/UI 1/);
  let cupSteps=0;while(s.tournament.stage!=='done'){assert.ok(++cupSteps<80,JSON.stringify({stage:s.tournament.stage,live:s.tournament.live?.minute,notice:ui.node('#notice').textContent}));if(drawPending(s.tournament)){ui.click('draw-all');ui.click('draw-finish');s=ui.state();}for(const team of pendingUpgrades(s.tournament)){ui.click('',{upgradeSkip:team.id});s=ui.state();}for(const team of pendingMatchPlans(s.tournament)){assert.match(ui.html(),/PLANI KİLİTLE/);ui.node('#plan-tempo-'+team.id).value='high';ui.node('#plan-style-'+team.id).value='counter';ui.click('',{lockPlan:team.id});}ui.click('simulate');ui.advance(200000);s=ui.state();}
  assert.match(ui.html(),/FUT DRAFT KAZANANI/);assert.match(ui.html(),/zafer senin/);
  ui.click('',{cupView:'bracket'});assert.match(ui.html(),/bracket-column/);
  ui.click('',{cupView:'squads'});assert.match(ui.html(),/Kadro dosyası/);
  assert.match(ui.html(),/chemistry-lines/);assert.match(ui.html(),/MODEL 6/);
  ui.change('cup-squad-select','12');assert.match(ui.html(),/TAKIM GÜCÜ/);
  assert.match(ui.html(),/Kulüp kimyası · uygulanmaz/);assert.match(ui.html(),/Kulüp bonusu yok/);
  ui.click('restart');assert.ok(ui.node('#reset-dialog').open);ui.click('confirm-reset');assert.match(ui.html(),/Masayı kur/);
});

test('draft maintains viewport and prevents picks until the sequential reveal finishes',async()=>{
  const ui=await environment();ui.submit();
  window.scrollY=420;
  ui.click('open-pack');let s=ui.state();assert.equal(window.scrollY,420);
  ui.click('',{pick:String(s.pack.options[0].id)});assert.equal(ui.state().picks,0);
  ui.advance(100);assert.equal(ui.node('card-0').attributes['aria-hidden'],'false');assert.equal(ui.node('card-1').attributes['aria-hidden'],'true');
  ui.advance(240);assert.equal(ui.node('card-1').attributes['aria-hidden'],'false');assert.equal(ui.node('card-2').attributes['aria-hidden'],'true');
  ui.advance(240);assert.equal(ui.node('card-2').attributes['aria-hidden'],'false');assert.ok(ui.node('card-2').disabled);
  ui.advance(300);assert.equal(ui.node('card-2').disabled,false);
  ui.click('',{pick:String(s.pack.options[0].id)});assert.equal(ui.state().picks,1);assert.equal(window.scrollY,420);
});

test('participant color selection and in-game recoloring are retained',async()=>{
  const ui=await environment();
  ui.click('',{setupColor:'0:pink'});assert.match(ui.html(),/data-setup-color="0:pink"/);
  ui.submit();assert.equal(ui.state().teams[0].color,'pink');
  ui.click('colors-button');assert.ok(ui.node('#colors-dialog').open);
  ui.click('',{teamColor:'0:red'});assert.equal(ui.state().teams[0].color,'red');assert.match(ui.node('#colors-content').innerHTML,/0:red/);
});
test('blocked storage still allows play, corrupt saves recover and team names are HTML escaped',async()=>{
  let ui=await environment(null,true);assert.match(ui.html(),/kayıt kullanılamıyor/);ui.submit();assert.match(ui.html(),/DRAFT MASASI/);
  ui=await environment({version:99});assert.match(ui.html(),/KAYIT OKUNAMADI/);
  ui.click('confirm-reset');ui.node('#setup-form').elements['team-0'].value='<img src=x onerror=alert(1)>';
  ui.submit();assert.match(ui.node('#form-error').textContent,/24 karakter/);
  ui.node('#setup-form').elements['team-0'].value='<b>Takım</b>';ui.submit();assert.doesNotMatch(ui.html(),/<b>Takım<\/b>/);
});

test('quarterfinal UI requires plans, saves each lock and reveals tactics only after playing',async()=>{
  const {createGame,createTournament}=await import('../dist/games/fut-draft/rules.js');
  let saved=createGame(['Plan A','Plan B','Plan C'],undefined,19);const used=new Set();
  for(const team of saved.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&!used.has(p.id)).slice(0,n)){used.add(p.id);team.roster.push(p);}
  saved.picks=33;saved.phase='tournament';saved.tournament=createTournament(saved,data,{version:4});
  const t=saved.tournament,ids=t.teams.slice(0,8).map(t=>t.id);t.history=[{stage:'league',matches:[],label:'Lig',number:1}];t.stage='quarter';t.leagueRanking=t.teams.map(t=>t.id);t.bracket=[{stage:'quarter',leg:0,ties:Array.from({length:4},(_,i)=>({a:ids[i*2],b:ids[i*2+1],matches:[]}))}];
  let ui=await environment(saved);assert.match(ui.html(),/id="simulate" disabled/);
  for(const team of pendingMatchPlans(saved.tournament)){
    ui.node('#plan-tempo-'+team.id).value='high';ui.node('#plan-style-'+team.id).value='counter';ui.click('',{lockPlan:team.id});saved=ui.state();
    assert.doesNotMatch(ui.html(),new RegExp('id="plan-tempo-'+team.id+'"'));
    ui=await environment(saved);assert.doesNotMatch(ui.html(),new RegExp('id="plan-tempo-'+team.id+'"'));
  }
  assert.doesNotMatch(ui.html(),/id="simulate" disabled/);ui.click('simulate');ui.advance(200000);
  assert.equal(ui.state().tournament.bracket.at(-1).leg,1);assert.match(ui.html(),/Yüksek tempo · Kontra atak/);assert.match(ui.html(),/İsabetli şut/);assert.match(ui.html(),/id="simulate" disabled/);
});

test('upgrade UI opens three cards sequentially, survives reload, swaps the player and shows scorer names',async()=>{
 const {createGame,createTournament}=await import('../dist/games/fut-draft/rules.js');
 let s=createGame(['Upgrade A','Upgrade B','Upgrade C'],undefined,33),used=new Set();
 for(const team of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&p.overall<=76&&!used.has(p.id)).slice(0,n)){team.roster.push(p);used.add(p.id);}
 s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data,{version:5});const t=s.tournament;t.stage='r16';t.history=[{stage:'league',matches:[],label:'Lig',number:1}];t.leagueRanking=t.teams.map(t=>t.id);t.bracket=[{stage:'r16',leg:0,ties:Array.from({length:8},(_,i)=>({a:t.teams[i*2].id,b:t.teams[i*2+1].id,matches:[]}))}];
 let ui=await environment(s);assert.match(ui.html(),/KADRO YÜKSELTME/);assert.match(ui.html(),/id="simulate" disabled/);
 const id=s.teams[0].id,old=s.teams[0].roster[0];ui.click('',{upgradePlayer:String(old.id)});ui.click('',{upgradeOpen:id});s=ui.state();const pack=s.tournament.upgrades.r16[id].pack;assert.equal(pack.options.length,3);assert.match(ui.html(),/data-upgrade-pick=/);
 ui.click('',{upgradePick:String(pack.options[0].id),upgradeTeam:id});assert.equal(ui.state().tournament.upgrades.r16[id].done,false);
 ui.advance(900);ui=await environment(ui.state());ui.click('',{upgradePick:String(pack.options[0].id),upgradeTeam:id});s=ui.state();assert.equal(s.tournament.upgrades.r16[id].done,true);assert.ok(s.teams[0].roster.some(p=>p.id===pack.options[0].id));
 for(const team of pendingUpgrades(s.tournament)){ui.click('',{upgradeSkip:team.id});s=ui.state();}
 ui.click('simulate');ui.advance(200000);s=ui.state();const goal=s.tournament.history.at(-1).matches.flatMap(m=>m.events)[0];assert.ok(goal?.playerName);assert.ok(ui.html().includes(goal.playerName.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.equal(s.tournament.bracket.at(-1).leg,1);
});

test('draw timer reveals one opponent at a time and full XI selection exposes eleven pitch buttons',async()=>{
 const {createGame,createTournament}=await import('../dist/games/fut-draft/rules.js');let s=createGame(['Draw A','Draw B','Draw C'],undefined,22);const used=new Set();for(const team of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&p.overall<=76&&!used.has(p.id)).slice(0,n)){team.roster.push(p);used.add(p.id);}s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data);
 let ui=await environment(s);assert.match(ui.html(),/Güç sırasına göre 4 torba/);assert.equal(ui.state().tournament.draw.revealed,0);ui.advance(649);assert.equal(ui.state().tournament.draw.revealed,0);ui.advance(1);assert.equal(ui.state().tournament.draw.revealed,1);
 ui=await environment(ui.state());assert.equal(ui.state().tournament.draw.revealed,1);ui.click('draw-all');assert.equal((ui.html().match(/fixture-column team-panel/g)||[]).length,3);ui.click('draw-finish');
 s=ui.state();s.tournament.history=[{stage:'league',matches:[],label:'Lig',number:1}];s.tournament.stage='r16';s.tournament.leagueRanking=s.tournament.teams.map(t=>t.id);s.tournament.bracket=[{stage:'r16',leg:0,ties:[{a:s.teams[0].id,b:s.teams[1].id,matches:[]}]}];
 ui=await environment(s);assert.equal((ui.html().match(/data-upgrade-player=/g)||[]).length,11);assert.doesNotMatch(ui.html(),/id="upgrade-player"/);assert.match(ui.html(),/data-upgrade-open="human-0" disabled/);ui.click('',{upgradePlayer:String(s.teams[0].roster[0].id)});assert.doesNotMatch(ui.html(),/data-upgrade-open="human-0" disabled/);
});
test('live UI has one shared minute, pauses and changes speed, reloads paused, and never leaks final scorers',async()=>{
 const {createGame,createTournament}=await import('../dist/games/fut-draft/rules.js');let s=createGame(['Live A','Live B','Live C'],undefined,21);const used=new Set();for(const team of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&!used.has(p.id)).slice(0,n)){team.roster.push(p);used.add(p.id);}s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data);const t=s.tournament;t.draw.done=true;t.draw.revealed=t.draw.total;t.stage='playoff';t.history=[{stage:'league',matches:[],label:'Lig',number:1}];t.leagueRanking=t.teams.map(t=>t.id);t.bracket=[{stage:'playoff',leg:0,ties:[{a:t.teams[0].id,b:t.teams[3].id,matches:[]}]}];
 let ui=await environment(s);ui.click('simulate');s=ui.state();assert.equal(s.tournament.live.minute,0);assert.match(ui.html(),/CANLI MAÇ GÜNÜ/);const future=s.tournament.live.result.history.at(-1).matches[0].events[0];assert.ok(future);assert.ok(!ui.html().includes(future.playerName));
 ui.advance(2000);assert.equal(ui.state().tournament.live.minute,10);ui.click('live-toggle');ui.advance(5000);assert.equal(ui.state().tournament.live.minute,10);ui.click('live-faster');assert.equal(ui.state().tournament.live.speed,2);ui.click('live-toggle');ui.advance(400);assert.equal(ui.state().tournament.live.minute,14);
 ui=await environment(ui.state());assert.equal(ui.state().tournament.live.paused,true);ui.advance(3000);assert.equal(ui.state().tournament.live.minute,14);ui.click('live-toggle');ui.advance(200000);assert.equal(ui.state().tournament.live,undefined);assert.equal(ui.state().tournament.bracket.at(-1).leg,1);
});

async function playbackFixture(stage='league'){
 const {createGame,createTournament}=await import('../dist/games/fut-draft/rules.js');const s=createGame(['Playback A','Playback B','Playback C'],undefined,4371),used=new Set();
 for(const team of s.teams)for(const [position,n] of Object.entries(LIMITS))for(const p of data.players.filter(p=>p.position===position&&!used.has(p.id)).slice(0,n)){team.roster.push(p);used.add(p.id);}
 s.picks=33;s.phase='tournament';s.tournament=createTournament(s,data);const t=s.tournament;t.draw.done=true;t.draw.revealed=t.draw.total;
 if(stage!=='league'){t.stage=stage;t.history=[{stage:'league',matches:[],label:'Lig',number:1}];t.leagueRanking=t.teams.map(t=>t.id);t.bracket=[{stage,leg:0,ties:[{a:t.teams[0].id,b:t.teams[3].id,matches:[]}]}];}
 return s;
}
test('live controls remain mounted across ticks; one click and one slider input change speed and instant finishes',async()=>{
 const ui=await environment(await playbackFixture('playoff'));ui.click('simulate');const toolbar=ui.node('#main').innerHTML;
 ui.advance(400);assert.equal(ui.node('#main').innerHTML,toolbar);assert.equal(ui.state().tournament.live.minute,2);
 ui.click('live-faster');assert.equal(ui.state().tournament.live.speed,2);assert.equal(ui.node('#main').innerHTML,toolbar);ui.advance(100);assert.equal(ui.state().tournament.live.minute,3);
 ui.input('live-speed','4');assert.equal(ui.state().tournament.live.speed,8);assert.equal(ui.node('#live-speed-label').textContent,'8× hız');ui.advance(25);assert.equal(ui.state().tournament.live.minute,4);
 ui.click('live-slower');assert.equal(ui.state().tournament.live.speed,4);ui.click('live-instant');assert.equal(ui.state().tournament.live,undefined);assert.equal(ui.state().tournament.bracket.at(-1).leg,1);
});
test('league results reveal one at a time and the instant button reveals the saved remaining results',async()=>{
 const ui=await environment(await playbackFixture());ui.click('simulate');assert.equal(ui.state().tournament.live.mode,'league');assert.match(ui.html(),/İLK SONUÇ BEKLENİYOR/);assert.equal(ui.state().tournament.week,0);
 ui.advance(649);assert.equal(ui.state().tournament.live.minute,0);ui.advance(1);assert.equal(ui.state().tournament.live.minute,1);assert.match(ui.html(),/YENİ AÇILAN SONUÇ · 1\/18/);ui.advance(650);assert.equal(ui.state().tournament.live.minute,2);assert.equal(ui.state().tournament.history.length,0);assert.doesNotMatch(ui.html(),/YENİ AÇILAN SONUÇ · 18/);
 ui.click('live-instant');assert.equal(ui.state().tournament.week,1);assert.equal(ui.state().tournament.history[0].matches.length,18);
});
test('a user penalty shootout takes full focus and reveals a single kick each 1.8 seconds even at 8x',async()=>{
 const s=await playbackFixture('final'),t=s.tournament,home=t.teams[0],away=t.teams[3],kicks=[];let ph=0,pa=0;for(const [i,scored] of [true,true,true,true,false,true,true,false,true,false].entries()){if(i%2===0)ph+=scored?1:0;else pa+=scored?1:0;kicks.push({side:i%2===0?'home':'away',round:Math.floor(i/2)+1,scored,home:ph,away:pa});}
 const m={home:home.id,away:away.id,hg:1,ag:1,modelVersion:6,extra:{home:0,away:0},penalties:{home:4,away:3,kicks},events:[{minute:20,team:home.id,playerName:home.roster[10].name},{minute:50,team:away.id,playerName:away.roster[10].name}]};
 const result=structuredClone(t);result.history.push({stage:'final',number:1,label:'Final',matches:[m]});result.stage='done';result.champion=home.id;result.gameWinner=home.id;result.eliminated[home.id]='champion';result.eliminated[away.id]='final';t.live={mode:'knockout',minute:119,speed:8,paused:false,duration:132,result,rng:s.rng};
 const ui=await environment(s);ui.click('live-toggle');ui.advance(25);assert.equal(ui.state().tournament.live.minute,120);assert.match(ui.html(),/PENALTI ODAĞI/);assert.doesNotMatch(ui.html(),/DİĞER MAÇLAR/);assert.match(ui.html(),/İlk vuruş bekleniyor/);assert.equal(ui.node('#live-faster').disabled,true);
 ui.advance(1799);assert.equal(ui.state().tournament.live.minute,120);ui.advance(1);assert.equal(ui.state().tournament.live.minute,121);assert.match(ui.html(),/1\. vuruş · ⚽ GOL/);assert.doesNotMatch(ui.html(),/penaltılarla kazandı/);
 ui.click('live-toggle');ui.advance(5000);assert.equal(ui.state().tournament.live.minute,121);ui.click('live-toggle');ui.advance(200000);assert.equal(ui.state().tournament.live,undefined);assert.equal(ui.state().tournament.champion,home.id);
});

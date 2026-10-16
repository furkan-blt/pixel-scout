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
  node('#setup-form').elements=Object.fromEntries([...Array.from({length:5},(_,i)=>[`team-${i}`,{value:`UI ${i+1}`}]),...[20,30,30,15,5].map((n,i)=>[`odds-${i}`,{value:String(n)}])]);
  globalThis.document={querySelector:node,querySelectorAll:()=>[0,1,2].map(i=>{const n=node(`card-${i}`);n.dataset.revealIndex=String(i);return n;}),addEventListener:(event,fn)=>listeners.set(event,fn)};
  globalThis.window={scrollY:0,scrollTo(options){this.scrollY=options.top;}};
  globalThis.localStorage={getItem:key=>{if(brokenStorage)throw Error('Storage denied');return storage.get(key)||null;},setItem:(key,v)=>{if(brokenStorage)throw Error('Storage denied');storage.set(key,v);},removeItem:key=>storage.delete(key)};
  globalThis.fetch=async()=>({ok:true,json:async()=>data});
  await import(`../dist/games/fut-draft/app.js?smoke=${++bootId}`);
  await new Promise(resolve=>setImmediate(resolve));
  return {
    html:()=>node('#main').innerHTML,
    state:()=>JSON.parse(storage.get(STORAGE_KEY)),
    submit:()=>listeners.get('submit')({target:{id:'setup-form'},preventDefault(){}}),
    click:(id='',dataset={})=>listeners.get('click')({target:{closest:()=>({id,dataset,disabled:false,hasAttribute:attr=>attr==='data-new-game'&&dataset.newGame!==undefined})}}),
    change:(id,value)=>listeners.get('change')({target:{id,value}}),
    advance:ms=>{const end=now+ms;for(const [id,timer] of [...timers].sort((a,b)=>a[1].at-b[1].at)){if(timer.at<=end){timers.delete(id);now=timer.at;timer.fn();}}now=end;},
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
  assert.equal(s.phase,'tournament');assert.match(ui.html(),/1\. HAFTAYI SİMÜLE ET/);
  ui.click('simulate');s=ui.state();assert.equal(s.tournament.week,1);assert.match(ui.html(),/Lig · 1\. hafta/);
  ui=await environment(s);assert.match(ui.html(),/2\. HAFTAYI SİMÜLE ET/);
  ui.click('',{cupView:'table'});assert.match(ui.html(),/<table>/);assert.match(ui.html(),/UI 1/);
  while(s.tournament.stage!=='done'){ui.click('simulate');s=ui.state();}
  assert.match(ui.html(),/FUT DRAFT KAZANANI/);assert.match(ui.html(),/zafer senin/);
  ui.click('',{cupView:'bracket'});assert.match(ui.html(),/bracket-column/);
  ui.click('',{cupView:'squads'});assert.match(ui.html(),/Kadro dosyası/);
  ui.change('cup-squad-select','12');assert.match(ui.html(),/TAKIM GÜCÜ/);
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

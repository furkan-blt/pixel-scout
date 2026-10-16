// Application event/render smoke tests with a DOM boundary stub; no browser layout claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LIMITS,activeSeat,STORAGE_KEY} from '../dist/games/fut-draft/rules.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/games/fut-draft/players.json',import.meta.url)));
let bootId=0;
async function environment(saved=null,brokenStorage=false){
  const nodes=new Map(),listeners=new Map(),storage=new Map(saved?[[STORAGE_KEY,JSON.stringify(saved)]]:[]);
  function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',hidden:false,textContent:'',classList:{toggle(){}},focus(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){},elements:{}});return nodes.get(selector);}
  node('#setup-form').elements=Object.fromEntries([...Array.from({length:5},(_,i)=>[`team-${i}`,{value:`UI ${i+1}`}]),...[20,30,30,15,5].map((n,i)=>[`odds-${i}`,{value:String(n)}])]);
  globalThis.document={querySelector:node,addEventListener:(event,fn)=>listeners.set(event,fn)};
  globalThis.window={scrollY:0,scrollTo(){}};
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
    ui.click('open-pack');s=ui.state();assert.equal(s.pack.options.length,3);
    ui.click('',{pick:String(s.pack.options[0].id)});s=ui.state();
  }
  assert.match(ui.html(),/Cihazı/);assert.doesNotMatch(ui.html(),/data-protect=/);
  for(let round=0;round<2;round++){
    while(s.phase==='steal'){
      ui.click('private-ready');assert.match(ui.html(),/data-protect=/);assert.match(ui.html(),/data-target=/);
      const i=activeSeat(s),v=(i+1)%s.teams.length;
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
test('blocked storage still allows play, corrupt saves recover and team names are HTML escaped',async()=>{
  let ui=await environment(null,true);assert.match(ui.html(),/kayıt kullanılamıyor/);ui.submit();assert.match(ui.html(),/DRAFT MASASI/);
  ui=await environment({version:99});assert.match(ui.html(),/KAYIT OKUNAMADI/);
  ui.click('confirm-reset');ui.node('#setup-form').elements['team-0'].value='<img src=x onerror=alert(1)>';
  ui.submit();assert.match(ui.node('#form-error').textContent,/24 karakter/);
  ui.node('#setup-form').elements['team-0'].value='<b>Takım</b>';ui.submit();assert.doesNotMatch(ui.html(),/<b>Takım<\/b>/);
});

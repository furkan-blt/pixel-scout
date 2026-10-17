import {SIMULATION_VERSION,expectedGoals,simulateOpportunities,qualificationRisk,profileForTeam,penaltyProbability} from './simulation-v4.js';
import {simulateOpportunities as simulateV3} from './simulation-v3.js';
import {SEASON,SEASON_TEAMS} from './season-data.js';
import {TEMPOS,STYLES,DEFAULT_PLAN,planKey,matchPlanWindow,pendingMatchPlans,computerPlan} from './match-plans.js';
export {teamProfile,profileForTeam} from './simulation-v4.js';
export const COLORS = [{id:'lime',label:'Yeşil',hex:'#cbf477'},{id:'blue',label:'Mavi',hex:'#78b6ff'},{id:'orange',label:'Turuncu',hex:'#ffb36b'},{id:'purple',label:'Mor',hex:'#c5a1ff'},{id:'pink',label:'Pembe',hex:'#ff94c3'},{id:'red',label:'Kırmızı',hex:'#ff7f79'},{id:'cyan',label:'Turkuaz',hex:'#68d7d1'},{id:'yellow',label:'Sarı',hex:'#f4d76e'}];
export const POSITIONS = { GK:'Kaleci', DEF:'Defans', MID:'Orta saha', ATT:'Forvet' };
export const LIMITS = { GK:1, DEF:4, MID:3, ATT:3 };
export const ODDS = [20,40,25,10,5];
export const STORAGE_KEY = 'pixel-scout:fut-draft:v1';
const check = (ok,message) => { if (!ok) throw new Error(message); };
const copy = value => structuredClone(value);
const mean = list => list.reduce((a,b)=>a+b,0)/list.length;

export function random(state) {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}
function shuffle(state,values) {
  const result = [...values];
  for(let i=result.length-1;i>0;i--){ const j=Math.floor(random(state)*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export const tierOf = overall => overall>=85 ? 1 : overall>=81 ? 2 : overall>=77 ? 3 : overall>=73 ? 4 : 5;
export function activeSeat(state) {
  if(state.phase==='draft') return (state.first+Math.floor(state.picks/state.teams.length)+state.picks%state.teams.length)%state.teams.length;
  return state.order[state.cursor];
}
export const stealVictim = (state,seat) => (seat+(state.stealOffset??1))%state.teams.length;
export const stealAttacker = (state,seat) => (seat-(state.stealOffset??1)+state.teams.length)%state.teams.length;
export function createGame(names,odds=ODDS,seed=1,colors=COLORS.slice(0,names.length).map(c=>c.id)) {
  check(names.length>=3&&names.length<=5,'3–5 katılımcı gerekli.');
  check(names.every(n=>typeof n==='string'&&n.trim()&&n.trim().length<=24),'Takım adları 1–24 karakter olmalı.');
  check(new Set(names.map(n=>n.trim().toLocaleLowerCase('tr'))).size===names.length,'Takım adları farklı olmalı.');
  check(odds.length===5&&odds.every(n=>Number.isInteger(n)&&n>=0&&n<=100)&&odds.reduce((a,b)=>a+b,0)===100,'Olasılıklar toplamı %100 olmalı.');
  check(colors.length===names.length&&new Set(colors).size===colors.length&&colors.every(id=>COLORS.some(c=>c.id===id)),'Her katılımcı sekiz renkten farklı bir renk seçmeli.');
  const state = {version:1,rulesVersion:2,phase:'draft',rng:(seed>>>0)||1,odds:[...odds],picks:0,pack:null,teams:names.map((name,i)=>({id:`human-${i}`,name:name.trim(),color:colors[i],roster:[],joker:true})),stealRound:0,stealHistory:[],tournament:null};
  state.first=Math.floor(random(state)*names.length);
  return state;
}
function beginSteal(state) {
  state.phase='steal'; state.cursor=0; state.locks={};
  state.stealOffset=state.stealRound+1;
  state.order=Array.from({length:state.teams.length},(_,i)=>(state.first+state.stealRound+i)%state.teams.length);
  state.stealSnapshot=state.teams.map(t=>copy(t.roster));
}
export function compensationOptions(state) {
  const move=state.moves[state.cursor];
  if(!move)return [];
  const reserved=new Set(state.moves.map(m=>m.target));
  const roster=state.teams[move.thief].roster;
  const originals=roster.filter(p=>p.position===move.position&&!reserved.has(p.id));
  return originals.length?originals:roster.filter(p=>p.id===move.target);
}
function completeSteal(state,catalogue) {
  assertSquads(state.teams);
  state.stealHistory.push({round:state.stealRound+1,results:copy(state.results),moves:copy(state.moves)});
  state.phase='steal-summary';
}
export function transition(previous,catalogue,action) {
  const state=copy(previous);
  if(action.type==='open') {
    check(state.phase==='draft'&&!state.pack,'Bu aşamada kutu açılamaz.');
    const team=state.teams[activeSeat(state)],pos=action.position;
    check(Object.hasOwn(LIMITS,pos)&&team.roster.filter(p=>p.position===pos).length<LIMITS[pos],'Bu mevki dolu.');
    check(!action.joker||team.joker,'Joker zaten kullanıldı.');
    const used=new Set(state.teams.flatMap(t=>t.roster.map(p=>p.id)));
    const pool=catalogue.players.filter(p=>p.position===pos&&!used.has(p.id));
    const available=[1,2,3,4,5].filter(level=>pool.filter(p=>tierOf(p.overall)===level).length>=3);
    let level=1;
    if(!action.joker){
      const total=available.reduce((sum,l)=>sum+state.odds[l-1],0);
      check(total>0,'Bu mevki için yeterli futbolcu kalmadı.');
      let roll=random(state)*total;
      level=available.find(l=>(roll-=state.odds[l-1])<0)??available.at(-1);
    }
    check(available.includes(level),'Bu seviyede üç futbolcu kalmadı.');
    state.pack={position:pos,level,joker:!!action.joker,options:shuffle(state,pool.filter(p=>tierOf(p.overall)===level)).slice(0,3)};
    if(action.joker)team.joker=false;
  } else if(action.type==='pick') {
    check(state.phase==='draft'&&state.pack,'Önce bir kutu aç.');
    const player=state.pack.options.find(p=>p.id===action.id);
    check(player,'Kutudaki futbolculardan birini seç.');
    state.teams[activeSeat(state)].roster.push(player);
    state.picks++; state.pack=null;
    if(state.picks===state.teams.length*11){assertSquads(state.teams);beginSteal(state);}
  } else if(action.type==='lock') {
    check(state.phase==='steal','Gizli seçim aşaması tamamlandı.');
    const seat=activeSeat(state),victim=stealVictim(state,seat);
    check(state.stealSnapshot[seat].some(p=>p.id===action.protect),'Koruyacağın futbolcuyu seç.');
    check(state.stealSnapshot[victim].some(p=>p.id===action.target),'Çalacağın futbolcuyu seç.');
    state.locks[seat]={protect:action.protect,target:action.target};
    state.cursor++;
    if(state.cursor===state.teams.length){
      state.results=state.order.map(thief=>{const victim=stealVictim(state,thief);return {thief,victim,target:state.locks[thief].target,protected:state.locks[victim].protect,success:state.locks[thief].target!==state.locks[victim].protect};});
      state.phase='steal-reveal';
    }
  } else if(action.type==='exchange-start') {
    check(state.phase==='steal-reveal','Önce seçimler açıklanmalı.');
    state.moves=state.results.filter(r=>r.success).map(r=>({...r,position:state.stealSnapshot[r.victim].find(p=>p.id===r.target).position}));
    // Reserve every successful target before any compensation is chosen.
    for(const m of state.moves)state.teams[m.victim].roster=state.teams[m.victim].roster.filter(p=>p.id!==m.target);
    for(const m of state.moves)state.teams[m.thief].roster.push(copy(state.stealSnapshot[m.victim].find(p=>p.id===m.target)));
    state.cursor=0; state.phase='exchange';
    if(!state.moves.length)completeSteal(state,catalogue);
  } else if(action.type==='compensate') {
    check(state.phase==='exchange','Takas aşamasında değilsin.');
    const player=compensationOptions(state).find(p=>p.id===action.id);
    check(player,'Aynı mevkiden uygun bir futbolcu seç.');
    const move=state.moves[state.cursor]; move.compensation=player.id;
    state.teams[move.thief].roster=state.teams[move.thief].roster.filter(p=>p.id!==player.id);
    state.teams[move.victim].roster.push(player);
    state.cursor++;
    if(state.cursor===state.moves.length)completeSteal(state,catalogue);
  } else if(action.type==='steal-next') {
    check(state.phase==='steal-summary','Çalma turu tamamlanmalı.');
    if(state.stealRound===0){state.stealRound=1;beginSteal(state);}
    else{state.phase='tournament';state.tournament=createTournament(state,catalogue);delete state.locks;delete state.stealSnapshot;}
  } else if(action.type==='color') {
    const team=state.teams.find(t=>t.id===action.team);
    check(team&&COLORS.some(c=>c.id===action.color)&&!state.teams.some(t=>t.id!==team.id&&t.color===action.color),'Başka katılımcının kullanmadığı bir renk seç.');
    team.color=action.color;
    if(state.tournament)state.tournament.teams.find(t=>t.id===team.id).color=action.color;
  } else if(action.type==='match-plan') {
    const t=state.tournament;
    check(state.phase==='tournament'&&t&&pendingMatchPlans(t).some(team=>team.id===action.team),'Bu takım şu anda maç planı seçemez.');
    check(Object.hasOwn(TEMPOS,action.tempo)&&Object.hasOwn(STYLES,action.style),'Geçersiz maç planı.');
    t.matchPlans??={};t.matchPlans[planKey(t)]??={};
    t.matchPlans[planKey(t)][action.team]={tempo:action.tempo,style:action.style};
  } else if(action.type==='simulate') {
    check(state.phase==='tournament'&&state.tournament.stage!=='done','Simüle edilecek maç kalmadı.');
    check(pendingMatchPlans(state.tournament).length===0,'Sahaya çıkacak katılımcılar maç planını kilitlemeli.');
    advanceTournament(state);
  } else throw new Error('Bilinmeyen işlem.');
  return state;
}
export function assertSquads(teams) {
  const ids=new Set();
  for(const team of teams){
    check(team.roster.length===11,'Kadro 11 kişi olmalı.');
    for(const [position,count] of Object.entries(LIMITS))check(team.roster.filter(p=>p.position===position).length===count,'Mevki dengesi bozuldu.');
    for(const p of team.roster){check(!ids.has(p.id),'Futbolcu tekrar ediyor.');ids.add(p.id);}
  }
  return true;
}
export function teamStrength(roster) {
  return Object.fromEntries(Object.keys(LIMITS).map(pos=>[pos,mean(roster.filter(p=>p.position===pos).map(p=>p.overall))]));
}
const EUROPEAN_LEAGUES = ['Premier League','LALIGA EA SPORTS','Serie A Enilive',"Ligue 1 McDonald's",'Bundesliga','Liga Portugal','Eredivisie','Trendyol Süper Lig','Scottish Prem','Belgium Pro League','Belgian Pro League','1A Pro League','Ö. Bundesliga'];
export function legacyComputerTeams(catalogue) {
  const clubs=new Map();
  for(const p of catalogue.players){
    if(!EUROPEAN_LEAGUES.includes(p.league))continue;
    if(!clubs.has(p.clubId))clubs.set(p.clubId,{id:`club-${p.clubId}`,name:p.club,roster:[]});
    clubs.get(p.clubId).roster.push(p);
  }
  return [...clubs.values()].map(t=>({...t,roster:Object.entries(LIMITS).flatMap(([pos,n])=>t.roster.filter(p=>p.position===pos).sort((a,b)=>b.overall-a.overall||a.id-b.id).slice(0,n))})).filter(t=>t.roster.length===11).map(t=>({...t,human:false,strength:teamStrength(t.roster),overall:mean(t.roster.map(p=>p.overall))})).sort((a,b)=>b.overall-a.overall||a.name.localeCompare(b.name));
}

export function computerTeams(catalogue,{legacy=false}={}) {
  if(legacy)return legacyComputerTeams(catalogue);
  return copy(SEASON_TEAMS).map(t=>({...t,strength:teamStrength(t.roster),overall:mean(t.roster.map(p=>p.overall))})).sort((a,b)=>b.overall-a.overall||a.name.localeCompare(b.name));
}

// The ring has two opponents from each of four pots and exactly 4 home / 4 away.
// Factor its 8-regular graph into eight perfect matchings (one per matchday).
export function leagueSchedule(state,teams) {
  const ranked=[...teams].sort((a,b)=>b.overall-a.overall||a.id.localeCompare(b.id));
  const pots=Array.from({length:4},(_,i)=>shuffle(state,ranked.slice(i*9,i*9+9)));
  const ring=Array.from({length:36},(_,i)=>pots[i%4][Math.floor(i/4)].id);
  const edges=[];
  for(let i=0;i<36;i++)for(let d=1;d<=4;d++)edges.push({home:ring[i],away:ring[(i+d)%36],a:i,b:(i+d)%36});
  for(let attempt=0;attempt<240;attempt++){
    const remaining=new Map(edges.map((e,i)=>[i,e])),weeks=[];
    let failed=false;
    for(let round=0;round<8;round++){
      const adjacency=Array.from({length:36},()=>[]);
      for(const [id,e] of remaining){adjacency[e.a].push({id,other:e.b});adjacency[e.b].push({id,other:e.a});}
      let budget=12000;
      function match(unused,picked){
        if(!unused.size)return picked;
        if(--budget<=0)return null;
        let vertex=-1,options;
        for(const v of unused){const opts=adjacency[v].filter(e=>unused.has(e.other));if(!opts.length)return null;if(!options||opts.length<options.length){vertex=v;options=opts;}}
        for(const e of shuffle(state,options)){
          const next=new Set(unused);next.delete(vertex);next.delete(e.other);
          const found=match(next,[...picked,e.id]);if(found)return found;
        }
        return null;
      }
      const matching=match(new Set(Array.from({length:36},(_,i)=>i)),[]);
      if(!matching){failed=true;break;}
      weeks.push(matching.map(id=>{const e=remaining.get(id);remaining.delete(id);return {home:e.home,away:e.away};}));
    }
    if(!failed)return {weeks:shuffle(state,weeks),pots:pots.map(p=>p.map(t=>t.id))};
  }
  throw new Error('Fikstür oluşturulamadı. Tekrar dene.');
}
export function createTournament(state,catalogue,{version=SIMULATION_VERSION,legacyClubPool=false}={}) {
  const humans=state.teams.map(t=>({...copy(t),human:true,strength:teamStrength(t.roster),overall:mean(t.roster.map(p=>p.overall))}));
  const bots=computerTeams(catalogue,{legacy:legacyClubPool}).slice(0,36-humans.length);
  check(bots.length===36-humans.length,'36 takımlık turnuva için yeterli kulüp yok.');
  const teams=[...humans,...bots];
  const {weeks,pots}=leagueSchedule(state,teams);
  return {simulationVersion:version,season:legacyClubPool?null:SEASON,matchPlans:{},teams,weeks,pots,stage:'league',week:0,history:[],bracket:[],eliminated:{},leagueRanking:[],champion:null,gameWinner:null};
}
function poisson(state,lambda) {
  const stop=Math.exp(-lambda);let p=1,k=0;
  do {k++;p*=random(state);}while(p>stop&&k<20);
  return k-1;
}
export function simulateMatch(state,home,away,neutral=false,version=SIMULATION_VERSION,context={}) {
  if(version>=3)return (version>=4?simulateOpportunities:simulateV3)(()=>random(state),home,away,neutral,context);
  const expectation=expectedGoals(home,away,neutral,version);
  return {home:home.id,away:away.id,neutral,hg:poisson(state,expectation.lambdaHome),ag:poisson(state,expectation.lambdaAway),...expectation};
}
export function standings(tournament) {
  const rows=new Map(tournament.teams.map(t=>[t.id,{id:t.id,name:t.name,human:t.human,p:0,w:0,d:0,l:0,gf:0,ga:0,ag:0,aw:0,pts:0,opponents:[]}]));
  for(const week of tournament.history.filter(h=>h.stage==='league'))for(const m of week.matches){
    const h=rows.get(m.home),a=rows.get(m.away);h.p++;a.p++;h.gf+=m.hg;h.ga+=m.ag;a.gf+=m.ag;a.ga+=m.hg;a.ag+=m.ag;
    h.opponents.push(a.id);a.opponents.push(h.id);
    if(m.hg>m.ag){h.w++;a.l++;h.pts+=3;}else if(m.ag>m.hg){a.w++;a.aw++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}
  }
  const values=[...rows.values()];
  for(const r of values){r.gd=r.gf-r.ga;r.oppPts=r.opponents.reduce((s,id)=>s+rows.get(id).pts,0);r.oppGd=r.opponents.reduce((s,id)=>s+rows.get(id).gf-rows.get(id).ga,0);r.oppGf=r.opponents.reduce((s,id)=>s+rows.get(id).gf,0);}
  return values.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||b.ag-a.ag||b.w-a.w||b.aw-a.aw||b.oppPts-a.oppPts||b.oppGd-a.oppGd||b.oppGf-a.oppGf||a.id.localeCompare(b.id));
}
function makeTie(state,tournament,a,b,group=null) {
  const ranking=tournament.leagueRanking;
  const [high,low]=ranking.indexOf(a)<ranking.indexOf(b)?[a,b]:[b,a];
  return {a:high,b:low,group,matches:[],winner:null,aggregate:null};
}
function setupRound(state,tournament,stage,ties) {
  tournament.stage=stage;
  tournament.bracket.push({stage,leg:0,ties});
}
function setupPlayoffs(state,t) {
  const rank=standings(t).map(r=>r.id);t.leagueRanking=rank;
  rank.slice(24).forEach(id=>t.eliminated[id]='league');
  const ties=[];
  for(let g=0;g<4;g++){
    const seeded=shuffle(state,rank.slice(8+g*2,10+g*2)),unseeded=shuffle(state,rank.slice(22-g*2,24-g*2));
    seeded.forEach((id,i)=>ties.push(makeTie(state,t,id,unseeded[i],g)));
  }
  setupRound(state,t,'playoff',ties);
}
function setupLast16(state,t) {
  const previous=t.bracket.at(-1),rank=t.leagueRanking,groupWinners=Array.from({length:4},(_,g)=>shuffle(state,previous.ties.filter(x=>x.group===g).map(x=>x.winner)));
  const topPairs=Array.from({length:4},(_,g)=>shuffle(state,rank.slice(g*2,g*2+2)));
  // Opposite halves for ranks 1/2, 3/4, 5/6 and 7/8.
  const seeds=[topPairs[0][0],topPairs[3][0],topPairs[1][0],topPairs[2][0],topPairs[0][1],topPairs[3][1],topPairs[1][1],topPairs[2][1]];
  const ties=seeds.map(id=>{const group=3-Math.floor(rank.indexOf(id)/2);return makeTie(state,t,id,groupWinners[group].pop());});
  setupRound(state,t,'r16',ties);
}
function settleTie(state,t,tie,final) {
  let a=0,b=0;
  for(const m of tie.matches){a+=m.home===tie.a?m.hg:m.ag;b+=m.home===tie.b?m.hg:m.ag;}
  const last=tie.matches.at(-1);
  if(a===b){
    let eh,ea;
    if(last.modelVersion>=3){
      const home=t.teams.find(x=>x.id===last.home),away=t.teams.find(x=>x.id===last.away);
      const first=tie.matches.length>1?tie.matches[0]:null;
      const extra=(last.modelVersion>=4?simulateOpportunities:simulateV3)(()=>random(state),home,away,final,{homePlan:last.plans?.home,awayPlan:last.plans?.away,initialHome:last.hg,initialAway:last.ag,aggregateHome:first?(first.home===home.id?first.hg:first.ag):0,aggregateAway:first?(first.home===away.id?first.hg:first.ag):0},30,90);
      eh=extra.hg;ea=extra.ag;last.lambdaHome+=extra.lambdaHome;last.lambdaAway+=extra.lambdaAway;
      last.events.push(...extra.events);
      for(const side of ['home','away'])for(const key of Object.keys(last.stats[side]))last.stats[side][key]+=extra.stats[side][key];
    }else{eh=poisson(state,last.lambdaHome/3);ea=poisson(state,last.lambdaAway/3);}
    last.extra={home:eh,away:ea};last.hg+=eh;last.ag+=ea;
    a+=last.home===tie.a?eh:ea;b+=last.home===tie.b?eh:ea;
  }
  if(a!==b)tie.winner=a>b?tie.a:tie.b;
  else{
    let ph=0,pa=0,kicks=0;
    const home=t.teams.find(x=>x.id===last.home),away=t.teams.find(x=>x.id===last.away);
    const hp=last.modelVersion>=4?penaltyProbability(home,away):.76,ap=last.modelVersion>=4?penaltyProbability(away,home):.76;
    // Five kicks each, with early clinches and then paired sudden death.
    for(let i=0;i<5;i++){
      ph+=random(state)<hp?1:0;
      if(ph>pa+(5-i)||pa>ph+(4-i)){kicks=i+1;break;}
      pa+=random(state)<ap?1:0;kicks=i+1;
      if(Math.abs(ph-pa)>4-i)break;
    }
    while(ph===pa&&kicks<100){ph+=random(state)<hp?1:0;pa+=random(state)<ap?1:0;kicks++;}
    if(ph===pa){if(random(state)<.5)ph++;else pa++;}
    last.penalties={home:ph,away:pa};
    tie.winner=ph>pa?last.home:last.away;
  }
  tie.aggregate={a,b};
  const loser=tie.winner===tie.a?tie.b:tie.a;
  t.eliminated[loser]=final?'final':t.stage;
}
function advanceTournament(state) {
  const t=state.tournament,lookup=new Map(t.teams.map(team=>[team.id,team]));
  if(t.stage==='league'){
    if(t.week===8){setupPlayoffs(state,t);return;}
    const table=standings(t);
    const plans=new Map(table.map(row=>[row.id,qualificationRisk(table,row.id,t.week)]));
    const matches=t.weeks[t.week].map(m=>simulateMatch(state,lookup.get(m.home),lookup.get(m.away),false,t.simulationVersion??1,{home:plans.get(m.home),away:plans.get(m.away)}));
    t.week++;t.history.push({stage:'league',number:t.week,label:`Lig · ${t.week}. hafta`,matches});return;
  }
  const round=t.bracket.at(-1),final=t.stage==='final';
  if(round.leg===(final?1:2)){
    const next={playoff:'r16',r16:'quarter',quarter:'semi',semi:'final'}[t.stage];
    if(next==='r16')setupLast16(state,t);
    else {const winners=round.ties.map(x=>x.winner);setupRound(state,t,next,Array.from({length:winners.length/2},(_,i)=>makeTie(state,t,winners[i*2],winners[i*2+1])));}
    return;
  }
  const leg=round.leg+1,matches=[];
  for(const tie of round.ties){
    const [h,a]=final||leg===2?[tie.a,tie.b]:[tie.b,tie.a];
    const first=leg===2?tie.matches[0]:null;
    const context={aggregateHome:first?(first.home===h?first.hg:first.ag):0,aggregateAway:first?(first.home===a?first.hg:first.ag):0};
    if(matchPlanWindow(t)){
      const choices=t.matchPlans?.[planKey(t)]??{};
      const planFor=(id,other)=>lookup.get(id).human?(choices[id]??DEFAULT_PLAN):computerPlan(profileForTeam(lookup.get(id)),profileForTeam(lookup.get(other)));
      context.homePlan=planFor(h,a);context.awayPlan=planFor(a,h);
    }
    const match=simulateMatch(state,lookup.get(h),lookup.get(a),final,t.simulationVersion??1,context);tie.matches.push(match);
    if(final||leg===2)settleTie(state,t,tie,final);
    matches.push(copy(match));
  }
  round.leg=leg;
  const labels={playoff:'Play-off',r16:'Son 16',quarter:'Çeyrek final',semi:'Yarı final',final:'Final'};
  t.history.push({stage:t.stage,number:leg,label:final?'Final':`${labels[t.stage]} · ${leg}. maçlar`,matches});
  if(final){
    t.champion=round.ties[0].winner;t.eliminated[t.champion]='champion';
    const score={league:0,playoff:1,r16:2,quarter:3,semi:4,final:5,champion:6};
    t.gameWinner=[...t.teams.filter(x=>x.human)].sort((a,b)=>score[t.eliminated[b.id]]-score[t.eliminated[a.id]]||t.leagueRanking.indexOf(a.id)-t.leagueRanking.indexOf(b.id))[0].id;
    t.stage='done';
  }
}

export function migrateSaved(saved) {
  const state=copy(saved);
  state.teams.forEach((team,i)=>{team.color??=COLORS[i].id;if(state.tournament){const t=state.tournament.teams.find(t=>t.id===team.id);if(t)t.color=team.color;}});
  // Already locked targets keep their original opponents; an untouched round can rotate.
  state.stealOffset??=state.phase==='steal'&&state.cursor===0?state.stealRound+1:1;
  if(state.tournament){
    if(state.tournament.history.length===0)state.tournament.simulationVersion=SIMULATION_VERSION;
    else state.tournament.simulationVersion??=1;
  }
  if(state.phase==='draft'&&state.odds.join(',')==='20,30,30,15,5')state.odds=[...ODDS];
  state.rulesVersion=2;
  return state;
}
export function validateSaved(state,catalogue) {
  try{
    check(state.version===1&&['draft','steal','steal-reveal','exchange','steal-summary','tournament'].includes(state.phase),'Kayıt sürümü geçersiz.');
    check(state.teams.length>=3&&state.teams.length<=5&&Number.isInteger(state.rng)&&state.rng>0,'Kayıt eksik.');
    const colors=state.teams.map(t=>t.color).filter(c=>c!==undefined);
    check((colors.length===0||colors.length===state.teams.length)&&new Set(colors).size===colors.length&&colors.every(id=>COLORS.some(c=>c.id===id)),'Takım renkleri geçersiz.');
    check(state.stealOffset===undefined||state.stealOffset===1||state.stealOffset===2,'Çalma rakibi geçersiz.');
    const players=new Map(catalogue.players.map(p=>[p.id,p]));
    const ids=new Set();
    for(const t of state.teams){
      check(typeof t.name==='string'&&t.name.length<=24&&t.roster.length<=12,'Kadro kaydı geçersiz.');
      for(const p of t.roster){check(players.has(p.id)&&JSON.stringify(players.get(p.id))===JSON.stringify(p)&&!ids.has(p.id),'Futbolcu kaydı geçersiz.');ids.add(p.id);}
    }
    if(state.phase!=='draft'&&state.phase!=='exchange')assertSquads(state.teams);
    check(state.odds?.length===5&&state.odds.every(n=>Number.isInteger(n)&&n>=0)&&state.odds.reduce((a,b)=>a+b,0)===100,'Olasılık kaydı geçersiz.');
    check(Number.isInteger(state.picks)&&state.picks>=0&&state.picks<=state.teams.length*11,'Tur kaydı geçersiz.');
    if(state.phase==='draft'){
      check(ids.size===state.picks&&state.picks<state.teams.length*11,'Seçim kaydı geçersiz.');
      if(state.pack){check(state.pack.options.length===3&&new Set(state.pack.options.map(p=>p.id)).size===3,'Kutu kaydı geçersiz.');for(const p of state.pack.options)check(players.has(p.id)&&!ids.has(p.id)&&p.position===state.pack.position&&tierOf(p.overall)===state.pack.level,'Kutu futbolcusu geçersiz.');}
    }
    if(state.phase==='steal')check(state.order?.length===state.teams.length&&state.cursor>=0&&state.cursor<state.teams.length&&state.stealSnapshot?.length===state.teams.length,'Gizli seçim kaydı eksik.');
    if(state.phase==='exchange')check(state.moves?.length>state.cursor&&compensationOptions(state).length>0,'Takas kaydı eksik.');
    if(state.phase==='tournament')check(state.tournament?.teams?.length===36&&state.tournament.weeks?.length===8&&Array.isArray(state.tournament.history)&&['league','playoff','r16','quarter','semi','final','done'].includes(state.tournament.stage),'Turnuva kaydı eksik.');
    return true;
  }catch{return false;}
}

import {POSITIONS,LIMITS,ODDS,STORAGE_KEY,createGame,activeSeat,transition,tierOf,compensationOptions,standings,validateSaved,teamStrength,COLORS,stealVictim,stealAttacker,migrateSaved,profileForTeam} from './rules.js';
import {formationSlots,chemistryPairs,chemistryNetwork} from './chemistry.js';
import {createPackReveal} from './pack-reveal.js';

const $=selector=>document.querySelector(selector);
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avg=roster=>roster.length?(roster.reduce((s,p)=>s+p.overall,0)/roster.length).toFixed(1):'—';
const STAGES={league:'Lig aşaması',playoff:'Play-off',r16:'Son 16',quarter:'Çeyrek final',semi:'Yarı final',final:'Final',champion:'Şampiyon',done:'Turnuva tamamlandı'};
let catalogue,state=null,participantCount=3,names=['Takım 1','Takım 2','Takım 3','Takım 4','Takım 5'],odds=[...ODDS];
let selectedPosition='ATT',useJoker=false,squadSeat=0,privateOpen=false,protect=null,target=null,cupView='matches',historyIndex=-1;
let storageWorks=true,corruptSave=false,noticeTimer;
let teamColors=COLORS.slice(0,5).map(c=>c.id),revealedCards=3,packRevealing=false;
const reveal=createPackReveal((count,running)=>{
  revealedCards=count;packRevealing=running;
  document.querySelectorAll('[data-reveal-index]').forEach(card=>{
    const visible=Number(card.dataset.revealIndex)<count;
    card.classList.toggle('is-concealed',!visible);
    card.classList.toggle('is-revealed',visible);
    card.disabled=running;
    card.setAttribute('aria-hidden',String(!visible));
  });
  const status=$('#reveal-status');if(status)status.textContent=running?'Kartlar sırayla açılıyor…':'Üç kart açık. Seçimini yap.';
});
const colorHex=team=>COLORS.find(c=>c.id===team?.color)?.hex||'#a4b4a5';
const teamDot=team=>'<i class="team-dot" style="--team-color:'+colorHex(team)+'" aria-hidden="true"></i>';
function colorChoices(seat,current,selectedColors=teamColors.slice(0,participantCount),inGame=false){
  return '<div class="color-choices" role="group" aria-label="'+(seat+1)+'. katılımcı rengi">'+COLORS.map(c=>'<button type="button" class="color-choice" style="--team-color:'+c.hex+'" aria-label="'+c.label+'" aria-pressed="'+(current===c.id)+'" data-'+(inGame?'team-color':'setup-color')+'="'+seat+':'+c.id+'" '+(selectedColors.some((id,i)=>i!==seat&&id===c.id)?'disabled':'')+'><span aria-hidden="true">'+(current===c.id?'✓':'')+'</span></button>').join('')+'</div>';
}
function refreshColorsDialog(){
  $('#colors-content').innerHTML=state.teams.map((t,i)=>'<section class="color-setting"><b>'+teamDot(t)+h(t.name)+'</b>'+colorChoices(i,t.color,state.teams.map(x=>x.color),true)+'</section>').join('');
}

function notify(message,error=false){
  const box=$('#notice');box.textContent=message;box.hidden=false;box.classList.toggle('error',error);
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>box.hidden=true,9000);
}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  catch{if(storageWorks)notify('Tarayıcı kaydı kullanılamıyor. Bu sekmeyi kapatmadan oyunu tamamlayabilirsin.');storageWorks=false;}
}
function apply(action){
  try{
    if(action.type==='pick'&&packRevealing)return;
    const oldHistory=state.tournament?.history.length||0;
    state=transition(state,catalogue,action);
    if(action.type==='open'){
      reveal.stop();revealedCards=0;packRevealing=true;
    }
    if(action.type==='pick'){reveal.stop();useJoker=false;if(state.phase==='draft')squadSeat=activeSeat(state);}
    if(action.type==='lock'||action.type==='steal-next'){privateOpen=false;protect=null;target=null;}
    if(action.type==='simulate'){historyIndex=state.tournament.history.length>oldHistory?state.tournament.history.length-1:-1;cupView='matches';}
    save();render();
    if(action.type==='open')reveal.start();
    if(['lock','exchange-start','compensate','steal-next'].includes(action.type))window.scrollTo({top:0,behavior:'instant'});
  }catch(error){notify(error.message,true);}
}

function stageProgress(){
  const current=!state||state.phase==='draft'?0:state.phase==='tournament'?2:1;
  return `<div class="process" aria-label="Oyun aşamaları">${['01 DRAFT','02 GİZLİ ÇALMA','03 AVRUPA KUPASI'].map((label,i)=>`<span class="${i===current?'active':i<current?'done':''}" ${i===current?'aria-current="step"':''}>${label}</span>`).join('')}</div>`;
}
function levelStrip(weights=state?.odds||odds){return `<div class="level-strip" aria-label="Seviye olasılıkları">${weights.map((weight,i)=>`<div class="tier-${i+1}"><b>%${weight}</b><span>${i+1}. SEVİYE · ${['85+','81–84','77–80','73–76','70–72'][i]}</span></div>`).join('')}</div>`;}
function pitch(roster=[],{clubEligible=true}={}){
  const slots=formationSlots(roster),pairs=chemistryPairs(roster,{clubEligible}),edges=chemistryNetwork(slots,{clubEligible});
  const name=id=>roster.find(p=>p.id===id)?.name||'';
  const label=edge=>edge.club&&edge.nation?'Kulüp + milliyet':edge.club?'Aynı kulüp':'Aynı milliyet';
  const lines=edges.map(e=>`<line class="chem-link ${e.club&&e.nation?'both':e.club?'club':'nation'}" x1="${e.x1*4}" y1="${e.y1*4.2}" x2="${e.x2*4}" y2="${e.y2*4.2}"><title>${h(name(e.a))} ↔ ${h(name(e.b))}: ${label(e)}</title></line>`).join('');
  return `<div class="pitch-with-chemistry"><div class="pitch chem-pitch" aria-label="4-3-3 kadro ve kimya bağlantıları"><svg class="chemistry-lines" viewBox="0 0 400 420" preserveAspectRatio="none" role="img" aria-label="${edges.length} kimya bağlantı çizgisi">${lines}</svg>${slots.map(slot=>{
    const p=slot.player,connected=p&&pairs.some(e=>e.a===p.id||e.b===p.id);
    return `<div class="pitch-player ${p?'tier-'+tierOf(p.overall):'empty'} ${connected?'chem-linked':''}" style="left:${slot.x}%;top:${slot.y}%" ${p?`title="${h(p.name)} · ${h(p.club)} · ${h(p.country||'—')}"`:''}><strong>${p?p.overall:'+'}</strong><span>${p?h(p.name):POSITIONS[slot.position]}</span></div>`;
  }).join('')}</div>${roster.length>1?`<div class="chem-legend">${clubEligible?'<span><i class="club"></i>Kulüp</span>':''}<span><i class="nation"></i>Milliyet</span>${clubEligible?'<span><i class="both"></i>İkisi</span>':'<span>Kulüp bonusu yok</span>'}</div><details class="chemistry-details"><summary>Kimya bağları · ${pairs.length}</summary>${pairs.length?`<ul>${pairs.map(e=>`<li>${h(name(e.a))} ↔ ${h(name(e.b))}<small>${label(e)}</small></li>`).join('')}</ul>`:'<p>Ortak kulüp veya milliyet bağı yok.</p>'}</details>`:''}</div>`;
}

function squadPanel(){
  squadSeat=Math.min(squadSeat,state.teams.length-1);
  const team=state.teams[squadSeat];
  return `<aside class="panel team-panel" style="--team-color:${colorHex(team)}"><div class="tabs" role="tablist" aria-label="Katılımcı kadroları">${state.teams.map((t,i)=>`<button type="button" role="tab" aria-selected="${i===squadSeat}" data-squad="${i}">${teamDot(t)}${h(t.name)}</button>`).join('')}</div><div class="panel-body"><div class="pitch-meta"><strong>${teamDot(team)}${h(team.name)}</strong><span>${team.roster.length}/11 · 4-3-3</span></div>${pitch(team.roster)}<div class="squad-footer"><span>${team.joker?'✦ Joker hazır':'✦ Joker kullanıldı'}</span><span class="score-badge">ORT. ${avg(team.roster)}</span></div></div></aside>`;
}

function setup(){
  return `<section class="hero"><div><span class="eyebrow">MASADA DRAFT. SAHADA REKABET.</span><h1>KADRONU KUR.<br><em>AVRUPA'YI FETHET.</em></h1><p>11 seçim, iki gizli çalma turu, tek kupa.<br>Arkadaşlarını topla. Kimin futbol aklı daha iyi, sahada görelim.</p><div class="badges"><span class="badge live">● 3–5 KİŞİ</span><span class="badge">AYNI CİHAZDA</span><span class="badge">FC 27 OVERALL</span><span class="badge">36 TAKIMLIK TURNUVA</span></div></div><div class="hero-stamp" aria-hidden="true"><span>TEK HEDEF</span><strong>★</strong><span>AVRUPA KUPASI</span></div></section><div class="setup-grid"><section class="panel"><div class="panel-heading"><h2>Masayı kur.</h2><span>Yeni FUT Draft</span></div><form id="setup-form" class="panel-body"><span class="field-label">KAÇ KİŞİ OYNUYORUZ?</span><div class="segments" role="group" aria-label="Katılımcı sayısı">${[3,4,5].map(n=>`<button type="button" data-count="${n}" aria-pressed="${participantCount===n}">${n}</button>`).join('')}</div><div class="names">${Array.from({length:participantCount},(_,i)=>`<div class="participant-setting"><label>${i+1}. KATILIMCI<input name="team-${i}" maxlength="24" value="${h(names[i])}" required autocomplete="off" aria-label="${i+1}. katılımcı takım adı"></label>${colorChoices(i,teamColors[i])}</div>`).join('')}</div><details class="odds-settings"><summary>Seviye olasılıklarını düzenle <span class="small">· toplam %100</span></summary><div class="odds-fields">${odds.map((n,i)=>`<label>${i+1}. seviye %<input type="number" name="odds-${i}" min="0" max="100" step="1" value="${n}" required></label>`).join('')}</div></details>${levelStrip(odds)}<p id="form-error" class="form-error" role="alert" hidden></p><button type="submit" class="primary full">DRAFT'I BAŞLAT <span aria-hidden="true">→</span></button><p class="muted small">İlk sıra rastgele. Her yeni turda ilk seçen değişir.<br>${storageWorks?'Oyun bu tarayıcıda otomatik kaydedilir.':'Bu tarayıcıda kayıt kullanılamıyor; sekmeyi açık tut.'}</p></form></section><aside class="panel pitch-preview"><div class="panel-body"><div class="pitch-meta"><strong>SENİN İLK 11'İN</strong><span>4-3-3</span></div>${pitch()}<div class="mini-steps"><div><b>01 / SEÇ</b><span>Üç futbolcu.<br>Tek karar.</span></div><div><b>02 / ÇAL</b><span>Koru, hedefle.<br>Kimseye söyleme.</span></div><div><b>03 / KAZAN</b><span>Hafta hafta<br>kupaya yürü.</span></div></div></div></aside></div><p class="source-note">${catalogue.players.length.toLocaleString('tr-TR')} futbolcu · Standart FC 27 kartları · LM/RM dahil kanatlar forvet grubunda · 16 Ekim 2026 veri görüntüsü</p>`;
}
function draftScreen(){
  const seat=activeSeat(state),team=state.teams[seat],round=Math.floor(state.picks/state.teams.length)+1;
  if(team.roster.filter(p=>p.position===selectedPosition).length>=LIMITS[selectedPosition])selectedPosition=Object.keys(LIMITS).find(pos=>team.roster.filter(p=>p.position===pos).length<LIMITS[pos]);
  const order=Array.from({length:state.teams.length},(_,i)=>(state.first+round-1+i)%state.teams.length);
  return `${stageProgress()}<div class="game-title"><div><span class="eyebrow">DRAFT MASASI · SIRA SENDE</span><h1>${teamDot(team)}${h(team.name)}, seçimini yap.</h1><p>${team.roster.length} futbolcu seçildi. Bir sonraki yıldızını bul.</p></div><div class="round-number">${String(round).padStart(2,'0')}<small> / 11</small></div></div><div class="turn-order" aria-label="Bu turun seçim sırası">${order.map(i=>`<span class="${i===seat?'current':''}">${teamDot(state.teams[i])}${i===seat?'▶ ':''}${h(state.teams[i].name)}</span>`).join('')}</div><div class="game-grid"><section class="panel draft-choice"><div class="panel-heading"><h2>${state.pack?'Üç seçenek. Tek forma.':'Hangi bölgeye transfer?'}</h2><span>${state.pack?`${POSITIONS[state.pack.position]} kutusu`:'Önce mevki seç'}</span></div><div class="panel-body">${state.pack?packScreen():`<div class="position-grid" role="group" aria-label="Transfer mevkisi">${Object.entries(POSITIONS).map(([pos,name])=>{const count=team.roster.filter(p=>p.position===pos).length;return `<button type="button" class="position-choice" data-position="${pos}" aria-pressed="${selectedPosition===pos}" ${count>=LIMITS[pos]?'disabled':''}><strong>${name}</strong><span>${count}/${LIMITS[pos]}</span></button>`;}).join('')}</div><button type="button" class="joker" id="toggle-joker" aria-pressed="${useJoker}" ${!team.joker?'disabled':''}><span class="star" aria-hidden="true">✦</span><span><b>${team.joker?'1. SEVİYE JOKERİ':'JOKER KULLANILDI'}</b><small>${team.joker?'Bir kez. İstediğin mevkide. Üç elit seçenek.':'Bu draft için başka jokerin yok.'}</small></span><span class="check" aria-hidden="true">${useJoker?'✓':'+'}</span></button><div class="pack-placeholder" aria-hidden="true"><div class="sealed-card">?</div><div class="sealed-card">✦</div><div class="sealed-card">?</div></div><button type="button" class="primary full" id="open-pack">${useJoker?'JOKERLE 1. SEVİYE KUTU AÇ':'OYUNCU KUTUSUNU AÇ'} →</button>${levelStrip()}<p class="muted small">${useJoker?'Bu seçimde şansa gerek yok: 1. seviye garanti.':'Seviye şansa bağlı. Üç futbolcudan birini sen seçersin.'} Seçilmeyenler havuza döner.</p>`}</div></section>${squadPanel()}</div>`;
}
function packScreen(){
  const pack=state.pack;
  return `<p class="pack-label tier-${pack.level}">${pack.joker?'✦ JOKER · ':''}${pack.level}. SEVİYE AÇILDI</p><div class="cards">${pack.options.map((p,i)=>`<button type="button" class="player-card tier-${pack.level} ${i<revealedCards?'is-revealed':'is-concealed'}" data-reveal-index="${i}" data-pick="${p.id}" aria-hidden="${i>=revealedCards}" ${packRevealing?'disabled':''} aria-label="${h(p.name)}, ${p.overall} overall, ${h(p.club)}; kadroya ekle"><span class="card-rating">${p.overall}</span><span class="card-position">${h(p.detailPosition)}</span><span class="card-name">${h(p.name)}</span><span class="card-club">${h(p.club)}<br>${h(p.country||'')}</span><span class="card-pick">KADROYA EKLE ↗</span></button>`).join('')}</div><p id="reveal-status" class="muted small" role="status" aria-live="polite">${packRevealing?'Kartlar sırayla açılıyor…':'Üç kart açık. Seçimini yap.'}</p>`;
}

function rosterSelect(roster,kind,selected){return `<div class="select-roster" role="group" aria-label="${kind==='protect'?'Korunacak':'Çalınacak'} futbolcu">${['GK','DEF','MID','ATT'].flatMap(pos=>roster.filter(p=>p.position===pos)).map(p=>`<button type="button" class="select-player tier-${tierOf(p.overall)}" data-${kind}="${p.id}" aria-pressed="${selected===p.id}"><strong>${p.overall}</strong><span class="player-info">${h(p.name)}<small>${POSITIONS[p.position]} · ${h(p.club)} · ${h(p.country||'—')}</small></span><span class="selection-dot" aria-hidden="true"></span></button>`).join('')}</div>`;}
function stealScreen(){
  const seat=activeSeat(state),team=state.teams[seat],victimSeat=stealVictim(state,seat),attackerSeat=stealAttacker(state,seat),victim=state.teams[victimSeat];
  if(!privateOpen)return `${stageProgress()}<section class="panel secret-gate"><div class="secret-icon" aria-hidden="true">◈</div><span class="eyebrow">GİZLİ ÇALMA · ${state.stealRound+1}/2</span><h2>${teamDot(team)}Cihazı ${h(team.name)}<br>katılımcısına ver.</h2><p>Bir futbolcunu koru, ${h(victim.name)} kadrosundan bir futbolcuyu hedefle. ${state.stealRound===1?'Bu tur hedef rakibin değişti. ':''}İki seçimin birlikte kilitlenecek; herkes bitirince açılacak.</p><div class="secret-progress">${state.cursor}/${state.teams.length} katılımcı seçimini kilitledi</div><button type="button" class="primary" id="private-ready">HAZIRIM, SEÇİMLERİMİ YAP →</button></section>`;
  const ordered=[seat,victimSeat,...state.teams.map((_,i)=>i).filter(i=>i!==seat&&i!==victimSeat)];
  const boards=ordered.map(i=>{
    const t=state.teams[i],own=i===seat,beingTargeted=i===victimSeat,incoming=i===attackerSeat;
    const role=own?'◈ KORUYACAĞIN KADRO':beingTargeted?'↗ ÇALACAĞIN KADRO':incoming?'↙ SENDEN ÇALACAK RAKİP':'DİĞER RAKİP';
    return `<section class="panel steal-team team-panel" style="--team-color:${colorHex(t)}"><div class="panel-heading"><div><span class="steal-role">${role}${beingTargeted&&incoming?' · SENDEN DE ÇALIYOR':''}</span><h2>${teamDot(t)}${h(t.name)}</h2></div><span>ORT. ${avg(t.roster)}</span></div><div class="panel-body">${own?rosterSelect(state.stealSnapshot[i],'protect',protect):beingTargeted?rosterSelect(state.stealSnapshot[i],'target',target):`<div class="read-only-roster">${state.stealSnapshot[i].map(p=>`<div class="select-player tier-${tierOf(p.overall)}"><strong>${p.overall}</strong><span class="player-info">${h(p.name)}<small>${POSITIONS[p.position]} · ${h(p.club)} · ${h(p.country||'—')}</small></span></div>`).join('')}</div>`}</div></section>`;
  }).join('');
  return `${stageProgress()}<div class="private-banner"><span>${teamDot(team)}<b>${h(team.name)}</b> · Sadece sen bak.</span><button type="button" id="hide-private">Ekranı gizle</button></div><div class="game-title"><div><span class="eyebrow">GİZLİ ÇALMA · ${state.stealRound+1}/2</span><h1>Koru. Hedefle. Kilitle.</h1><p>${h(victim.name)} kadrosundan çalacaksın. ${h(state.teams[attackerSeat].name)} senin kadrondan çalacak. Koruma seçimleri gizli kalır.</p></div></div><div class="steal-boards" data-team-count="${state.teams.length}">${boards}</div><div class="lock-bar"><p>Tüm kadrolar görünür; diğerlerinin koruma ve çalma seçimleri görünmez.<br>İki seçimini kilitledikten sonra değiştiremezsin.</p><button type="button" class="primary" id="lock-choices" ${protect===null||target===null?'disabled':''}>İKİ SEÇİMİ KİLİTLE →</button></div>`;
}

function player(id){return catalogue.players.find(p=>p.id===id);}
function outcomes(results,moves=[]){return `<div class="outcomes">${results.map(r=>{const compensation=moves.find(m=>m.thief===r.thief)?.compensation;return `<article class="outcome ${r.success?'':'blocked'}"><span class="result-label">${r.success?'↗ ÇALMA BAŞARILI':'◈ KORUMAYA TAKILDI'}</span><b>${h(state.teams[r.thief].name)} → ${h(state.teams[r.victim].name)}</b><p>Hedef: <strong>${h(player(r.target).name)}</strong> · Korunan: ${h(player(r.protected).name)}${compensation?`<br>Takas karşılığı: <strong>${h(player(compensation).name)}</strong>`:''}${!r.success?'<br>Çalma hakkı bu tur için sona erdi.':''}</p></article>`;}).join('')}</div>`;}
function revealScreen(){return `${stageProgress()}<div class="game-title"><div><span class="eyebrow">${state.stealRound+1}. ÇALMA TURU · SEÇİMLER AÇILDI</span><h1>Kim kimi hedefledi?</h1><p>Başarılı hedefler ayrılır; ardından aynı mevkide takas yapılır.</p></div></div>${outcomes(state.results)}<div class="actions"><button type="button" class="primary" id="exchange-start">${state.results.some(r=>r.success)?'TAKASLARI TAMAMLA':'TURU TAMAMLA'} →</button></div>`;}
function exchangeScreen(){
  const move=state.moves[state.cursor],team=state.teams[move.thief],incoming=player(move.target),options=compensationOptions(state);
  squadSeat=move.thief;
  return `${stageProgress()}<div class="game-title"><div><span class="eyebrow">TAKAS ${state.cursor+1}/${state.moves.length} · ${state.stealRound+1}. ÇALMA TURU</span><h1>${h(team.name)}, karşılığını seç.</h1><p>Her takas aynı ana mevkide yapılır.</p></div></div><div class="game-grid"><section class="panel"><div class="panel-body"><div class="transfer-banner"><span class="eyebrow">GELEN FUTBOLCU · ${POSITIONS[incoming.position]}</span><h2>${h(incoming.name)} <span class="score-badge">${incoming.overall}</span></h2><p class="muted small">${h(state.teams[move.victim].name)} kadrosundan ayrıldı.</p></div><p class="muted">${h(state.teams[move.victim].name)} kadrosuna vereceğin ${POSITIONS[incoming.position].toLocaleLowerCase('tr')} futbolcusunu seç.</p>${options.length===1&&options[0].id===move.target?'<p class="form-error">Bu mevkide başka uygun futbolcun kalmadı. Yeni gelen futbolcuyu geri vermelisin.</p>':''}${rosterSelect(options,'compensation',null)}<p class="muted small">Başarıyla çalınan diğer hedefler takas karşılığı olarak seçilemez. Tüm takaslar bitince her kadro 11 kişiye döner.</p></div></section>${squadPanel()}</div>`;
}
function summaryScreen(){return `${stageProgress()}<div class="game-title"><div><span class="eyebrow">${state.stealRound+1}. ÇALMA TURU TAMAMLANDI</span><h1>Transferler tamam.</h1><p>Tüm kadrolar 11 kişi. ${state.stealRound===0?'İkinci turda koruma ve hedefler yeniden seçilecek.':'Sırada Avrupa sahnesi var.'}</p></div></div><div class="game-grid"><section>${outcomes(state.results,state.moves)}<div class="actions"><button type="button" class="primary" id="steal-next">${state.stealRound===0?'2. ÇALMA TURUNA GEÇ':'36 TAKIMLIK TURNUVAYI KUR'} →</button></div></section>${squadPanel()}</div>`;}
function teamName(id){return state.tournament.teams.find(t=>t.id===id)?.name||'—';}
function matchDetails(m){
  if(m.modelVersion!==3)return '';
  const reasons={'must-win':'Galibiyet gerekli','chasing-24':'İlk 24 için risk','at-risk':'İlk 24 çizgisinde','qualified':'İlk 24 garanti','eliminated':'İlk 24 erişilemez'};
  const plans=['home','away'].filter(side=>reasons[m.tactics?.[side]?.reason]).map(side=>`<span class="risk-badge">${h(teamName(m[side]))}: ${reasons[m.tactics[side].reason]}</span>`).join('');
  const stats=m.stats;
  return `${plans?`<div class="risk-notes">${plans}</div>`:''}<details class="match-analysis"><summary>Maçın akışı ve pozisyonlar</summary><div class="chance-stats"><span>Atak</span><b>${stats.home.attacks} – ${stats.away.attacks}</b><span>Tehlikeli fırsat</span><b>${stats.home.dangerous} – ${stats.away.dangerous}</b><span>Şut</span><b>${stats.home.shots} – ${stats.away.shots}</b><span>Tempo</span><b>${m.tempo<.94?'Düşük':m.tempo>1.06?'Yüksek':'Normal'}</b></div><p class="muted small">Risk almak hücum ihtimalini ve rakibe verilen boşluğu artırır.</p>${m.events.length?`<ul class="goal-events">${m.events.map(e=>`<li>${e.minute}' · ${h(teamName(e.team))}</li>`).join('')}</ul>`:'<p class="muted small">Gol olmadı.</p>'}</details>`;
}
function matchCard(m){
  const t=state.tournament,home=t.teams.find(x=>x.id===m.home),away=t.teams.find(x=>x.id===m.away);
  const featured=home.human||away.human,played=Number.isInteger(m.hg);
  const homePower=m.homePower??(t.simulationVersion>=2?profileForTeam(home,t.simulationVersion).rating:null),awayPower=m.awayPower??(t.simulationVersion>=2?profileForTeam(away,t.simulationVersion).rating:null);
  const resultLabel=!played?'MAÇ ÖNCESİ':m.penalties?'PENALTILARLA':m.extra?'UZATMA SONUCU':'MAÇ SONUCU';
  if(featured)return `<article class="match spotlight-match" style="--home-color:${colorHex(home)};--away-color:${colorHex(away)}"><div class="spotlight-top"><span class="tag">★ ${home.human&&away.human?'DRAFT DERBİSİ':'SİZİN MAÇINIZ'}</span><span>${resultLabel}</span></div><div class="spotlight-score"><div class="spotlight-team">${teamDot(home)}<b>${h(home.name)}</b><small>${m.neutral?'TARAFSIZ SAHA':'EV SAHİBİ'}${homePower!==null?' · GÜÇ '+homePower.toFixed(1):''}</small></div><strong class="big-score">${played?`${m.hg}<span>:</span>${m.ag}`:'<span>VS</span>'}</strong><div class="spotlight-team">${teamDot(away)}<b>${h(away.name)}</b><small>${m.neutral?'TARAFSIZ SAHA':'DEPLASMAN'}${awayPower!==null?' · GÜÇ '+awayPower.toFixed(1):''}</small></div></div>${played&&m.modelVersion>=2?`<p class="expectation">Model gol beklentisi <b>${m.lambdaHome.toFixed(2)} – ${m.lambdaAway.toFixed(2)}</b></p>`:''}${matchDetails(m)}${m.extra?`<div class="match-note">Uzatmalar dahil · uzatma: ${m.extra.home}–${m.extra.away}</div>`:''}${m.penalties?`<div class="match-note">Penaltılar: ${m.penalties.home}–${m.penalties.away}</div>`:''}</article>`;
  return `<article class="match"><div class="match-row ${played&&m.hg>m.ag?'winner':''}"><span>${h(home.name)}</span><b>${played?m.hg:'—'}</b></div><div class="match-row ${played&&m.ag>m.hg?'winner':''}"><span>${h(away.name)}</span><b>${played?m.ag:'—'}</b></div>${matchDetails(m)}${m.extra?`<div class="match-note">Uzatmalar dahil · uzatma: ${m.extra.home}–${m.extra.away}</div>`:''}${m.penalties?`<div class="match-note">Penaltılar: ${m.penalties.home}–${m.penalties.away}</div>`:''}</article>`;
}

function nextLabel(){
  const t=state.tournament;
  if(t.stage==='done')return '';
  if(t.stage==='league')return t.week<8?`${t.week+1}. HAFTAYI SİMÜLE ET →`:'PLAY-OFF KURASINI ÇEK →';
  const r=t.bracket.at(-1),final=t.stage==='final';
  if(r.leg===(final?1:2))return `${STAGES[({playoff:'r16',r16:'quarter',quarter:'semi',semi:'final'})[t.stage]].toLocaleUpperCase('tr')} KURASINA GEÇ →`;
  return final?'FİNALİ SİMÜLE ET →':`${r.leg+1}. MAÇLARI SİMÜLE ET →`;
}
function upcoming(){
  const t=state.tournament;
  if(t.stage==='league')return t.week<8?{label:`Lig · ${t.week+1}. hafta fikstürü`,matches:t.weeks[t.week]}:null;
  if(t.stage==='done')return null;
  const r=t.bracket.at(-1),final=t.stage==='final';
  if(r.leg===(final?1:2))return null;
  return {label:final?'Final fikstürü':`${STAGES[t.stage]} · ${r.leg+1}. maçlar`,matches:r.ties.map(tie=>({neutral:final,home:final||r.leg===1?tie.a:tie.b,away:final||r.leg===1?tie.b:tie.a}))};
}
function matchesView(){
  const t=state.tournament,next=upcoming();
  const selected=historyIndex>=0?t.history[historyIndex]:next||t.history.at(-1);
  const options=[...(next?[`<option value="-1" ${historyIndex===-1?'selected':''}>Sıradaki maçlar</option>`]:[]),...t.history.map((entry,i)=>`<option value="${i}" ${historyIndex===i||historyIndex===-1&&!next&&i===t.history.length-1?'selected':''}>${h(entry.label)}</option>`)];
  if(!selected)return '<div class="empty-cup">Fikstür hazırlanıyor.</div>';
  const matches=[...selected.matches].sort((a,b)=>Number(b.home.startsWith('human-')||b.away.startsWith('human-'))-Number(a.home.startsWith('human-')||a.away.startsWith('human-')));
  const featured=matches.filter(m=>[m.home,m.away].some(id=>id.startsWith('human-'))),others=matches.filter(m=>![m.home,m.away].some(id=>id.startsWith('human-')));
  return `<div class="week-toolbar"><h2>${h(selected.label)}</h2><select id="history-select" aria-label="Gösterilecek maç haftası">${options.join('')}</select></div><section class="featured-fixtures" aria-label="Katılımcı maçları"><h3 class="section-label">SİZİN SAHANIZ</h3><div class="spotlight-matches">${featured.map(matchCard).join('')||'<p class="muted">Bu maç gününde katılımcı maçı yok.</p>'}</div></section>${others.length?`<h3 class="section-label">DİĞER MAÇLAR</h3><div class="matches">${others.map(matchCard).join('')}</div>`:''}<p class="stage-note">Maçlar ${state.tournament.stage==='league'?'hafta hafta':'turun maç günü başına'} birlikte simüle edilir. Sonuçlar kaydedilir; önceki maçlara üstteki listeden dönebilirsin.</p>`;
}
function tableView(){return `<div class="table-legend"><span><i></i>1–8: Son 16</span><span><i class="purple"></i>9–24: Play-off</span><span>25–36: Elendi</span></div><div class="table-wrap"><table><caption class="muted" style="text-align:left;padding:12px">Lig aşaması · ${state.tournament.week}/8 hafta</caption><thead><tr><th>#</th><th>TAKIM</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>AV</th><th>PUAN</th></tr></thead><tbody>${standings(state.tournament).map((r,i)=>`<tr class="${r.human?'human ':''}${i<8?'direct':i<24?'playoff':''}"><td class="rank">${i+1}</td><td>${r.human?teamDot(state.teams.find(t=>t.id===r.id)):''}${h(r.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gd>0?'+':''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;}
function bracketView(){
  const t=state.tournament;
  if(!t.bracket.length)return '<div class="empty-cup">Eleme ağacı sekiz lig haftası tamamlanıp play-off kurası çekilince açılacak.</div>';
  return `<div class="bracket">${t.bracket.map(round=>`<section class="bracket-column"><h3>${STAGES[round.stage].toLocaleUpperCase('tr')}</h3>${round.ties.map(tie=>`<article class="match ${[tie.a,tie.b].some(id=>id.startsWith('human-'))?'featured':''}"><div class="match-row ${tie.winner===tie.a?'winner':''}"><span>${h(teamName(tie.a))}</span><b>${tie.aggregate?.a??'—'}</b></div><div class="match-row ${tie.winner===tie.b?'winner':''}"><span>${h(teamName(tie.b))}</span><b>${tie.aggregate?.b??'—'}</b></div><div class="match-note">${tie.matches.length?tie.matches.map(m=>`${m.hg}–${m.ag}`).join(' / '):'Maçlar bekleniyor'}${tie.matches.at(-1)?.penalties?' · Penaltılarla':''}${tie.winner?`<br>Tur atlayan: ${h(teamName(tie.winner))}`:''}</div></article>`).join('')}</section>`).join('')}</div>`;
}
function cupSquadsView(){
  const t=state.tournament,team=t.teams[squadSeat]||t.teams[0],version=t.simulationVersion??1,strength=teamStrength(team.roster),profile=profileForTeam(team,version),legacy=version<3;
  const factors=[['Overall ortalaması',profile.overall,''],[`${profile.eliteCount} adet 1. seviye`,profile.eliteBonus,'+'],[!legacy&&!team.human?'Kulüp kimyası · uygulanmaz':'Kulüp kimyası',profile.clubBonus,'+'],['Milliyet kimyası',profile.nationBonus,'+'],[`Kadro açıklığı · ${profile.range} OVR`,profile.balancePenalty,'−']];
  return `<div class="week-toolbar"><h2>Kadro dosyası</h2><select id="cup-squad-select" aria-label="İncelenecek takım">${t.teams.map((t,i)=>`<option value="${i}" ${squadSeat===i?'selected':''}>${h(t.name)}</option>`).join('')}</select></div><div class="game-grid"><div class="panel team-panel" style="--team-color:${colorHex(team)}"><div class="panel-body"><div class="pitch-meta"><strong>${teamDot(team)}${h(team.name)}</strong><span>ORT. ${avg(team.roster)}</span></div>${pitch(team.roster,{clubEligible:legacy||team.human})}</div></div><section class="panel"><div class="panel-body"><span class="eyebrow">TAKIM GÜCÜ · MODEL ${version}</span>${legacy?'<p class="muted">Bu turnuva önceki modelle başladı; sonuçları korumak için aynı modelle sürer. Yeni model yeni turnuvalarda kullanılır.</p>':''}${version===1?'':`<div class="power-total"><b>${profile.rating.toFixed(2)}</b><span>TAKIM PUANI</span></div><div class="power-breakdown">${factors.map(([label,value,sign])=>`<div><span>${label}</span><b>${sign}${value.toFixed(2)}</b></div>`).join('')}</div>`}<details class="line-details"><summary>Mevki ortalamaları</summary>${Object.entries(strength).map(([pos,value])=>`<div class="match-row"><span>${POSITIONS[pos]}</span><b>${value.toFixed(1)}</b></div>`).join('')}</details><p class="muted small">${legacy?'Bu kayıt eski model katsayılarını kullanır.':'Kulüp kimyası yalnızca katılımcılara en fazla +2,6; milliyet kimyası herkese en fazla +1,6. Elit futbolcu +0,15; kadro açıklığı en fazla −1. Rakip kulüpler kulüp kimyası bonusu almaz.'}</p></div></section></div>`;
}

function humanResults(){
  const t=state.tournament,table=standings(t),scores={league:0,playoff:1,r16:2,quarter:3,semi:4,final:5,champion:6};
  const teams=[...t.teams.filter(x=>x.human)].sort((a,b)=>(scores[t.eliminated[b.id]]??7)-(scores[t.eliminated[a.id]]??7)||table.findIndex(r=>r.id===a.id)-table.findIndex(r=>r.id===b.id));
  return `<div class="human-results">${teams.map((team,i)=>`<article class="human-result team-panel" style="--team-color:${colorHex(team)}"><div class="place">${t.stage==='done'?`${i+1}. SIRA`:team.id===t.gameWinner?'KAZANAN':t.eliminated[team.id]?'TURNUVA TAMAMLANDI':'KUPA YOLCULUĞU'}</div><b>${teamDot(team)}${h(team.name)}</b><span>${t.eliminated[team.id]?STAGES[t.eliminated[team.id]]:'Turnuvada devam ediyor'} · Lig: ${table.findIndex(r=>r.id===team.id)+1}.</span></article>`).join('')}</div>`;
}
function cupScreen(){
  const t=state.tournament;
  return `${stageProgress()}${t.stage==='done'?`<section class="winner-panel"><span class="eyebrow">★ FUT DRAFT KAZANANI</span><h2>${h(teamName(t.gameWinner))}, zafer senin.</h2><p>Avrupa Kupası şampiyonu: <strong>${h(teamName(t.champion))}</strong></p><p>${t.champion===t.gameWinner?'Draft masasından kupaya. Bu sezonun sahibi sensin.':'Katılımcılar arasında en ileri aşama; eşitlikte lig sırası belirledi.'}</p><div class="actions"><button type="button" class="primary" data-new-game>YENİ DRAFT →</button><button type="button" class="secondary" id="copy-result">Sonucu kopyala</button></div></section>`:`<section class="cup-header"><div><span class="eyebrow">✦ AVRUPA KUPASI · 36 TAKIM</span><h1>${STAGES[t.stage]}${t.stage==='league'?` · ${t.week}/8 hafta`:''}</h1>${t.simulationVersion<3?'<span class="badge">Bu kayıt önceki maç modelini kullanıyor</span>':''}<p>${t.stage==='league'?'İlk 8 doğrudan son 16. Sonraki 16 takım play-off.':t.stage==='final'?'Tek maç. Tarafsız saha. Tek kupa.':'Çift maç. Eşitlikte uzatma ve penaltılar.'}</p></div><button type="button" class="primary" id="simulate">${nextLabel()}</button></section>`}${humanResults()}<div class="tournament-tabs" role="tablist" aria-label="Turnuva görünümü">${[['matches','Maç merkezi'],['table','Puan tablosu'],['bracket','Eleme ağacı'],['squads','Kadrolar']].map(([view,label])=>`<button type="button" role="tab" aria-selected="${cupView===view}" data-cup-view="${view}">${label}</button>`).join('')}</div>${cupView==='matches'?matchesView():cupView==='table'?tableView():cupView==='bracket'?bracketView():cupSquadsView()}`;
}
function render(){
  const scroll=window.scrollY;
  const main=$('#main');
  if(state?.phase==='draft'&&main.offsetHeight)main.style.minHeight=main.offsetHeight+'px';
  else if(main.style)main.style.minHeight='';
  $('#restart').hidden=!state;$('#colors-button').hidden=!state;
  $('#main').classList.toggle('is-drafting',state?.phase==='draft');
  if(corruptSave){$('#main').innerHTML='<section class="panel recovery"><span class="eyebrow">KAYIT OKUNAMADI</span><h1>Yeni bir başlangıç yapalım.</h1><p class="muted">Kayıt eksik veya bu veri sürümüyle uyumsuz. Yeni draft başlatarak devam edebilirsin.</p><button type="button" class="primary" data-new-game>YENİ DRAFT →</button></section>';return;}
  $('#main').innerHTML=!state?setup():state.phase==='draft'?draftScreen():state.phase==='steal'?stealScreen():state.phase==='steal-reveal'?revealScreen():state.phase==='exchange'?exchangeScreen():state.phase==='steal-summary'?summaryScreen():cupScreen();
  window.scrollTo({top:scroll,behavior:'instant'});
}
function readSetup(){
  const form=$('#setup-form');if(!form)return;
  for(let i=0;i<participantCount;i++)names[i]=form.elements[`team-${i}`].value;
  odds=ODDS.map((_,i)=>Number(form.elements[`odds-${i}`].value));
}
document.addEventListener('submit',event=>{
  if(event.target.id!=='setup-form')return;event.preventDefault();readSetup();
  try{const seed=crypto.getRandomValues(new Uint32Array(1))[0];state=createGame(names.slice(0,participantCount),odds,seed,teamColors.slice(0,participantCount));squadSeat=activeSeat(state);save();render();window.scrollTo({top:0,behavior:'instant'});}
  catch(error){const box=$('#form-error');box.textContent=error.message;box.hidden=false;}
});
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.close){$('#'+b.dataset.close).close();return;}
  if(b.id==='colors-button'){refreshColorsDialog();$('#colors-dialog').showModal();return;}
  if(b.dataset.setupColor){readSetup();const [seat,color]=b.dataset.setupColor.split(':');if(!teamColors.slice(0,participantCount).some((id,i)=>i!==Number(seat)&&id===color))teamColors[Number(seat)]=color;render();return;}
  if(b.dataset.teamColor){const [seat,color]=b.dataset.teamColor.split(':');apply({type:'color',team:state.teams[Number(seat)].id,color});refreshColorsDialog();return;}
  if(b.id==='help'){$('#help-dialog').showModal();return;}
  if(b.id==='restart'||b.hasAttribute('data-new-game')){$('#reset-dialog').showModal();return;}
  if(b.id==='confirm-reset'){
    try{localStorage.removeItem(STORAGE_KEY);}catch{storageWorks=false;}
    reveal.stop();revealedCards=3;packRevealing=false;state=null;corruptSave=false;privateOpen=false;protect=null;target=null;useJoker=false;squadSeat=0;historyIndex=-1;cupView='matches';
    $('#reset-dialog').close();render();window.scrollTo({top:0,behavior:'instant'});return;
  }
  if(b.dataset.count){readSetup();participantCount=Number(b.dataset.count);const used=new Set();for(let i=0;i<participantCount;i++){if(used.has(teamColors[i]))teamColors[i]=COLORS.find(c=>!used.has(c.id)).id;used.add(teamColors[i]);}render();return;}
  if(b.dataset.position){selectedPosition=b.dataset.position;render();$(`[data-position="${selectedPosition}"]`)?.focus({preventScroll:true});return;}
  if(b.dataset.squad!==undefined){squadSeat=Number(b.dataset.squad);render();$(`[data-squad="${squadSeat}"]`)?.focus({preventScroll:true});return;}
  if(b.id==='toggle-joker'){useJoker=!useJoker;render();$('#toggle-joker')?.focus({preventScroll:true});return;}
  if(b.id==='open-pack'){apply({type:'open',position:selectedPosition,joker:useJoker});return;}
  if(b.dataset.pick){apply({type:'pick',id:Number(b.dataset.pick)});return;}
  if(b.id==='private-ready'){privateOpen=true;protect=null;target=null;render();return;}
  if(b.id==='hide-private'){privateOpen=false;protect=null;target=null;render();return;}
  if(b.dataset.protect||b.dataset.target){const kind=b.dataset.protect?'protect':'target',id=Number(b.dataset[kind]);if(kind==='protect')protect=id;else target=id;render();$(`[data-${kind}="${id}"]`)?.focus({preventScroll:true});return;}
  if(b.id==='lock-choices'){apply({type:'lock',protect,target});return;}
  if(b.id==='exchange-start'){apply({type:'exchange-start'});return;}
  if(b.dataset.compensation){apply({type:'compensate',id:Number(b.dataset.compensation)});return;}
  if(b.id==='steal-next'){apply({type:'steal-next'});return;}
  if(b.id==='simulate'){apply({type:'simulate'});return;}
  if(b.dataset.cupView){cupView=b.dataset.cupView;render();$(`[data-cup-view="${cupView}"]`)?.focus({preventScroll:true});return;}
  if(b.id==='copy-result'){
    const t=state.tournament,text=`Pixel Scout FUT Draft\nOyun kazananı: ${teamName(t.gameWinner)}\nAvrupa Kupası şampiyonu: ${teamName(t.champion)}\n${state.teams.map(team=>`${team.name}: ${STAGES[t.eliminated[team.id]]}`).join('\n')}`;
    navigator.clipboard?.writeText(text).then(()=>notify('Sonuç panoya kopyalandı.')).catch(()=>notify('Panoya erişilemedi.',true));
  }
});
document.addEventListener('change',event=>{
  if(event.target.id==='history-select'){historyIndex=Number(event.target.value);render();}
  if(event.target.id==='cup-squad-select'){squadSeat=Number(event.target.value);render();}
  if(event.target.name?.startsWith('odds-')){readSetup();const strip=$('#setup-form .level-strip');if(strip)strip.outerHTML=levelStrip(odds);}
});
async function boot(){
  try{
    const response=await fetch('./players.json');if(!response.ok)throw new Error('Oyuncu verisi yüklenemedi.');catalogue=await response.json();
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){try{const saved=JSON.parse(raw);if(validateSaved(saved,catalogue)){state=migrateSaved(saved);squadSeat=state.phase==='draft'?activeSeat(state):0;historyIndex=state.tournament?state.tournament.history.length-1:-1;}else corruptSave=true;}catch{corruptSave=true;}}
    }catch{storageWorks=false;}
    render();
  }catch(error){$('#main').innerHTML='<section class="panel recovery"><h1>Oyuncu tüneli açılamadı.</h1><p>Veri dosyası yüklenemedi. Bağlantını kontrol edip sayfayı yenile.</p><button type="button" id="retry-load" class="primary">Tekrar dene</button></section>';$('#retry-load').addEventListener('click',boot);}
}
boot();

import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),pages=process.argv[2],clubs=process.argv[3];
if(!pages||!clubs)throw Error('Usage: node scripts/prepare-draft-season.mjs <EA-page-snapshots> <EA-full-club-snapshots>');
const definition=[
 [278,'AEK Athens','GRE'],[1,'Arsenal','ENG'],[2,'Aston Villa','ENG'],[240,'Atlético de Madrid','ESP'],[241,'Barcelona','ESP'],[21,'Bayern München','GER'],[918,'Bodø/Glimt','NOR'],[22,'Borussia Dortmund','GER'],[231,'Club Brugge','BEL'],[1745,'Como','ITA'],[326,'Fenerbahçe','TUR'],[246,'Feyenoord','NED'],[325,'Galatasaray','TUR'],[131682,'Inter','ITA'],[252,'LASK','AUT'],[112172,'Leipzig','GER'],[64,'Lens','FRA'],[65,'Lille','FRA'],[9,'Liverpool','ENG'],[10,'Manchester City','ENG'],[11,'Man United','ENG'],[48,'Napoli','ITA'],[73,'Paris SG','FRA'],[236,'Porto','POR'],[247,'PSV','NED'],[449,'Real Betis','ESP'],[243,'Real Madrid','ESP'],[52,'Roma','ITA'],[null,'Sabah','AZE'],[101059,'Shakhtar','UKR'],[266,'Slavia Praha','CZE'],[null,'Slovan Bratislava','SVK'],[237,'Sporting CP','POR'],[36,'Stuttgart','GER'],[300,'Viking','NOR'],[483,'Villarreal','ESP']
];
const keys=['finishing','positioning','composure','shotPower','vision','shortPassing','ballControl','defensiveAwareness','interceptions','standingTackle','stamina','sprintSpeed','gkDiving','gkHandling','gkPositioning','gkReflexes','penalties'];
const hash=s=>createHash('sha256').update(s).digest('hex'),sources=[],rawPlayers=new Map(),attributePlayers=new Map();
for(const f of fs.readdirSync(pages).filter(f=>/^\d+\.json$/.test(f)).sort((a,b)=>parseInt(a)-parseInt(b))){const raw=fs.readFileSync(path.join(pages,f),'utf8');for(const p of JSON.parse(raw).items)if(p.gender?.id===0){rawPlayers.set(p.id,p);attributePlayers.set(p.id,p);}}
for(const f of fs.readdirSync(clubs).filter(f=>f.endsWith('.json'))){const raw=fs.readFileSync(path.join(clubs,f),'utf8'),d=JSON.parse(raw);if(!d.edition.includes('27'))throw Error('Wrong edition');sources.push({url:d.url,sha256:hash(raw),players:d.items.length});for(const p of d.items){if(p.gender?.id!==0)continue;rawPlayers.set(p.id,p);if(!attributePlayers.has(p.id))attributePlayers.set(p.id,p);}}
const role=short=>short==='GK'?'GK':['ST','CF','LW','RW','LM','RM'].includes(short)?'ATT':['CAM','CM','CDM'].includes(short)?'MID':['CB','LB','RB','LWB','RWB'].includes(short)?'DEF':null;
function lineup(players){
 const limits=[1,4,3,3],roles=['GK','DEF','MID','ATT'];let states=new Map([['0,0,0,0',{score:0,roster:[]}]]);
 for(const p of players){const next=new Map(states),allowed=new Set([p.position,...(p.alternatePositions||[])].map(pos=>role(pos.shortLabel)).filter(Boolean));
  for(const [key,value] of states){const counts=key.split(',').map(Number);for(let i=0;i<4;i++){if(!allowed.has(roles[i])||counts[i]===limits[i])continue;const c=[...counts];c[i]++;const k=c.join(','),score=value.score+p.overallRating;
   if(score>(next.get(k)?.score??-1)){const player={id:p.id,name:p.commonName||`${p.firstName} ${p.lastName}`.trim(),overall:p.overallRating,position:roles[i],detailPosition:p.position.shortLabel,club:p.team.label,clubId:p.team.id,league:p.leagueName,country:p.nationality?.label||null};next.set(k,{score,roster:[...value.roster,player]});}
  }}states=next;
 }return states.get('1,4,3,3')?.roster;
}
const season=[],unavailable=[];
for(const [id,name,association] of definition){if(id===null){unavailable.push({name,reason:'No licensed FC27 club identifier in the EA filter snapshot.'});continue;}const players=[...rawPlayers.values()].filter(p=>p.team.id===id),roster=lineup(players);if(!roster){unavailable.push({name,reason:'Insufficient verified positional coverage.'});continue;}season.push({id:`club-${id}`,clubId:id,name,association,roster,human:false});}
if(season.length<33)throw Error(`Only ${season.length} verified clubs; need 33`);
const attributes=Object.fromEntries([...attributePlayers.values()].map(p=>[p.id,keys.map(key=>{const n=p.stats?.[key]?.value;return Number.isInteger(n)&&n>=0&&n<=99?n:null;})]));
fs.writeFileSync(path.join(root,'dist/games/fut-draft/player-attributes.js'),`// Factual EA FC27 attributes. Column names and provenance: research/fut-draft-season.json\nexport const ATTRIBUTE_KEYS=${JSON.stringify(keys)};\nexport const PLAYER_ATTRIBUTES=${JSON.stringify(attributes)};\n`);
fs.writeFileSync(path.join(root,'dist/games/fut-draft/season-data.js'),`// Verified 2026/27 participants with a complete FC27 XI; see research/fut-draft-season.json.\nexport const SEASON='2026/27';\nexport const SEASON_TEAMS=${JSON.stringify(season)};\nexport const UNAVAILABLE_CLUBS=${JSON.stringify(unavailable)};\n`);
fs.writeFileSync(path.join(root,'research/fut-draft-season.json'),JSON.stringify({season:'2026/27',verifiedAt:'2026-10-17',uefaSource:'https://www.uefa.com/uefachampionsleague/news/02a8-2171a88881a0-c70193b972c6-1000--meet-the-2026-27-champions-league-league-phase-teams/',officialParticipants:definition.map(([,name,association])=>({name,association})),availableClubs:season.length,unavailable,selection:'Highest-overall feasible 4-3-3 using verified primary or alternate EA positions. 31–33 available clubs plus user teams; no non-participant league fillers.',attributeKeys:keys,attributePlayers:Object.keys(attributes).length,baseSourceManifest:'research/fut-draft-data.json',fullClubSnapshots:sources},null,2)+'\n');
console.log(JSON.stringify({seasonClubs:season.length,unavailable,attributes:Object.keys(attributes).length}));

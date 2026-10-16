import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Input: saved ratingDetails objects from EA's public FC 27 ratings pages.
// Keep the raw responses outside the public source; distribute factual fields only.
const root = fileURLToPath(new URL('../', import.meta.url));
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/prepare-draft-data.mjs <snapshot-directory>');
const sources = [];
const unique = new Map();
for (const file of fs.readdirSync(input).filter(f => /^\d+\.json$/.test(f)).sort((a,b)=>parseInt(a)-parseInt(b))) {
  const raw = fs.readFileSync(path.join(input,file),'utf8');
  const page = parseInt(file);
  sources.push({ page, url: `https://www.ea.com/games/ea-sports-fc/ratings${page > 1 ? `?page=${page}` : ''}`, sha256: createHash('sha256').update(raw).digest('hex') });
  for (const p of JSON.parse(raw).items) {
    if (p.gender?.id !== 0 || p.overallRating < 70) continue;
    // Wide midfielders count as attacking wingers in this game's broad 4-3-3 roles.
    const position = p.position?.shortLabel === 'GK' ? 'GK' : ['ST','CF','LW','RW','LM','RM'].includes(p.position?.shortLabel) ? 'ATT' : ({defense:'DEF',midfielder:'MID',attack:'ATT'})[p.position?.positionType?.id];
    if (!position || !Number.isInteger(p.overallRating) || !p.team?.label) throw new Error(`Incomplete player ${p.id}`);
    unique.set(p.id, { id:p.id, name:p.commonName || `${p.firstName} ${p.lastName}`.trim(), overall:p.overallRating, position, detailPosition:p.position.shortLabel, club:p.team.label, clubId:p.team.id, league:p.leagueName, country:p.nationality?.label || null });
  }
}
const players = [...unique.values()].sort((a,b)=>b.overall-a.overall || a.id-b.id);
const tiers = [{level:1,min:85,max:99},{level:2,min:81,max:84},{level:3,min:77,max:80},{level:4,min:73,max:76},{level:5,min:70,max:72}];
const counts = Object.fromEntries(['GK','DEF','MID','ATT'].map(pos=>[pos,tiers.map(t=>players.filter(p=>p.position===pos&&p.overall>=t.min&&p.overall<=t.max).length)]));
if(Object.values(counts).some(v=>v.some(n=>n<8))) throw new Error('Insufficient positional tier depth');
const source = {edition:'EA SPORTS FC 27',capturedAt:'2026-10-16',url:'https://www.ea.com/games/ea-sports-fc/ratings',scope:`First ${sources.length} ratings pages; men's base items rated 70+. This is a selected pool, not the entire database.`,positionGrouping:'GK goalkeeper; defense DEF; ST/CF/LW/RW/LM/RM ATT (wingers); remaining midfielders MID. Original position retained in detailPosition.',playerCount:players.length,counts,sources};
fs.mkdirSync(path.join(root,'dist/games/fut-draft'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/games/fut-draft/players.json'),JSON.stringify({version:1,edition:source.edition,capturedAt:source.capturedAt,source:source.url,tiers,players})+'\n');
fs.writeFileSync(path.join(root,'research/fut-draft-data.json'),JSON.stringify(source,null,2)+'\n');
console.log(JSON.stringify({players:players.length,counts}));

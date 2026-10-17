export const UPGRADE_LEVELS={r16:[1,2],quarter:[2,3],semi:[1,2]};
const tier=p=>p.overall>=85?1:p.overall>=81?2:p.overall>=77?3:p.overall>=73?4:5;
export function upgradeWindow(t){return t.simulationVersion>=5&&UPGRADE_LEVELS[t.stage]&&t.bracket.at(-1)?.leg===0;}
export function pendingUpgrades(t){if(!upgradeWindow(t))return [];const ids=new Set(t.bracket.at(-1).ties.flatMap(x=>[x.a,x.b]));return t.teams.filter(team=>team.human&&ids.has(team.id)&&!t.upgrades?.[t.stage]?.[team.id]?.done);}
export function upgradePool(state,catalogue,teamId,playerId,level){
 const team=state.teams.find(t=>t.id===teamId),old=team?.roster.find(p=>p.id===playerId);if(!old)return [];
 const used=new Set(state.teams.flatMap(t=>t.roster.map(p=>p.id)));
 return catalogue.players.filter(p=>p.position===old.position&&p.overall>old.overall&&tier(p)===level&&!used.has(p.id));
}
export function upgradeOptions(state,catalogue,teamId){const levels=UPGRADE_LEVELS[state.tournament.stage]??[];return state.teams.find(t=>t.id===teamId)?.roster.filter(p=>levels.every(level=>upgradePool(state,catalogue,teamId,p.id,level).length>=3))??[];}

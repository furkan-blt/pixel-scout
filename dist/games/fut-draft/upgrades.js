export const UPGRADE_LEVELS={r16:[1,2],quarter:[1,2],semi:[1,2]};
// Policy 1 is used only by historical calibration scripts, never inferred from an old save.
export const upgradeLevels=t=>t.upgradePolicy===1&&t.stage==='quarter'?[2,3]:UPGRADE_LEVELS[t.stage];
const tier=p=>p.overall>=85?1:p.overall>=81?2:p.overall>=77?3:p.overall>=73?4:5;
export function upgradeWindow(t){return t.simulationVersion>=5&&UPGRADE_LEVELS[t.stage]&&t.bracket.at(-1)?.leg===0;}
export function pendingUpgrades(t){if(!upgradeWindow(t))return [];const ids=new Set(t.bracket.at(-1).ties.flatMap(x=>[x.a,x.b]));return t.teams.filter(team=>team.human&&ids.has(team.id)&&!t.upgrades?.[t.stage]?.[team.id]?.done);}
export function upgradePool(state,catalogue,teamId,playerId,level){
 const old=state.teams.find(t=>t.id===teamId)?.roster.find(p=>p.id===playerId);if(!old)return [];
 const used=new Set(state.teams.flatMap(t=>t.roster.map(p=>p.id)));
 const pool=catalogue.players.filter(p=>p.position===old.position&&tier(p)===level&&!used.has(p.id)&&(state.tournament.upgradePolicy!==1||p.overall>old.overall));
 // In a five-user all-elite draft only two unused elite defenders may remain.
 // The selected player's own card is then an explicit keep option, never a duplicate transfer.
 return state.tournament.upgradePolicy!==1&&pool.length<3&&tier(old)===level?[...pool,old]:pool;
}
export function upgradeOptions(state,catalogue,teamId){const roster=state.teams.find(t=>t.id===teamId)?.roster??[];return state.tournament.upgradePolicy===1?roster.filter(p=>upgradeLevels(state.tournament).every(level=>upgradePool(state,catalogue,teamId,p.id,level).length>=3)):roster;}

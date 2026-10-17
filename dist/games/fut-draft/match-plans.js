export const TEMPOS={low:{label:'Düşük',volume:.90,load:.75},normal:{label:'Normal',volume:1,load:1},high:{label:'Yüksek',volume:1.11,load:1.30}};
export const STYLES={balanced:{label:'Dengeli',description:'Hücum ve savunma arasında dengeli yük.'},press:{label:'Önde baskı',description:'Daha çok atak; daha fazla yorgunluk ve arkada boşluk.'},counter:{label:'Kontra atak',description:'Daha az atak; baskılı ve risk alan rakibe karşı hızlı çıkış.'}};
export const DEFAULT_PLAN=Object.freeze({tempo:'normal',style:'balanced'});
export const planKey=t=>`${t.stage}:${(t.bracket.at(-1)?.leg??0)+1}`;
export function matchPlanWindow(t){const round=t.bracket.at(-1);return t.simulationVersion>=4&&['quarter','semi','final'].includes(t.stage)&&round&&round.leg<(t.stage==='final'?1:2);}
export function pendingMatchPlans(t){
  if(!matchPlanWindow(t))return [];
  const round=t.bracket.at(-1),ids=new Set(round.ties.flatMap(tie=>[tie.a,tie.b])),choices=t.matchPlans?.[planKey(t)]??{};
  return t.teams.filter(team=>team.human&&ids.has(team.id)&&!choices[team.id]);
}
export function computerPlan(own,opponent){
  if(own.rating<opponent.rating-3)return {tempo:'normal',style:'counter'};
  if(own.rating>opponent.rating+3&&own.attributes.stamina>=78)return {tempo:'normal',style:'press'};
  return {...DEFAULT_PLAN};
}

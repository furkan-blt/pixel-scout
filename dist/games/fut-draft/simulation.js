// Game balance model, not a prediction model fitted to real match results.
export const SIMULATION_VERSION = 2;
export const MODEL = Object.freeze({ elite:0.30, clubChemistry:2, nationChemistry:1.2, spreadAllowance:3, spreadWeight:0.38, rangeAllowance:10, rangeWeight:0.04, maxBalancePenalty:2.8, baseGoals:1.32, powerSensitivity:0.09, matchupSensitivity:0.025, homeAdvantage:1.10 });
const mean = values => values.reduce((a,b)=>a+b,0)/values.length;
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

function chemistry(roster,key) {
  // Each player gets full chemistry at three teammates sharing the attribute.
  // Unknown attributes never link to other unknown attributes.
  return mean(roster.map(p=>p[key]===null||p[key]===undefined||p[key]===''?0:Math.min(3,roster.filter(q=>q!==p&&q[key]===p[key]).length)/3));
}
export function teamProfile(roster) {
  if(roster.length!==11)throw new Error('Takım gücü için 11 futbolcu gerekli.');
  const values=roster.map(p=>p.overall),overall=mean(values);
  const deviation=Math.sqrt(mean(values.map(value=>(value-overall)**2)));
  const range=Math.max(...values)-Math.min(...values);
  const eliteCount=values.filter(value=>value>=85).length;
  const eliteBonus=eliteCount*MODEL.elite;
  const clubChemistry=chemistry(roster,'clubId'),nationChemistry=chemistry(roster,'country');
  const clubBonus=clubChemistry*MODEL.clubChemistry,nationBonus=nationChemistry*MODEL.nationChemistry;
  const balancePenalty=Math.min(MODEL.maxBalancePenalty,Math.max(0,deviation-MODEL.spreadAllowance)*MODEL.spreadWeight+Math.max(0,range-MODEL.rangeAllowance)*MODEL.rangeWeight);
  const rating=overall+eliteBonus+clubBonus+nationBonus-balancePenalty;
  const lines=Object.fromEntries(['GK','DEF','MID','ATT'].map(pos=>[pos,mean(roster.filter(p=>p.position===pos).map(p=>p.overall))]));
  return {overall,eliteCount,eliteBonus,deviation,range,clubChemistry,nationChemistry,clubBonus,nationBonus,balancePenalty,rating,lines};
}
export function expectedGoals(home,away,neutral=false,version=SIMULATION_VERSION) {
  if(version===1){
    const attack=t=>t.strength.ATT*.7+t.strength.MID*.3;
    const defense=t=>t.strength.DEF*.65+t.strength.GK*.35;
    return {lambdaHome:clamp(1.25*Math.exp((attack(home)-defense(away))*.055)*(neutral?1:1.14),.18,4.6),lambdaAway:clamp(1.25*Math.exp((attack(away)-defense(home))*.055),.18,4.6),modelVersion:1};
  }
  const h=teamProfile(home.roster),a=teamProfile(away.roster);
  const attack=p=>p.lines.ATT*.65+p.lines.MID*.35;
  const defense=p=>p.lines.DEF*.65+p.lines.GK*.35;
  const gap=(h.rating-a.rating)*MODEL.powerSensitivity;
  return {
    lambdaHome:clamp(MODEL.baseGoals*Math.exp(gap+(attack(h)-defense(a))*MODEL.matchupSensitivity)*(neutral?1:MODEL.homeAdvantage),.12,5.2),
    lambdaAway:clamp(MODEL.baseGoals*Math.exp(-gap+(attack(a)-defense(h))*MODEL.matchupSensitivity),.12,5.2),
    homePower:h.rating,awayPower:a.rating,modelVersion:SIMULATION_VERSION,
  };
}

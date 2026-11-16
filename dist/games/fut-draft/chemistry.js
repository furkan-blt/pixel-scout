const known=v=>v!==null&&v!==undefined&&v!=='';
export function chemistryPairs(players,{clubEligible=true}={}){
  const pairs=[];players.forEach((a,i)=>players.slice(i+1).forEach(b=>{const club=clubEligible&&known(a.clubId)&&a.clubId===b.clubId,nation=known(a.country)&&a.country===b.country;if(club||nation)pairs.push({a:a.id,b:b.id,club,nation});}));return pairs;
}
export function formationSlots(roster){return [['ATT',[25,50,75],10],['MID',[25,50,75],34],['DEF',[16,38.67,61.33,84],58],['GK',[50],82]].flatMap(([position,xs,y])=>xs.map((x,i)=>({key:`${position}-${i}`,position,x,y,player:roster.filter(p=>p.position===position)[i]??null})));}
// Connect every group with a sparse tree, rather than 55 overlapping lines.
export function chemistryNetwork(slots,{clubEligible=true}={}){
  const filled=slots.filter(s=>s.player),edges=new Map();
  for(const key of clubEligible?['clubId','country']:['country']){
    const groups=new Map();for(const s of filled){const v=s.player[key];if(!known(v))continue;if(!groups.has(v))groups.set(v,[]);groups.get(v).push(s);}
    for(const group of groups.values()){
      if(group.length<2)continue;const connected=[group[0]],left=new Set(group.slice(1));
      while(left.size){
        let best;for(const a of connected)for(const b of left){const distance=(a.x-b.x)**2+(a.y-b.y)**2;if(!best||distance<best.distance)best={a,b,distance};}
        const {a,b}=best;left.delete(b);connected.push(b);const id=[a.key,b.key].sort().join(':');
        edges.set(id,{a:a.player.id,b:b.player.id,x1:a.x,y1:a.y,x2:b.x,y2:b.y,club:clubEligible&&known(a.player.clubId)&&a.player.clubId===b.player.clubId,nation:known(a.player.country)&&a.player.country===b.player.country});
      }
    }
  }
  return [...edges.values()];
}

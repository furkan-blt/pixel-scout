export const REVEAL_TIMES = Object.freeze([100,340,580,880]);
export function createPackReveal(onChange,{schedule=setTimeout,cancel=clearTimeout}={}) {
  let timers=[],generation=0;
  function stop(){generation++;timers.forEach(cancel);timers=[];}
  return {
    stop,
    start(){
      stop();const token=generation;
      onChange(0,true);
      REVEAL_TIMES.forEach((ms,i)=>timers.push(schedule(()=>{
        if(generation!==token)return;
        onChange(Math.min(3,i+1),i<3);
      },ms)));
    },
  };
}

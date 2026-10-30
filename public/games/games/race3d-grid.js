export const RACE_GRID_SIZE=10;
export function createRaceGrid(participants=[]){
  if(participants.length<1||participants.length>RACE_GRID_SIZE)throw new RangeError('Select 1–10 class participants. Bots fill the remaining places in the 10-car grid.');
  const players=participants.map((p,i)=>({...p,id:p.id??`student-${i}`,name:String(p.name??`Student ${i+1}`),isBot:false}));
  const ids=new Set(players.map(p=>String(p.id)));
  if(ids.size!==players.length)throw new RangeError('Each selected class participant must have a unique ID.');
  for(let n=1;players.length<RACE_GRID_SIZE;n++){
    const id=`race-bot-${n}`;if(ids.has(id))continue;
    players.push({id,name:`BOT ${n}`,isBot:true,color:'#8a9ca5'});ids.add(id);
  }
  return players;
}

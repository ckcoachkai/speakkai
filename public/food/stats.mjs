export const keys=['calories','protein','carbs','fat','fiber','sugar','saturatedFat','sodium','caffeine'];
export const round=n=>Math.round(n*10)/10;
export function foods(day,{references=false}={}) {
 const entries=(day.meals||[]).flatMap(meal=>(meal.items?.length?meal.items:[{id:meal.id,name:meal.name||meal.description,portion:meal.description,type:'meal',confidence:'Legacy estimate',nutrition:Object.fromEntries(keys.map(k=>[k,meal[k]??null])),caloriesRange:Number.isFinite(meal.caloriesLow)&&Number.isFinite(meal.caloriesHigh)?[meal.caloriesLow,meal.caloriesHigh]:null}]).map(item=>({...item,mealId:meal.id,mealName:meal.name||'Logged meal',time:meal.time,timeApproximate:meal.timeApproximate})));
 return references?[...entries,...(day.references||[])]:entries.filter(i=>i.consumed!==false);
}
export function summarize(entries) {
 const counted=entries.filter(i=>i.consumed!==false);
 const result={count:counted.length};
 for(const key of keys){const values=counted.map(i=>i.nutrition?.[key]).filter(Number.isFinite);result[key]={value:values.length?round(values.reduce((a,b)=>a+b,0)):null,known:values.length,missing:counted.length-values.length};}
 const ranges=counted.filter(i=>Array.isArray(i.caloriesRange)&&i.caloriesRange.every(Number.isFinite));
 result.range=ranges.length?{low:round(ranges.reduce((a,i)=>a+i.caloriesRange[0],0)),high:round(ranges.reduce((a,i)=>a+i.caloriesRange[1],0)),missing:counted.length-ranges.length}:null;
 return result;
}
export function parseRoute(hash,days){
 const fallback={level:'day',date:days[0]?.date};
 try{
 const [level,date,id]=hash.replace(/^#/,'').split('/').map(decodeURIComponent);
 if(level==='overview')return {level:'overview',date:days[0]?.date};
 const day=days.find(d=>d.date===date);if(!day)return fallback;
 if(level==='food'&&foods(day,{references:true}).some(i=>i.id===id))return {level:'food',date,id};
 return {level:'day',date};
 }catch{return fallback;}
}
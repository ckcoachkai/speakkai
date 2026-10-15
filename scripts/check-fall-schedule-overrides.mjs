import assert from 'node:assert/strict';
import {applyFallScheduleOverrides} from './fall-schedule-overrides.mjs';
const sheet=(title,values)=>({title,rows:[{cells:values.map(value=>({value}))}]});
const value=day=>`${day}\nLimited availability\n15:30–17:30 · Class booked · 华漕\n18:15–20:15 · Class booked · 龙柏`;
const input=[sheet('October 2026',[value(8),value(15),value(16),value(22)]),sheet('November 2026',[value(5)]),sheet('December 2026',[value(31)]),sheet('January 2027',[value(7)])];
const original=JSON.stringify(input),output=applyFallScheduleOverrides(input);
assert.equal(JSON.stringify(input),original);
for(const [s,c] of [[0,1],[0,3],[1,0],[2,0]]){assert.ok(!output[s].rows[0].cells[c].value.includes('18:15'));assert.ok(output[s].rows[0].cells[c].value.includes('15:30'));}
for(const [s,c] of [[0,0],[0,2],[3,0]])assert.equal(output[s].rows[0].cells[c].value,input[s].rows[0].cells[c].value);
assert.deepEqual(applyFallScheduleOverrides(output),output);
console.log('Fall cancellation boundaries, history, other classes and idempotence passed.');

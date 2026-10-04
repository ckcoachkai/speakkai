const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('tools/problem-solving-sprint/game.html','utf8');
const elements={};
for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]).concat(['.progress','.progress-bar']))elements[id]={textContent:'',style:{},listeners:{},setAttribute(){},replaceChildren(){},append(){},focus(){},addEventListener(e,fn){this.listeners[e]=fn;}};
const root=elements['imagination-sprint'];root.querySelector=s=>{const e=elements[s.startsWith('#')?s.slice(1):s];assert(e,'Missing '+s);return e;};
let now=1000,tick,saved;
const context={document:{getElementById:id=>elements[id],createElement:()=>({})},window:{openai:{setWidgetState:s=>{saved=s;return Promise.resolve();}},addEventListener(){}},Date:{now:()=>now},setInterval:fn=>{tick=fn;return 1},clearInterval(){},Math,Set};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const click=id=>elements[id].listeners.click();
click('start');assert.equal(saved.privateContent.order.length,500);assert.equal(new Set(saved.privateContent.order).size,500);
click('answer');click('skip');assert.equal(elements.score.textContent,'1 answered');assert.equal(elements.skips.textContent,'1 skipped');
now=60999;click('answer');assert.equal(elements.score.textContent,'2 answered');
now=61000;click('answer');assert.equal(elements.score.textContent,'2 answered');assert.equal(saved.privateContent.phase,'done');assert.equal(elements.clock.textContent,'0 seconds');
click('start');assert.equal(elements.score.textContent,'0 answered');assert.equal(elements.clock.textContent,'60 seconds');
now+=60000;tick();assert.equal(saved.privateContent.phase,'done');
click('start');for(let i=0;i<500;i++)click('answer');assert.equal(saved.privateContent.phase,'done');assert.equal(elements.score.textContent,'500 answered');
click('reset');assert.equal(elements.score.textContent,'0 answered');assert.equal(elements.clock.textContent,'60 seconds');assert.equal(saved.privateContent.phase,'ready');click('start');click('answer');click('reset');now+=70000;tick();assert.equal(elements.clock.textContent,'60 seconds');assert.equal(elements.score.textContent,'0 answered');assert(!html.includes('\\"'));console.log('PASS: 500 unique prompts, scoring, skips, deadline boundary, timer expiry, replay and deck completion.');



async(page)=>{
 await page.clock.install({time:new Date('2026-10-04T10:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-04T10:00:01Z'));
 await page.locator('#timezone').selectOption('Asia/Shanghai'); if(await page.locator('#real-clock').innerText()!=='18:00:01')throw Error('Shanghai clock'); await page.locator('#timezone').selectOption('UTC'); if(await page.locator('#real-clock').innerText()!=='10:00:01')throw Error('Timezone conversion'); await page.locator('#timezone').selectOption('Asia/Shanghai');
 for(const count of [60,120,180,240,300,360,420,480,500]){
  await page.locator('#duration').selectOption(String(count));
  await page.getByRole('button',{name:/^Start/}).click();
  if(await page.locator('#setup').isVisible())throw Error('Settings visible during session');
  await page.clock.fastForward(count*60000-100);
  if(await page.locator('#counter').innerText()!==`Question ${count} / ${count}`)throw Error('Final minute '+count);
  if(await page.locator('#question').innerText()===`All ${count} questions complete.`)throw Error('Ended early');
  await page.clock.fastForward(100);
  if(await page.locator('#question').innerText()!==`All ${count} questions complete.`)throw Error('Duration '+count);
 }
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.locator('#duration').selectOption('60');
 await page.getByRole('button',{name:'Start',exact:true}).click();
 await page.clock.fastForward(20000);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 const clock=await page.locator('#real-clock').innerText();
 await page.clock.fastForward(10000);
 if(await page.locator('#timer').innerText()!=='0:40')throw Error('Pause timer');
 if(await page.locator('#real-clock').innerText()===clock)throw Error('Real clock paused');
 await page.getByRole('button',{name:'Resume',exact:true}).click();
 await page.clock.fastForward(40000);
 if(await page.locator('#counter').innerText()!=='Question 2 / 60')throw Error('Resume');
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.getByRole('button',{name:'Exit full screen',exact:true}).click();
 for(const [width,height] of [[1280,720],[390,844],[320,720]]){
  await page.setViewportSize({width,height});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Overflow');
  if(width===1280)await page.screenshot({path:'work/duration-desktop.png'});
  if(width===390)await page.screenshot({path:'work/duration-phone.png'});
 }
}


async page => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:4325/tools/wheel-of-doom/');
  const frame=page.frameLocator('iframe');
  await frame.locator('button[title="Customize"]').click();
  for(const label of ['Weighted entries','Auto-remove winner']){
    const toggle=frame.locator('.switch-row').filter({hasText:label}).getByRole('switch');
    if(await toggle.getAttribute('aria-checked')!=='true')await toggle.click();
  }
  await frame.getByRole('button',{name:'Done',exact:true}).click();
  await frame.locator('.entries-editor').fill('Alex | 1\nSam | 3\nRiley | 2');
  await frame.locator('.spin-button').click();
  await frame.locator('.winner-name').waitFor({timeout:20000});
  const winner=await frame.locator('.winner-name').innerText();
  const detail=await page.frames()[1].evaluate(()=>{
    const rotor=document.querySelector('.rotor');
    return {rotation:rotor.style.transform,centers:[...rotor.querySelectorAll('g[transform]')].filter(g=>g.querySelector('text')).map(g=>({angle:Number(g.getAttribute('transform').match(/rotate\(([-.\d]+)/)[1]),name:g.textContent}))};
  });
  const rotation=Number(detail.rotation.match(/rotate\(([-.\d]+)/)[1]);
  const chosen=detail.centers.find(entry=>entry.name===winner);
  const angle=((rotation+chosen.angle)%360+360)%360;
  if(Math.min(angle,360-angle)>0.01)throw Error('Pointer and selected name disagree: '+JSON.stringify({winner,angle,detail}));
  await frame.locator('.winner-modal').click({position:{x:10,y:10}});
  await page.keyboard.press('Escape');
  const remaining=await frame.locator('.entries-editor').inputValue();
  if(remaining.includes(winner))throw Error('Escape bypassed auto-remove');
  return {winner,remaining,pointerAligned:true};
}

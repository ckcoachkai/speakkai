async page => {
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  const base='http://127.0.0.1:4325';
  const dir='output/playwright/';
  await page.goto(base+'/games/keeperfall/index.html');
  if(await page.locator('[data-action="skip-onboarding"]').isVisible()) await page.locator('[data-action="skip-onboarding"]').click();
  for(const view of ['keep','raid','hero','forge','spells','chronicle','reports']){
    const button=page.locator('[data-view="'+view+'"]');
    await button.click();
  }
  if((await page.locator('body').innerText()).includes('RELEASE CANDIDATE'))throw Error('Developer diagnostics still shown');
  await page.locator('[data-view="keep"]').click();
  await page.locator('[data-action="open-settings"]').click();
  await page.locator('#presentation-mode').selectOption('3d');
  await page.locator('[data-action="close-settings"].icon-button').click();
  const keeper=[];
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.locator('#dungeon-3d canvas').waitFor({state:'visible'});
    await page.waitForTimeout(2500);
    const canvas=page.locator('#dungeon-3d canvas');
    await canvas.screenshot({path:dir+'keeperfall-scene-'+width+'.png'});
    keeper.push(await canvas.boundingBox());
  }
  await page.locator('[data-action="open-settings"]').click();
  await page.locator('#presentation-mode').selectOption('2d');
  await page.locator('[data-action="close-settings"].icon-button').click();
  await page.waitForTimeout(300);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:dir+'keeperfall-mobile.png'});
  await page.reload();
  if(await page.locator('[data-action="skip-onboarding"]').isVisible())throw Error('Keeper save did not persist');

  await page.goto(base+'/games/ice-drop/index.html');
  await page.waitForFunction(()=>window.iceReady);
  const ice=[];
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(500);
    await page.locator('#scene canvas').screenshot({path:dir+'ice-scene-'+width+'-a.png'});
    await page.waitForTimeout(1000);
    await page.locator('#scene canvas').screenshot({path:dir+'ice-scene-'+width+'-b.png'});
    ice.push(await page.locator('#scene canvas').boundingBox());
  }
  if(errors.length)throw Error(errors.join("; "));return {keeper,ice,errors};
}

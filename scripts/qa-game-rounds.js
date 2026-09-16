async page => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const checks = [];
  const base = 'http://127.0.0.1:4325';
  const ensure = (ok, message) => { if (!ok) throw Error(message); checks.push(message); };
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base + '/tools/class-charades/');
  const charades = page.frameLocator('iframe');
  await charades.locator('#startRound').click();
  ensure(await charades.locator('#playerSelect').isDisabled(), 'Charades locks the active player');
  ensure(await charades.locator('#randomPlayer').isDisabled(), 'Charades disables random player during a round');
  await charades.locator('#correctBtn').click();
  await charades.locator('#wrongBtn').click();
  await charades.locator('#undoBtn').click();
  ensure(await charades.locator('#correctCount').innerText() === '1', 'Correct answers are counted');
  ensure(await charades.locator('#wrongCount').innerText() === '0', 'Undo removes the previous mark');
  await charades.locator('#pauseBtn').click();
  const paused = await charades.locator('#timer').innerText();
  await page.waitForTimeout(1100);
  ensure(await charades.locator('#timer').innerText() === paused, 'Charades pause freezes the timer');
  await charades.locator('#pauseBtn').click();
  await charades.locator('#endBtn').click();
  ensure(await charades.locator('#resultScore').innerText() === '1', 'Round score is credited correctly');
  ensure(!(await charades.locator('#playerSelect').isDisabled()), 'Player selection unlocks after the round');
  await page.locator('.nav-toggle').click();
  ensure(!(await page.locator('nav.site-nav').isVisible()), 'Site navigation collapses');
  await page.locator('.nav-toggle').click();
  ensure(await page.locator('nav.site-nav').isVisible(), 'Site navigation expands');

  await page.goto(base + '/games/ice-drop/index.html');
  await page.waitForFunction(() => window.iceReady);
  await page.locator('#names').fill('Alex\nSam');
  await page.locator('#duration').selectOption('8');
  const winners = [];
  for (let i=0;i<2;i++) {
    await page.locator(i ? '#again' : '#pick').click();
    ensure(await page.locator('#names').isDisabled(), 'Ice roster is locked during round ' + (i+1));
    await page.locator('#result').waitFor({state:'visible',timeout:20000});
    winners.push(await page.locator('#winner').innerText());
  }
  ensure(new Set(winners).size === 2, 'Ice Drop selects everyone without repeats');
  await page.locator('#again').click();
  ensure(await page.locator('#count').innerText() === '2 / 2 on the ice', 'Ice Drop reset restores everyone');
  await page.locator('#names').fill('');
  ensure(await page.locator('#pick').isDisabled(), 'Ice Drop rejects empty rosters');

  await page.goto(base + '/tools/wheel-of-doom/');
  const wheel = page.frameLocator('iframe');
  await wheel.locator('.entries-editor').fill('Alex\nSam');
  await wheel.locator('.spin-button').click();
  ensure(await wheel.locator('.entries-editor').isDisabled(), 'Wheel roster locks while spinning');
  ensure(await wheel.getByRole('button',{name:'Shuffle',exact:true}).isDisabled(), 'Wheel reorder locks while spinning');
  await wheel.locator('.winner-name').waitFor({state:'visible',timeout:20000});
  ensure(['Alex','Sam'].includes(await wheel.locator('.winner-name').innerText()), 'Wheel returns an eligible winner');
  return {checks,errors};
}

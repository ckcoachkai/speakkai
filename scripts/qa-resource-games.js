async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  const routes = ['games/mouse-house/index.html', 'games/ice-drop/index.html', 'games/keeperfall/index.html', 'tools/class-charades/', 'tools/marble-name-picker/', 'tools/wheel-of-doom/', 'forest/'];
  for (const route of routes) {
    await page.goto('http://127.0.0.1:4325/' + route);
    if (route.includes('ice-drop')) await page.waitForFunction(() => window.iceReady);
    if (route === 'forest/') await page.locator('#start').waitFor({state:'visible'});
    await page.waitForTimeout(800);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
      const frames = [];
      for (const frame of page.frames()) {
        frames.push(await frame.evaluate(() => ({
          path: location.pathname, width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          canvases: [...document.querySelectorAll('canvas')].map(canvas => {
            const r = canvas.getBoundingClientRect();
            return { width: Math.round(r.width), height: Math.round(r.height), intrinsic: [canvas.width,canvas.height] };
          })
        })));
      }
      if (frames.some(f => f.scrollWidth > f.width + 1)) throw new Error('Horizontal overflow: ' + JSON.stringify(frames));
      await page.screenshot({ path: 'output/playwright/' + (route.split('/')[1] || 'forest') + '-' + width + '.png', fullPage: true });
      results.push({ route, width, frames });
    }
  }
  if(errors.length)throw Error(errors.join("; "));return { results, errors };
}

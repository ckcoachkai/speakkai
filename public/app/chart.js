/* Weekly local check-in times. Dates with no entry keep their own empty column. */
(function () {
  'use strict';

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const colors = {
    ink: '#674154', muted: '#805e70', grid: '#edcddf',
    pink: '#b81569', gold: '#ffdb79', halo: '#f5a4ce'
  };

  function svgNode(tag, attributes, text) {
    const node = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, String(value));
    }
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function shortDate(day, spoken) {
    const month = Number(day.date.slice(5, 7));
    const date = Number(day.date.slice(8, 10));
    return spoken ? month + '月' + date + '日' : month + '/' + date;
  }

  function hasTime(day) {
    return Number.isInteger(day.minutes) && day.minutes >= 0 && day.minutes < 1440;
  }

  function render(element, days) {
    const figure = document.createElement('figure');
    figure.style.cssText = 'margin:0;width:100%;min-width:0;';
    const graph = svgNode('svg', {
      viewBox: '0 0 340 170', width: '100%', role: 'group',
      'aria-label': '七天打卡时间折线图，横轴是日期，纵轴是本地时间',
      'font-family': '-apple-system,BlinkMacSystemFont,Arial,sans-serif',
      style: 'display:block;width:100%;max-height:290px;overflow:visible'
    });
    figure.appendChild(graph);
    const caption = document.createElement('figcaption');
    caption.style.cssText = 'font-size:13px;line-height:1.5;text-align:center;font-variant-numeric:tabular-nums;color:#674154;margin-top:3px;';
    caption.setAttribute('aria-live', 'polite');
    figure.appendChild(caption);

    const left = 53, right = 320, top = 15, bottom = 142;
    const x = index => days.length <= 1 ? (left + right) / 2 :
      left + index * (right - left) / (days.length - 1);
    const y = minutes => bottom - minutes / 1440 * (bottom - top);

    [0, 6, 12, 18, 24].forEach(hour => {
      const py = y(hour * 60);
      graph.appendChild(svgNode('line', {
        x1: left - 7, x2: right + 4, y1: py, y2: py,
        stroke: colors.grid, 'stroke-width': 1, 'stroke-dasharray': '2 4',
        'aria-hidden': true
      }));
      graph.appendChild(svgNode('text', {
        x: left - 14, y: py + 3.8, fill: colors.muted,
        'text-anchor': 'end', 'font-size': 10.7, 'aria-hidden': true
      }, String(hour).padStart(2, '0') + ':00'));
    });

    // Start a new subpath after each missed day, even when both neighbours exist.
    let path = '', connected = false;
    days.forEach((day, index) => {
      if (hasTime(day)) {
        path += (connected ? ' L' : ' M') + x(index) + ' ' + y(day.minutes);
        connected = true;
      } else {
        connected = false;
      }
      graph.appendChild(svgNode('text', {
        x: x(index), y: 163, fill: colors.ink, 'text-anchor': 'middle',
        'font-size': 10.5, 'aria-hidden': true
      }, shortDate(day, false)));
    });
    if (path) graph.appendChild(svgNode('path', {
      d: path.trim(), fill: 'none', stroke: colors.pink, 'stroke-width': 2.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': true
    }));

    const points = [];
    function select(point) {
      for (const item of points) {
        const active = item === point;
        item.halo.setAttribute('visibility', active ? 'visible' : 'hidden');
        item.target.setAttribute('aria-pressed', String(active));
      }
      caption.textContent = shortDate(point.day, true) + '　' + point.day.time + ' 打卡';
    }

    days.forEach((day, index) => {
      if (!hasTime(day)) return;
      const cx = x(index), cy = y(day.minutes);
      const label = shortDate(day, true) + ' ' + day.time + ' 打卡';
      const target = svgNode('g', {
        role: 'button', tabindex: 0, 'aria-label': label,
        'aria-pressed': false, style: 'cursor:pointer;touch-action:manipulation'
      });
      const halo = svgNode('circle', {
        cx, cy, r: 8.2, fill: 'none', stroke: colors.halo, 'stroke-width': 2,
        visibility: 'hidden', 'aria-hidden': true
      });
      target.appendChild(halo);
      target.appendChild(svgNode('circle', {
        cx, cy, r: 4.9, fill: colors.gold, stroke: colors.pink, 'stroke-width': 2.1
      }));
      // Nearly full-column, tall hit target for comfortable one-handed tapping.
      const hitLeft = index === 0 ? left - 15 : (x(index - 1) + cx) / 2;
      const hitRight = index === days.length - 1 ? right + 16 : (cx + x(index + 1)) / 2;
      target.appendChild(svgNode('rect', {
        x: hitLeft, y: 0, width: hitRight - hitLeft, height: 169, fill: 'transparent'
      }));
      const point = { day, target, halo };
      points.push(point);
      target.addEventListener('click', () => select(point));
      target.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(point);
        }
      });
      graph.appendChild(target);
    });
    if (points.length) {
      select(points[points.length - 1]);
    } else {
      caption.textContent = '这七天还没有打卡记录';
    }
    element.replaceChildren(figure);
  }

  window.DiaryChart = { render };
})();

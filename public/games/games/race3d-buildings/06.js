export const buildings = [
  {
    id: 'jade-courtyard-teahouse', name: 'Jade Courtyard Tea House', category: 'tea-house',
    build(b) {
      b.box('raised-stone-platform', '#aba994', 0, .45, 0, 25, .9, 19);
      b.box('timber-hall', '#e5d6b7', 0, 4, -2, 21, 6.2, 12);
      b.box('entrance-step', '#d3cbb7', 0, .25, 10, 10, .5, 3);
      b.roof('dark-jade-gabled-roof', '#355d56', 0, 8.5, -1, 25, 4, 18);
      b.box('gold-ridge-cap', '#b7a16c', 0, 10.55, -1, .35, .28, 18.8);
      for (const x of [-11, 11]) {
        b.box('projecting-eave', '#31564f', x, 7.15, -1, 4.5, .35, 19, x < 0 ? -.16 : .16);
        for (const z of [-9, 7]) b.box('raised-eave-tip', '#31564f', x, 7.5, z, 4.5, .3, 2, x < 0 ? -.24 : .24);
      }
      for (const x of [-9, -4.5, 4.5, 9]) {
        b.cylinder('veranda-red-column', '#773f32', x, 3.9, 6.8, .23, .28, 6);
        b.box('column-stone-foot', '#aaa694', x, 1.1, 6.8, .8, .45, .8);
      }
      b.box('veranda-lintel', '#663e2f', 0, 6.85, 6.8, 22, .45, .5);
      b.box('central-double-door', '#63442e', 0, 2.85, 4.1, 3.5, 4.1, .18);
      b.box('door-split', '#bc9f66', 0, 2.85, 4.25, .08, 4, .08);
      for (const x of [-7, -3.9, 3.9, 7]) {
        b.box('tea-hall-window', '#35504b', x, 3.6, 4.08, 2.5, 3.4, .14);
        for (const dx of [-.7, 0, .7]) b.box('window-lattice-vertical', '#846440', x + dx, 3.6, 4.2, .08, 3.4, .08);
        for (const y of [2.5, 3.6, 4.7]) b.box('window-lattice-horizontal', '#846440', x, y, 4.2, 2.5, .08, .08);
      }
      for (const x of [-7, 7]) {
        b.cylinder('terrace-tea-table', '#836b45', x, 1.7, 8.2, 1.15, 1.15, .18);
        b.cylinder('table-pedestal', '#5b4b36', x, 1.25, 8.2, .19, .35, .8);
        for (const dx of [-1.6, 1.6]) b.cylinder('terrace-stool', '#836b45', x + dx, 1.25, 8.2, .48, .4, .7);
        b.cylinder('hanging-red-lantern', '#bf543f', x, 5.7, 7, .48, .48, .8);
        b.box('lantern-tassel', '#bd934b', x, 5.1, 7, .08, .35, .08);
      }
      b.sign('玉庭茶馆 · JADE TEA', '#603e2e', 0, 5.8, 7.12, 7.6, 1.3);
    }
  },
  {
    id: 'pearl-lab-bubble-tea', name: 'Pearl Lab Bubble Tea', category: 'bubble-tea',
    build(b) {
      b.box('corner-plinth', '#c2b6a9', 0, .2, 0, 21, .4, 17);
      b.box('mint-shop-volume', '#a2cbbf', -2, 3.45, -1.5, 15, 6.5, 13);
      b.cylinder('rounded-corner-tower', '#f1ddc3', 5.2, 3.45, 1.2, 4.3, 4.3, 6.5, 16);
      b.box('flat-roof-lip', '#f2e5d0', -2, 6.9, -1.5, 15.5, .4, 13.5);
      b.cylinder('round-roof-lip', '#457d70', 5.2, 6.9, 1.2, 4.55, 4.55, .35, 16);
      b.box('wide-service-window', '#335956', -2, 3, 5.08, 10.5, 3, .18);
      b.box('serving-counter', '#d3a97a', -2, 1.8, 5.7, 11, .28, 1.5);
      b.box('service-window-top-frame', '#f5e5d1', -2, 4.55, 5.24, 11, .2, .3);
      for (const x of [-7.4, -2, 3.4]) b.box('service-window-divider', '#f5e5d1', x, 3.2, 5.24, .18, 2.6, .3);
      b.box('side-entry-door', '#365f59', -8.5, 2.15, 5.1, 1.8, 3.9, .16);
      b.box('entry-door-handle', '#e2bc79', -8, 2, 5.25, .09, .65, .12);
      for (let i = 0; i < 8; i++) b.box('striped-fabric-awning', i % 2 ? '#fbeddc' : '#63a99b', -6.8 + i * 1.4, 5.25, 6.2, 1.4, .2, 2.5);
      for (const x of [-6, 0, 5.5]) {
        b.cylinder('pavement-cafe-table', '#f4d698', x, 1.3, 9.1, 1.1, 1.1, .12);
        b.cylinder('cafe-table-stem', '#427969', x, .7, 9.1, .12, .3, 1.2);
        for (const dx of [-1.45, 1.45]) b.cylinder('cafe-stool', '#dd9c95', x + dx, .6, 9.1, .4, .3, 1);
      }
      // Roof sculpture is a physical milk-tea cup with lid, straw and pearls.
      b.cylinder('giant-tea-cup', '#ddb58b', 5.2, 8.75, 1.2, 1.65, 1.15, 3.3, 16);
      b.cylinder('cup-lid', '#f6e6d2', 5.2, 10.45, 1.2, 1.8, 1.8, .25, 16);
      b.cylinder('oversize-straw', '#438376', 5.5, 11.9, 1.4, .2, .2, 2.8);
      for (const dx of [-.65, 0, .65]) b.cylinder('visible-tapioca-pearl', '#604334', 5.2 + dx, 7.7, 2.35, .23, .23, .36, 8);
      for (const x of [-5.5, -4, -2.5, -1]) {
        b.cylinder('counter-drink-cup', '#e7bb89', x, 2.18, 5.9, .17, .12, .44);
        b.cylinder('drink-straw', '#417565', x, 2.55, 5.9, .025, .025, .4, 6);
      }
      b.sign('珍珠实验室 · PEARL LAB', '#427969', -2, 6.05, 5.32, 10, 1.1);
    }
  },
  {
    id: 'golden-steamer-bakery', name: 'Golden Steamer Bakery', category: 'bakery',
    build(b) {
      b.box('bakery-stone-base', '#b7a592', 0, .3, 0, 24, .6, 18);
      b.box('terracotta-bakery-walls', '#d59b77', 0, 4.4, -1, 22, 7.6, 15);
      b.roof('ochre-tiled-roof', '#97603e', 0, 9.1, -1, 24, 3.1, 17);
      b.box('roof-ridge-ornament', '#d2ad6e', 0, 10.75, -1, .35, .25, 17.5);
      b.box('baking-chimney', '#a55d43', -7, 10.4, -4.3, 1.5, 4, 1.5);
      b.box('chimney-cap', '#693f32', -7, 12.45, -4.3, 2, .3, 2);
      b.box('central-bakery-door', '#684737', 0, 2.4, 6.65, 2.6, 3.8, .2);
      b.box('door-glass', '#47615a', 0, 2.8, 6.8, 1.9, 2.1, .08);
      for (const x of [-6.4, 6.4]) {
        b.box('deep-display-window', '#46625d', x, 2.9, 6.65, 7.5, 3.7, .16);
        b.box('display-case-base', '#75523b', x, 1.05, 7.1, 7.7, .9, 1.2);
        b.box('display-case-counter', '#e5c58d', x, 1.6, 7.2, 7.7, .2, 1.5);
        b.box('display-shelf', '#d2ab6a', x, 2.6, 6.95, 7.3, .12, .8);
        for (const dx of [-2.8, 0, 2.8]) {
          b.box('window-upright', '#f3d7a3', x + dx, 3.05, 7.05, .12, 3.5, .16);
          for (const y of [1.92, 2.9]) {
            b.cylinder('bamboo-steamer-basket', '#c09355', x + dx, y, 7.17, .65, .65, .35);
            b.cylinder('steamed-bun', '#f5dfb3', x + dx, y + .27, 7.17, .3, .4, .22);
          }
        }
        b.box('upper-shutter-window', '#6a624b', x, 6.5, 6.65, 3, 1.8, .15);
        for (const dx of [-1.8, 1.8]) b.box('timber-window-shutter', '#7e4b35', x + dx, 6.5, 6.8, .5, 2, .2);
      }
      b.box('storefront-canopy', '#b3553e', 0, 5.05, 7.8, 23, .25, 3.4);
      for (const x of [-10.5, 10.5]) b.box('canopy-wood-bracket', '#684737', x, 4.4, 7.5, .18, 1.3, 1.4);
      for (let i = 0; i < 12; i++) b.box('roof-tile-ridge', '#b77c4f', -10.5 + i * 1.9, 8.15 + (1 - Math.abs(-10.5 + i * 1.9) / 12) * 1.5, -1, .12, .15, 16);
      b.box('takeaway-cart-body', '#956b3e', 9, 1, 10, 3.2, 1.4, 1.7);
      b.box('takeaway-cart-top', '#ebc981', 9, 1.8, 10, 3.6, .2, 2);
      for (const x of [7.9, 10.1]) b.cylinder('cart-support-foot', '#564c3f', x, .35, 10, .18, .18, .5);
      b.sign('金笼饼家 · GOLDEN BAKERY', '#80452f', 0, 5.75, 7.1, 13, 1.05);
    }
  }
];

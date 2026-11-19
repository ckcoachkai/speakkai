(function (global) {
  'use strict';

  const rewards = {
    first: {
      edition: 'DEBUT', stage: '首日打卡', title: '好棒！为你鼓掌！', badge: 'clap',
      words: '贝贝举起两只肉垫，啪、啪、啪！第一颗星星是你的啦。明天也要加油喵！'
    },
    three: {
      edition: 'VICTORY', stage: '连续三天', title: '三连胜！甜妹救了世界！', badge: 'trophy',
      words: '三天的坚持，把甜妹星球重新点亮啦！贝贝为你捧起奖杯。继续坚持，下站是七天王冠！'
    },
    seven: {
      edition: 'ENCORE', stage: '七天里程碑', title: '全世界为你打歌！', badge: 'crown',
      words: '连续七天，英雄甜妹拯救世界！偶像练习生为你举起应援灯，贝贝把闪耀的王冠戴在你头上！'
    },
    return: {
      edition: 'COMEBACK', stage: '回归打卡', title: '重生之甜妹又控糖', badge: 'heart',
      words: '你回来啦！贝贝一直给你留着封面的位置。今天重新出发，之前攒下的星星也都还在。'
    },
    daily: {
      edition: 'HIGH FIVE', stage: '日常打卡', title: '甜妹，来击个掌！', badge: 'sparkles',
      words: '再收下一颗属于今天的星星！来，和贝贝碰一下肉垫，喵！'
    }
  };

  function icon(name, size) {
    return global.DiaryIcons ? global.DiaryIcons(name, size) : '';
  }

  function closeButton() {
    return '<button type="button" class="dg-close" data-action="cancel" aria-label="关闭弹窗">' +
      (icon('x', 19) || '×') + '</button>';
  }

  function asset(name) {
    return '<img src="assets/' + name + '.png" alt="" draggable="false">';
  }

  function confirm() {
    const foods = [['tea', '奶茶'], ['cake', '蛋糕'], ['dessert', '糖水']];
    const pictures = foods.map(function (food) {
      return '<li>' + asset(food[0]) + '<span>' + food[1] + '</span></li>';
    }).join('');
    return '<article class="dg-card dg-confirm">' + closeButton() +
      '<div class="dg-confirm-top" aria-hidden="true">' + icon('heart', 19) + ' SWEET DIARY</div>' +
      '<div class="dg-body"><h2 id="diary-dialog-title">今天完成控糖了吗？</h2>' +
      '<ul class="dg-foods" aria-label="今日打卡项目">' + pictures + '</ul>' +
      '<p>确认今天没喝奶茶、没吃蛋糕和糖水，也没有吃喝其他含添加糖的食物或饮品。</p>' +
      '<div class="dg-actions"><button class="dg-main" type="button" data-action="confirm">' + icon('check', 19) +
      '我完成啦，打卡！</button><button type="button" class="dg-sub" data-action="cancel">晚点再来</button></div></div></article>';
  }

  function reward(kind, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(rewards, kind)) kind = 'daily';
    const data = rewards[kind];
    const status = options.preview
      ? ('奖励预览 · ' + (options.unlocked ? '已解锁' : '待解锁'))
      : '今日打卡成功';
    return '<article class="dg-card dg-reward dg-' + kind + '">' + closeButton() +
      '<div class="dg-cover"><img class="dg-poster" src="assets/' + (kind === 'seven' ? 'weekly' : 'hero') + '.jpg" alt="">' +
      '<span class="dg-edition" aria-hidden="true">' + data.edition + '</span></div>' +
      '<div class="dg-body"><div class="dg-medal" aria-hidden="true">' + asset(data.badge) + '</div>' +
      '<div class="dg-labels"><span class="dg-stage">' + data.stage + '</span><span class="dg-status">' + status + '</span></div>' +
      '<h2 id="diary-dialog-title">' + data.title + '</h2><p>' + data.words + '</p>' +
      '<div class="dg-actions"><button type="button" class="dg-main" data-action="cancel">' +
      (options.preview ? '看完啦' : '收下夸夸！') + '</button>' +
      '<button type="button" class="dg-sub" data-action="replay">' + icon('party-popper', 17) + '再看一次特效</button></div></div>' +
      '<div class="dg-particles" id="reward-fx" aria-hidden="true"></div></article>';
  }

  global.DiaryDialog = {confirm, reward};
})(window);

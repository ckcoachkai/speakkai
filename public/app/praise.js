/* Shared caption and audio IDs for the web and WeChat reward cards. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BeibeiPraise = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const texts = {
  "first": [
    "第一枚爪印，盖好啦！来，跟贝贝击个掌！",
    "今天，你把答应自己的事做到了。贝贝给你鼓鼓掌！",
    "看，这颗小星星是你的。第一天，值得庆祝！"
  ],
  "daily": [
    "左爪还是右爪？今天换你挑，咱们碰个爪！",
    "今天也给自己留了一点耐心。这一步，算数！",
    "听，叮！今天的小星星，落在你的手帐里啦！",
    "这页刚好缺一颗星。你一来，就齐啦！",
    "忙了一天，还记得自己的小约定。真棒！",
    "这份掌声，今天你来领。贝贝在台下给你比心！"
  ],
  "three": [
    "一、二、三，三枚爪印排好队！谢谢你坚持到今天！",
    "甜妹星球亮起来啦！是你连续三天点亮的哦！",
    "三天小队，集合！队长，请收下贝贝的胜利击掌！"
  ],
  "seven": [
    "七天啦！英雄甜妹，请上台。今天的掌声全都送给你！",
    "一周七枚爪印，刚好排成一顶皇冠。给你戴上！",
    "聚光灯亮啦！偶像练习生举着应援灯，为你欢呼呢！"
  ],
  "return": [
    "你回来啦！前面的爪印都还在，今天再添一枚。",
    "重生之甜妹又控糖！来，和贝贝一起翻开新的一页。",
    "给你留的那颗星星还在呢。欢迎回来，碰个爪吧！"
  ]
};
  const recorded = false;

  function pick(kind, day, offset) {
    if (!Object.prototype.hasOwnProperty.call(texts, kind)) kind = 'daily';
    const lines = texts[kind];
    const ordinal = Date.parse(day + 'T12:00:00Z') / 86400000;
    const base = kind === 'first' || !Number.isFinite(ordinal) ? 0 : Math.floor(ordinal);
    const index = ((base + (offset || 0)) % lines.length + lines.length) % lines.length;
    const id = kind + '-' + ('0' + (index + 1)).slice(-2);
    return { id: id, text: lines[index], recorded: recorded };
  }

  return { pick: pick };
});

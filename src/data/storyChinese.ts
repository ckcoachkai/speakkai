import source from "../content/practice/one-object-story.json";
// Narrative translation reviewed against the English source on 2026-09-07.
// Shared timing and publication fields are inherited; private editorial fields are not passed to the React guide.
const translatedSteps = [
  { title: "选一件物品", detail: "选择一件熟悉的物品，例如铅笔、玩具、书或一件小纪念品。告诉倾听者，你为什么选择它。" },
  { title: "找到一个片段", detail: "想一想你使用它、找到它或和别人分享它的一次经历。发生了什么？选一个让倾听者能够想象出来的细节。" },
  { title: "讲出这个故事", detail: "说出物品，讲清这个片段，并说明它为什么重要。目标是表达 30–60 秒；更短的尝试也可以。" },
  { title: "听取一个具体的反馈", detail: "倾听者说出一个自己听懂的具体细节，再问一个有帮助的问题。选择一个下一次想尝试的调整。" },
  { title: "再试一次", detail: "带着这个调整，再讲一遍故事。说说这一次哪里更清楚了。最后说出你下次想尝试的一件事。" },
];
if (source.steps.length !== translatedSteps.length) throw new Error("Review Chinese story translation after changing the English step count");
export const storyChinese = {
  ...source,
  followUp: "coaching" as const,
  title: "一件物品的故事",
  summary: "面向表达初学者和家长或伙伴的免费10分钟表达练习。选一件物品，讲一个片段，听取反馈，再做一次调整。包含分步练习与可打印的中文练习单。",
  introduction: "一件熟悉的物品。一个真实的片段。一位帮助你找到下一步的倾听者。",
  audience: "表达初学者", setting: "与家长、老师或伙伴一起练习", materials: "一件日常物品",
  steps: translatedSteps.map((step, index) => ({ ...step, minutes: source.steps[index].minutes })),
  frameTitle: "物品 · 片段 · 意义", prompts: ["我选择了……", "有一次……", "它对我重要，是因为……"],
  listenerGuide: "给对方时间说完。具体说出你听懂的一点，再问一个问题。",
  feedbackExample: "我能想象那本鲜蓝色封面的书。你打开书后发生了什么？",
};

import type { CollectionEntry } from 'astro:content';
import { storyChinese } from './storyChinese';
import school from '../content/practice/explain-then-swap.json';
import brief from '../content/practice/one-minute-brief.json';
import { translatedPracticeSlugs } from '../lib/practiceAvailability.mjs';

type Lesson = CollectionEntry<'practice'>['data'];
function translatedSteps(source: typeof school, steps: {title: string; detail: string}[]) {
  if (source.steps.length !== steps.length) throw new Error('Review Chinese practice translation after changing the English step count');
  return steps.map((step,index) => ({...step,minutes:source.steps[index].minutes}));
}
export const practiceChinese: Record<string,Lesson> = {
  'one-object-story': storyChinese,
  'explain-then-swap': {
    ...school, followUp: 'schools',
    title: '解释一个想法，再交换角色',
    summary: '面向学校小组的免费 12 分钟双人表达活动。解释一个想法，倾听具体细节，交换角色，再试一个更清楚的版本。包含分步练习与可打印的中文练习单。',
    introduction: '一个想法。轮流表达。一位能告诉你听懂了什么的倾听者。',
    audience: '学校小组', setting: '两人一组，由教师或带领者引导', materials: '一个熟悉的话题；笔记可选',
    steps: translatedSteps(school,[
      {title:'一起选一个想法',detail:'教师提出一个熟悉且适合学生年龄的话题，例如游戏规则、课堂常规，或今天学到的概念，并示范一段简短解释。伙伴选择可以解释清楚、又不需要分享私人经历的内容。'},
      {title:'准备一个重点和一个例子',detail:'每位伙伴选一个希望对方理解的重点，并想一个日常例子。可以写几条笔记，也可以先小声练习。教师可以简化提示，或提供其他参与方式。'},
      {title:'表达、倾听，再交换角色',detail:'伙伴 A 用约 30 秒解释。伙伴 B 说出一个自己听懂的细节，再问一个有帮助的问题。交换角色，让双方都有表达和倾听的机会。每次回答前留一点思考时间。'},
      {title:'再试一个更清楚的版本',detail:'每位伙伴根据刚才听到的问题，选择一处小调整：更早说出重点、使用更清楚的例子，或在重要细节前停顿。再解释一次。倾听者说说哪里变得更容易理解。'},
      {title:'选择下一步',detail:'每位伙伴说出一个希望保留的表达选择。如果愿意，可以向全组分享这个选择。教师最后就倾听或解释给出一个具体观察，不对表达者进行排名。'},
    ]),
    frameTitle:'重点 · 例子 · 确认',prompts:['主要意思是……','例如……','你希望我再解释哪一部分？'],
    listenerGuide:'先听完这次尝试，再回应。说出一个听到的细节，然后就内容提一个问题。描述对方的解释，不评价对方这个人。两人练习时，也由倾听者提问。',
    feedbackExample:'我听懂了第一条游戏规则。你能演示一下下一轮会发生什么吗？',
  },
  'one-minute-brief': {
    ...brief, followUp:'companies',
    title:'一分钟简报',
    summary:'免费的 10 分钟职场表达练习。围绕听众组织一项建议，做一次简短汇报，确认听众听懂了什么，再试一次。包含分步练习与可打印的中文练习单。',
    introduction:'一项建议。一个与听众相关的理由。一个听众能说清楚的下一步行动。',
    audience:'成人与职场团队',setting:'与同事或练习伙伴一起',materials:'一个不涉及敏感信息的情境；如有需要可准备几条笔记',
    steps:translatedSteps(brief,[
      {title:'选择听众',detail:'使用这个虚构情境：团队正在考虑每周安排一次简短碰头会。选一位听众，例如团队负责人或项目伙伴，想想对方需要理解什么或做什么。练习中不要包含真实客户、员工个人情况或公司机密细节。'},
      {title:'搭建简报',detail:'写下三句简短的话：建议是什么、它为什么对这位听众重要，以及你希望讨论的下一步行动。你可以提议短期试行碰头会。如果有假设，要明确说明是假设，不要编造证据或结果。'},
      {title:'用一分钟说出来',detail:'用约 45–60 秒说出建议、理由与下一步行动。如有帮助，可以参考笔记。省略听众做这个决定时不需要的背景，用一个具体问题结束，避免含糊收尾。'},
      {title:'确认听众听懂了什么',detail:'倾听者说出自己理解的建议与理由，再说出讲述者请求的下一步行动。就遗漏之处提出一个问题。关注解释本身，不评价表达者的性格或口音。'},
      {title:'做一处调整，再试一次',detail:'选择一处不清楚的地方来改进：更直接的开头、更具体的理由，或更清楚的请求。再做一次简短汇报，询问听众哪里发生了变化。如果时间允许，交换角色。最后说出下次排练时想运用的一个选择。'},
    ]),
    frameTitle:'建议 · 理由 · 请求',prompts:['我建议……','这与你有关，因为……','我希望讨论的下一步是……'],
    listenerGuide:'用自己的话说出建议、理由与下一步行动。如果有一项不清楚，就提出一个具体问题。反馈关注听众理解了什么，并不预测建议是否会获批或能否取得商业成功。',
    feedbackExample:'我听到你希望试行每周碰头会。你希望团队负责人今天做出什么决定？',
  },
};
if (JSON.stringify(Object.keys(practiceChinese).sort()) !== JSON.stringify([...translatedPracticeSlugs].sort())) {
  throw new Error('Chinese practice copy and translation availability must be reviewed and registered together');
}

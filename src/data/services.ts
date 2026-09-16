import type { SiteLanguage } from './homeCopy';

type Service = { id: string; title: string; description: string; examples: string[] };
type Audience = { id: string; title: string; description: string };
type ServiceCopy = {
  eyebrow: string; title: string; intro: string; explore: string; discuss: string;
  services: Service[]; audiences: Audience[]; ageTitle: string; ageNote: string;
  additionalTitle: string; additional: string[]; arrangementsTitle: string;
  arrangements: string; online: string; schools: string;
  guideTitle: string; guideIntro: string; languageLabel: string; audienceLabel: string;
  interestLabel: string; anyAge: string; anyInterest: string; show: string; skip: string;
  specific: string; reopen: string; selection: string;
};

export const serviceCopy: Record<SiteLanguage, ServiceCopy> = {
  en: {
    eyebrow: 'Courses & coaching', title: 'Find your next step.',
    intro: 'From a first speech at age five to an important business presentation. Build clear ideas, confident delivery and a voice of your own.',
    explore: 'Explore the formats', discuss: 'Discuss your goals',
    services: [
      { id: 'speaking', title: 'Public Speaking & Storytelling', description: 'Organize your thoughts, connect with an audience and make your message memorable.', examples: ['Introductory speaking, prepared and topic-based speeches', 'Personal narrative, expository and informative speeches', 'TED-style talks and original oratory', 'Impromptu speaking, Q&A and extemporaneous news speeches', 'Explore Public Speaking: an introduction to different formats'] },
      { id: 'debate', title: 'Debate & Critical Thinking', description: 'Build arguments, explore different perspectives and respond with purpose.', examples: ['Junior debate and foundational argument skills', 'Public Forum, British Parliamentary and World Schools debate', 'Extemporaneous debate', 'Model UN: research, representation and discussion'] },
      { id: 'drama', title: 'Drama & Expressive Speaking', description: 'Bring a story to life through voice, expression, movement and character.', examples: ['Dramatic storytelling', 'Dramatic interpretation and humorous interpretation', 'Humorous speeches and techniques for delivering humor'] },
      { id: 'preparation', title: 'Competition & Interview Preparation', description: 'Prepare for a specific opportunity with focused practice and individual feedback.', examples: ['School, local and national speech competitions: content development, structure and delivery', 'Coaching matched to the event, age division and current rules', 'Vericant and InitialView interview preparation', 'American private boarding school, university and master’s admissions interviews'] },
      { id: 'professional', title: 'Professional & Executive Communication', description: 'Make your ideas understood in conversations, presentations and moments that matter at work.', examples: ['Clear technical communication for software engineers and other professionals', 'Customer service: complaints, difficult conversations and problem-solving', 'Sales persuasion and leadership communication', 'Presentation mastery, business storytelling and pitch training', 'Executive scriptwriting and conference preparation', 'Hosting, facilitation, feedback and evaluation'] },
    ],
    ageTitle: 'A starting point for every stage.',
    ageNote: 'Age is a guide. Coaching adapts to English proficiency, writing ability, experience and maturity across public, bilingual and international school backgrounds. Student coaching is primarily in English; selected corporate training is available in Chinese.',
    audiences: [
      { id: 'early', title: 'Early years · around age 5–Grade 1', description: 'Guided or prepared speeches, familiar topics and personal stories. Practice facial expressions, eye contact and gestures. Stronger speakers can explore simplified SDG and environmental topics through their own experiences.' },
      { id: 'primary', title: 'Primary · Grades 1–3', description: 'Build structure, find the right words and respond to questions. Explore storytelling, three-minute expository speeches, informative and TED-style talks, junior debate and competition preparation.' },
      { id: 'upper', title: 'Upper primary · Grades 4–6', description: 'Develop deeper ideas, audience awareness and greater independence. Longer talks bring together personal experience, social issues and introductory research. Experienced Grade 3 speakers may also suit this work.' },
      { id: 'middle', title: 'Middle school', description: 'Develop a personal voice through original oratory, interpretation, impromptu speaking, research-based extemporaneous speeches, debate and Model UN. Interview preparation is also available.' },
      { id: 'high', title: 'High school', description: 'Refine reasoning, research, self-awareness and persuasive delivery. Explore advanced speech and debate, interpretation, TOC-style impromptu practice and admissions interviews.' },
      { id: 'adult', title: 'Adults & organizations', description: 'Work on professional interviews, everyday communication, team training, leadership presentations, business storytelling or an important pitch.' },
    ],
    additionalTitle: 'Also available by arrangement',
    additional: ['English development and high school intensive reading; world, English and European history.', 'Overseas study preparation: American culture, living abroad and communicating in a new environment.', 'Professional and business visa interview practice.', 'Hosting, facilitation, constructive feedback and evaluation for students ready for these skills.', 'Selected academic and multidisciplinary competition support, including relevant speech, interview, presentation and subject components. Share the event brief to discuss fit.'],
    arrangementsTitle: 'Work directly with Kai.',
    arrangements: 'Personalized one-to-one coaching and private groups, subject to availability. Looking to join an existing group? Kai can connect you with partner programs. Sessions are primarily in person. Share the learner’s age, goals, preferred format and any deadline to discuss a suitable next step.',
    online: 'Online classes coming soon.', schools: 'Explore school programs and workshops',
    guideTitle: 'Find your starting point', guideIntro: 'Choose a language, a learning stage and an interest—or browse everything.',
    languageLabel: 'Website language', audienceLabel: 'Who is learning?', interestLabel: 'What would you like help with?',
    anyAge: 'All ages / not sure yet', anyInterest: 'Explore all services', show: 'Show my starting point',
    skip: 'Skip and browse', specific: 'I have a specific request', reopen: 'Help me choose', selection: 'Your starting point',
  },
  'zh-CN': {
    eyebrow: '课程与辅导', title: '找到适合你的下一步。',
    intro: '从五岁左右的第一次演讲，到重要的职场演示，练习清晰的思路、自信的呈现与属于自己的表达。',
    explore: '查看课程类型', discuss: '聊聊你的目标',
    services: [
      { id: 'speaking', title: '公众演讲与故事表达', description: '整理想法，与听众建立连接，让表达更清楚、更有记忆点。', examples: ['演讲入门、指导式演讲与主题演讲', '个人叙事、阐释型演讲与知识介绍型演讲', 'TED 风格演讲与原创演讲（Original Oratory）', '即兴演讲、问答与新闻时事限时准备演讲', '演讲探索课：体验不同的演讲形式'] },
      { id: 'debate', title: '辩论与思辨', description: '建立论点，理解不同观点，并有条理地回应。', examples: ['初级辩论与基础论证', '公共论坛式（Public Forum）、英国议会制与世界学校制辩论', '即兴辩论', '模拟联合国：研究、国家立场与会议讨论'] },
      { id: 'drama', title: '戏剧与表现力', description: '用声音、表情、动作与角色塑造，让故事生动起来。', examples: ['戏剧化故事讲述', '戏剧诠释与幽默诠释（Dramatic / Humorous Interpretation）', '幽默演讲与幽默表达技巧'] },
      { id: 'preparation', title: '竞赛与面试准备', description: '围绕具体目标，通过针对性的练习与反馈做好准备。', examples: ['校内、地区及全国演讲活动：内容创作、结构与呈现', '根据活动形式、年龄组及当届规则设计辅导', 'Vericant 与 InitialView 面试准备', '美国私立寄宿高中、大学及硕士入学面试'] },
      { id: 'professional', title: '职场与管理者沟通', description: '让想法在日常对话、团队协作和重要演示中被理解。', examples: ['软件工程师及其他专业岗位的清晰沟通', '客户服务：投诉处理、困难对话与问题解决', '销售说服力与管理者沟通', '演示技巧、商业故事与项目路演', '管理者及企业负责人的讲稿撰写与会议演讲准备', '主持、引导讨论、反馈与评估'] },
    ],
    ageTitle: '每个阶段，都有适合的起点。',
    ageNote: '年龄只是参考。课程根据英语水平、写作能力、经验与成熟度调整，适合公立、双语及国际学校的不同背景。学生课程主要使用英语；部分企业培训可使用中文。',
    audiences: [
      { id: 'early', title: '启蒙阶段 · 约五岁至一年级', description: '从熟悉的话题与个人故事出发，使用适合孩子水平的指导式或预备讲稿，练习表情、眼神与手势。表达基础较好的孩子可结合自身经历，接触简化的可持续发展与环保话题。' },
      { id: 'primary', title: '小学低年级 · 一至三年级', description: '练习结构、选词与问答，探索故事讲述、三分钟阐释型演讲、知识介绍、TED 风格演讲、初级辩论及竞赛准备。' },
      { id: 'upper', title: '小学高年级 · 四至六年级', description: '加深内容、听众意识与独立表达能力。在较长的演讲中结合个人经历、社会议题与初步研究。有经验的三年级学生也可考虑这一阶段的内容。' },
      { id: 'middle', title: '初中', description: '通过原创演讲、戏剧诠释、即兴演讲、时事研究、辩论与模拟联合国，发展个人声音。也可安排入学面试准备。' },
      { id: 'high', title: '高中', description: '加强论证、研究、自我认知与说服性表达，探索进阶演讲与辩论、戏剧诠释、TOC 风格即兴练习及升学面试。' },
      { id: 'adult', title: '成人与企业团队', description: '围绕求职面试、日常沟通、团队培训、管理者演示、商业故事或重要路演，开展实用练习。' },
    ],
    additionalTitle: '其他可洽询的课程',
    additional: ['英语能力与高中精读；世界史、英国史及欧洲史。', '海外学习准备：美国文化、海外生活与跨文化沟通。', '职场及商务签证面试练习。', '面向具备相应基础的学生：主持、引导讨论、建设性反馈与评估。', '部分学术及跨学科活动辅导，可讨论相关演讲、面试、展示及学科内容。请提供活动要求，以确认适合的辅导范围。'],
    arrangementsTitle: '与 Kai 直接练习。',
    arrangements: '可安排个性化一对一辅导，或在时间允许时组建私人小班。如希望加入现有班课，Kai 可协助对接合作机构。课程以线下为主。请说明学员年龄、目标、偏好的形式及重要日期，一起讨论合适的下一步。',
    online: '线上课程即将推出。', schools: '了解学校项目与工作坊',
    guideTitle: '找到适合你的起点', guideIntro: '选择页面语言、学习阶段与兴趣，也可以直接浏览全部内容。',
    languageLabel: '页面语言', audienceLabel: '谁来学习？', interestLabel: '你希望获得哪方面的帮助？',
    anyAge: '全部阶段／尚未确定', anyInterest: '浏览全部服务', show: '查看我的起点',
    skip: '跳过，直接浏览', specific: '我有具体需求', reopen: '帮我选择', selection: '你的起点',
  },
};

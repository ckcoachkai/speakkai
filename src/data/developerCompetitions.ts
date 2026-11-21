type Competition = {
  title: string;
  format: string;
  date: string;
  schedule: string;
  build: string;
  eligibility: string;
  link: string;
  prizePool: string;
  awards: string;
  entryRules: string[];
  references?: Array<{ label: string; href: string }>;
  archived?: boolean;
};

export const gameCompetitions: Competition[] = [
  {
    title: 'GitHub Game Off 2026',
    format: 'Online jam · Any engine',
    date: 'Dec 2, 2026 · 05:37',
    schedule: 'Submission deadline',
    build: 'Make a game around the theme SHIFT. Publish your source in a public GitHub repository and submit the game on itch.io.',
    eligibility: 'Solo developers and teams, including first-time game makers.',
    link: 'https://itch.io/jam/game-off-2026',
    prizePool: 'No cash or material prize listed',
    awards: 'Peer ratings determine winners in Overall, Gameplay, Graphics, Audio, Innovation, and Theme Interpretation. GitHub announces the winners on its blog and social channels.',
    entryRules: [
      'Do most of the work during the jam and use the SHIFT theme. Any engine is allowed. Starter projects and assets you have permission to use are welcome.',
      'Push the source to a public GitHub repository and submit separately on itch.io. You choose the source license.',
      'AI assistance is allowed. Report how you used it when the submission form asks.',
    ],
    references: [{ label: 'GitHub rules and judging', href: 'https://github.blog/open-source/gaming/game-off-2026-the-theme-is-shift/' }],
  },
  {
    title: 'Scratch Game Jam #24',
    format: 'Online jam · Scratch',
    date: 'Dec 5, 2026 · 08:00',
    schedule: 'Submission deadline',
    build: 'Make a themed game during the jam in Scratch, Gandi IDE, or TurboWarp. Submit a browser-playable HTML5 export.',
    eligibility: 'Solo or team. A first jam for students who already know the basics of Scratch.',
    link: 'https://itch.io/jam/scratch-game-jam-24',
    prizePool: '3 MoDeck handheld consoles',
    awards: 'The top three overall entries receive one MoDeck each. The organizer has yet to confirm shipping dates. Entrants and contributors vote on enjoyment, visuals, audio, theme, and gameplay.',
    entryRules: [
      'Create your game during the jam in Scratch or a compatible editor and follow the announced theme.',
      'Upload a playable HTML5 build to itch.io. Credit licensed assets and small code snippets you reuse. Entire pre-existing projects are ineligible.',
    ],
  },
  {
    title: 'Godot Wild Jam #100',
    format: 'Online jam · Godot',
    date: 'Dec 12–21, 2026',
    schedule: 'Build window · Closes at 05:00',
    build: 'Build a new Godot game around the announced theme. The organizer prohibits generative AI.',
    eligibility: 'Solo or teams of up to five. Beginners are welcome.',
    link: 'https://itch.io/jam/godot-wild-jam-100',
    prizePool: 'No prize pool published for #100',
    awards: 'Participants rate theme, fun, controls, graphics, audio, accessibility, and originality. The jam announces a winner, with a winner role available on its Discord.',
    entryRules: [
      'Make the game in Godot during the nine-day jam. Follow the theme. Wildcards are optional and do not count toward ratings.',
      'Create most of your code and assets yourself. Templates and assets you have rights to are allowed.',
      'The jam bans AI-generated material, including code, art, audio, and writing, in both your game and your itch.io listing.',
    ],
    references: [{ label: 'Winner recognition', href: 'https://godotwildjam.com/news/chrome-names-for-jam-winners/' }],
  },
  {
    title: 'Global Game Jam 2027',
    format: 'Game jam · Join a local or online site',
    date: 'Jan 25–31, 2027',
    schedule: 'Global event window · Registration opens Dec 1, 2026',
    build: 'Make a game from the global theme. Each jam site sets its own schedule and participation details.',
    eligibility: 'Standard sites generally require local age of majority. Minors should check the site’s guardian policy or look for GGJ Next.',
    link: 'https://globalgamejam.org/',
    prizePool: 'No global prize pool',
    awards: 'The global jam is a collaborative event. Individual sites may offer their own prizes or recognition.',
    entryRules: [
      'Join one approved site, follow its schedule and conduct rules, and build around the global theme. Confirm age and guardian requirements directly with the site.',
      'Upload an executable or a playable browser link to the GGJ platform. Your team keeps copyright and lets GGJ host the submission.',
      'The global policy allows AI use subject to the jam’s copyright and content rules.',
    ],
    references: [{ label: 'Global jam and age policies', href: 'https://globalgamejam.org/policies' }],
  },
  {
    title: 'Brackeys Game Jam 2027.1',
    format: 'Online jam · One week',
    date: 'Feb 14–21, 2027',
    schedule: 'Build window · Closes at 19:00',
    build: 'Build a game from the theme revealed at kickoff, then play and rate other teams’ games. The organizer will post the full rules closer to the jam.',
    eligibility: 'Solo or team. The organizer recommends keeping teams under four people.',
    link: 'https://itch.io/jam/brackeys-17',
    prizePool: '2027 prizes unannounced',
    awards: 'Participants rate each other’s work. The organizer has yet to publish award categories or a prize schedule for this edition.',
    entryRules: [
      'Make a game in one week based on the theme revealed at kickoff. Solo entries and teams are welcome, with no published team cap.',
      'The organizer plans to publish the remaining rules about a month before the jam. Check the entry and AI rules when they appear.',
    ],
  },
  {
    title: 'Games for Change Student Challenge',
    format: 'International student competition · Social impact',
    date: 'Mar 30, 2027 · 14:59',
    schedule: 'Competition submission deadline',
    build: 'Design an original game inspired by a social impact theme listed in the 2027 competition portal.',
    eligibility: 'Ages 8–25 across four divisions. Games by students outside the US can be considered for Best International Game.',
    link: 'https://learn.gamesforchange.org/student-challenge/competition',
    prizePool: 'US$10,000 scholarship per Game of the Year winning team',
    awards: 'Game of the Year has two award brackets, Junior/Senior and Expert. Other awards include Best International Game, theme and platform categories, trailers, tabletop, and character design. Finalists and winners receive an Arcade feature. Prizes vary by category.',
    entryRules: [
      'Select a published theme and submit through the competition portal. Category rules govern eligible ages, teams, and formats.',
      'For Best International Game, entrants must live outside the US. Use a free or open platform and a browser link playable by English-speaking judges. Minecraft Education Edition and Roblox entries use a 2–5 minute walkthrough instead.',
      'Disclose AI assistance when asked. Students must create the game design, narrative, and gameplay functions themselves.',
    ],
    references: [
      { label: 'Submission portal', href: 'https://g4cstudentchallenge.secure-platform.com/a' },
      { label: 'Award and category rules', href: 'https://g4cstudentchallenge.secure-platform.com/a/page/award-categories' },
      { label: 'Competition and AI FAQ', href: 'https://g4cstudentchallenge.secure-platform.com/a/page/faq' },
    ],
  },
  {
    title: 'Gamedev.js Jam 2027',
    format: 'Online jam · Browser games',
    date: 'Apr 13–26, 2027',
    schedule: 'Build window · Closes at 23:00',
    build: 'Ship an HTML5 game with English as the default language. The jam allows AI tools and requires entrants to respect copyright.',
    eligibility: 'Any skill level, solo or team. Use any engine that can export a playable browser build.',
    link: 'https://itch.io/jam/gamedevjs-2027',
    prizePool: '2027 amounts and items to be announced',
    awards: 'The organizer lists overall prizes, prizes by judging criterion, and separately judged challenge prizes. Community voting considers innovation, theme, gameplay, graphics, and audio.',
    entryRules: [
      'Make a themed browser game that runs without extra plugins and defaults to English. Any engine is allowed if it exports a playable web build.',
      'Enter solo or with a team. Multiple entries are allowed. AI tools are allowed if your work respects copyright.',
    ],
  },
  {
    title: 'GMTK Game Jam 2027',
    format: 'Online jam · Four days',
    date: 'Aug 12–16, 2027',
    schedule: 'Build window · Closes at 01:00',
    build: 'Submit a free game playable on Windows in a browser or as a download. The rules prohibit AI-generated art and audio.',
    eligibility: 'All ages worldwide, solo or team. A parent or guardian should upload the game for entrants under 13.',
    link: 'https://itch.io/jam/gmtk-2027',
    prizePool: 'No prize pool published',
    awards: 'Peer ratings recognize creativity, enjoyment, narrative, artwork, and audio. There is no combined ranking. Mark Brown features selected games on Game Maker’s Toolkit. Participants can request a certificate.',
    entryRules: [
      'Create the game during the jam. Licensed existing code and assets are allowed. The entry must be suitable for a general audience, free to play, and uploaded to itch.io.',
      'Provide a Windows-compatible download or browser build that works with keyboard or mouse and requires no extra software.',
      'AI-generated art and audio are prohibited in the game and its itch.io thumbnail. The voting period locks uploads.',
    ],
  },
];

export const appCompetitions: Competition[] = [
  {
    title: 'Global Appathon 2027',
    format: 'Free online competition · MIT App Inventor',
    date: 'Apr 3, 2027 · 19:59',
    schedule: 'Submission deadline · Submissions open Dec 2, 2026',
    build: 'Build a mobile app that addresses a UN Sustainable Development Goal. Submit the app, a 2–3 minute demo with English captions, and an English slide deck.',
    eligibility: 'Junior, Youth and Adult divisions. One to five people per team. A parent, guardian, or teacher registers entrants under 13.',
    link: 'https://globalappathon.org/',
    prizePool: 'No cash pool published',
    awards: 'One winner per division receives an award certificate, organizer press coverage, and a 2027 Global Education Summit presentation invitation. Honorable mentions also receive certificates and an invitation. Entrants who submit successfully and complete the post-event survey receive a digital contribution certificate.',
    entryRules: [
      'Use MIT App Inventor to address a UN Sustainable Development Goal. Each member registers individually. Enter one team and submit one project.',
      'Share the app in the App Inventor Gallery or provide an .aia file. Submit a 2–3 minute demo featuring a target user and an English slide deck.',
      'Complete the forms in English. Videos can be in any language with English captions. AI is optional.',
    ],
    references: [
      { label: 'Registration and submission', href: 'https://globalappathon.org/registration-submission/' },
      { label: 'Judging and FAQ', href: 'https://globalappathon.org/faq/' },
    ],
  },
  {
    title: 'Lanqiao Cup · HarmonyOS App Development',
    format: 'Mainland China · University competition',
    date: 'Dec 18, 2026 · 14:00',
    schedule: 'Registration deadline · Qualifiers scheduled for April 2027',
    build: 'Enter the HarmonyOS app development track of the 18th Lanqiao Cup (蓝桥杯鸿蒙应用开发). The Cup also offers Web Application Development as a separate software event.',
    eligibility: 'Eligible full-time higher education students. Register through your institution and check its internal deadline.',
    link: 'https://dasai.lanqiao.cn/',
    prizePool: 'No HarmonyOS cash amount verified',
    awards: 'The committee issues certificates to award-winning entrants and supervising teachers at the qualifier and national levels. Award tiers and quotas for HarmonyOS follow the special-track rules.',
    entryRules: [
      'Register online under your institution, choose the HarmonyOS track, and confirm eligibility, the entry fee, and any campus selection requirements.',
      'The four-hour qualifier is scheduled for April 24, 2027. Confirm the venue, format, permitted tools, and advancement criteria in the track notice and on your admission ticket.',
    ],
    references: [
      { label: 'Official competition notice', href: 'https://dasai.lanqiao.cn/notices/3004' },
      { label: 'Qualifier schedule and certificates', href: 'https://xxgcxy.kfvc.edu.cn/2026/1022/c206a11078/page.htm' },
    ],
  },
  {
    title: 'Apple Swift Student Challenge',
    format: 'International student competition · Swift',
    date: 'Feb 8–28, 2027',
    schedule: 'Submission window · Organizer dates',
    build: 'Make an original app for an Apple platform that judges can experience offline in three minutes. Submit an Xcode app or Swift Playground project.',
    eligibility: 'Individual entry. Mainland China entrants must be at least 14 and meet Apple’s student eligibility requirements.',
    link: 'https://developer.apple.com/swift-student-challenge/',
    prizePool: 'No cash pool published',
    awards: 'Winners receive a year of Apple Developer Program membership and a gift. Apple invites Distinguished Winners to an experience in Cupertino. Judging considers innovation, creativity, social impact, or inclusivity.',
    entryRules: [
      'Submit your own English-language app as a ZIP up to 500 MB. It must run offline and be reviewable in three minutes using Xcode 27 or Swift Playground 4.7 or later.',
      'Provide proof you meet the student eligibility requirement. Credit third-party materials you use under the rules.',
      'You may use AI for specific tasks with full disclosure. The submission must show substantial individual work and technical understanding.',
    ],
    references: [
      { label: 'Eligibility and requirements', href: 'https://developer.apple.com/swift-student-challenge/eligibility/' },
      { label: 'Official terms and AI rules', href: 'https://developer.apple.com/swift-student-challenge/policy/' },
    ],
  },
  {
    title: 'Technovation Challenge',
    format: 'Free global competition · App or AI project',
    date: 'Mar 12, 2027 · 07:59',
    schedule: 'Registration deadline · Projects due May 6 at 08:00',
    build: 'Build a mobile app, web app, or AI tool for a problem in your community. Prepare a pitch that explains who it helps and how it works.',
    eligibility: 'Ages 8–18. The global program offers a Girls Track and a separate Mixed Track open to co-ed or boys’ teams.',
    link: 'https://technovationchallenge.org/get-involved/',
    prizePool: 'US$250–750 stipends per person · Total unpublished',
    awards: 'Regional Honors pay $250 per person. Finalists receive $500 per person, with covered World Summit travel and accommodation for Girls Track finalists. Each Girls Track division grand-prize team gets $750 per person in place of the $500. Further Mixed Track honors are pending.',
    entryRules: [
      'Register 1–5 students. The oldest member’s age on August 1, 2027 determines the division. Follow the parental consent rules.',
      'Build a working digital solution for a real community problem and test it with real users. Submit the required project evidence, video and written materials for your division through the team profile.',
      'Students must do the work and credit outside sources, including AI tools they used. Written submissions must be in English. Videos in other languages need English subtitles.',
    ],
    references: [
      { label: 'Award structure', href: 'https://technovationchallenge.org/award-structure/' },
      { label: 'Submission guidelines', href: 'https://technovationchallenge.org/submission-guidelines/' },
    ],
  },
  {
    title: 'Youth AI Coding Competition',
    format: 'International student competition · Shanghai final',
    date: 'Apr 10, 2027 · 07:59',
    schedule: 'English-group registration deadline · Final on Jul 2',
    build: 'In AI原生·代码进化, start with a project proposal and progress to a pitch video and working software prototype using AI coding tools.',
    eligibility: 'Primary through high school worldwide. Free to enter solo or in teams of up to three. Check the organizer’s schedule for the Chinese-language group.',
    link: 'https://www.saec.org.cn/airace/',
    prizePool: '2027 cash amounts and award tiers unannounced',
    awards: 'Finalists present and answer questions in Shanghai. The organizer lists a 2027 World Artificial Intelligence Conference showcase for top projects, with the date pending. Finalists cover their own travel.',
    entryRules: [
      'In the English-language group, submit a project description of up to 200 words. If selected, submit a video of up to three minutes and then a working prototype made with AI coding tools.',
      'Advancing teams outside mainland China pitch at an online regional final. Mainland entries are scored on their materials at that stage. Shanghai finalists submit an improved prototype and give a live demo and Q&A.',
    ],
  },
];

export const shanghai2026: Competition = {
  title: 'Shanghai Youth Computer Innovation Competition',
  format: 'Shanghai · Mobile App Development track',
  date: 'Oct 17, 2026 · 12:00',
  schedule: '2026 entries closed',
  build: 'The 25th edition’s mobile track invited students to build a health app for Android, iOS, or OpenHarmony.',
  eligibility: 'Teams of up to three from the same school stage. Check the next edition’s notice for eligible grades and submission dates.',
  link: 'https://www.shxszp.cn/blog/e203e3b1da6',
  prizePool: 'No cash pool listed in the 2026 notice',
  awards: 'First, second, and third prizes by school division. The notice provisionally allocates 10%, 15%, and 40% to those tiers for the mobile app and other applicable tracks. Winners receive certificates. Schools and organizing units can receive group awards.',
  entryRules: [
    'Develop a health-focused mobile app for Android, iOS, or OpenHarmony. Team members must share a school stage, with up to three students and two supervising teachers.',
    'Submit through the Shanghai Science and Art Education Center mini-program. Districts review entries before selected teams present at the city final.',
  ],
  archived: true,
};

type Competition = {
  title: string;
  format: string;
  date: string;
  schedule: string;
  build: string;
  eligibility: string;
  link: string;
  rules?: { label: string; href: string };
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
    rules: { label: 'GitHub announcement', href: 'https://github.blog/open-source/gaming/game-off-2026-the-theme-is-shift/' },
  },
  {
    title: 'Scratch Game Jam #24',
    format: 'Online jam · Scratch',
    date: 'Dec 5, 2026 · 08:00',
    schedule: 'Submission deadline',
    build: 'Make a themed game during the jam in Scratch, Gandi IDE, or TurboWarp. Submit a browser-playable HTML5 export.',
    eligibility: 'Solo or team. A first jam for students who already know the basics of Scratch.',
    link: 'https://itch.io/jam/scratch-game-jam-24',
  },
  {
    title: 'Godot Wild Jam #100',
    format: 'Online jam · Godot',
    date: 'Dec 12–21, 2026',
    schedule: 'Build window · Closes at 05:00',
    build: 'Build a new Godot game around the announced theme. The organizer prohibits generative AI.',
    eligibility: 'Solo or team. Beginners are welcome.',
    link: 'https://itch.io/jam/godot-wild-jam-100',
  },
  {
    title: 'Global Game Jam 2027',
    format: 'Game jam · Join a local or online site',
    date: 'Jan 25–31, 2027',
    schedule: 'Global event window · Registration opens Dec 1, 2026',
    build: 'Make a game from the global theme. Each jam site sets its own schedule and participation details.',
    eligibility: 'Standard sites generally require local age of majority. Minors should check the site’s guardian policy or look for GGJ Next.',
    link: 'https://globalgamejam.org/',
    rules: { label: 'Age policy', href: 'https://globalgamejam.org/policies' },
  },
  {
    title: 'Brackeys Game Jam 2027.1',
    format: 'Online jam · One week',
    date: 'Feb 14–21, 2027',
    schedule: 'Build window · Closes at 19:00',
    build: 'Build a game from the theme revealed at kickoff, then play and rate other teams’ games. The organizer will post the full rules closer to the jam.',
    eligibility: 'Solo or team. The organizer recommends keeping teams under four people.',
    link: 'https://itch.io/jam/brackeys-17',
  },
  {
    title: 'Games for Change Student Challenge',
    format: 'International student competition · Social impact',
    date: 'Mar 30, 2027 · 14:59',
    schedule: 'Competition submission deadline',
    build: 'Design an original game inspired by one of the season’s social impact themes, such as belonging or resilience.',
    eligibility: 'Ages 8–25 across four divisions. Games by students outside the US can be considered for Best International Game.',
    link: 'https://learn.gamesforchange.org/student-challenge/competition',
    rules: { label: 'Submission portal', href: 'https://g4cstudentchallenge.secure-platform.com/a' },
  },
  {
    title: 'Gamedev.js Jam 2027',
    format: 'Online jam · Browser games',
    date: 'Apr 13–26, 2027',
    schedule: 'Build window · Closes at 23:00',
    build: 'Ship an HTML5 game with English as the default language. The jam allows AI tools and requires entrants to respect copyright.',
    eligibility: 'Any skill level, solo or team. Use any engine that can export a playable browser build.',
    link: 'https://itch.io/jam/gamedevjs-2027',
  },
  {
    title: 'GMTK Game Jam 2027',
    format: 'Online jam · Four days',
    date: 'Aug 12–16, 2027',
    schedule: 'Build window · Closes at 01:00',
    build: 'Submit a free game playable on Windows in a browser or as a download. The rules prohibit AI-generated art and audio.',
    eligibility: 'All ages worldwide, solo or team. A parent or guardian should upload the game for entrants under 13.',
    link: 'https://itch.io/jam/gmtk-2027',
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
    rules: { label: 'Registration and submission', href: 'https://globalappathon.org/registration-submission/' },
  },
  {
    title: 'Lanqiao Cup · HarmonyOS App Development',
    format: 'Mainland China · University competition',
    date: 'Dec 18, 2026 · 14:00',
    schedule: 'Registration deadline · Qualifiers scheduled for April 2027',
    build: 'Enter the HarmonyOS app development track of the 18th Lanqiao Cup (蓝桥杯鸿蒙应用开发). The Cup also offers Web Application Development as a separate software event.',
    eligibility: 'Eligible full-time higher education students. Register through your institution and check its internal deadline.',
    link: 'https://dasai.lanqiao.cn/',
    rules: { label: 'University registration notice', href: 'https://due.xjtu.edu.cn/info/1172/10507.htm' },
  },
  {
    title: 'Apple Swift Student Challenge',
    format: 'International student competition · Swift',
    date: 'Feb 8–28, 2027',
    schedule: 'Submission window · Organizer dates',
    build: 'Make an original app for an Apple platform that judges can experience offline in three minutes. Submit an Xcode app or Swift Playground project.',
    eligibility: 'Individual entry. Mainland China entrants must be at least 14 and meet Apple’s student eligibility requirements.',
    link: 'https://developer.apple.com/swift-student-challenge/',
    rules: { label: 'Eligibility and requirements', href: 'https://developer.apple.com/swift-student-challenge/eligibility/' },
  },
  {
    title: 'Technovation Challenge',
    format: 'Free global competition · App or AI project',
    date: 'Mar 12, 2027 · 07:59',
    schedule: 'Registration deadline · Projects due May 6 at 08:00',
    build: 'Build a mobile app, web app, or AI tool for a problem in your community. Prepare a pitch that explains who it helps and how it works.',
    eligibility: 'Ages 8–18. The global program offers a Girls Track and a separate Mixed Track open to co-ed or boys’ teams.',
    link: 'https://technovationchallenge.org/get-involved/',
    rules: { label: 'Submission guidelines', href: 'https://technovationchallenge.org/submission-guidelines/' },
  },
  {
    title: 'Youth AI Coding Competition',
    format: 'International student competition · Shanghai final',
    date: 'Apr 10, 2027 · 07:59',
    schedule: 'English-group registration deadline · Final on Jul 2',
    build: 'In AI原生·代码进化, start with a project proposal and progress to a pitch video and working software prototype using AI coding tools.',
    eligibility: 'Primary through high school worldwide. Free to enter solo or in teams of up to three. Check the organizer’s schedule for the Chinese-language group.',
    link: 'https://www.saec.org.cn/airace/',
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
};

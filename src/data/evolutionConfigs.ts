export type EvolutionCard = {
  label: string;
  title: string;
  copy: string;
};

export type EvolutionConfig = {
  version: number;
  parentVersion: number;
  theme: "atelier" | "cinematic" | "glass" | "architecture";
  title: string;
  primaryAudience: string;
  description: string;
  hero: {
    eyebrow: string;
    headline: string;
    summary: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
  };
  metrics: EvolutionCard[];
  paths: EvolutionCard[];
  process: EvolutionCard[];
  closing: {
    eyebrow: string;
    headline: string;
    copy: string;
    cta: string;
    href: string;
  };
};

export const evolutionConfigs: Record<number, EvolutionConfig> = {
  5: {
    version: 5,
    parentVersion: 1,
    theme: "atelier",
    title: "Coaching Atelier, Refined",
    primaryAudience: "Parents and private coaching clients",
    description: "A warmer, clearer evolution of Version 1 with verified experience, a visible coaching process, and stronger next steps.",
    hero: {
      eyebrow: "Private coaching · Speech · Debate · Presentation",
      headline: "A speaking practice shaped around the moment that matters.",
      summary: "Work with Coach Kai to clarify the message, strengthen the structure, rehearse the delivery, and prepare for the real audience ahead.",
      primaryCta: "Discuss the next speaking goal",
      primaryHref: "/contact/",
      secondaryCta: "Meet Coach Kai",
      secondaryHref: "/about/",
    },
    metrics: [
      { label: "Experience", title: "15+ years", copy: "Education and communication training" },
      { label: "Students", title: "2,000+", copy: "Learners trained in speaking, debate, and confidence" },
      { label: "Presentations", title: "1,000+", copy: "Delivered across seven countries" },
    ],
    paths: [
      { label: "01", title: "Speech and storytelling", copy: "Shape ideas into a clear, memorable message for a class, competition, talk, or personal story." },
      { label: "02", title: "Debate and response", copy: "Build claims, reasons, evidence, comparison, listening, and confident response under pressure." },
      { label: "03", title: "Presentations and interviews", copy: "Prepare the structure, delivery, presence, and audience connection for an important moment." },
    ],
    process: [
      { label: "Clarify", title: "Name the moment", copy: "Define the audience, purpose, context, and most important challenge." },
      { label: "Shape", title: "Build the message", copy: "Organize the idea, story, argument, or presentation into a path people can follow." },
      { label: "Rehearse", title: "Practise intentionally", copy: "Work on voice, pace, emphasis, presence, response, and realistic performance conditions." },
      { label: "Refine", title: "Make the next adjustment", copy: "Use specific feedback, keep what works, and improve the next attempt." },
    ],
    closing: {
      eyebrow: "Start with context, not a package",
      headline: "Tell Kai what the next speaking moment requires.",
      copy: "Share the learner, audience, occasion, and current challenge. The first conversation is about fit and a useful starting point.",
      cta: "Start the conversation",
      href: "/contact/",
    },
  },
  6: {
    version: 6,
    parentVersion: 2,
    theme: "cinematic",
    title: "Cinematic Stage, Refined",
    primaryAudience: "Students, professionals, and ambitious speakers",
    description: "A more legible and conversion-focused evolution of Version 2 that keeps its cinematic portrait and stage energy.",
    hero: {
      eyebrow: "Coach · Method · Programs · Evidence",
      headline: "Step into the room with something worth hearing.",
      summary: "Coach Kai helps students and professionals turn an important idea into a clear message, a deliberate performance, and a stronger next attempt.",
      primaryCta: "Plan the next performance",
      primaryHref: "/contact/",
      secondaryCta: "Explore the public profile",
      secondaryHref: "/about/",
    },
    metrics: [
      { label: "Speaking", title: "TEDx", copy: "Speaker and coach" },
      { label: "Reach", title: "7 countries", copy: "Presentations and training" },
      { label: "Leadership", title: "District 85", copy: "Competition and training record" },
    ],
    paths: [
      { label: "Student", title: "Build a voice that feels like yours", copy: "Develop ideas, stories, debate responses, stage presence, and confidence through purposeful practice." },
      { label: "Professional", title: "Make the important message land", copy: "Prepare presentations, interviews, business stories, pitches, and high-stakes conversations." },
      { label: "School", title: "Create a practical speaking experience", copy: "Discuss the audience, learning need, focus, setting, and possible workshop or coaching format." },
    ],
    process: [
      { label: "Focus", title: "Find the central idea", copy: "Decide what the audience should understand, feel, or do." },
      { label: "Structure", title: "Build the route", copy: "Create a beginning, development, turn, and finish the audience can follow." },
      { label: "Rehearse", title: "Make intentional choices", copy: "Practise pace, emphasis, expression, response, presence, and timing." },
      { label: "Perform", title: "Connect, notice, refine", copy: "Try the moment, learn from its effect, and choose the next adjustment." },
    ],
    closing: {
      eyebrow: "The spotlight is a practice space",
      headline: "Prepare the message before the room decides what it means.",
      copy: "Start with the audience, the occasion, and the result the communication needs to create.",
      cta: "Discuss the moment",
      href: "/contact/",
    },
  },
  7: {
    version: 7,
    parentVersion: 3,
    theme: "glass",
    title: "Spatial Focus System",
    primaryAudience: "Parents and modern learning partners",
    description: "A clearer evolution of Version 3 that turns spatial glass into a guided parent-first decision journey.",
    hero: {
      eyebrow: "Goal → Practice → Feedback → Next attempt",
      headline: "Bring the next communication challenge into focus.",
      summary: "Explore the coach, speaking paths, practice method, and verified public experience without losing the human goal at the center.",
      primaryCta: "Ask about fit",
      primaryHref: "/contact/",
      secondaryCta: "See how Kai coaches",
      secondaryHref: "/about/",
    },
    metrics: [
      { label: "Experience", title: "15+ years", copy: "Education and communication training" },
      { label: "Practice", title: "Speech · Debate", copy: "Storytelling, presentation, and response" },
      { label: "Evidence", title: "Public record", copy: "Profile, results, leadership, and working tools" },
    ],
    paths: [
      { label: "Clarity", title: "The ideas are difficult to organize", copy: "Practise the central point, supporting reasons, examples, story movement, and a finish." },
      { label: "Delivery", title: "The message is prepared but not landing", copy: "Work on voice, pace, expression, pause, presence, and audience connection." },
      { label: "Response", title: "The speaker needs to think in the moment", copy: "Practise listening, comparison, adaptation, questions, interviews, and debate response." },
    ],
    process: [
      { label: "Goal", title: "Define the communication moment", copy: "Who is listening, what matters, and what does success require?" },
      { label: "Map", title: "Choose a useful practice focus", copy: "Concentrate on an observable speaking choice instead of trying to fix everything." },
      { label: "Practice", title: "Try it in context", copy: "Rehearse with realistic prompts, timing, audience needs, and performance conditions." },
      { label: "Refine", title: "Carry one adjustment forward", copy: "Keep a useful choice and make the next attempt more deliberate." },
    ],
    closing: {
      eyebrow: "A calm place to begin",
      headline: "Start with the learner’s next real challenge.",
      copy: "Share the age, situation, audience, and current concern. Kai can help identify a practical starting point.",
      cta: "Start a fit conversation",
      href: "/contact/",
    },
  },
  8: {
    version: 8,
    parentVersion: 4,
    theme: "architecture",
    title: "Program Architecture, Refined",
    primaryAudience: "Schools, organizations, and serious buyers",
    description: "A stronger evolution of Version 4 with a clearer institutional decision path, verified capability, and program-planning CTA.",
    hero: {
      eyebrow: "Speech · Debate · Presentation · Workshop",
      headline: "Build the communication program around the people in the room.",
      summary: "Choose a speaking path, inspect the practice method, and begin a planning conversation around the audience, context, and communication need.",
      primaryCta: "Plan a program conversation",
      primaryHref: "/contact/",
      secondaryCta: "Review Coach Kai’s background",
      secondaryHref: "/about/",
    },
    metrics: [
      { label: "Leadership scale", title: "20 clubs", copy: "Approximately 500 members as Division N Director" },
      { label: "Officer training", title: "120 × 2", copy: "Participants across two training programs" },
      { label: "Development", title: "6 pathways", copy: "Toastmasters Pathways completed" },
    ],
    paths: [
      { label: "01", title: "Speech", copy: "Ideas, structure, storytelling, delivery, presence, and audience connection." },
      { label: "02", title: "Debate", copy: "Claims, evidence, comparison, response, critical thinking, and persuasive delivery." },
      { label: "03", title: "Presentation", copy: "Message, visuals, flow, rehearsal, professional presence, and the important moment." },
      { label: "04", title: "Workshop", copy: "A planned learning experience shaped around the group, setting, and communication need." },
    ],
    process: [
      { label: "Brief", title: "Define the audience", copy: "Clarify participants, context, communication challenge, and intended focus." },
      { label: "Design", title: "Choose the practice architecture", copy: "Shape the emphasis, sequence, activities, examples, and possible format." },
      { label: "Deliver", title: "Make participation practical", copy: "Connect concepts to rehearsal, response, application, and observable choices." },
      { label: "Review", title: "Identify the next useful step", copy: "Close with reflection, priorities, and a practical route for continued practice." },
    ],
    closing: {
      eyebrow: "Programs are discussed, not pre-packaged",
      headline: "Start with the audience and the communication problem.",
      copy: "Share the group, setting, timing, goals, and current constraints. No fixed package, price, or capacity is implied here.",
      cta: "Discuss a program",
      href: "/contact/",
    },
  },
};

export function getEvolutionConfig(version: number): EvolutionConfig {
  const config = evolutionConfigs[version];
  if (!config) throw new Error(`Missing evolution config for Version ${version}.`);
  return config;
}

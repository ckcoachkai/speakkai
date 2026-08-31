import registry from "../../design-lab-v4/config/experiments.json";

export type ExperimentFamily = "corporate" | "fun-motion" | "modern";
export type StakeholderCategory = "parent" | "student" | "customer" | "mixed";

export type ExperimentPanel = {
  label: string;
  title: string;
  copy: string;
};

export type ExperimentContent = {
  headline: string;
  summary: string;
  panels: ExperimentPanel[];
  secondaryCta: string;
  secondaryHref: string;
  boundary: string;
  accentAsset?: string;
};

export type ExperimentV4 = {
  number: number;
  sourceNumber: number;
  slug: string;
  family: ExperimentFamily;
  title: string;
  primaryStakeholder: string;
  secondaryStakeholder: string;
  primaryCategory: StakeholderCategory;
  hypothesis: string;
  layoutArchetype: string;
  visualLanguage: string;
  portraitTreatment: string;
  interactionModel: string;
  motionLanguage: string;
  primaryCta: string;
  primaryHref: string;
  signature: Record<string, string>;
  avoid: string;
  content: ExperimentContent;
};

const panel = (label: string, title: string, copy: string): ExperimentPanel => ({ label, title, copy });

const contentByNumber: Record<number, ExperimentContent> = {
  21: {
    headline: "Build a speaking program around the moment that matters.",
    summary: "Speech, debate, storytelling, presentation, and communication coaching for students, professionals, schools, and organizations.",
    panels: [
      panel("Programs", "Begin with the audience", "Name who will speak, what they are preparing for, and the communication focus."),
      panel("Method", "Make practice visible", "Assess, structure, practise, refine, and perform around the real speaking task."),
      panel("Partnership", "Shape the right format", "Discuss the setting, scope, and goals instead of assuming a standard package."),
    ],
    secondaryCta: "Read Coach Kai's profile",
    secondaryHref: "/about/",
    boundary: "No partnership, scale, or outcome is claimed without confirmation.",
  },
  22: {
    headline: "Which speaking skill needs attention now?",
    summary: "A parent-first evidence grid for exploring the task, the practice process, Coach Kai's public profile, and the next useful question.",
    panels: [
      panel("01 / Task", "Start with the real moment", "Share the speech, debate, story, presentation, interview, or conversation ahead."),
      panel("02 / Practice", "Work on observable choices", "Ideas, structure, delivery, response, feedback, and another attempt."),
      panel("03 / Evidence", "Use public, inspectable sources", "The About page and working tools are available; unsupported proof stays out."),
      panel("04 / Next", "Ask about fit", "Describe the speaker, context, and next challenge on the contact page."),
    ],
    secondaryCta: "Open the public profile",
    secondaryHref: "/about/",
    boundary: "This is a decision aid, not a diagnosis or student tracking dashboard.",
    accentAsset: "/images/test/cyber-orbit.webp",
  },
  23: {
    headline: "A clear method, from first brief to final delivery.",
    summary: "A live practice report that explains how a communication goal can move through preparation without pretending to be an investor document.",
    panels: [
      panel("Assess", "Clarify the brief", "Identify the audience, context, strengths, and next important challenge."),
      panel("Structure", "Build the path", "Organize the idea, argument, story, and supporting material."),
      panel("Practice", "Try it under realistic conditions", "Rehearse, notice the effect, refine the choices, and try again."),
      panel("Perform", "Use the message", "Prepare for the real situation without promising a guaranteed result."),
    ],
    secondaryCta: "See the coaching method",
    secondaryHref: "/about/",
    boundary: "This practice overview contains no financial, client, or impact reporting.",
    accentAsset: "/images/test/vlog-megaphone.webp",
  },
  24: {
    headline: "Make the message land in the room.",
    summary: "A keynote-scale interface for presentation, storytelling, persuasion, and leadership communication preparation.",
    panels: [
      panel("Why", "Know what the room needs", "Clarify the point before polishing the performance."),
      panel("Build", "Give the idea a structure", "Create a route the audience can follow and remember."),
      panel("Rehearse", "Practise the real delivery", "Work on pace, emphasis, expression, presence, and response."),
      panel("Refine", "Choose the next adjustment", "Use specific feedback to make the next attempt intentional."),
    ],
    secondaryCta: "Meet Coach Kai",
    secondaryHref: "/about/",
    boundary: "This direction presents coaching preparation, not a claim that keynote speaking is the product.",
  },
  25: {
    headline: "What is your child preparing to say?",
    summary: "Choose a communication focus to reveal a possible starting point—without treating a homepage choice as an assessment.",
    panels: [
      panel("Confidence", "Make the first attempt easier to begin", "Use a manageable speaking task and specific feedback."),
      panel("Structure", "Help the audience follow", "Find the main point, supporting ideas, and a clear finish."),
      panel("Competition", "Prepare for the real format", "Practise the task, timing, reasoning, delivery, and response."),
      panel("Presentation", "Guide attention", "Coordinate message, visuals, voice, and presence around the audience."),
    ],
    secondaryCta: "View current availability",
    secondaryHref: "/schedule/",
    boundary: "Selections are conversation starters, not diagnoses, placements, or guaranteed recommendations.",
  },
  26: {
    headline: "Plan a practical speaking program.",
    summary: "Map audience, setting, focus, and practice into one clear institutional conversation.",
    panels: [
      panel("Audience", "Who needs to communicate?", "Start with learners, professionals, teams, or event participants."),
      panel("Moment", "What are they preparing for?", "Name the speech, debate, presentation, workshop, or communication challenge."),
      panel("Focus", "What should practice emphasize?", "Explore ideas, structure, delivery, response, story, or confidence."),
      panel("Format", "What could fit?", "Discuss the setting and scope instead of assuming a fixed package."),
    ],
    secondaryCta: "Review public background",
    secondaryHref: "/about/",
    boundary: "No standard format, delivery scale, school partner, or result is implied.",
  },
  27: {
    headline: "Bespoke coaching for the moment that matters.",
    summary: "A quiet private-coaching atelier shaped around audience, message, structure, delivery, and another purposeful attempt.",
    panels: [
      panel("Message", "Clarify the point", "Decide what the audience should understand and remember."),
      panel("Delivery", "Rehearse the moment", "Practise pace, emphasis, expression, presence, and response."),
      panel("Refinement", "Keep what works", "Use specific feedback to choose what to keep and what to change."),
    ],
    secondaryCta: "Read the coaching approach",
    secondaryHref: "/about/",
    boundary: "The premium visual treatment does not claim exclusivity, scarcity, or guaranteed prestige.",
    accentAsset: "/images/test/kids-speaking.webp",
  },
  28: {
    headline: "See the practice behind a stronger speaking moment.",
    summary: "A process-example wall shows Goal, Practice, Change, and Next Step while approved learner case studies remain unavailable.",
    panels: [
      panel("Process example", "Goal", "Name the audience, occasion, message, and current challenge."),
      panel("Process example", "Practice", "Try structure and delivery choices in a realistic speaking task."),
      panel("Process example", "Change", "Notice what became clearer and what still needs work."),
      panel("Process example", "Next step", "Choose one adjustment and make another attempt."),
    ],
    secondaryCta: "Explore working tools",
    secondaryHref: "/resources/tools/",
    boundary: "These are process examples—not testimonials, student stories, or before-and-after claims.",
    accentAsset: "/images/test/kids-speaking.webp",
  },
  29: {
    headline: "See SpeakKai in context.",
    summary: "A documentary-style press room built only from approved Coach Kai imagery, public pages, and working speaking tools.",
    panels: [
      panel("Profile", "Coach Kai", "Open the public biography and current coaching background."),
      panel("Practice", "Working tools", "Explore concrete speaking and classroom tools already available on SpeakKai."),
      panel("Availability", "Plan with current information", "Use the public schedule as a starting point and confirm before relying on it."),
      panel("Boundary", "No invented documentary evidence", "Illustrations, tool previews, and portraits are labelled for what they are."),
    ],
    secondaryCta: "Explore the tools",
    secondaryHref: "/resources/tools/",
    boundary: "No frame is presented as a student result, partnership, or real classroom case study.",
  },
  30: {
    headline: "Move from idea to delivery.",
    summary: "A motion identity for speech, debate, storytelling, presentation, and professional communication preparation.",
    panels: [
      panel("Speaking", "Clarify and connect", "Make the point understandable, memorable, and purposeful."),
      panel("Debate", "Build and test reasons", "Practise claims, evidence, comparison, and response."),
      panel("Presentation", "Guide the room", "Coordinate structure, delivery, visuals, and audience attention."),
      panel("Professional", "Prepare the important moment", "Rehearse interviews, talks, leadership messages, and conversations."),
    ],
    secondaryCta: "Meet the coach",
    secondaryHref: "/about/",
    boundary: "Motion is finite and decorative; the proposition and actions remain readable without it.",
  },
  31: {
    headline: "Choose your next speaking skill.",
    summary: "Ideas, story, debate, voice, presence, and response become an explorable skill galaxy—not a ranking system.",
    panels: [
      panel("Ideas", "Know what you mean", "Find the thought before polishing the performance."),
      panel("Story", "Make people care", "Create movement, detail, contrast, and a satisfying finish."),
      panel("Debate", "Build and test reasons", "Practise claims, evidence, comparison, and response."),
      panel("Presence", "Connect with the room", "Coordinate attention, body language, voice, and purpose."),
    ],
    secondaryCta: "How coaching works",
    secondaryHref: "/about/",
    boundary: "The skill universe is exploratory and does not imply formal levels or personal progress data.",
    accentAsset: "/images/test/cyber-orbit.webp",
  },
  32: {
    headline: "The stage is a path, not a leap.",
    summary: "A four-level quest turns an intimidating speaking moment into a sequence of approachable practice choices.",
    panels: [
      panel("Level 01", "Find the point", "Say what the audience should understand in one clear sentence."),
      panel("Level 02", "Build the route", "Create a beginning, movement, and finish."),
      panel("Level 03", "Try the delivery", "Practise pace, emphasis, expression, and pause."),
      panel("Level 04", "Respond in the moment", "Answer, adapt, and keep the message clear."),
    ],
    secondaryCta: "Try a speaking tool",
    secondaryHref: "/resources/tools/",
    boundary: "Levels describe practice choices, not grades, achievements, or a fixed curriculum.",
    accentAsset: "/images/concepts/speakkai-influence-sketch.png",
  },
  33: {
    headline: "Every strong speech has panels.",
    summary: "A comic speech lab breaks a communication idea into scene, tension, turn, and final line—with mature graphic energy.",
    panels: [
      panel("Panel 01", "Set the scene", "Give the audience the people, place, or problem they need."),
      panel("Panel 02", "Create movement", "Use contrast, tension, a question, or a choice."),
      panel("Panel 03", "Make the turn", "Reveal the idea, response, or consequence."),
      panel("Panel 04", "Land the line", "Finish with the thought the audience should carry."),
    ],
    secondaryCta: "Open a story tool",
    secondaryHref: "/resources/tools/",
    boundary: "The comic language is a creative structure, not a claim about a standard program.",
  },
  34: {
    headline: "Your words can move before you do.",
    summary: "A kinetic type playground reveals how pace, emphasis, contrast, and pause change what an audience hears.",
    panels: [
      panel("Pace", "Give the thought room", "Speed can add energy; space can make the point easier to follow."),
      panel("Emphasis", "Choose what matters", "Stress helps the audience hear the center of the sentence."),
      panel("Contrast", "Create a difference", "Opposing ideas make change and choice visible."),
      panel("Pause", "Let meaning arrive", "Silence can separate ideas and give the room time to think."),
    ],
    secondaryCta: "Explore practice tools",
    secondaryHref: "/resources/tools/",
    boundary: "The type motion has a complete reduced-motion fallback and carries no essential meaning alone.",
    accentAsset: "/images/test/cyber-orbit.webp",
  },
  35: {
    headline: "Mission: make the message clear.",
    summary: "A game HUD organizes speaking practice into selectable missions without pretending to track a real learner account.",
    panels: [
      panel("Mission A", "Find the idea", "Identify the point and the strongest support."),
      panel("Mission B", "Build the structure", "Create a path the audience can follow."),
      panel("Mission C", "Practise the delivery", "Use voice, expression, presence, and timing intentionally."),
      panel("Mission D", "Handle the response", "Listen, answer, adapt, and stay clear under pressure."),
    ],
    secondaryCta: "Ask about coaching",
    secondaryHref: "/contact/",
    boundary: "Mission language is metaphorical; there are no scores, ranks, accounts, or stored learner data.",
  },
  36: {
    headline: "Make speaking feel like you.",
    summary: "A sticker-cutout studio lets students combine message, tone, story, and delivery into a personal speaking direction.",
    panels: [
      panel("Message", "Choose the thought", "Start with what you actually want people to understand."),
      panel("Tone", "Sound like a person", "Use language and voice that fit the audience and occasion."),
      panel("Story", "Give the idea life", "Add detail, change, contrast, and a reason to care."),
      panel("Delivery", "Try it out loud", "Practise, notice the effect, and make a new choice."),
    ],
    secondaryCta: "Meet Coach Kai",
    secondaryHref: "/about/",
    boundary: "The creative direction invites expression without promising a fixed identity or outcome.",
  },
  37: {
    headline: "Open the practice desk.",
    summary: "A warm tabletop world turns method into four tangible cards that parents and students can explore together.",
    panels: [
      panel("Prompt card", "What are you trying to say?", "Name the audience, occasion, and central idea."),
      panel("Structure card", "What comes next?", "Arrange the beginning, development, and finish."),
      panel("Voice card", "How should it sound?", "Practise pace, emphasis, expression, and pause."),
      panel("Reflection card", "What will you try again?", "Choose one specific adjustment for the next attempt."),
    ],
    secondaryCta: "Explore classroom tools",
    secondaryHref: "/resources/tools/",
    boundary: "Illustrative desk elements are not presented as evidence of a particular class or student.",
    accentAsset: "/images/test/vlog-megaphone.webp",
  },
  38: {
    headline: "Hear the shape of a sentence.",
    summary: "A rhythm-and-voice visualizer turns pace, emphasis, expression, and pause into a responsive rehearsal interface.",
    panels: [
      panel("Beat", "Find the natural pulse", "Group words into ideas instead of rushing every syllable."),
      panel("Lift", "Raise the important word", "Use emphasis to help the audience hear the point."),
      panel("Space", "Leave room for thought", "Pause between ideas so meaning has time to arrive."),
      panel("Variation", "Avoid one flat line", "Change pace, pitch, energy, and expression with purpose."),
    ],
    secondaryCta: "Try an expression tool",
    secondaryHref: "/resources/tools/",
    boundary: "The visualizer is a design metaphor and does not analyze, record, or score a visitor's voice.",
    accentAsset: "/images/emotional-expression-practice-preview.png",
  },
  39: {
    headline: "One attempt becomes the next.",
    summary: "A transformation flipbook shows how Goal, Attempt, Feedback, and Next Attempt form a practical learning loop.",
    panels: [
      panel("Frame 01", "Goal", "Choose the audience, message, and speaking situation."),
      panel("Frame 02", "Attempt", "Try the structure and delivery in context."),
      panel("Frame 03", "Feedback", "Notice what helped and what remained unclear."),
      panel("Frame 04", "Next attempt", "Keep one useful choice and refine another."),
    ],
    secondaryCta: "See the coaching approach",
    secondaryHref: "/about/",
    boundary: "The frames describe a process—not a guaranteed transformation or a real student case.",
  },
  40: {
    headline: "Speaking deserves a better poster.",
    summary: "A motion-poster festival celebrates voice, ideas, story, debate, and stage presence with finite, optional movement.",
    panels: [
      panel("Poster 01", "VOICE", "Use sound intentionally."),
      panel("Poster 02", "IDEAS", "Know what you mean."),
      panel("Poster 03", "STORY", "Make people care."),
      panel("Poster 04", "STAGE", "Connect with the room."),
    ],
    secondaryCta: "Try a speaking challenge",
    secondaryHref: "/resources/tools/",
    boundary: "The festival is a visual metaphor and does not imply a real event or competition.",
  },
  41: {
    headline: "Bring your goal into focus.",
    summary: "A spatial glass canvas layers Coach Kai, communication programs, and public evidence into one calm parent-first view.",
    panels: [
      panel("Identity", "Meet the coach", "Use the public About page for Kai's current background and approach."),
      panel("Programs", "Start with the speaking need", "Speech, debate, storytelling, presentation, and communication coaching."),
      panel("Evidence", "Inspect what is public", "Profile, working tools, current site pages, and explicit evidence gaps."),
    ],
    secondaryCta: "Open the public profile",
    secondaryHref: "/about/",
    boundary: "Glass depth is decorative; contrast and content remain usable without blur support.",
    accentAsset: "/images/test/cyber-orbit.webp",
  },
  42: {
    headline: "Say it. Shape it. Try again.",
    summary: "A refined neo-brutalist studio gives students three bold blocks: ideas, delivery, and response.",
    panels: [
      panel("IDEAS", "Find the point", "Choose the claim, reason, example, or story that matters."),
      panel("DELIVERY", "Make the choice visible", "Practise voice, pace, expression, presence, and pause."),
      panel("RESPONSE", "Think while speaking", "Listen, answer, adapt, and keep the message clear."),
    ],
    secondaryCta: "Open a speaking tool",
    secondaryHref: "/resources/tools/",
    boundary: "The bold interface is not a ranking system and does not store or score student work.",
  },
  43: {
    headline: "Programs should open like a system.",
    summary: "A dimensional card architecture lets customers inspect speech, debate, presentation, and workshop paths without suggesting fixed packages.",
    panels: [
      panel("Speech", "Develop a clear message", "Work on ideas, structure, delivery, presence, and audience connection."),
      panel("Debate", "Build and test reasons", "Practise claims, evidence, comparison, response, and persuasive delivery."),
      panel("Presentation", "Guide the audience", "Prepare the message, visuals, flow, rehearsal, and important moment."),
      panel("Workshop", "Plan around the group", "Discuss audience, communication need, focus, setting, and possible format."),
    ],
    secondaryCta: "Review Coach Kai's profile",
    secondaryHref: "/about/",
    boundary: "Cards describe conversation paths, not published products, prices, capacities, or standard formats.",
  },
  44: {
    headline: "Focus the goal. Blur the noise.",
    summary: "A lens portal organizes Coach, Programs, Students, and Organizations around the communication moment ahead.",
    panels: [
      panel("Coach", "Start with the public profile", "Review Kai's current background, roles, approach, and service areas."),
      panel("Programs", "Start with a speaking task", "Prepare a speech, debate, presentation, interview, story, or important conversation."),
      panel("Students", "Make practice concrete", "Work on ideas, structure, voice, response, presence, and another attempt."),
      panel("Organizations", "Plan around the audience", "Discuss the communication need, focus, setting, and possible format."),
    ],
    secondaryCta: "See how coaching works",
    secondaryHref: "/about/",
    boundary: "The lens never distorts the portrait and does not imply diagnostic or measured insight.",
  },
  45: {
    headline: "Calm thinking. Clear speaking.",
    summary: "A quiet monochrome homepage keeps method, public experience, programs, and one next step visible without visual noise.",
    panels: [
      panel("Method", "Clarify. Practise. Refine.", "Prepare the message, rehearse the moment, and choose the next adjustment."),
      panel("Experience", "Read the public record", "The About page contains Kai's current biography and professional background."),
      panel("Programs", "Speech. Debate. Presentation.", "Begin with the audience, communication goal, and real task."),
    ],
    secondaryCta: "Read the public profile",
    secondaryHref: "/about/",
    boundary: "Minimalism does not replace evidence; unavailable testimonials and outcomes remain absent.",
  },
  46: {
    headline: "Your communication workspace.",
    summary: "SpeakKai OS keeps Coach, Programs, Public Evidence, and Contact in fixed, accessible windows.",
    panels: [
      panel("Coach", "Public profile", "Read Kai's current background and coaching approach."),
      panel("Programs", "Speaking pathways", "Explore speech, debate, storytelling, presentation, and professional communication."),
      panel("Evidence", "Working site routes", "Open public tools, the About page, and the current schedule view."),
      panel("Contact", "Start with the goal", "Describe the audience, situation, and communication challenge."),
    ],
    secondaryCta: "Open public tools",
    secondaryHref: "/resources/tools/",
    boundary: "This desktop metaphor is not an account, dashboard, file system, or private data product.",
  },
  47: {
    headline: "Meet the coach. Find the path.",
    summary: "A cinematic portrait places Coach, Method, Programs, Evidence, and Contact within immediate reach.",
    panels: [
      panel("Coach", "Who is Kai?", "Open the public biography and current role descriptions."),
      panel("Method", "How does practice work?", "Clarify the goal, structure the message, rehearse, refine, and perform."),
      panel("Programs", "What can we explore?", "Speech, debate, storytelling, presentation, and communication coaching."),
      panel("Evidence", "What can I inspect?", "Public profile, working tools, schedule view, and explicit Missing items."),
      panel("Contact", "What happens next?", "Share the audience, goal, context, and current speaking challenge."),
    ],
    secondaryCta: "Meet Coach Kai",
    secondaryHref: "/about/",
    boundary: "Hotspots expose public information only; no private, student, or unsupported result data is shown.",
  },
  48: {
    headline: "Give your message a shape.",
    summary: "A fluid typography field adapts its language for students, parents, and schools while keeping the same factual core.",
    panels: [
      panel("Student", "Find the point. Shape the story.", "Say it out loud, notice the effect, and choose what to try again."),
      panel("Parent", "Start with the next challenge", "Describe what the student is preparing for and ask about fit."),
      panel("School", "Plan around the audience", "Discuss the communication need, focus, setting, and possible format."),
    ],
    secondaryCta: "Explore speaking tools",
    secondaryHref: "/resources/tools/",
    boundary: "All meaning remains readable as HTML without variable-font or motion support.",
    accentAsset: "/images/emotional-expression-practice-preview.png",
  },
  49: {
    headline: "Trace how practice connects.",
    summary: "A living network links audiences, skills, speaking paths, and intended focus areas without pretending the connections are measured data.",
    panels: [
      panel("Audiences", "Students · Professionals · Organizations", "Different people enter with different communication moments and needs."),
      panel("Skills", "Ideas · Structure · Delivery · Response", "Practice can concentrate on observable speaking choices."),
      panel("Paths", "Speech · Debate · Presentation · Workshop", "Discuss which route fits the audience and goal."),
      panel("Focus", "Clarity · Purpose · Presence · Connection", "These are intended practice directions, not measured outcomes."),
    ],
    secondaryCta: "Review public background",
    secondaryHref: "/about/",
    boundary: "The network is an illustrative map, not a causal model, analytics system, or results claim.",
    accentAsset: "/images/concepts/speakkai-influence-sketch.png",
  },
  50: {
    headline: "One brand. Three ways in.",
    summary: "An adaptive prism changes the argument, evidence, and next step for parents, students, and schools or organizations.",
    panels: [
      panel("Parent", "Start with the student's next challenge", "Explore structure, delivery, feedback, another attempt, and a fit conversation."),
      panel("Student", "Explore the skills you want to practise", "Try story, debate, presentation, expression, and speaking tools."),
      panel("School", "Plan a practical communication program", "Discuss the audience, challenge, focus, setting, and possible format."),
    ],
    secondaryCta: "Not sure? Start here",
    secondaryHref: "/contact/",
    boundary: "Audience paths change the content and action, but do not add claims beyond the verified public site record.",
    accentAsset: "/images/concepts/speakkai-influence-sketch.png",
  },
};

function normalizeStakeholder(value: string): StakeholderCategory {
  const lower = value.toLowerCase();
  if (lower.includes("mixed")) return "mixed";
  if (lower.includes("student")) return "student";
  if (lower.includes("parent")) return "parent";
  return "customer";
}

function normalizeExperiment(raw: (typeof registry.experiments)[number]): ExperimentV4 {
  const content = contentByNumber[raw.number];
  if (!content) throw new Error(`Missing V4 content for Test ${raw.number}.`);

  return {
    number: raw.number,
    sourceNumber: raw.number,
    slug: raw.slug,
    family: raw.family as ExperimentFamily,
    title: raw.title,
    primaryStakeholder: raw.primary_stakeholder,
    secondaryStakeholder: raw.secondary_stakeholder,
    primaryCategory: normalizeStakeholder(raw.primary_stakeholder),
    hypothesis: raw.hypothesis,
    layoutArchetype: raw.layout_archetype,
    visualLanguage: raw.visual_language,
    portraitTreatment: raw.portrait_treatment,
    interactionModel: raw.interaction_model,
    motionLanguage: raw.motion_language,
    primaryCta: raw.primary_cta,
    primaryHref: "/contact/",
    signature: raw.signature,
    avoid: raw.avoid,
    content,
  };
}

const experimentsBySourceNumber = new Map(
  registry.experiments.map(normalizeExperiment).map((experiment) => [experiment.sourceNumber, experiment]),
);

const selectedVersions = [
  { number: 1, sourceNumber: 27 },
  { number: 2, sourceNumber: 47 },
  { number: 3, sourceNumber: 41 },
  { number: 4, sourceNumber: 43 },
] as const;

export const experimentsV4 = selectedVersions.map(({ number, sourceNumber }) => {
  const source = experimentsBySourceNumber.get(sourceNumber);
  if (!source) throw new Error(`Missing selected experiment source ${sourceNumber}.`);
  return {
    ...source,
    number,
    sourceNumber,
    slug: `version-${number}-${source.slug}`,
  };
});
export const experimentV4ByNumber = new Map(experimentsV4.map((item) => [item.number, item]));

const version3Source = experimentsBySourceNumber.get(41);
if (!version3Source) throw new Error("Missing Version 3 source experiment 41.");

const version3VariantSpecs = [
  {
    number: 5,
    title: "Spatial Glass — Quiet Focus",
    hypothesis: "A softer blue field and calmer glass surfaces can make Version 3 feel more welcoming without weakening its spatial clarity.",
    visualLanguage: "Soft cobalt glass with cool white panels and restrained yellow emphasis",
  },
  {
    number: 6,
    title: "Spatial Glass — Deep Focus",
    hypothesis: "A deeper navy field and sharper white contrast can make Version 3 feel more authoritative and presentation-ready.",
    visualLanguage: "Deep navy glass with crisp white panels and high-contrast controls",
  },
  {
    number: 7,
    title: "Spatial Atelier",
    hypothesis: "Version 1's cream, brown, navy, and yellow palette can give Version 3 a warmer premium character while preserving its interaction model.",
    visualLanguage: "Warm cream atelier with espresso text, navy depth, and yellow highlights",
  },
  {
    number: 8,
    title: "Editorial Atelier Glass",
    hypothesis: "The Version 1 palette plus editorial typography can make Version 3 feel more personal and considered for parents and private clients.",
    visualLanguage: "Cream editorial glass with brown framing, serif display type, and yellow emphasis",
  },
  {
    number: 9,
    title: "Golden Focus",
    hypothesis: "A stronger Version 1 yellow signal against cream and navy can make the active path and next action easier to recognize.",
    visualLanguage: "Cream and navy spatial canvas with highlighter-yellow active states",
  },
  {
    number: 10,
    title: "Robin Glass",
    hypothesis: "A brighter robin-blue field can make Version 3 feel more energetic and youthful without relying on neon or novelty graphics.",
    visualLanguage: "Bright robin blue with ice-white glass and navy typography",
  },
  {
    number: 11,
    title: "Ink and Ice",
    hypothesis: "A nearly monochrome navy-and-white treatment can make Version 3 feel precise, calm, and institutionally credible.",
    visualLanguage: "Near-monochrome navy, ice white, and minimal yellow accents",
  },
  {
    number: 12,
    title: "Soft Horizon",
    hypothesis: "An airy pale-blue treatment can reduce visual weight and keep the three-part decision path approachable.",
    visualLanguage: "Pale blue horizon with translucent white glass and cobalt type",
  },
  {
    number: 13,
    title: "Gallery Frame",
    hypothesis: "Stronger frames and more deliberate panel boundaries can improve scanability while retaining Version 3's spatial composition.",
    visualLanguage: "Gallery-white framing over navy glass with precise yellow markers",
  },
  {
    number: 14,
    title: "Balanced Focus",
    hypothesis: "A balanced mix of blue depth, warm white, and measured yellow can become the most production-ready refinement of Version 3.",
    visualLanguage: "Balanced royal blue, warm white, navy, and restrained yellow",
  },
] as const;

export const version3Variants: ExperimentV4[] = version3VariantSpecs.map((spec) => ({
  ...version3Source,
  ...spec,
  number: spec.number,
  sourceNumber: 41,
  slug: `version-${spec.number}-spatial-glass`,
}));

export const activeExperimentsV4 = [...experimentsV4, ...version3Variants];
export const activeExperimentV4ByNumber = new Map(activeExperimentsV4.map((item) => [item.number, item]));

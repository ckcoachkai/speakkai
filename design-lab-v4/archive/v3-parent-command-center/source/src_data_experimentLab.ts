export type Stakeholder = "Parent" | "Student" | "Customer" | "Mixed";

export type ExperimentCard = {
  label: string;
  title: string;
  copy: string;
};

export type Experiment = {
  id: number;
  name: string;
  primary: Stakeholder;
  secondary: Stakeholder;
  hypothesis: string;
  mode: string;
  singleScreen: boolean;
  eyebrow: string;
  headline: string;
  summary: string;
  cta: string;
  ctaHref: string;
  altCta: string;
  altHref: string;
  image: string;
  imageAlt: string;
  accent: string;
  accent2: string;
  background: string;
  ink: string;
  tags: string[];
  cards: ExperimentCard[];
  limitation: string;
};

const card = (label: string, title: string, copy: string): ExperimentCard => ({ label, title, copy });

export const experiments: Experiment[] = [
  {
    id: 21, name: "The Speaking Portfolio", primary: "Customer", secondary: "Parent",
    hypothesis: "Editorial authority may make SpeakKai's capabilities easier for serious buyers and parents to assess.",
    mode: "editorial", singleScreen: false, eyebrow: "A communication practice",
    headline: "Ideas deserve a voice people remember.",
    summary: "Speech, debate, storytelling, and presentation coaching for students, professionals, schools, and organizations.",
    cta: "Discuss a program", ctaHref: "/contact/", altCta: "Meet Coach Kai", altHref: "/about/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#ffcc00", accent2: "#2563eb", background: "#f4efe4", ink: "#0b1020",
    tags: ["customer", "parent", "premium", "editorial"],
    cards: [card("01 / Programs", "Work shaped around the speaking moment", "Explore coaching and training for young speakers, professionals, and organizations."), card("02 / Method", "Assess. Structure. Practise. Refine.", "A practical path from a rough idea toward clearer, more confident delivery."), card("03 / Next step", "Start with the goal", "Share the audience, situation, and speaking challenge you are preparing for.")],
    limitation: "This concept uses no client logos, ratings, or unsupported outcome claims."
  },
  {
    id: 22, name: "SpeakLab", primary: "Student", secondary: "Parent",
    hypothesis: "An explorable practice map may make communication training feel active instead of remedial.",
    mode: "lab", singleScreen: false, eyebrow: "Learn by doing",
    headline: "Build your voice in the lab.",
    summary: "Pick a station, try a speaking skill, and see how ideas become stories, arguments, presentations, and performances.",
    cta: "Explore a speaking practice", ctaHref: "/resources/tools/", altCta: "How coaching works", altHref: "/about/",
    image: "/images/test/cyber-orbit.webp", imageAlt: "Abstract skill universe",
    accent: "#d9ff57", accent2: "#55ddc7", background: "#071d25", ink: "#f7fff8",
    tags: ["student", "youth", "interactive"],
    cards: [card("Voice station", "Sound intentional", "Practise pace, emphasis, expression, and presence."), card("Idea station", "Know what you mean", "Find the point before polishing the performance."), card("Story station", "Give the room a reason to care", "Shape an opening, a journey, and a finish that lands."), card("Stage station", "Try it out loud", "Rehearse, notice, adjust, and speak again.")],
    limitation: "The stations describe areas to practise, not levels, scores, or guaranteed progress."
  },
  {
    id: 23, name: "On Mic Now", primary: "Student", secondary: "Customer",
    hypothesis: "Creator-style pacing may make public speaking feel current while still revealing the teaching method.",
    mode: "creator", singleScreen: false, eyebrow: "Speech without the boring bits",
    headline: "Make them stop. Listen. Remember.",
    summary: "Sharper stories, stronger delivery, and real practice for the moments when your voice has to carry.",
    cta: "See the speaking tools", ctaHref: "/resources/tools/", altCta: "Talk with Kai", altHref: "/contact/",
    image: "/images/test/vlog-megaphone.webp", imageAlt: "Illustrated megaphone and creator graphics",
    accent: "#ffe600", accent2: "#ff3d24", background: "#090a0f", ink: "#ffffff",
    tags: ["student", "youth", "creator"],
    cards: [card("Hook", "Win the opening", "Give the audience a reason to stay with you."), card("Build", "Make the idea move", "Use structure, contrast, and story to create momentum."), card("Land", "Finish on purpose", "End with the thought you want the room to carry.")],
    limitation: "No social metrics, popularity claims, or invented video results are shown."
  },
  {
    id: 24, name: "One Clear Next Step", primary: "Customer", secondary: "Parent",
    hypothesis: "Extreme clarity may outperform visual abundance for visitors already looking for communication help.",
    mode: "minimal", singleScreen: false, eyebrow: "SpeakKai",
    headline: "Communication coaching. Clearly explained.",
    summary: "For speeches, debate, presentations, storytelling, interviews, and important conversations.",
    cta: "Start a conversation", ctaHref: "/contact/", altCta: "View availability", altHref: "/schedule/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#ffcc00", accent2: "#0b1020", background: "#fbfbf7", ink: "#111827",
    tags: ["customer", "parent", "minimal"],
    cards: [card("Students & families", "Build skill through practice", "Speaking, debate, storytelling, and presentation support."), card("Professionals", "Prepare for a real moment", "Clarify the message and rehearse how it will be delivered."), card("Organizations", "Discuss a practical program", "Explore workshops or training shaped around your communication goal.")],
    limitation: "Only confirmed service areas are named; pricing and fit remain conversation topics."
  },
  {
    id: 25, name: "Ideas Worth Saying", primary: "Customer", secondary: "Student",
    hypothesis: "A clear point of view about communication may distinguish SpeakKai from commodity coaching.",
    mode: "ideas", singleScreen: false, eyebrow: "Notes on being understood",
    headline: "Clarity is not simplification. It is respect for the room.",
    summary: "A thought-led homepage connecting practical speaking ideas to coaching, workshops, and tools.",
    cta: "Discuss a workshop", ctaHref: "/contact/", altCta: "Try a tool", altHref: "/resources/tools/",
    image: "/images/concepts/speakkai-influence-sketch.png", imageAlt: "SpeakKai influence framework sketch",
    accent: "#e8b100", accent2: "#2f5bea", background: "#efe9dc", ink: "#172033",
    tags: ["customer", "student", "editorial"],
    cards: [card("Idea 01", "Structure earns attention", "A clear path lets the audience follow a complex thought."), card("Idea 02", "Delivery changes meaning", "Pace, emphasis, expression, and silence shape what people hear."), card("Idea 03", "Practice should reveal choices", "Useful rehearsal notices what works, then makes the next attempt more intentional.")],
    limitation: "These are teaching principles, not research claims or invented credentials."
  },
  {
    id: 26, name: "Meet Coach Kai", primary: "Parent", secondary: "Customer",
    hypothesis: "A transparent human profile may build trust faster than an anonymous brand hero.",
    mode: "profile", singleScreen: false, eyebrow: "The person behind SpeakKai",
    headline: "Meet Kai. Then decide if the approach fits.",
    summary: "Communication and speech-and-debate coaching grounded in practical preparation, thoughtful feedback, and repeated speaking practice.",
    cta: "See if coaching is a fit", ctaHref: "/contact/", altCta: "Read the full profile", altHref: "/about/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#f0b52b", accent2: "#3f6e68", background: "#eee4d5", ink: "#25302e",
    tags: ["parent", "customer", "premium", "documentary"],
    cards: [card("Why", "Make important ideas easier to express", "Coaching starts with what the speaker genuinely wants the audience to understand."), card("How", "Practise the real task", "Work on structure and delivery, then try the speech again."), card("Fit", "Students, professionals, and organizations", "Start with the audience, goal, context, and current challenge.")],
    limitation: "The page links to the verified biography instead of adding new claims about Kai."
  },
  {
    id: 27, name: "From First Try to Next Stage", primary: "Parent", secondary: "Student",
    hypothesis: "A process-led learner journey may show parents meaningful development without promising a result.",
    mode: "journey", singleScreen: false, eyebrow: "A possible learning journey",
    headline: "Every stronger speech begins with a first try.",
    summary: "See how an idea can move through preparation, practice, feedback, and another more intentional attempt.",
    cta: "Ask about a starting point", ctaHref: "/contact/", altCta: "View availability", altHref: "/schedule/",
    image: "/images/test/kids-speaking.webp", imageAlt: "Illustrative young speakers",
    accent: "#ffcc00", accent2: "#1b65d8", background: "#f4f7fb", ink: "#10284d",
    tags: ["parent", "student", "documentary"],
    cards: [card("01 / Begin", "Find the idea", "Name the message, audience, and speaking situation."), card("02 / Build", "Give it structure", "Create an opening, a clear path, and a purposeful ending."), card("03 / Practise", "Try the delivery", "Speak it, notice what the audience needs, and adjust."), card("04 / Continue", "Take the next attempt", "Progress can move in different orders for different speakers.")],
    limitation: "This is an example process, not a fixed curriculum or guaranteed transformation."
  },
  {
    id: 28, name: "Parent Questions, Answered", primary: "Parent", secondary: "Student",
    hypothesis: "Answering real parent questions first may reduce uncertainty and lead to more useful enquiries.",
    mode: "questions", singleScreen: false, eyebrow: "A parent-first homepage",
    headline: "What will my child actually practise?",
    summary: "Start with the questions that matter: fit, activities, coaching process, and the next conversation.",
    cta: "Ask your question", ctaHref: "/contact/", altCta: "See the schedule", altHref: "/schedule/",
    image: "/images/test/kids-speaking.webp", imageAlt: "Illustrative speaking practice",
    accent: "#f4c400", accent2: "#0f6db5", background: "#edf5f7", ink: "#123047",
    tags: ["parent", "student"],
    cards: [card("Is it a fit?", "Begin with the speaking goal", "Share the student's context, current challenge, and what they are preparing for."), card("What happens?", "Ideas become practice", "Sessions can focus on structure, delivery, feedback, and another attempt."), card("What skills?", "Speech, debate, story, presentation", "The emphasis depends on the task and the speaker."), card("How do we start?", "Ask one clear question", "Use the contact page to describe the situation and discuss fit.")],
    limitation: "Age ranges, pricing, availability, and outcomes are not guessed."
  },
  {
    id: 29, name: "Proof Before Promise", primary: "Parent", secondary: "Customer",
    hypothesis: "Visible source boundaries may build more trust than broad marketing promises.",
    mode: "evidence", singleScreen: false, eyebrow: "Evidence, with context",
    headline: "See the work. Know what it shows.",
    summary: "A restrained evidence wall using approved biography, teaching tools, process examples, and clearly labelled limitations.",
    cta: "Review fit and availability", ctaHref: "/contact/", altCta: "Read Kai's profile", altHref: "/about/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#ffcc00", accent2: "#2563eb", background: "#0b1020", ink: "#f8fafc",
    tags: ["parent", "customer", "evidence"],
    cards: [card("Verified profile", "Experience and approach", "Use the About page for the current public record of Kai's background."), card("Working tools", "Practice is visible", "Explore free speaking and classroom tools already available on SpeakKai."), card("Current availability", "Check before planning", "The schedule page shows the current public availability view."), card("Missing evidence", "No invented testimonials", "This concept leaves unsupported proof out instead of filling the gap with marketing copy.")],
    limitation: "No student case study, testimonial, logo, or statistic is presented without an approved source."
  },
  {
    id: 30, name: "The Moment Before You Speak", primary: "Mixed", secondary: "Parent",
    hypothesis: "A shared emotional moment may connect audiences before routing each one to a practical next step.",
    mode: "cinematic", singleScreen: false, eyebrow: "The room goes quiet",
    headline: "Your next important moment deserves preparation.",
    summary: "For students, professionals, families, and organizations preparing to say something that matters.",
    cta: "Choose your next step", ctaHref: "#paths", altCta: "Contact SpeakKai", altHref: "/contact/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai on a dark blue banner",
    accent: "#ffd266", accent2: "#5c78ff", background: "#030712", ink: "#ffffff",
    tags: ["mixed", "cinematic", "premium"],
    cards: [card("Parent", "Help a student prepare", "Explore a coaching conversation around the student's next speaking challenge."), card("Student", "Make the moment yours", "Try a tool, build an idea, and practise saying it out loud."), card("School or organization", "Plan a communication program", "Discuss the audience, format, and skill focus you have in mind.")],
    limitation: "The cinematic framing is illustrative and does not claim a particular student story."
  },
  {
    id: 31, name: "The Speaking Control Room", primary: "Parent", secondary: "Customer",
    hypothesis: "A modular overview may help visitors answer several trust and fit questions quickly.",
    mode: "bento", singleScreen: false, eyebrow: "The whole practice at a glance",
    headline: "Think. Speak. Connect. Repeat.",
    summary: "A modular map of who SpeakKai helps, what speakers practise, and how to start.",
    cta: "See how coaching works", ctaHref: "/about/", altCta: "Ask about fit", altHref: "/contact/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#ffcc00", accent2: "#2563eb", background: "#081326", ink: "#f8fafc",
    tags: ["parent", "customer", "bento"],
    cards: [card("Practice", "Speak, debate, present, tell stories", "Work on real communication tasks instead of abstract promises."), card("Process", "Assess → Structure → Practise → Refine", "A visible sequence that keeps the work understandable."), card("People", "Students, professionals, organizations", "Different audiences can start with different goals."), card("Action", "One useful conversation", "Describe the audience, the occasion, and what needs to improve.")],
    limitation: "The interface is a public overview, not a student dashboard or progress tracker."
  },
  {
    id: 32, name: "Three Doors", primary: "Mixed", secondary: "Customer",
    hypothesis: "Audience self-selection may make the first click more relevant than one blended message.",
    mode: "doors", singleScreen: false, eyebrow: "Choose the conversation",
    headline: "Three audiences. Three different first questions.",
    summary: "Enter as a family, a student, or a school and organization—then see the most relevant next step.",
    cta: "Not sure? Start here", ctaHref: "/about/", altCta: "Contact SpeakKai", altHref: "/contact/",
    image: "/images/concepts/speakkai-influence-sketch.png", imageAlt: "SpeakKai communication framework",
    accent: "#ffcc00", accent2: "#47d6c4", background: "#0b1020", ink: "#ffffff",
    tags: ["mixed", "interactive"],
    cards: [card("For families", "What could my child practise?", "Start with the student's speaking goal and current challenge."), card("For students", "Will this be interesting?", "Explore stories, debate, presentation, expression, and real practice."), card("For schools & organizations", "What could we plan?", "Discuss a practical workshop or coaching goal for your audience.")],
    limitation: "The doors route visitors by need without implying unsupported separate products."
  },
  {
    id: 33, name: "Proof Through Time", primary: "Customer", secondary: "Parent",
    hypothesis: "A verified career timeline may make capability more credible than generic authority copy.",
    mode: "archive", singleScreen: false, eyebrow: "Experience, in context",
    headline: "A practice built through teaching, speaking, and coaching.",
    summary: "A chronological view of Kai's public career stages, paired with what each stage contributes to communication coaching today.",
    cta: "Discuss a communication goal", ctaHref: "/contact/", altCta: "Full biography", altHref: "/about/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#d49d00", accent2: "#174ea6", background: "#f6f1e6", ink: "#1d2b3f",
    tags: ["customer", "parent", "timeline", "editorial"],
    cards: [card("2007–2012", "English trainer", "Adapted communication work for learners from children to professionals."), card("2012–2015", "Education consultant", "Coached interviews and helped learners prepare for important educational conversations."), card("2015–2017", "Test preparation", "Taught structured argument, writing, and speaking."), card("2017–present", "Speech and debate coach", "Develops speakers, stories, debates, and presentations.")],
    limitation: "The timeline restates the current public biography and adds no inferred affiliations."
  },
  {
    id: 34, name: "Speak Quest", primary: "Student", secondary: "Parent",
    hypothesis: "A mature skill-tree metaphor may make practice feel attainable while preserving educational structure.",
    mode: "quest", singleScreen: false, eyebrow: "Choose a speaking path",
    headline: "Your voice can level up in more than one direction.",
    summary: "Explore ideas, structure, voice, presence, story, and response as connected areas of practice.",
    cta: "Try a speaking challenge", ctaHref: "/resources/tools/", altCta: "Ask about coaching", altHref: "/contact/",
    image: "/images/test/cyber-orbit.webp", imageAlt: "Abstract skill map",
    accent: "#d9ff57", accent2: "#4fd8ff", background: "#07111f", ink: "#f5fff8",
    tags: ["student", "youth", "interactive"],
    cards: [card("Ideas", "Know what you want to say", "Find a clear point and supporting material."), card("Structure", "Create a path", "Help the audience follow from opening to ending."), card("Voice", "Use sound intentionally", "Practise pace, emphasis, expression, and pause."), card("Presence", "Connect with the room", "Coordinate attention, body language, and purpose."), card("Response", "Think while speaking", "Practise answering, adapting, and staying clear under pressure.")],
    limitation: "The map is non-linear and does not claim formal levels, certification, or mastery."
  },
  {
    id: 35, name: "The Partnership Blueprint", primary: "Customer", secondary: "Parent",
    hypothesis: "A procurement-oriented blueprint may help schools and organizations understand how to begin a program conversation.",
    mode: "blueprint", singleScreen: false, eyebrow: "For schools and organizations",
    headline: "Plan practical communication training around a real audience.",
    summary: "Explore speaking, debate, storytelling, presentation, and communication workshop possibilities without pretending every format is already fixed.",
    cta: "Start a partnership conversation", ctaHref: "/contact/", altCta: "Meet Coach Kai", altHref: "/about/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#ffcc00", accent2: "#63d6ff", background: "#071a33", ink: "#edf7ff",
    tags: ["customer", "institutional", "blueprint"],
    cards: [card("01 / Audience", "Who needs to communicate?", "Start with learners, professionals, teams, or event participants."), card("02 / Moment", "What are they preparing for?", "Name the speech, debate, presentation, workshop, or communication challenge."), card("03 / Focus", "What should practice emphasize?", "Discuss ideas, structure, delivery, response, story, or confidence."), card("04 / Format", "What could fit?", "Talk through the setting and scope instead of assuming a standard package.")],
    limitation: "No school partnership, scale, delivery format, or outcome is claimed without confirmation."
  },
  {
    id: 36, name: "The Private Practice Studio", primary: "Customer", secondary: "Parent",
    hypothesis: "A calm, discreet presentation may appeal to visitors seeking focused preparation for an important speaking moment.",
    mode: "studio", singleScreen: false, eyebrow: "Focused communication coaching",
    headline: "Prepare the message. Rehearse the moment.",
    summary: "A quieter route for presentations, interviews, leadership moments, and private speaking goals.",
    cta: "Ask about coaching", ctaHref: "/contact/", altCta: "View availability", altHref: "/schedule/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#d8a514", accent2: "#365b7a", background: "#f0eadf", ink: "#1c2b37",
    tags: ["customer", "parent", "premium", "minimal"],
    cards: [card("Message", "Clarify the point", "Decide what the audience needs to understand and remember."), card("Delivery", "Practise under realistic conditions", "Work on pace, emphasis, expression, presence, and response."), card("Refinement", "Make the next attempt more intentional", "Use specific feedback to choose what to keep and change.")],
    limitation: "Availability, privacy terms, session format, and pricing are discussed rather than assumed."
  },
  {
    id: 37, name: "Signal", primary: "Student", secondary: "Parent",
    hypothesis: "Contemporary youth energy may make speaking feel relevant without making the work childish.",
    mode: "signal", singleScreen: false, eyebrow: "Speaking with energy",
    headline: "Big thoughts. Bold stories. Brave voices.",
    summary: "Modern, high-contrast communication practice for students who want their ideas to land.",
    cta: "Explore the challenge", ctaHref: "/resources/tools/", altCta: "Parent guide", altHref: "/about/",
    image: "/images/test/vlog-megaphone.webp", imageAlt: "Illustrated creator-style megaphone",
    accent: "#ffe600", accent2: "#ff4d67", background: "#0a0b10", ink: "#ffffff",
    tags: ["student", "youth", "creator"],
    cards: [card("Speak", "Say the idea clearly", "Turn the thought in your head into words the room can follow."), card("Think", "Build a stronger reason", "Use examples, stories, and argument instead of empty volume."), card("Lead", "Help the audience move", "Connect your message to a meaningful next thought or action.")],
    limitation: "The page promises practice and possibility, not guaranteed confidence or popularity."
  },
  {
    id: 38, name: "One Student, Many Voices", primary: "Parent", secondary: "Student",
    hypothesis: "A documentary chapter structure may feel more trustworthy than generic transformation claims.",
    mode: "documentary", singleScreen: false, eyebrow: "A story framework, not a testimonial",
    headline: "Every confident speaker started somewhere.",
    summary: "A privacy-safe documentary concept showing the stages of practice without inventing a student identity or result.",
    cta: "See how coaching could fit", ctaHref: "/contact/", altCta: "Explore the tools", altHref: "/resources/tools/",
    image: "/images/test/kids-speaking.webp", imageAlt: "Illustrative young speakers",
    accent: "#d5653d", accent2: "#244f78", background: "#eee4d4", ink: "#302b25",
    tags: ["parent", "student", "documentary"],
    cards: [card("Chapter 1", "The starting point", "A speaker arrives with an idea, a task, and something that feels difficult."), card("Chapter 2", "The practice", "The message gets structured, spoken, noticed, and adjusted."), card("Chapter 3", "The speaking moment", "The learner tries again with clearer choices."), card("Chapter 4", "The reflection", "The next goal comes from what the speaker and audience actually experienced.")],
    limitation: "This is an illustrative process and not a real student case study."
  },
  {
    id: 39, name: "The Rehearsal Room", primary: "Mixed", secondary: "Student",
    hypothesis: "A stage-like environment may help visitors understand SpeakKai by exploring situations rather than reading a brochure.",
    mode: "rehearsal", singleScreen: false, eyebrow: "Step into the work",
    headline: "Practice. Performance. Partnership.",
    summary: "Three spaces reveal what speakers can work on, what they may prepare for, and how an organization can begin.",
    cta: "Step into a conversation", ctaHref: "/contact/", altCta: "Try a tool", altHref: "/resources/tools/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#ffd057", accent2: "#6c78ff", background: "#04070e", ink: "#ffffff",
    tags: ["mixed", "experimental", "cinematic"],
    cards: [card("Practice", "Build the speaking choices", "Work on ideas, structure, voice, story, response, and presence."), card("Performance", "Prepare for a real moment", "Rehearse a speech, debate, presentation, interview, or important conversation."), card("Partnership", "Shape a learning experience", "Discuss an audience, workshop focus, and possible format.")],
    limitation: "All three paths use plain-language summaries and do not depend on hotspots or hover."
  },
  {
    id: 40, name: "Parent Command Center", primary: "Parent", secondary: "Student",
    hypothesis: "A one-screen question dashboard may reduce parent uncertainty without a long sales page.",
    mode: "command", singleScreen: true, eyebrow: "Parent command center",
    headline: "What will your child practise next?",
    summary: "Fit, speaking activities, coaching process, and the next conversation—in one calm overview.",
    cta: "Start with a question", ctaHref: "/contact/", altCta: "Current availability", altHref: "/schedule/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#ffcc00", accent2: "#3e7ccb", background: "#e9f1f6", ink: "#102a43",
    tags: ["parent", "student", "single-screen"],
    cards: [card("Fit", "Begin with the goal", "Tell us the student's context and next speaking challenge."), card("Practice", "Work on the real task", "Ideas, structure, delivery, feedback, and another attempt."), card("Next", "Ask one clear question", "Use the contact page to discuss fit and availability.")],
    limitation: "The command-center metaphor is an overview, not a private student account."
  },
  {
    id: 41, name: "Student Skill Universe", primary: "Student", secondary: "Parent",
    hypothesis: "A one-screen skill universe may make communication practice feel aspirational and explorable.",
    mode: "universe", singleScreen: true, eyebrow: "Student skill universe",
    headline: "Find the next part of your voice.",
    summary: "Explore confidence, debate, presentation, storytelling, response, and communication as connected skills.",
    cta: "Explore a skill", ctaHref: "#skills", altCta: "How coaching works", altHref: "/about/",
    image: "/images/test/cyber-orbit.webp", imageAlt: "Abstract skill universe",
    accent: "#d9ff57", accent2: "#45d7ff", background: "#03101e", ink: "#f3fff8",
    tags: ["student", "youth", "single-screen", "interactive"],
    cards: [card("Ideas", "Know what you mean", "Find the thought before polishing the performance."), card("Story", "Make people care", "Create movement, detail, contrast, and a finish."), card("Debate", "Build and test reasons", "Practise claims, evidence, comparison, and response."), card("Presentation", "Guide the room", "Use structure and delivery to help people follow.")],
    limitation: "The universe represents practice areas, not a complete curriculum or rank system."
  },
  {
    id: 42, name: "School Partnership Deck", primary: "Customer", secondary: "Parent",
    hypothesis: "A concise one-screen partnership deck may help institutional buyers understand the first conversation quickly.",
    mode: "deck", singleScreen: true, eyebrow: "School and organization deck",
    headline: "Plan a practical communication workshop.",
    summary: "Start with the audience, communication challenge, learning focus, and possible format.",
    cta: "Discuss a school program", ctaHref: "/contact/", altCta: "Coach profile", altHref: "/about/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#ffcc00", accent2: "#2563eb", background: "#f6f4ee", ink: "#0b1734",
    tags: ["customer", "institutional", "single-screen"],
    cards: [card("01 / The need", "What should participants communicate better?", "Name the audience and the situations they face."), card("02 / The focus", "What should practice emphasize?", "Explore speaking, debate, presentation, story, or communication skills."), card("03 / The next step", "What can we discuss?", "Share the context and talk through a possible program.")],
    limitation: "The deck does not claim existing school partners, scale, or a standard package."
  },
  {
    id: 43, name: "Interactive Coach Kai Profile", primary: "Parent", secondary: "Customer",
    hypothesis: "A role-focused one-screen profile may build trust while keeping the coaching offer visible.",
    mode: "profile-screen", singleScreen: true, eyebrow: "Meet the coach behind the method",
    headline: "Know who you are talking to—and what you can work on.",
    summary: "A compact profile connecting Kai's public biography to practical speech, debate, presentation, and communication coaching.",
    cta: "Start a conversation", ctaHref: "/contact/", altCta: "Full biography", altHref: "/about/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#f2bd2d", accent2: "#42667f", background: "#e9e1d4", ink: "#1b2a34",
    tags: ["parent", "customer", "single-screen", "premium"],
    cards: [card("Approach", "Practise specific choices", "Clarify the message, rehearse the delivery, and adjust the next attempt."), card("Experience", "Teaching, speaking, coaching", "Use the verified About page for Kai's current public background."), card("Who it helps", "Students, professionals, organizations", "Begin with the audience and real communication task.")],
    limitation: "The profile links to the public biography and adds no new awards, affiliations, or client claims."
  },
  {
    id: 44, name: "Student Achievement Dashboard", primary: "Student", secondary: "Parent",
    hypothesis: "A one-screen example pathway may make learning feel concrete without fake progress metrics.",
    mode: "pathway", singleScreen: true, eyebrow: "How a learner's journey can look",
    headline: "Prepare. Practise. Perform. Reflect.",
    summary: "Observable stages of communication practice, presented without scores, rankings, or guaranteed outcomes.",
    cta: "See coaching pathways", ctaHref: "/contact/", altCta: "Try a practice tool", altHref: "/resources/tools/",
    image: "/images/test/kids-speaking.webp", imageAlt: "Illustrative young speakers",
    accent: "#ffcc00", accent2: "#2784d8", background: "#0a1730", ink: "#f6f9ff",
    tags: ["student", "parent", "single-screen"],
    cards: [card("Prepare", "Know the task", "Identify the audience, message, and speaking situation."), card("Practise", "Try the choices", "Work on structure, delivery, story, argument, or response."), card("Perform", "Speak in context", "Use the message with an audience or realistic rehearsal."), card("Reflect", "Choose the next adjustment", "Notice what worked and what needs another attempt.")],
    limitation: "This is an example pathway, not a logged-in achievement tracker."
  },
  {
    id: 45, name: "Interactive Magazine Cover", primary: "Mixed", secondary: "Customer",
    hypothesis: "A one-screen editorial cover may create curiosity while keeping the core offer explicit.",
    mode: "cover", singleScreen: true, eyebrow: "SpeakKai / Issue 01",
    headline: "A field guide to being heard.",
    summary: "Stories, debate, presentations, confidence, and the practical work behind a stronger speaking moment.",
    cta: "Open the story", ctaHref: "#stories", altCta: "Contact SpeakKai", altHref: "/contact/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#f2c300", accent2: "#b93a33", background: "#f0e7d5", ink: "#191919",
    tags: ["mixed", "editorial", "single-screen", "premium"],
    cards: [card("The craft", "How ideas become clear", "Structure helps an audience follow and remember."), card("The rehearsal", "Why another attempt matters", "Feedback becomes useful when the speaker can try the choice again."), card("The routes", "Students. Professionals. Organizations.", "Different audiences can enter through different speaking goals.")],
    limitation: "The magazine cover points to real service areas and does not imitate awards or press coverage."
  },
  {
    id: 46, name: "Speaking Stage Interface", primary: "Student", secondary: "Parent",
    hypothesis: "A one-screen stage metaphor may make speaking feel exciting while keeping coaching details close.",
    mode: "stage", singleScreen: true, eyebrow: "Your next cue",
    headline: "When the room goes quiet, what will you say?",
    summary: "Choose an idea, shape the message, practise the delivery, and prepare for the moment.",
    cta: "Take the first step", ctaHref: "/resources/tools/", altCta: "What coaching includes", altHref: "/about/",
    image: "/images/coach-kai-banner-desktop.png", imageAlt: "Coach Kai banner",
    accent: "#ffd15c", accent2: "#715cff", background: "#02040a", ink: "#ffffff",
    tags: ["student", "single-screen", "cinematic", "interactive"],
    cards: [card("Cue 01", "Find the point", "Know what you want the audience to understand."), card("Cue 02", "Build the path", "Create an opening, movement, and a purposeful finish."), card("Cue 03", "Rehearse it aloud", "Practise pace, expression, presence, and response.")],
    limitation: "The stage is an aspirational interface and does not promise public performances or competitions."
  },
  {
    id: 47, name: "Program Map", primary: "Customer", secondary: "Parent",
    hypothesis: "A needs-based map may make coaching and workshop possibilities easier to compare.",
    mode: "map", singleScreen: true, eyebrow: "Find the path that fits",
    headline: "Start with the audience. Follow the speaking need.",
    summary: "A compact map for young speakers, debate, presentations, professional moments, and organization conversations.",
    cta: "Talk through your needs", ctaHref: "/contact/", altCta: "Check availability", altHref: "/schedule/",
    image: "/images/concepts/speakkai-influence-sketch.png", imageAlt: "SpeakKai communication framework",
    accent: "#ffcc00", accent2: "#58ccff", background: "#061b2f", ink: "#f0f9ff",
    tags: ["customer", "parent", "single-screen", "blueprint"],
    cards: [card("Young speakers", "Speech, story, debate, presentation", "Ask about fit for the learner's next task."), card("Professionals", "Presentation, interview, leadership moment", "Prepare a clear message and realistic rehearsal."), card("Organizations", "Workshop or training conversation", "Discuss the audience, goal, focus, and possible format.")],
    limitation: "Every route says 'ask about fit' rather than claiming permanent availability."
  },
  {
    id: 48, name: "Video Story Wall", primary: "Student", secondary: "Parent",
    hypothesis: "A one-screen contact sheet may make authentic practice feel visible even when approved video is unavailable.",
    mode: "story-wall", singleScreen: true, eyebrow: "Practice in motion",
    headline: "Speaking is something you do—not something you scroll past.",
    summary: "A lightweight story wall using approved stills and tool previews, ready for consented video later.",
    cta: "Try a speaking tool", ctaHref: "/resources/tools/", altCta: "Ask about coaching", altHref: "/contact/",
    image: "/images/emotional-expression-practice-preview.png", imageAlt: "Emotional expression speaking practice preview",
    accent: "#ffcc00", accent2: "#ff6a59", background: "#081018", ink: "#f8fafc",
    tags: ["student", "parent", "single-screen", "documentary"],
    cards: [card("Expression", "Notice what the audience can see", "Explore a practice tool focused on emotional expression."), card("Structure", "Make the path visible", "Use a timer or prompt to practise a clear beginning, middle, and finish."), card("Response", "Think and speak in the moment", "Try debate, question, or impromptu speaking practice.")],
    limitation: "No student video or identity is shown; approved media can replace these stills later."
  },
  {
    id: 49, name: "Interactive Evidence Wall", primary: "Parent", secondary: "Customer",
    hypothesis: "A one-screen evidence index may reduce skepticism without overwhelming the visitor.",
    mode: "evidence-screen", singleScreen: true, eyebrow: "Selected experience",
    headline: "Trust should be inspectable.",
    summary: "Open the public profile, try the real tools, check current availability, and see what evidence is still missing.",
    cta: "Review the approach", ctaHref: "/about/", altCta: "Request details", altHref: "/contact/",
    image: "/images/coach-kai-headshot.webp", imageAlt: "Coach Kai",
    accent: "#ffcc00", accent2: "#2d6cdf", background: "#111827", ink: "#f8fafc",
    tags: ["parent", "customer", "single-screen", "evidence"],
    cards: [card("Profile", "Public biography", "Read Kai's current experience and coaching background."), card("Examples", "Working speaking tools", "Use the same site to open concrete classroom and practice resources."), card("Availability", "Current public schedule", "Check the latest public availability before planning."), card("Boundary", "What is not shown", "No unsupported testimonials, partnerships, ratings, or student results.")],
    limitation: "Every evidence tile maps to a real public route or an explicit limitation."
  },
  {
    id: 50, name: "The Three-Lane Homepage", primary: "Mixed", secondary: "Customer",
    hypothesis: "A one-screen audience selector may outperform a compromise message that is weak for everyone.",
    mode: "lanes", singleScreen: true, eyebrow: "Choose your SpeakKai path",
    headline: "Speak clearly. Think critically. Lead confidently.",
    summary: "One brand, three intentional starting points for parents, students, and schools or organizations.",
    cta: "Not sure? Start here", ctaHref: "/about/", altCta: "Contact SpeakKai", altHref: "/contact/",
    image: "/images/concepts/speakkai-influence-sketch.png", imageAlt: "SpeakKai communication framework",
    accent: "#ffcc00", accent2: "#4fd5c5", background: "#07111f", ink: "#ffffff",
    tags: ["mixed", "single-screen", "interactive"],
    cards: [card("I'm a parent", "See how practice can work", "Start with the student's next speaking challenge and ask about fit."), card("I'm a student", "Explore the skills", "Try stories, debate, presentation, expression, and speaking tools."), card("I'm a school or organization", "Discuss a program", "Share the audience, communication need, and possible setting.")],
    limitation: "The lanes vary the starting point without inventing audience-specific outcomes or products."
  }
];

export const experimentById = new Map(experiments.map((experiment) => [experiment.id, experiment]));

export const legacyExperiments = [
  { id: "1", href: "/concept-lab/test1/", status: "preserved" },
  { id: "2", href: "/concept-lab/test2/", status: "preserved" },
  { id: "3", href: "/concept-lab/test3/", status: "preserved" },
  { id: "4", href: "/concept-lab/test4/", status: "preserved" },
  { id: "5", href: "/concept-lab/test5/", status: "preserved" },
  { id: "6", href: "/concept-lab/test6/", status: "preserved" },
  { id: "7", href: "/concept-lab/test7/", status: "preserved" },
  { id: "8", href: "", status: "missing-source" },
  { id: "9", href: "/concept-lab/test9/", status: "preserved" },
  { id: "10", href: "/concept-lab/test10/", status: "preserved" },
  { id: "A", href: "/concept-lab/testa/", status: "preserved" },
];

export const missingExperiments = Array.from({ length: 10 }, (_, index) => ({
  id: index + 11,
  status: "missing-source" as const,
}));

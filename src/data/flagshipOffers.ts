export type Offer = {
  slug: "coaching" | "schools" | "companies";
  audience: string;
  title: string;
  description: string;
  headline: string;
  emphasis: string;
  introduction: string;
  label: string;
  fitTitle: string;
  fit: string[];
  formats: { title: string; detail: string }[];
  outcomes: { title: string; detail: string }[];
  example: { title: string; prompt: string; steps: string[] };
  questions: { question: string; answer: string }[];
  nextStep: string;
};

export const flagshipOffers: Offer[] = [
  {
    slug: "coaching",
    audience: "Students & parents",
    title: "Student Public Speaking & Debate Coaching | SpeakKai",
    description:
      "Help your child structure ideas, tell stories and speak with confidence. Explore Kai Liu’s student coaching and the Fall 2026 Young Competition Speakers course.",
    headline: "Help them find",
    emphasis: "a voice of their own.",
    introduction:
      "For the child with a story to tell, an idea to explain or a stage to step onto. Speaking practice that builds clear thinking and growing independence.",
    label: "Discuss student coaching",
    fitTitle: "Start with the moment that matters to your child.",
    fit: [
      "They have ideas but find it difficult to put them in order.",
      "They want to speak more clearly in class, tell a story or answer questions.",
      "They are preparing for a speech, debate, presentation or competition.",
    ],
    formats: [
      {
        title: "Young Competition Speakers",
        detail:
          "The Fall 2026 course for Grades 1–2: 18 classes, six three-class units, short practice speeches and a supported final showcase.",
      },
      {
        title: "Focused speech coaching",
        detail:
          "Discuss support for original oratory, expository speaking, storytelling or a specific presentation. The plan follows the learner’s age, starting point and goal.",
      },
      {
        title: "Debate & competition preparation",
        detail:
          "Work on structured argument, evidence, delivery and responding to questions. Share the event requirements so Kai can assess the fit.",
      },
    ],
    outcomes: [
      {
        title: "One point the audience can follow",
        detail:
          "Practise choosing a central idea, arranging supporting details and finishing with purpose.",
      },
      {
        title: "Delivery that serves the message",
        detail:
          "Explore articulation, pace, pause, expression and movement through short speaking tasks.",
      },
      {
        title: "A next step they understand",
        detail:
          "Connect feedback to one observable choice the learner can try in the next attempt.",
      },
    ],
    example: {
      title: "The one-object story",
      prompt:
        "Choose an everyday object. What makes it interesting or important to you?",
      steps: [
        "Name the object and one reason you chose it.",
        "Tell a short moment or example that shows why it matters.",
        "Finish with the one thing you want your listener to remember.",
      ],
    },
    questions: [
      {
        question: "Which ages do you teach?",
        answer:
          "Young Competition Speakers is specifically for Grades 1–2. For other coaching, share the learner’s age, experience and goal with Kai to discuss suitability.",
      },
      {
        question: "Does my child need to be confident already?",
        answer:
          "Describe what speaking feels like for your child and what they currently find difficult. Kai can discuss a starting point; a competition-ready performance is not a prerequisite for a coaching conversation.",
      },
      {
        question: "What are the fees and lesson times?",
        answer:
          "Fees, group or individual format, timing and availability are confirmed directly with Kai. The public schedule is a planning reference and does not reserve a place.",
      },
      {
        question: "Are competition results guaranteed?",
        answer:
          "No. Coaching develops speaking skills and preparation; competition outcomes depend on the learner, event, judging and other factors.",
      },
    ],
    nextStep:
      "Send the learner’s age or grade, their speaking goal, any event deadline and your preferred lesson format. A short introduction is enough to start.",
  },
  {
    slug: "schools",
    audience: "Schools & educators",
    title: "School Speaking Programs & Teacher Workshops | SpeakKai",
    description:
      "Discuss practical speaking, storytelling, debate and presentation programs for your school. Custom curricula and teacher workshops with communication coach Kai Liu.",
    headline: "Make speaking",
    emphasis: "part of school life.",
    introduction:
      "Give students more than a turn at the front of the room. Build purposeful speaking practice into the way they think, learn and share ideas.",
    label: "Discuss a school program",
    fitTitle: "Build around your students and your timetable.",
    fit: [
      "You want a speaking or storytelling program aligned with students’ age and language level.",
      "You are planning a showcase, presentation project or debate activity.",
      "Your teachers want practical ways to model speaking and give useful feedback.",
    ],
    formats: [
      {
        title: "A focused workshop",
        detail:
          "A shared speaking task, guided practice and useful feedback around a clear learning focus. Discuss a one-off session that fits your school’s context.",
      },
      {
        title: "A sequence of lessons",
        detail:
          "Develop speaking progressively across a short or longer curriculum. Agree learning aims, lesson length, group size and the final speaking task together.",
      },
      {
        title: "Teacher development",
        detail:
          "Explore clear instruction, classroom presentation, speaking tasks and feedback that students can act on. Scope the workshop around the team’s priorities.",
      },
    ],
    outcomes: [
      {
        title: "A clear purpose for each task",
        detail:
          "Connect speaking practice to what students should communicate, who they are addressing and why.",
      },
      {
        title: "A repeatable practice structure",
        detail:
          "Use a cycle of planning, speaking, listening and refining that teachers and learners can understand.",
      },
      {
        title: "Feedback with a next action",
        detail:
          "Define observable speaking choices and discuss how teachers will notice progress. Agree reporting needs before the program.",
      },
    ],
    example: {
      title: "Explain it to a younger student",
      prompt:
        "Choose one idea from today’s lesson. How would you explain it to someone encountering it for the first time?",
      steps: [
        "Say the main idea in one sentence.",
        "Use a familiar example or comparison.",
        "Ask the listener what is still unclear, then try again.",
      ],
    },
    questions: [
      {
        question: "Can the content fit our curriculum?",
        answer:
          "Share the age group, language level, curriculum focus and desired speaking outcome. Kai can discuss a suitable sequence instead of assuming a fixed package.",
      },
      {
        question: "Can you support teachers as well as students?",
        answer:
          "Teacher workshops can focus on classroom communication, modelling a task and making feedback useful. Confirm the objectives, participants and format directly with Kai.",
      },
      {
        question: "What should our school prepare?",
        answer:
          "Agree the timetable, group size, room or online setup, staff responsibilities and learning materials. Share your safeguarding and supervision requirements before a booking is confirmed.",
      },
      {
        question: "Will student work be published?",
        answer:
          "Public sharing is separate from participating in a lesson. Any proposed use of identifiable student images, recordings or stories needs appropriate permission; discuss your school’s requirements with Kai.",
      },
    ],
    nextStep:
      "Share the student age range, approximate group size, learning goal, preferred dates and delivery format. A first inquiry does not need student names or individual records.",
  },
  {
    slug: "companies",
    audience: "Companies & event teams",
    title: "Keynotes, Team Communication Training & Coaching | SpeakKai",
    description:
      "Plan a keynote, communication workshop or presentation coaching with Kai Liu. Practical work on clarity, storytelling, audience connection and delivery.",
    headline: "Give your ideas",
    emphasis: "a stronger voice.",
    introduction:
      "For the presentation, pitch or conversation that needs to land. Turn expertise into a message people can understand, remember and respond to.",
    label: "Discuss a talk or workshop",
    fitTitle: "Name the communication challenge first.",
    fit: [
      "Your team knows the subject but needs to explain it with more clarity.",
      "Leaders or specialists are preparing for an important presentation, pitch or Q&A.",
      "Your event needs a communication-focused talk with a practical idea people can take away.",
    ],
    formats: [
      {
        title: "A keynote shaped for your event",
        detail:
          "Discuss the audience, event purpose and message. Possible themes include clear thinking, purposeful practice and connecting with a room; the final topic and format are agreed with Kai.",
      },
      {
        title: "A practical team workshop",
        detail:
          "Work on real communication tasks: structure, storytelling, presentation delivery or responding to questions. Discuss half-day, full-day or multi-session options.",
      },
      {
        title: "Presentation & executive coaching",
        detail:
          "Prepare for an important speaking moment with focused work on message, structure, delivery and rehearsal. Share the brief and deadline without confidential material in the first inquiry.",
      },
    ],
    outcomes: [
      {
        title: "A sharper central message",
        detail:
          "Decide what the audience needs, remove competing points and build a useful through-line.",
      },
      {
        title: "A presentation that works aloud",
        detail:
          "Test the story, evidence and transitions in rehearsal. Use delivery choices to strengthen meaning.",
      },
      {
        title: "A practical next rehearsal",
        detail:
          "Leave the discussion with clear priorities to practise. Agree any materials, feedback or follow-up as part of the scope.",
      },
    ],
    example: {
      title: "The decision-ready update",
      prompt:
        "You have one minute to update a busy team. What do they need to know or decide?",
      steps: [
        "Lead with the change, recommendation or decision needed.",
        "Give the two supporting facts that matter most.",
        "Finish with a clear next action or question.",
      ],
    },
    questions: [
      {
        question: "How is a keynote different from a workshop?",
        answer:
          "A keynote centers on a message for a larger audience. A workshop makes room for participants to apply, rehearse and discuss. Your event goals determine which format to explore.",
      },
      {
        question: "Can we use our own presentations?",
        answer:
          "Discuss how real work can support practice, and agree confidentiality and material-sharing arrangements before sending internal documents. General context is enough for the first conversation.",
      },
      {
        question: "Do you offer online and in-person delivery?",
        answer:
          "Kai is based in Shanghai and works online. Discuss in-person location, travel, online or hybrid requirements and availability directly.",
      },
      {
        question: "How do we book and get a quote?",
        answer:
          "Share the audience, goal, date range, format and approximate group size. Kai will discuss fit, scope, fees and availability. An inquiry or a schedule view does not confirm a booking.",
      },
    ],
    nextStep:
      "Share your organization type, audience, communication challenge, approximate participant count, date range and format. A short brief is enough to start.",
  },
];

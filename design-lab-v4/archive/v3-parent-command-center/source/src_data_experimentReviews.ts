export type ExperimentReviewScore = {
  id: number;
  visualImpact: number;
  originality: number;
  brandFit: number;
  parentAppeal: number;
  studentAppeal: number;
  customerAppeal: number;
  clarity: number;
  trust: number;
  conversion: number;
  ux: number;
  imageUsage: number;
  motionQuality: number;
  responsiveness: number;
  accessibility: number;
  technicalQuality: number;
  performance: number;
};

// Internal simulated-review scores, not user research or measured conversion data.
export const experimentReviewScores: ExperimentReviewScore[] = [
  { id: 21, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 7, studentAppeal: 4, customerAppeal: 8, clarity: 8, trust: 7, conversion: 7, ux: 8, imageUsage: 7, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 22, visualImpact: 9, originality: 8, brandFit: 7, parentAppeal: 6, studentAppeal: 9, customerAppeal: 5, clarity: 7, trust: 6, conversion: 6, ux: 8, imageUsage: 8, motionQuality: 6, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 23, visualImpact: 9, originality: 8, brandFit: 6, parentAppeal: 4, studentAppeal: 9, customerAppeal: 5, clarity: 8, trust: 5, conversion: 7, ux: 8, imageUsage: 9, motionQuality: 5, responsiveness: 8, accessibility: 8, technicalQuality: 8, performance: 8 },
  { id: 24, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 7, studentAppeal: 4, customerAppeal: 9, clarity: 10, trust: 7, conversion: 9, ux: 9, imageUsage: 6, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 10 },
  { id: 25, visualImpact: 8, originality: 8, brandFit: 8, parentAppeal: 6, studentAppeal: 6, customerAppeal: 8, clarity: 8, trust: 7, conversion: 7, ux: 8, imageUsage: 7, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 26, visualImpact: 8, originality: 7, brandFit: 9, parentAppeal: 9, studentAppeal: 5, customerAppeal: 8, clarity: 9, trust: 9, conversion: 8, ux: 8, imageUsage: 9, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 27, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 9, studentAppeal: 7, customerAppeal: 6, clarity: 9, trust: 7, conversion: 8, ux: 8, imageUsage: 8, motionQuality: 5, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 28, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 10, studentAppeal: 6, customerAppeal: 6, clarity: 10, trust: 8, conversion: 9, ux: 9, imageUsage: 8, motionQuality: 4, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 29, visualImpact: 8, originality: 9, brandFit: 9, parentAppeal: 9, studentAppeal: 4, customerAppeal: 8, clarity: 9, trust: 10, conversion: 8, ux: 8, imageUsage: 7, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 30, visualImpact: 9, originality: 8, brandFit: 8, parentAppeal: 7, studentAppeal: 8, customerAppeal: 7, clarity: 8, trust: 6, conversion: 8, ux: 8, imageUsage: 8, motionQuality: 6, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 31, visualImpact: 8, originality: 7, brandFit: 9, parentAppeal: 8, studentAppeal: 6, customerAppeal: 8, clarity: 9, trust: 8, conversion: 8, ux: 9, imageUsage: 8, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 32, visualImpact: 8, originality: 8, brandFit: 8, parentAppeal: 8, studentAppeal: 8, customerAppeal: 8, clarity: 9, trust: 7, conversion: 8, ux: 8, imageUsage: 6, motionQuality: 5, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 33, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 8, studentAppeal: 4, customerAppeal: 9, clarity: 8, trust: 9, conversion: 7, ux: 8, imageUsage: 8, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 34, visualImpact: 9, originality: 8, brandFit: 7, parentAppeal: 6, studentAppeal: 10, customerAppeal: 4, clarity: 8, trust: 6, conversion: 7, ux: 8, imageUsage: 8, motionQuality: 6, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 35, visualImpact: 9, originality: 8, brandFit: 9, parentAppeal: 7, studentAppeal: 4, customerAppeal: 10, clarity: 9, trust: 8, conversion: 9, ux: 8, imageUsage: 7, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 36, visualImpact: 8, originality: 7, brandFit: 8, parentAppeal: 8, studentAppeal: 4, customerAppeal: 9, clarity: 9, trust: 8, conversion: 9, ux: 9, imageUsage: 9, motionQuality: 3, responsiveness: 8, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 37, visualImpact: 9, originality: 8, brandFit: 6, parentAppeal: 5, studentAppeal: 9, customerAppeal: 4, clarity: 8, trust: 5, conversion: 6, ux: 8, imageUsage: 9, motionQuality: 5, responsiveness: 8, accessibility: 8, technicalQuality: 8, performance: 8 },
  { id: 38, visualImpact: 8, originality: 8, brandFit: 8, parentAppeal: 9, studentAppeal: 8, customerAppeal: 6, clarity: 8, trust: 8, conversion: 8, ux: 8, imageUsage: 8, motionQuality: 4, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 39, visualImpact: 9, originality: 9, brandFit: 8, parentAppeal: 6, studentAppeal: 8, customerAppeal: 8, clarity: 8, trust: 6, conversion: 8, ux: 8, imageUsage: 8, motionQuality: 6, responsiveness: 8, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 40, visualImpact: 8, originality: 8, brandFit: 9, parentAppeal: 10, studentAppeal: 6, customerAppeal: 6, clarity: 10, trust: 8, conversion: 9, ux: 9, imageUsage: 8, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 41, visualImpact: 9, originality: 8, brandFit: 7, parentAppeal: 6, studentAppeal: 10, customerAppeal: 4, clarity: 8, trust: 6, conversion: 7, ux: 8, imageUsage: 9, motionQuality: 6, responsiveness: 9, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 42, visualImpact: 9, originality: 8, brandFit: 9, parentAppeal: 7, studentAppeal: 4, customerAppeal: 10, clarity: 10, trust: 8, conversion: 10, ux: 9, imageUsage: 7, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 10 },
  { id: 43, visualImpact: 8, originality: 7, brandFit: 9, parentAppeal: 10, studentAppeal: 5, customerAppeal: 8, clarity: 9, trust: 10, conversion: 9, ux: 9, imageUsage: 9, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 44, visualImpact: 8, originality: 8, brandFit: 8, parentAppeal: 8, studentAppeal: 9, customerAppeal: 5, clarity: 9, trust: 7, conversion: 8, ux: 9, imageUsage: 8, motionQuality: 4, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 45, visualImpact: 9, originality: 9, brandFit: 8, parentAppeal: 6, studentAppeal: 7, customerAppeal: 8, clarity: 8, trust: 7, conversion: 7, ux: 8, imageUsage: 8, motionQuality: 4, responsiveness: 9, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 46, visualImpact: 9, originality: 9, brandFit: 8, parentAppeal: 6, studentAppeal: 10, customerAppeal: 5, clarity: 8, trust: 6, conversion: 8, ux: 8, imageUsage: 8, motionQuality: 6, responsiveness: 9, accessibility: 8, technicalQuality: 9, performance: 8 },
  { id: 47, visualImpact: 8, originality: 8, brandFit: 9, parentAppeal: 8, studentAppeal: 5, customerAppeal: 10, clarity: 9, trust: 8, conversion: 9, ux: 9, imageUsage: 7, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 10 },
  { id: 48, visualImpact: 9, originality: 8, brandFit: 7, parentAppeal: 7, studentAppeal: 9, customerAppeal: 5, clarity: 8, trust: 7, conversion: 8, ux: 8, imageUsage: 9, motionQuality: 4, responsiveness: 9, accessibility: 8, technicalQuality: 9, performance: 9 },
  { id: 49, visualImpact: 8, originality: 9, brandFit: 9, parentAppeal: 10, studentAppeal: 4, customerAppeal: 9, clarity: 9, trust: 10, conversion: 9, ux: 9, imageUsage: 9, motionQuality: 3, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 9 },
  { id: 50, visualImpact: 9, originality: 9, brandFit: 10, parentAppeal: 9, studentAppeal: 9, customerAppeal: 9, clarity: 10, trust: 8, conversion: 9, ux: 9, imageUsage: 7, motionQuality: 4, responsiveness: 9, accessibility: 9, technicalQuality: 9, performance: 10 },
];

const scoreKeys = Object.keys(experimentReviewScores[0]).filter((key) => key !== "id") as Array<Exclude<keyof ExperimentReviewScore, "id">>;

export const averageReviewScore = (score: ExperimentReviewScore) =>
  scoreKeys.reduce((total, key) => total + score[key], 0) / scoreKeys.length;

export const experimentReviewById = new Map(experimentReviewScores.map((score) => [score.id, score]));

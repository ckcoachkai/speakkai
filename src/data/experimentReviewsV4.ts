import scorecards from "../../design-lab-v4/evidence/review-scorecards.json";

export type V4Review = {
  test: number;
  scores: number[];
  average: number;
  strength: string;
  risk: string;
  decision: "retain";
};

export const reviewDimensions = scorecards.dimensions;

export const experimentReviewsV4: V4Review[] = scorecards.reviews.map((review) => ({
  ...review,
  average: Number((review.scores.reduce((sum, value) => sum + value, 0) / review.scores.length).toFixed(2)),
  decision: "retain",
}));

export const reviewV4ByNumber = new Map(experimentReviewsV4.map((review) => [review.test, review]));

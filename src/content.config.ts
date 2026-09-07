import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
const practice = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/practice" }),
  schema: z.object({
    title: z.string().min(3).max(120),
    summary: z.string().min(40).max(260),
    introduction: z.string().min(20).max(400),
    audience: z.string().min(3).max(100),
    setting: z.string().min(3).max(140),
    followUp: z.enum(["coaching", "schools", "companies"]),
    minutes: z.number().int().min(1).max(60),
    materials: z.string().min(3).max(200),
    steps: z.array(z.object({ title: z.string().min(3).max(120), minutes: z.number().int().min(1).max(20), detail: z.string().min(20).max(700) })).min(2).max(10),
    frameTitle: z.string().min(3).max(120),
    prompts: z.array(z.string().min(3).max(240)).min(1).max(6),
    listenerGuide: z.string().min(20).max(700),
    feedbackExample: z.string().min(10).max(500),
    published: z.boolean(),
    reviewedOn: z.string().date(),
    editorialNote: z.string().min(10),
  }).refine(lesson => lesson.steps.reduce((total, step) => total + step.minutes, 0) === lesson.minutes, { message: "Step minutes must add up to the lesson total" }),
});
export const collections = { practice };

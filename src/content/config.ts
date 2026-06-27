import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string(),
    lede: z.string(),
    label: z.string(),
    imageSrc: z.string().optional(),
    order: z.number(),
    date: z.coerce.date(),
    sections: z.array(
      z.object({
        title: z.string(),
        text: z.string()
      })
    ),
    steps: z.array(z.string()),
    videos: z
      .array(
        z.object({
          title: z.string(),
          youtubeId: z.string()
        })
      )
      .optional()
  })
});

export const collections = { blog };

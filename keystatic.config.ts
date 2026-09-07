import { config, collection, fields } from "@keystatic/core";

const requiredText = (label: string, multiline = false) => fields.text({ label, multiline, validation: { isRequired: true } });
export default config({
  storage: { kind: "local" },
  ui: { brand: { name: "SpeakKai content" } },
  collections: {
    practice: collection({
      label: "Practice lessons",
      slugField: "title",
      path: "src/content/practice/*",
      format: { data: "json" },
      schema: {
        title: fields.slug({ name: { label: "Lesson title", validation: { isRequired: true } } }),
        summary: requiredText("Short description", true),
        introduction: requiredText("Introduction", true),
        audience: requiredText("Who is it for?"),
        minutes: fields.integer({ label: "Approximate total minutes", validation: { min: 1, max: 60 } }),
        materials: requiredText("What the learner needs"),
        steps: fields.array(fields.object({
          title: requiredText("Step title"),
          minutes: fields.integer({ label: "Minutes", validation: { min: 1, max: 20 } }),
          detail: requiredText("What to do", true),
        }), { label: "Practice steps", itemLabel: props => props.fields.title.value, validation: { length: { min: 2, max: 10 } } }),
        frameTitle: requiredText("Prompt section heading"),
        prompts: fields.array(requiredText("Prompt"), { label: "Speaking prompts", itemLabel: props => props.value, validation: { length: { min: 1, max: 6 } } }),
        listenerGuide: requiredText("Guidance for the listener", true),
        feedbackExample: requiredText("Illustrative listener question", true),
        published: fields.checkbox({ label: "Include in the next public release", defaultValue: false, description: "Saving is local. Publishing requires the website release checks and deployment." }),
        reviewedOn: fields.date({ label: "Content review date", validation: { isRequired: true } }),
        editorialNote: requiredText("Source and review note (editor only)", true),
      },
    }),
  },
});

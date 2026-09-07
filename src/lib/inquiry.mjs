const audiences = {
  coaching: "student coaching",
  schools: "a school program",
  companies: "a keynote or team training",
  unsure: "speaking coaching or training",
};
export function normalizeAudience(value) {
  return Object.hasOwn(audiences, value) ? value : "unsure";
}
const clean = (value, limit) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";
export function buildInquiry({ audience, goal, group, format, timing }) {
  const kind = normalizeAudience(audience);
  return [
    `Hi Kai, I’d like to ask about ${audiences[kind]}.`,
    clean(goal, 600) && `Goal: ${clean(goal, 600)}`,
    clean(group, 100) &&
      `${kind === "coaching" ? "Age / grade" : "Participants"}: ${clean(group, 100)}`,
    clean(format, 100) && `Preferred format: ${clean(format, 100)}`,
    clean(timing, 100) && `Timing: ${clean(timing, 100)}`,
    "Could we discuss the fit, approach, fees and availability?",
  ]
    .filter(Boolean)
    .join("\n\n");
}
export async function copyInquiry(text, writeText) {
  if (!text.trim())
    return {
      ok: false,
      message: "Your message is empty. Write a few words before copying.",
    };
  try {
    await writeText(text);
    return {
      ok: true,
      message:
        "Copied. Now open WeChat and paste it into your conversation with Kai. Nothing has been sent by this website.",
    };
  } catch {
    return {
      ok: false,
      message:
        "Automatic copy is unavailable. Your message is selected: use Copy on your device, then paste it into WeChat.",
    };
  }
}

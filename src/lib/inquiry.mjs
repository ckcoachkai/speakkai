const audiences = {
  coaching: "student coaching",
  schools: "a school program",
  companies: "a keynote or team training",
  unsure: "speaking coaching or training",
};
export function normalizeAudience(value) {
  return Object.hasOwn(audiences, value) ? value : "unsure";
}
export const schoolDirections = Object.freeze({
  workshop: "A focused workshop",
  sequence: "A sequence of lessons",
  teachers: "Teacher development",
});
export const schoolDirectionsChinese = Object.freeze({workshop: "主题工作坊", sequence: "系列课程", teachers: "教师发展"});
export function normalizeSchoolDirection(value) {
  return typeof value === "string" && Object.hasOwn(schoolDirections, value) ? value : "";
}
const clean = (value, limit) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";
export function buildInquiry({ audience, schoolDirection, goal, group, format, timing }, language = "en") {
  const kind = normalizeAudience(audience);
  const direction = kind === "schools" ? normalizeSchoolDirection(schoolDirection) : "";
  if (language === "zh-CN") {
    const topics = {coaching: "学生辅导", schools: "学校项目", companies: "主题演讲或团队培训", unsure: "表达辅导或培训"};
    const delivery = {Online: "线上", "In person": "线下", "A mix of both": "线上与线下结合"};
    const preference = Object.hasOwn(delivery, format) ? delivery[format] : clean(format, 100);
    return [
      `你好 Kai，我想咨询${topics[kind]}。`,
      direction && `项目方向：${schoolDirectionsChinese[direction]}`,
      clean(goal, 600) && `目标：${clean(goal, 600)}`,
      clean(group, 100) && `${kind === "coaching" ? "年龄或年级" : "参与者"}：${clean(group, 100)}`,
      preference && `形式偏好：${preference}`,
      clean(timing, 100) && `时间范围：${clean(timing, 100)}`,
      "想与你讨论是否适合，以及具体方式、范围、费用与可安排时间。谢谢！",
    ].filter(Boolean).join("\n\n");
  }
  return [
    `Hi Kai, I’d like to ask about ${audiences[kind]}.`,
    direction && `Program direction: ${schoolDirections[direction]}`,
    clean(goal, 600) && `Goal: ${clean(goal, 600)}`,
    clean(group, 100) &&
      `${kind === "coaching" ? "Age / grade" : "Participants"}: ${clean(group, 100)}`,
    clean(format, 100) && `Delivery preference: ${clean(format, 100)}`,
    clean(timing, 100) && `Timing: ${clean(timing, 100)}`,
    "Could we discuss the fit, approach, fees and availability?",
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function buildChineseCourseInquiry({ grade = "", goal = "", timing = "" }, courseName) {
  return [
    `你好 Kai，我想了解 ${clean(courseName, 120)} 课程。`,
    clean(grade, 100) && `年级：${clean(grade, 100)}`,
    clean(goal, 600) && `表达目标：${clean(goal, 600)}`,
    clean(timing, 100) && `时间范围：${clean(timing, 100)}`,
    "想与你讨论课程是否适合，以及具体安排、费用和可安排时间。谢谢！",
  ].filter(Boolean).join("\n\n");
}
export async function copyInquiry(text, writeText, language = "en") {
  const chinese = language === "zh-CN";
  if (!text.trim())
    return {
      ok: false,
      message: chinese ? "咨询稿为空，请先写几句话再复制。" : "Your message is empty. Write a few words before copying.",
    };
  try {
    await writeText(text);
    return {
      ok: true,
      message: chinese ? "已复制。请自行打开微信，粘贴并检查后发送。网站没有发送消息，也没有确认预订。" :
        "Copied. Now open WeChat and paste it into your conversation with Kai. Nothing has been sent by this website.",
    };
  } catch {
    return {
      ok: false,
      message: chinese ? "自动复制不可用。咨询稿已选中，请使用设备的复制功能，再粘贴到微信。" :
        "Automatic copy is unavailable. Your message is selected: use Copy on your device, then paste it into WeChat.",
    };
  }
}

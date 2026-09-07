import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeAudience,
  normalizeSchoolDirection,
  schoolDirections,
  buildInquiry,
  copyInquiry,
  buildChineseCourseInquiry,
} from "../src/lib/inquiry.mjs";

test("school direction is allowlisted and independent of delivery", () => {
  for (const [value, label] of Object.entries(schoolDirections)) {
    assert.equal(normalizeSchoolDirection(value), value);
    const draft = buildInquiry({ audience: "schools", schoolDirection: value, format: "Online" });
    assert.equal(draft.split(`Program direction: ${label}`).length, 2);
    assert.match(draft, /Delivery preference: Online/);
    for (const audience of ["coaching", "companies", "unsure"]) {
      assert.doesNotMatch(buildInquiry({ audience, schoolDirection: value }), /Program direction:/);
    }
  }
  for (const value of [undefined, null, "", "constructor", "__proto__", "unknown", "<img onerror=alert(1)>"]) {
    assert.equal(normalizeSchoolDirection(value), "");
    assert.doesNotMatch(buildInquiry({ audience: "schools", schoolDirection: value }), /Program direction:/);
  }
});

test("unrecognized query values never become an audience or reflect HTML", () => {
  for (const value of [
    null,
    "",
    "__proto__",
    "constructor",
    "<script>alert(1)</script>",
  ]) {
    assert.equal(normalizeAudience(value), "unsure");
    assert.match(
      buildInquiry({ audience: value }),
      /speaking coaching or training/,
    );
  }
});
test("Chinese course draft keeps optional fields blank and preserves bounded entered text", () => {
  const empty = buildChineseCourseInquiry({}, "Young Competition Speakers（Fall 2026）");
  assert.match(empty, /Young Competition Speakers（Fall 2026）/);
  assert.doesNotMatch(empty, /年级：|表达目标：|时间范围：/);
  const filled = buildChineseCourseInquiry({ grade: "二年级", goal: "  清楚地表达想法  ", timing: "十月" }, "Course");
  assert.match(filled, /年级：二年级/);
  assert.match(filled, /表达目标：清楚地表达想法/);
  assert.match(filled, /时间范围：十月/);
  assert.ok(buildChineseCourseInquiry({ goal: "字".repeat(900) }, "Course").length < 750);
});
test("Chinese clipboard success, denial and empty states stay explicit", async () => {
  let copied;
  const success = await copyInquiry("我的修改", async text => { copied = text; }, "zh-CN");
  assert.equal(copied, "我的修改");
  assert.match(success.message, /网站没有发送消息/);
  const denied = await copyInquiry("我的修改", async () => { throw new Error("denied"); }, "zh-CN");
  assert.equal(denied.ok, false);
  assert.match(denied.message, /自动复制不可用/);
  const empty = await copyInquiry(" ", () => assert.fail("No clipboard write for blank input"), "zh-CN");
  assert.match(empty.message, /咨询稿为空/);
});
test("Chinese general inquiry preserves each audience and omits undecided details", () => {
  for (const [audience, topic] of Object.entries({coaching:"学生辅导", schools:"学校项目", companies:"主题演讲或团队培训", unsure:"表达辅导或培训"})) {
    const draft = buildInquiry({audience, goal:" ", group:"", timing:""}, "zh-CN");
    assert.ok(draft.includes(topic));
    assert.doesNotMatch(draft, /目标：|参与者：|年龄或年级：|形式偏好：|时间范围：|项目方向：/);
    assert.match(draft, /费用与可安排时间/);
  }
  for (const [format, label] of Object.entries({Online:"线上", "In person":"线下", "A mix of both":"线上与线下结合"})) {
    const draft = buildInquiry({audience:"coaching",goal:"  讲清一个观点  ",group:"二年级",format,timing:"十月"}, "zh-CN");
    assert.ok(draft.includes(`形式偏好：${label}`));
    assert.match(draft,/目标：讲清一个观点/);
    assert.match(draft,/年龄或年级：二年级/);
    assert.match(draft,/时间范围：十月/);
  }
  const bounded = buildInquiry({goal:"字".repeat(900),group:"人".repeat(200),timing:"时".repeat(200),format:"式".repeat(200)}, "zh-CN");
  for (const [character, limit] of [["字",600],["人",100],["时",100],["式",100]]) assert.ok(!bounded.includes(character.repeat(limit + 1)));
});
test("Chinese school directions are allowlisted and confined to school drafts", () => {
  for (const [schoolDirection, label] of Object.entries({workshop:"主题工作坊",sequence:"系列课程",teachers:"教师发展"})) {
    assert.ok(buildInquiry({audience:"schools",schoolDirection},"zh-CN").includes(`项目方向：${label}`));
    for (const audience of ["coaching","companies","unsure"]) assert.doesNotMatch(buildInquiry({audience,schoolDirection},"zh-CN"), /项目方向：/);
  }
  for (const value of [null,"unknown","constructor","__proto__","<script>alert(1)</script>"]) {
    const draft = buildInquiry({audience:value,schoolDirection:value},"zh-CN");
    assert.match(draft,/表达辅导或培训/);
    assert.doesNotMatch(draft,/项目方向：|constructor|__proto__|<script>|unknown/);
    assert.doesNotMatch(buildInquiry({audience:"schools",schoolDirection:value},"zh-CN"),/项目方向：/);
  }
});
test("audience-specific briefs omit blank optional fields and preserve entered goals", () => {
  const parent = buildInquiry({
    audience: "coaching",
    goal: "  Tell a story  ",
    group: "Grade 2",
    format: "Online",
    timing: "October",
  });
  assert.match(parent, /student coaching/);
  assert.match(parent, /Goal: Tell a story/);
  assert.match(parent, /Age \/ grade: Grade 2/);
  const school = buildInquiry({
    audience: "schools",
    group: "20",
    goal: "",
    timing: " ",
  });
  assert.match(school, /Participants: 20/);
  assert.doesNotMatch(school, /Goal:|Timing:/);
  assert.match(
    buildInquiry({ audience: "companies" }),
    /keynote or team training/,
  );
  assert.ok(buildInquiry({ goal: "x".repeat(800) }).length < 800);
});
test("copy success only follows a completed write; edits are copied exactly", async () => {
  let copied;
  const result = await copyInquiry("My edited message", async (value) => {
    copied = value;
  });
  assert.equal(copied, "My edited message");
  assert.equal(result.ok, true);
  assert.match(result.message, /Nothing has been sent/);
});
test("denied clipboard, missing API and empty messages have honest recoverable outcomes", async () => {
  for (const write of [
    async () => {
      throw new Error("NotAllowedError");
    },
    undefined,
  ]) {
    const result = await copyInquiry("My inquiry", write);
    assert.equal(result.ok, false);
    assert.match(result.message, /Automatic copy is unavailable/);
  }
  const result = await copyInquiry("  ", () => {
    throw new Error("should not write");
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /empty/);
});

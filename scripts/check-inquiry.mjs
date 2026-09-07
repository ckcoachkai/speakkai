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

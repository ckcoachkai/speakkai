# One Question, One Minute

Source: user-supplied `500_Simple_But_Hard_Questions.md`, October 4, 2026. All 500 numbered questions are preserved in order; editorial stars and surrounding notes are omitted from the recording view.

Edit template.html or questions.json, then run `node scripts/build-one-question-one-minute.mjs`.

Sessions: 1–8 hours in whole-hour steps (60–480 questions), or all 500 (8h 20m). Every question lasts one minute; pause extends the wall-clock finish time. Timer callbacks reconcile elapsed wall time after browser throttling. Reset returns to the selected session's start. The clock defaults to Asia/Shanghai, with supported IANA zones and UTC selectable before starting; timezone changes do not affect durations. The real clock keeps running while paused. The public page is `/tools/one-question-one-minute/` and is linked in both Resources galleries.

Verified: browser clock simulation of every session duration, last-minute and finish boundaries, pause/resume, Shanghai/UTC conversion, fullscreen entry/exit, and 320/390/1280 layouts. Site build, SEO, language, flagship and asset-budget checks pass. These simulations do not establish uninterrupted operation through device sleep.

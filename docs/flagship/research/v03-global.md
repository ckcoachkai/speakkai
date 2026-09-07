# V3 global benchmark: audience-aware inquiry composers

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Question:** What should SpeakKai's V3 contact/inquiry flow learn from current first-party speaker and training sites?  
**Evidence boundary:** Public pages were fetched over HTTP and their visible headings, copy, links, and form fields were inspected. No form was submitted, no lead was created, and no conversion or response-time claim is inferred beyond copy displayed on the page.

## Recommendation for SpeakKai

Use one inquiry composer with a required audience choice at the start: **Parent**, **School/teacher**, or **Company/team**. Then reveal only the fields that help Kai respond: desired outcome, learner/team size, age or role, preferred language, target timing, delivery preference, and optional message. Show a short “what happens next” panel: Kai reviews the request, replies through the selected channel, and confirms any call or session separately. A direct WeChat route can carry the same structured prompt so the conversation remains actionable without implying an appointment.

The benchmark pattern is clear but incomplete. Simon Sinek qualifies a business lead and promises a one-business-day reply. Vinh Giang routes enquiries by type. Duarte frames contact around pricing, custom packages, and support while exposing FAQs, resources, case studies, and service categories. SpeakKai can combine these strengths for three audiences while adding the missing context: parent/school needs, level or age, learning goal, and an explicit pending-confirmation state.

## Source 1: Duarte

**Official page:** [Let’s Talk | Duarte](https://www.duarte.com/help-contact/contact-us/)  
**Page title observed:** “Let’s Talk | Duarte”  
**Status:** HTTP 200 on 2026-09-07.

### What works

- The heading “Let’s talk!” and the subheading “How can we help?” are direct and welcoming.
- The description explicitly covers “pricing,” “custom packages,” and “help managing your account,” so a visitor can understand why to contact the company.
- The page keeps relevant paths in view: communication training, presentation writing, business storytelling, visual/data storytelling, delivery, speaker coaching, virtual presenting, and consulting. It also links to case studies, free guides/tools, books, webinars, videos, and blog content.
- A FAQ section is present (“Common questions we get all the time”), giving visitors a chance to self-serve before submitting.
- The page offers distinct service context, including executive presentations, keynote/event presentation services, sales presentations, presentation template design, communication consulting, and data storytelling services.

### Gaps

The public HTML did not expose a concise audience selector or a visible list of required form fields in the checked response; the contact experience appears to rely on a form component that is not fully represented in the initial page text. The visitor must infer which service is right from a broad catalogue. The page does not visibly provide a response-time promise in the checked content. There is also no parent or school route, age/level field, teacher context, or lightweight “send me a starter practice” alternative visible in the page text.

### SpeakKai application

Use a narrow first question (“Who are you enquiring for?”), then route-specific examples beneath it. Borrow the useful self-serve layer—FAQs, sample resources, and case proof—but keep the composer short enough for a parent on a phone. Add a visible response expectation only if Kai can actually meet it; treat it as an operational promise requiring verification.

## Source 2: Simon Sinek / The Optimism Company

**Official page:** [Business Contact Us | The Optimism Company](https://simonsinek.com/business/contact-us/)  
**Page title observed:** “Contact Us | Optimism at Work | The Optimism Company”  
**Status:** HTTP 200 on 2026-09-07.

### What works

- The page gives a business-specific reason to act: “Unlock Your Team’s Potential.”
- It explains the offer before the form: experiences teaching human skills for collaboration, communication, and leadership.
- Required fields are explicit: first name, last name, work email, and organization. Phone is optional, and the message asks the visitor to describe the team and desired outcome. The form also includes a company-website field and a disabled submit state until required fields are complete.
- The page states that a support-team member will be in touch within one business day. This makes the handoff expectation clear, subject to the company’s ability to maintain it.
- The surrounding navigation retains links to keynotes, workshops, private classes, Leaderful for Business, and business enquiries, so the form sits in a recognizable business journey.

### Gaps

The composer assumes an organization and work email, which is appropriate for a corporate funnel but excludes a parent or school visitor. “How can we help?” remains free text rather than a structured need, audience, size, or timing choice. The checked page does not show a school/classroom or individual learner route. No explicit consent text, data-retention explanation, or “request received/pending confirmation” behavior was observable without submitting the form; these are therefore unknown, not defects claimed as fact.

### SpeakKai application

Keep a clear response expectation only if it is true for SpeakKai. Use audience-specific required fields instead of demanding a company website. For companies, ask team size and target behavior; for schools, class size, age/level, and teacher role; for parents, learner age/level, goal, language, and preferred contact channel. Preserve an optional free-text field for nuance after the structured fields.

## Source 3: Vinh Giang

**Official page:** [Contact Vinh Giang](https://www.vinhgiang.com/contact)  
**Page title observed:** “Contact Vinh Giang | Speaking, Media & General Enquiries”  
**Status:** HTTP 200 on 2026-09-07.

### What works

- The page begins with “Get in touch” and states the possible intents: ask a question, book Vinh, or say hello.
- The form provides an explicit enquiry-type selector with General, Brand Partnerships, Speaking Booking, Media/Press, Podcast Request, and STAGE Programs Support.
- Required fields are simple: full name, email address, and message. This keeps the first contact low friction.
- Student comments are placed below the form, giving context about the course experience before or after the enquiry decision.

### Gaps

The routing choices are oriented to a speaker business and its existing programme. They do not distinguish parent, school, classroom, or corporate training buyer, and the free-text message carries most of the qualification burden. The page does not visibly state a reply time or what occurs after submission. It says “book Vinh” but does not clarify whether the request is a tentative enquiry or a confirmed booking. No claim is made about the actual submission handling because the form was not submitted.

### SpeakKai application

Adopt the useful enquiry-type pattern, but make the types match SpeakKai’s operating lanes: parent consult, school/classroom programme, company/team training, Kai speaking request, and practice/resource question. Keep name and contact details minimal, then add progressive fields based on the selected lane. Label the primary action “Send enquiry” or “Request a conversation,” not “Book,” unless a real availability and confirmation system is connected.

## Cross-benchmark design rules

1. **Qualify by audience before asking for a story.** A structured audience choice makes the next fields and response path understandable.
2. **Keep the first form short, then ask only operationally useful details.** Name, contact, audience, desired outcome, size/level, timing, and language are more actionable than a long generic message.
3. **Use route-specific vocabulary.** “Learner,” “class,” and “team” should not be forced into one generic “organization” field.
4. **Show proof and FAQs beside the composer.** Duarte demonstrates that contact can sit within a wider self-serve decision path; this reduces uncertainty without claiming a conversion lift.
5. **State a response window only when resourced.** Simon Sinek’s one-business-day promise is a useful pattern, not evidence that a similar promise will work for SpeakKai.
6. **Separate enquiry from booking.** A submitted form or WeChat message should create a request. Kai confirms any time, service, price, or payment afterward.
7. **Carry the same fields across WeChat and web.** A WeChat prompt can ask the visitor to send “audience / goal / age or team size / language / target timing,” preserving context when the channel changes.
8. **Make privacy and consent visible.** Parent and student enquiries should avoid unnecessary personal data, explain how recordings or details are used, and offer a deletion/contact route where applicable.

## Minimal V3 composer specification

**Required first step:** “I’m enquiring for” → Parent / School or teacher / Company or team / Speaking or other.  
**Required common fields:** name, preferred contact channel, email or WeChat handle, desired outcome, preferred language.  
**Conditional fields:**

- Parent: learner age band, current level, main speaking challenge, online/in-person preference.
- School/teacher: school/class context, age/level, class size, target dates, teacher involvement.
- Company/team: organization, team size, communication scenario, desired delivery format, target timing.
- Speaking/other: event type, audience, date range, location/online, message.

**Confirmation copy:** “Your enquiry has been sent. Kai will review it and reply through your selected channel. Any session time or booking is confirmed separately.” Use this only if the actual implementation creates a reliable handoff; otherwise state the verified behavior more narrowly.

**Validation:** Test keyboard and mobile completion, language switching, required-field clarity, duplicate submission behavior, spam protection, privacy copy, and a read-back of the received fields. Test the WeChat prompt as a separate channel path. No benchmark page was submitted in this review, so their backend behavior remains unverified.

## Sources and limitations

| Source | Publisher | Live observation |
|---|---|---|
| [Let’s Talk](https://www.duarte.com/help-contact/contact-us/) | Duarte | HTTP 200; contact framing, service context, FAQ/resources visible; form-field details not fully exposed in initial HTML |
| [Business Contact Us](https://simonsinek.com/business/contact-us/) | The Optimism Company | HTTP 200; required identity/work fields, optional phone, team/outcome message, one-business-day copy visible |
| [Contact Vinh Giang](https://www.vinhgiang.com/contact) | Vinh Giang | HTTP 200; enquiry-type selector, required name/email/message, student comments visible |

These observations describe public page content on 2026-09-07. They do not establish conversion rates, lead quality, actual response times, accessibility conformance, privacy compliance, or submission reliability. Those require an authorized SpeakKai implementation test and, for third-party sites, cannot be independently confirmed from public pages alone.

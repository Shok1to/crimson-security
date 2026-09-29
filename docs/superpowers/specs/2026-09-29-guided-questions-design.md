# Guided Questions — REJECTED proposal

**Date:** 2026-09-29
**Status:** REJECTED, not built. Kept for the record.
**Decided by:** reviewed and argued against by its own author; Alvin agreed.
**Would have changed:** `components/ChatWidget.tsx`, `lib/quick-replies.ts` → `lib/guided-questions.ts`

## 0. Why this was not built

This proposed leading with a two-level question tree and hiding the text input
until the visitor chose "Ask something else". **The input stays visible. None of
the rest of this document was implemented.**

Three reasons, in order of weight:

1. **It was organised by Crimson's taxonomy, not by visitor intent.** Level 2A
   groups by the site's own capability areas and Level 2B by differentiator
   names. That is how the firm describes itself, not how someone arrives
   wanting to evaluate it.
2. **It was worse for the commonest intent.** Today one tap sends "What does a
   penetration test involve?" and gets an answer about penetration testing.
   Under this design that became two taps to "Testing and scanning", which
   answers about penetration testing *and* vulnerability scanning — more taps
   for a less focused answer.
3. **There was no evidence behind any of it.** The chatbot has never been in
   front of a real visitor. Every branch, grouping and label was guesswork
   presented as structure.

And the reason that guesswork cannot easily be fixed: conversations are
**deliberately ephemeral**. Nothing is stored server-side, which the privacy
policy states plainly. So the usage data that would justify a tree — what people
actually ask, where they give up — does not exist, and starting to collect it
would itself be a privacy decision to take on its own merits rather than a
prerequisite quietly adopted to enable a UI change.

**What was done instead:** the suggested questions were improved in place. The
four opening chips were rewritten in a prospect's voice, and the lightbulb menu
was widened to eight questions covering the differentiators that no suggestion
previously reached. Same surface, better content, no new navigation model.

**Do not re-propose this without new information.** The thing that would change
the decision is evidence about what visitors actually ask. Absent that, this
document is the argument against it.

Note that §8 relates this to the gap-assessment proposal
(`2026-09-28-gap-assessment-design.md`). That document is unaffected by this
rejection and stands or falls separately; the reasoning above is about leading
the chat panel with a tree, not about a scoping questionnaire.

---

*Everything below is the original proposal, unedited, for the record.*

## 1. What changes

Today the chat panel leads with a text input and offers four suggested questions that disappear after the first message.

Instead: **lead with buttons, reveal the input only when free text is actually needed.**

The visitor taps their way to an answer. The input appears when they choose "Ask something else", or when the assistant needs a name and email — because those cannot be buttons.

## 2. The question tree

Two levels, four or five buttons per screen, no scrolling. Every entry is answerable from `lib/content.ts`.

### Level 1

| Button | Behaviour |
|---|---|
| What services do you offer? | → Level 2A |
| How do you work? | → Level 2B |
| Where are you based? | Answers directly — Toronto office and the four other locations |
| Talk to the team | Starts lead capture, **reveals the input** |
| Ask something else | **Reveals the input** |

### Level 2A — services

Grouped by the four capability areas the site already uses, so two services are covered per answer and no screen needs scrolling.

| Button | Covers |
|---|---|
| Assessments and compliance | Compliance Assessments & Reports, SSAE 16 / SOC Audits |
| Testing and scanning | Penetration Testing, Vulnerability Scanning |
| Monitoring and vendors | Security Monitoring / SIEM, Vendor Security Management |
| Incidents and forensics | Incident Response Services, Forensic Analysis Services |

### Level 2B — how they work

| Button | Covers |
|---|---|
| What is your No Limit Policy? | No Limit Policy |
| Who actually does the work? | No Hacker Policy, Owner Accessibility, Real World References |
| What do the reports look like? | Detailed Reporting, Remediation Assistance |
| Can you work outside business hours? | Flexibility, Ongoing Technical Support |

Between them these cover all eight services and eight of nine differentiators. Remote Pre-Audit Preparation is covered inside the assessments answer, where a visitor would expect it.

**Every screen also carries "Back" and "Ask something else."** A visitor is never more than one tap from free text.

## 3. When the input appears

Three triggers, and only these:

1. **"Ask something else"** — explicit request.
2. **"Talk to the team"** — and automatically again whenever the assistant asks for a name or email mid-conversation. The model already does this through `capture_lead`; the widget watches for it rather than the visitor having to work out that they need to type.
3. **Once revealed, it stays revealed** for the rest of the session. Someone who has started typing should not have it taken away.

The buttons remain available throughout, via the existing lightbulb control.

## 4. Why this is worth doing

**Most traffic stops being free-form model calls.** A tapped question is a fixed string. The rate limiter, payload caps and prompt-injection defences all stay, but stop carrying the weight they carry today.

**The sensitive-data problem largely dissolves.** The guardrail against visitors pasting IP ranges and hostnames exists because there is a text box inviting it. With no visible input by default, the situation mostly stops arising.

**Mobile improves.** No keyboard for the common path, and the iOS zoom question stops applying to most visits.

**Answers get more predictable**, because the questions are fixed and known to be answerable.

## 5. What it costs

**It becomes an FAQ navigator rather than a conversation.** A visitor with a real question not in the tree has to notice "Ask something else" and take an extra step. For a firm selling expertise, someone who types a specific question and gets a good answer may convert better than someone clicking through options.

This is a genuine trade, not a free win. The mitigation is that "Ask something else" is on every screen and the input never disappears once shown — but the default path is narrower than it is today.

**A second cost:** the tree is content that needs maintaining. Add a service and the tree should grow. The build-time guard (§6) makes drift loud rather than silent, but it does not write the new entry.

## 6. Structure

`lib/quick-replies.ts` becomes `lib/guided-questions.ts` and gains the tree. It keeps the property that matters: **every entry declares the `lib/content.ts` titles it relies on, and the module throws at import — therefore at build — if one disappears.** That guard already exists and already works; renaming a service breaks the build rather than leaving a button that invites "I don't have that detail."

Shape:

```ts
interface GuidedQuestion {
  /** What the visitor sees and, when it is a leaf, what gets sent. */
  label: string
  /** Titles in lib/content.ts that carry the facts to answer it. */
  grounding: readonly string[]
  /** Present on a branch, absent on a leaf. */
  children?: readonly GuidedQuestion[]
}
```

A leaf sends its label through the existing `sendMessage` path — the same code as typing, no parallel submit logic. A branch swaps the visible set.

Navigation state is local to the component: the current node and a path back. Nothing persists, nothing reaches the server, consistent with the ephemeral decision.

## 7. Accessibility

- Buttons stay real `<button>` elements at 44px minimum, wrapping rather than scrolling horizontally.
- Changing level swaps the contents of the existing labelled group rather than replacing the region, so focus is not lost. Move focus to the first button of the new set.
- "Back" is a button with a label naming where it returns to, not a bare arrow.
- Revealing the input moves focus into it — the visitor asked to type.
- The global `:focus-visible` treatment is not overridden.

## 8. Relationship to the gap assessment

This is architecturally the same thing as `2026-09-28-gap-assessment-design.md`: a client-driven question bank, branching options, free text only where genuinely required, and a build-time guard tying entries to real content.

The difference is what happens at the end. Here a leaf sends a question and the assistant answers. There, the answers accumulate into a scoping brief that is emailed to Crimson.

**Building this first makes the assessment mostly wiring.** If the assessment is still the direction, that is an argument for this ordering rather than a coincidence.

## 9. Open questions

1. **Is the trade in §5 acceptable?** That is a judgement about the visitors, not a technical question, and it is the one that should decide whether this ships.
2. **Should the tree open expanded or collapsed on mobile?** Level 1 is five buttons, roughly 250px of a 682px sheet. It fits, but it is the first thing a visitor sees.
3. **Does "Talk to the team" duplicate the existing contact form** enough to confuse? The form is one scroll away on the same page.

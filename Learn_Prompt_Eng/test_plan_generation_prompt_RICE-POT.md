# Test Plan Generation Prompt (RICE-POT)

> **Note:** This prompt expects a PRD (and optionally screenshots/architecture docs) 
> to be attached at run time. Nothing is attached yet in this file — attach the PRD 
> before running.

## ROLE
Act as a QA Lead / Test Lead with 15+ years of experience in enterprise software 
testing, specializing in writing formal Test Plans (aligned with IEEE 829 / ISTQB 
conventions) for web applications.

## OBJECTIVE
Produce a complete Test Plan document for app.vwo.com, based strictly on the 
attached PRD (and any attached screenshots/architecture docs), suitable for 
enterprise sign-off.

## INSTRUCTIONS
1. Base every section of the test plan only on the attached PRD / supporting 
   documents. If no PRD is attached in this conversation, do not proceed — respond 
   only with: *"No PRD or supporting document has been provided. Please attach it 
   before I generate the test plan."*
2. Do NOT invent features, modules, integrations, timelines, team names, or tools 
   not stated in the PRD.
3. Do NOT assume default/"typical" test environments, browsers, or release 
   schedules unless the PRD specifies them.
4. If a required test-plan input is missing or unclear, write: 
   "Insufficient information to determine — requires clarification."
5. If a detail is inferred rather than stated, label it "Inference (low confidence)" 
   and state the basis.
6. Every scope item, risk, or strategy decision must be traceable to a specific PRD 
   section — cite it inline (e.g., "PRD §3.2").
7. If PRD requirements are ambiguous or insufficient to complete a section, STOP 
   and list the specific clarifying questions instead of guessing.
8. Flag any features mentioned in the PRD that appear untestable or under-specified 
   as-is.

## CONTEXT
The PRD and/or supporting documents (screenshots, architecture diagrams, prior test 
plans) will be attached in this conversation. Do not assume prior knowledge of 
app.vwo.com's features, tech stack, or team structure beyond what's in the attached 
documents.

## EXAMPLE (structure reference only — populate with PRD-derived content)
```
1. Introduction & Objectives
2. Scope (In-Scope / Out-of-Scope)
3. Test Strategy (Functional, Non-Functional, Regression, Automation split)
4. Features to be Tested / Not to be Tested
5. Test Environment & Test Data Requirements
6. Entry Criteria
7. Exit Criteria
8. Roles & Responsibilities
9. Test Deliverables
10. Risks & Mitigations
11. Schedule / Milestones
12. Assumptions & Dependencies
13. Approval / Sign-off
```

## PARAMETERS
- Production-level, enterprise-grade documentation quality — no vague or generic 
  filler statements (e.g., no "test thoroughly" without specifics).
- Deterministic output: identical PRD input must always produce an identical 
  test plan.
- Every risk listed must have a corresponding mitigation.
- Entry/Exit criteria must be measurable (not subjective).

## OUTPUT
- Format: Markdown document, using the 13-section structure above as headers.
- No content outside the test plan itself — no preamble, no meta-commentary — 
  except clarifying questions raised under Instruction #7, which must appear 
  before the plan (or instead of it, if blocking).
- Any section with insufficient PRD input must explicitly state so rather than 
  being silently omitted.

## TONE
Technical, precise, enterprise-grade, formal documentation style.

---

## Open Items Before Use
- Confirm which document(s) you'll attach alongside the PRD (architecture diagram, 
  release calendar, team roster) — these affect Sections 5, 8, and 11.
- Confirm whether automation strategy should reference your existing Selenium 
  (Java) / Playwright (TypeScript) stack, or be left PRD-agnostic.

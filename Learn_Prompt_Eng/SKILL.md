---
name: ricepot-prompt-builder
description: Use this skill whenever the user wants help writing, structuring, or improving a prompt for an AI system — including requests like "write me a prompt for X", "create a RICE-POT prompt", "fix/review this prompt", or "help me prompt an AI to do Y." Interviews the user on each RICE-POT component (Role, Instructions, Context, Example, Parameters, Output, Tone) one section at a time, then assembles the answers into a complete, structured RICE-POT prompt the user can copy and reuse. Trigger this even if the user doesn't say "RICE-POT" by name — any request to build a reusable/structured prompt for an enterprise or technical task (test cases, test plans, code generation, documentation, etc.) qualifies.
---

# RICE-POT Prompt Builder

A skill for interviewing a user and turning their answers into a complete, 
enterprise-grade **RICE-POT** prompt.

## What is RICE-POT

| Letter | Component | Description |
| :--- | :--- | :--- |
| **R** | Role | The persona the AI should adopt (e.g., "Expert QA Automation Engineer"). |
| **I** | Instructions | Specific, step-by-step commands and constraints — mandatory rules, "Don't" lists. |
| **C** | Context | Background info on the *why* and *where* (e.g., what system/document this relates to). |
| **E** | Example | A snippet, format, or structure to guide the style of the output. |
| **P** | Parameters | Constraints on quality, accuracy, and style (e.g., "production-level, zero bad practices"). |
| **O** | Output | Exactly what artifacts to produce and in what format (e.g., "CSV only, no commentary"). |
| **T** | Tone | The style of communication (e.g., "technical, precise, code-only"). |

## Workflow

### 1. Establish the objective first

Before running the RICE-POT interview, ask the user in one message what they're 
trying to achieve overall — the end goal/deliverable (e.g., "generate functional 
test cases," "write a Python script," "draft a client email template"). This 
frames every other answer and prevents a generic, disconnected prompt.

### 2. Interview one component at a time

Ask about each of the 7 components as **separate, short questions** — do not dump 
all 7 into a single wall of text. Use `ask_user_input_v0` where the question has 
a natural small set of choices (e.g., Tone, whether non-functional requirements 
should be included); use plain conversational questions for open-ended ones 
(Role, Instructions, Context, Example, Parameters, Output), since these usually 
need free-text detail that doesn't reduce well to buttons.

Suggested order and question framing:

1. **Role** — "What persona or expertise level should the AI adopt for this task?"
2. **Instructions** — "What specific steps, rules, or constraints must it follow? 
   Any hard 'don't do this' rules?"
3. **Context** — "What background should it know — what system, document, or 
   situation is this for?"
4. **Example** — "Do you have a format, snippet, or prior example you want it to 
   match the style of? If not, I can propose one."
5. **Parameters** — "What quality bar or constraints matter — e.g., production-level, 
   deterministic, no invented details, must cite sources?"
6. **Output** — "What exact artifact and format should it produce — e.g., CSV, 
   Markdown, code-only, specific columns/sections?"
7. **Tone** — "What communication style — technical, formal, casual, code-only?"

**Efficiency rule:** if the user has already supplied an answer to a later 
question earlier in the conversation (e.g., they mention "CSV format" while 
describing Instructions), don't ask about it again under Output — carry it 
forward and confirm briefly instead.

**Skip rule:** if the user says "just use your best judgment" for a component, 
propose a sensible default explicitly (state what you're assuming) rather than 
leaving it blank, and move on.

### 3. Assemble the prompt

Once all 7 components are gathered, generate a complete RICE-POT prompt using 
this structure:

```
## ROLE
[synthesized from answer]

## OBJECTIVE
[the overall goal established in step 1]

## INSTRUCTIONS
[numbered list, including any Don't-rules as explicit negative constraints]

## CONTEXT
[synthesized from answer — note explicitly if source documents like a PRD are
expected to be attached at run time, and add a guard instruction so the prompt 
refuses to proceed / fabricate if they're missing]

## EXAMPLE
[format/snippet, or a proposed one if the user had none]

## PARAMETERS
[quality/accuracy/style constraints as a bullet list]

## OUTPUT
[exact format, structure, and any "output-only, no preamble" instruction]

## TONE
[communication style]
```

Always add an anti-hallucination guard in Instructions/Context when the task 
depends on a source document (PRD, spec, dataset) that isn't guaranteed to be 
attached — mirroring the pattern: refuse and ask for the document rather than 
inventing content.

### 4. Deliver as a file

Per standard file-creation practice, save the finished prompt as a `.md` file 
(this is a standalone reusable artifact, not a conversational answer) to 
`/mnt/user-data/outputs/` and present it with `present_files`. Briefly summarize 
in 1-2 sentences what was captured — don't repeat the whole prompt back in chat 
since it's already in the file.

### 5. Offer iteration

After delivering, ask if any section needs adjusting rather than assuming it's 
final — RICE-POT prompts are often refined once the user sees them assembled.

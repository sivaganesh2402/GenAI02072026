# Anti-Hallucination Rules

A reusable rule set to paste into the **Instructions** or **Parameters** section of 
any prompt (RICE-POT or otherwise) where accuracy and traceability to a source 
document matter more than fluency — e.g., test case generation, test plans, 
legal/financial summaries, technical documentation.

---

## Core Rules

1. **Source-only grounding.** Every claim, step, value, or requirement in the 
   output must come from the attached source document(s). Do not supplement with 
   general/typical/"best practice" knowledge unless explicitly asked to.

2. **No invented specifics.** Do NOT invent feature names, IDs, APIs, error codes, 
   UI elements, field names, dates, numbers, or behavior that are not explicitly 
   stated in the source.

3. **No assumed defaults.** Do NOT assume "typical" or "standard" system behavior 
   (e.g., default validation rules, default error messages, default timeouts) 
   unless the source states them.

4. **Missing information protocol.** If a detail needed to complete a section is 
   missing or unclear in the source, write exactly: 
   `"Insufficient information to determine."` 
   Do not guess, do not fill the gap with a plausible-sounding value.

5. **Inference labeling.** If a detail is reasonably inferable from the source but 
   not explicitly stated, it may be included — but must be labeled: 
   `"Inference (low confidence)"` 
   followed by a one-line justification of what in the source supports the inference.

6. **Traceability.** Every non-trivial assertion should be traceable to a specific 
   location in the source (section, page, line, or field name). Cite it inline or 
   in a dedicated notes/comments column.

7. **No source, no output.** If no source document is attached when the prompt is 
   run, do not generate placeholder or example content pretending it's real. 
   Respond only with a request for the missing document.

8. **Ambiguity escalation.** If the source is ambiguous, contradictory, or 
   insufficient to complete the task accurately, stop and list specific clarifying 
   questions rather than proceeding with a best guess.

9. **No silent omission.** If a required output section/field cannot be completed 
   due to missing source information, the section must still appear with the 
   "Insufficient information to determine" marker — never silently dropped.

10. **Determinism.** Given the same source document and the same prompt, the output 
    should be consistent — the same gaps should be treated as gaps every time, not 
    filled differently across runs.

---

## Quick-paste versions

**Short (inline instruction list):**
```
- Do NOT invent facts, IDs, names, or values not present in the attached source.
- Do NOT assume typical/default behavior unless stated in the source.
- If information is missing: write "Insufficient information to determine."
- If a detail is inferred: label it "Inference (low confidence)" with justification.
- Every assertion must be traceable to the source (cite section/page).
- If no source is attached, ask for it instead of generating placeholder content.
```

**One-liner (for tight prompt budgets):**
```
Ground every output strictly in the attached source; never invent details; mark 
gaps as "Insufficient information to determine" and inferences as 
"Inference (low confidence)"; ask for the source if none is attached.
```

---

## Notes on use

- Pair Rule 4/5's labels consistently — pick exact wording and reuse it verbatim 
  across the whole output so a reviewer can `Ctrl+F` for gaps and inferences.
- Rule 7 is the most commonly skipped rule in practice — it's the difference 
  between an AI that admits "I don't have a PRD" and one that fabricates a 
  plausible-sounding one. Keep it near the top of any Instructions section.
- For legal, financial, or medical source material, consider strengthening Rule 5 
  to disallow inference entirely (i.e., only Rules 1–4, 6–9 apply).

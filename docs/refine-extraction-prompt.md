# Second pass → better JSON

A first extraction is a draft made under load: one look at a photograph, everything read
at once. This prompt is the second look. You give the model the **source photographs and
the extraction it already produced**, and it returns a corrected object plus an audit of
what it changed.

It is worth a second pass because the two passes fail differently. The first pass is
reading; the second is checking — the priors are on the page, the model is no longer
budgeting attention across the whole form, and it can be asked the one question the first
pass cannot answer: *does this actually say what I wrote down?*

The output validates against `extraction.schema.json`:

```sh
node tools/validate-extraction.mjs reply.json
```

Run the validator **before** the second pass as well. Its errors and warnings are the
best possible input to the prompt — feed them in and the model has a list of exactly what
to look at.

Two modes, same prompt: **refine** one prior extraction, or **reconcile** two or more made
independently. Reconciling two cheap extractions usually beats refining one expensive one:
disagreement localises the doubt for you, and where two independent reads agree, the value
is almost never wrong.

---

## Part 1 — What to send

1. Every source photograph, the same ones the first pass saw.
2. The prior extraction(s), each in a fenced block labelled `PRIOR A`, `PRIOR B`, …
3. Optionally, the validator's output.
4. The relevant field map: `case-extraction-prompt.md`, `blaine-consent-prompt.md`, or
   `mediclinic-admission-prompt.md`. The second pass must not invent paths the first pass
   never had.

---

## Part 2 — The prompt

---

You are reviewing an existing transcription of the attached photographs against the
photographs themselves. You are not starting over, and you are not rewriting it to taste.

Your output is the corrected transcription plus an account of every change. Transcribe
only — do not interpret, diagnose, summarise, expand abbreviations, average, smooth, or
fill gaps.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

### Structure

```
{
  "form": "sasa-case" | "blaine-consent-v2019" | "mediclinic-admission",
  "data": { …the corrected transcription, in the same shape as the prior… },
  "review": {
    "added":     ["dotted.path", …],
    "corrected": [{"path":"…", "from":…, "to":…, "reason":"…"}],
    "removed":   ["dotted.path", …],
    "confirmed": ["dotted.path", …],
    "conflicts": [{"path":"…", "values":[…], "resolution":"kept"|"omitted"|"reread",
                   "reason":"…"}],
    "stillUncertain": ["dotted.path", …],
    "checks": ["…"]
  }
}
```

`data` is the complete corrected object, not a diff. `review` accounts for how it differs
from the prior.

### The evidence rule

Every value in `data` must be visible in a photograph **now**, on this pass. A value
inherited from the prior is a value you are asserting; if you cannot find it on the page,
it does not survive merely because the first pass wrote it down.

Three outcomes per field, and only three:

- **Confirmed** — you found it and it reads as the prior says. Keep it. List high-risk
  paths in `confirmed` (identifiers, doses, times); routine text need not be listed.
- **Corrected** — you found it and it reads differently. Use what you can see and record
  the change in `corrected` with a one-clause reason.
- **Removed** — you cannot find it, or cannot read it well enough to assert it. Drop it
  from `data` and list it in `removed`. A missing value is correct; an inherited guess is
  not.

Never keep a value with the reason "the prior said so".

### Rules

1. **Do not add polish.** Abbreviations stay abbreviated, spelling stays uncorrected,
   handwriting stays as written. `GA`, `RSI`, `SVT` are transcriptions, not errors.
2. **Do not compute.** Do not derive age from a birth date, minutes from a start and end
   time, a mean from a systolic and diastolic, or sex from an identity number. Where the
   page states two things that disagree, transcribe both and record a conflict.
3. **Resolve every prior `uncertain` path explicitly.** Each one must end up in
   `corrected`, `confirmed`, `removed`, or `stillUncertain` — never silently carried
   forward. `stillUncertain` means you looked again and it is still not legible.
4. **Fill gaps only from the page.** Fields the prior omitted are worth a second look —
   the first pass may simply have run out of attention — but they enter `data` only on the
   same evidence rule, and are listed in `added`.
5. **Reconciling several priors**: where they agree, treat the value as probable and still
   verify it against the photograph. Where they disagree, go back to the image and decide
   from what you can see; record the alternatives in `conflicts` with
   `resolution: "reread"`. If the image cannot settle it, omit the field, set
   `resolution: "omitted"`, and list the path in `stillUncertain`. **Never split the
   difference, never take a majority vote, never pick the more plausible-sounding value.**
6. **Do not let one field repair another.** If the identity number and the date of birth
   disagree, both stay as printed and the conflict is recorded. If `timeMin` does not match
   `timeFrom`→`timeTo`, do not adjust either. The disagreement is the finding, and a
   reconciled record hides it.
7. **Ticked boxes**: a ticked, circled or crossed box is `true`; an empty box is omitted.
   Never write `false`. If the prior wrote `false` anywhere, remove that path and list it in
   `removed` — an unticked box means unanswered, not answered no. The same holds for
   YES/NO pairs and Section D: record `"yes"` or `"no"` only for the one actually marked.
8. **Never transcribe a signature as text.** Where a form records that a signature exists,
   that is a boolean. If the prior contains a name lifted out of a signature, remove it.
9. **Formats**: dates `YYYY-MM-DD`, times 24-hour `HH:MM`, timestamps
   `YYYY-MM-DDTHH:MM`, identity numbers exactly 13 digits with no spaces. Repairing a
   prior's format (`2026/08/25` → `2026-08-25`) is a correction; record it with the reason
   `format`. Numbers are plain ASCII with a decimal point, no units, no thousands
   separators.
10. **Vitals** (SASA only): each observation must sit on the grid defined by
    `chart.startTime` and `chart.interval` — 30 columns, so 2h25 at 5 minutes and 7h15 at
    15. If prior rows fall outside it, first check whether the start time or interval was
    read wrongly, and correct that rather than dropping the rows. Only rows that are still
    outside a correctly-read grid are removed. Never interpolate a missing column and never
    carry a reading forward.
11. **Identities** (admission sheets): confirm that the patient, the medical-aid main
    member and the signatory have not been merged, and that the two employer blocks have
    not been transposed. This is the most common defect in a first pass and the least
    visible afterwards. Record the check in `checks`.
12. If the prior is unrecognisable as any of the three forms, or the photographs do not
    show the form the prior claims, return
    `{"form":"…","data":{},"review":{"checks":["prior does not match the photographs"]}}`.

### checks

List the cross-checks you actually performed, in a few words each — `grid fits`,
`identities distinct`, `both initial boxes present`, `codes match descriptions`,
`ID vs DOB agree`. This is for the reviewer, not for you: it says what was looked at, so
what was *not* looked at is visible too.

---

## After the second pass

Run the validator again. Then read `review` before you read `data`:

- **`corrected`** is where the first pass was wrong. If it is long, the photograph is
  probably poor — reshoot it rather than running a third pass.
- **`removed`** is where the first pass invented. A value the second pass could not find is
  a value that was never on the page; treat any inherited number with new suspicion.
- **`conflicts`** and **`stillUncertain`** are for you to settle against the paper. They do
  not resolve by re-running the model.
- **`checks`** tells you what was verified. A short list on a long form means most of it
  was accepted rather than checked.

A second pass raises the floor; it does not make the transcription authoritative. The
record is still a draft until a human has read it back against the source, and the source
photographs still belong with the case.

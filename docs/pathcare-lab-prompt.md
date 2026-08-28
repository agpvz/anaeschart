# PathCare lab report → JSON

Blood results arrive in two shapes from the same laboratory, and they need one ingestion
path:

- a **Cumulative Report** — a matrix, one row per analyte and one column per collection,
  carrying a whole admission's trend on a page;
- a **FINAL REPORT** — one specimen, one discipline, printed portrait, with the flag legend
  and the authorising pathologist at the foot.

Both reduce to the same object: a patient, and a list of specimens each carrying results.
A cumulative report yields one specimen per column; a single report yields exactly one. The
field map and the analyte dictionary are `pathcare-lab-schema.json`.

**Every result belongs to a collection datetime, not to a report.** A cumulative report
printed on the 28th carries specimens drawn on the 18th, 19th, 20th, 24th, 25th, 27th and
28th. Filing them all under the print date destroys the trend, which is the only reason the
report exists.

---

## Part 1 — Recognising the report

1. **PathCare wordmark** — blue script with the red-and-blue microscope roundel — with
   `Dietrich Voigt Mia (Pty) Ltd` and a regional partnership name such as
   `PathCare Winelands & Overberg`.
2. **Title**: `Cumulative Report` in italic script (matrix layout), or
   `FINAL REPORT - Lab Ref : <digits>` / `PRELIMINARY REPORT` (single layout).
3. **Flag legend** at the foot of a single report:
   `H=High, L=Low, *H=Critically High, *L=Critically Low, #=Delta Checked`.
4. **Footer**: `Confidential Medical Results` with `Page N of M`, or
   `END OF REPORT : Total Number of Pages : N`.
5. **`Practice No:` / `Prac.No. :`** followed by digits, and an `Authorised on` line naming
   a Chemical Pathologist or Haematopathologist.
6. Critically abnormal values printed **white on a solid red block**.

Which layout: a grid of dated columns across the head is cumulative; a
`Test / Result / Flag / Reference` column set is single.

Orientation: single reports are very often photographed on their side. Rotate until the
wordmark reads horizontally before doing anything else.

Not this report: another laboratory's result sheet (Ampath, Lancet, NHLS) carries its own
wordmark and legend — report it as unrecognised rather than forcing this map, because the
flag vocabulary differs between laboratories.

---

## Part 2 — Transcribing it

Paste the block below into a vision-capable LLM and attach every page.

---

You are transcribing a **PathCare laboratory report** from photographs. Transcribe only. Do
not interpret, diagnose, comment on the results, recalculate anything, or infer a value
that is not printed.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

### Structure

```
{
  "report":  {…},
  "patient": {…},
  "specimens": [
    { "collectedAt": "YYYY-MM-DDTHH:MM", "requisitionNo": "…", "status": "Final",
      "results": [
        { "analyte": "sodium", "label": "P-SODIUM", "specimenPrefix": "P",
          "panel": "ue", "value": 141, "unit": "mmol/L",
          "refLow": 136, "refHigh": 145, "flags": [] }
      ] }
  ],
  "uncertain": [ "dotted.path", … ]
}
```

### Paths

```
report.layout ("cumulative"|"single")  .labRef  .requisitionNo  .specimenNo
  .laboratory  .labAddress  .labTel  .practiceNo  .reportTo  .reportToUnit
  .reportToAddress  .referringDoctor  .discipline  .testsRequested  .specimenType
  .referralIcd10  .status  .collectedAt  .receivedAt  .generatedAt  .authorisedAt
  .authorisedBy  .page  .pages  .printedAt  .headerRef

patient.title  .fullName  .surname  .firstNames  .idNo (13 digits)  .birthDate
  .sex ("M"|"F")  .ageText  .ageYears  .contactNo  .email  .patientRefNo
  .medAid  .medAidNo

specimens[n].collectedAt  .receivedAt  .requisitionNo  .labRef  .status  .results[]
specimens[n].results[m].analyte  .label  .specimenPrefix  .panel  .value  .text
  .unit  .refLow  .refHigh  .refText  .flags[]  .derived  .comment
```

### Rules

1. Omit anything you cannot read with confidence. A missing value is correct; an invented
   one is not.
2. Record your best reading where a value is partly legible and list its path in
   `uncertain`, as `specimens[2].results[7].value`.
3. **An empty cell means the analyte was not performed on that specimen.** Omit the result
   entirely. Never write `null`, never carry the previous column forward, never interpolate
   a trend. A gap in a cumulative report is information.
4. **Row alignment is the danger.** On a photographed cumulative report the value grid can
   sit a full row out of register with the labels, because the paper curves and shifts the
   right of the sheet against the left. Before recording a column, check it three ways:
   - each value is plausible against the reference range printed on its own row;
   - every `L` flag sits below `refLow` and every `H` above `refHigh`;
   - the derived analytes reconcile — `nonHdlCholesterol = cholesterol − hdl`,
     `cholHdlRatio = cholesterol ÷ hdl`, `globulin = totalProtein − albumin`,
     `anionGap = sodium − (chloride + bicarbonate)`.

   If any check fails, the column is misaligned: re-seat the whole column against the
   labels and read it again. Do not fix one analyte and leave its neighbours. Use the
   checks to *detect* a shift — never to *compute* a value you could not read.
5. **Do not recalculate derived results.** `anionGap`, `calciumAdjusted`, `globulin`,
   `nonHdlCholesterol`, `cholHdlRatio` and `egfr` are printed by the laboratory. Transcribe
   what is printed even where your own arithmetic disagrees, mark `derived: true`, and list
   the path in `uncertain` — a discrepancy is a finding for the pathologist, not an error
   for you to correct.
6. **Flags** are the characters printed after the value, as a list: `["H"]`, `["L"]`,
   `["*H"]`, `["#","L"]`, `["#","H"]`. `#` alone is a delta check with a normal result and
   is still recorded. An unflagged value gets `"flags": []`. A red-tinted or boxed value is
   critically abnormal — expect `*H` or `*L` and check you have not missed the asterisk.
7. **Specimen prefixes.** `P-` plasma, `S-` serum, `B-` whole blood, `U-` urine. Keep the
   printed form in `label`, the letter in `specimenPrefix`, and map to the canonical
   `analyte` from the dictionary. `P-CREATININE` and `S-CREATININE` are both `creatinine`
   and must not be merged into one result — they are separate measurements.
8. **Panels** come from the analyte dictionary in `pathcare-lab-schema.json`, never from
   where a row happens to sit. A report prints in laboratory order, not panel order, and
   the `Biochemistry` heading spans several panels at once. Use the canonical keys: `fbc`,
   `ue`, `lft`, `bone`, `lipogram`, `inflammatory`, `cardiac`, `coagulation`, `glycaemic`,
   `thyroid`, `bloodGas`, `ironStudies`, `preAnalytical`. An analyte you cannot place goes
   in with `"panel": null` rather than a guessed one.
9. **Reference ranges**: split the combined cell into `refLow`, `refHigh` and `unit`.
   `136-145 mmol/L` → 136, 145, `mmol/L`. One-sided ranges (`< 5.0 mmol/L`, `> 1.0 mmol/L`,
   `>=60`) fill the bound they state and repeat the whole thing verbatim in `refText`. A
   unit with no range (a derived value) fills `unit` only.
10. **Non-numeric results** — `ABSENT`, `NOT SPECIFIED`, `HAEMOLYSED`, `NOT DETECTED` — go
    in `text`, not `value`, exactly as printed.
11. **Datetimes** as `YYYY-MM-DDTHH:MM`, 24-hour. A cumulative column header carries the
    collection date on one line and the time beneath; combine them. Where a report gives
    collection, received, generated and authorised times, keep all four — they are
    different events.
12. **Identity numbers** are exactly 13 digits. The header may also carry an `Age:Sex:DoB`
    triplet: transcribe all three as printed and **do not derive any of them from the
    identity number**, nor reconcile them if they disagree. Record the disagreement by
    listing `patient.birthDate` in `uncertain`.
13. **Every page.** A cumulative report says `Page 1 of 4`; analytes continue on later
    pages with the same columns repeated. Merge them into one object, matching columns by
    collection datetime and requisition number, and set `report.pages`. If you were given
    fewer pages than the footer claims, record what you have and note the shortfall in
    `uncertain` as `report.pages`.
14. **One lab ref can produce several reports** — a biochemistry and a haematology sheet
    from the same draw, each with its own specimen number and authorising pathologist. Merge
    them into a single specimen entry keyed on the collection datetime, and keep the
    discipline on each report block.
15. Plain ASCII digits and a decimal point. No thousands separators, no units inside
    `value`, no trailing commas.
16. If the anchors in Part 1 do not match, return `{"uncertain":["report.layout"]}` and
    nothing else.

---

## After transcribing

- **Check the collection datetimes first.** They are the spine of the record. One column
  filed under the wrong draw puts a creatinine of 211 next to one of 128 in the wrong
  order, and the trend — rising or falling — is the clinical question.
- **Re-run the alignment checks** on any column where a flag and its reference range
  disagree. That is the signature of a shifted row, and it is invisible once the JSON is
  filed.
- Confirm the identity number and date of birth against the request form, not against each
  other.
- Where a single report covers the same specimen as a cumulative column, the two must
  agree analyte for analyte. They are the best check available and cost nothing.

Lab results are the one document class here that is machine-printed at source. If the
laboratory offers the same report as a data feed, use the feed — a transcription of a
photograph of a printout is three lossy steps from a number the analyser already knows.
This prompt is for when the paper on the ward is what you have.

Transcription is a draft, and a wrong potassium reads exactly like a right one. Keep the
photograph with the record.

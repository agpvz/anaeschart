# Blaine and Associates consent form → JSON

A photograph of the **Consent to Anaesthesia and Professional Fees** page, recognised and
transcribed into the shape in `blaine-consent-schema.json`.

Unlike the SASA record, almost all of this page is fixed pre-printed clause text. Only
nine values are ever written on it: the two initial boxes and the seven-slot block at the
foot. Transcribing the clauses is pointless — recognising *which* form this is, confirming
the initials and signature are present, and lifting the seven values is the whole job.

The clause wording is Blaine and Associates' copyright (2019). Recognise it, don't
reproduce it.

---

## Part 1 — Recognising the form

A page is this form when the banner matches **and** at least two other anchors do. Check
in this order, cheapest first:

1. **Blue title banner**, full page width, white capitals:
   `CONSENT TO ANAESTHESIA AND PROFESSIONAL FEES`. This alone is near-conclusive.
2. **Subtitle**, centred, parenthesised:
   `(PLEASE READ CAREFULLY AND SIGN OR INITIAL WHERE INDICATED)`.
3. **Footer**, bottom right: `Copyright Blaine and Associates 2019`.
4. **Twelve numbered clauses**, each opening with an underlined lead-in and a colon, in
   this order: Consent · Unforeseen incidents · Risks and side effects · Blood transfusion ·
   Personal information · Professional Fees · PLEASE NOTE · Procedure Codes · Estimation of
   Fees · Account Settlement · GAP cover · Complaints.
5. **Two pale blue initial boxes** in the right margin, each reading `Initial here please`,
   alongside clause 3 and clause 7 — and nowhere else.
6. **Contact strings**: `021 840-7006`, `info@blaineassoc.co.za`,
   `www.blaineandassociates.co.za`, `complaints@medicalschemes.co.za`, `012-431-0500`.
7. **Bottom block**: two columns by two rows — Full Name of Patient · Name of
   Parent/Guardian (for minors) · Signature (with an inset Date) · Procedure, Date, Surgeon.

Distinguishing it from things it is *not*:

- A **SASA form** (`case-extraction-prompt.md`) is landscape, green-ruled, bilingual
  Afrikaans/English, and carries Sections A–D. This form is portrait, blue, English only.
- The **INFORMATION FOR PATIENTS** page is the companion sheet cited in clause 3. It has no
  blue banner, no numbered fee clauses, and no signature block. It carries no fields —
  return `{}` for it.
- Another practice's consent form will fail the footer, the contact strings and the
  clause-label sequence even where the banner wording is similar. Do not treat a partial
  match as this form; report it as unrecognised.

If the version footer reads a year other than 2019, transcribe as normal but set
`consent.formRevision` to what the footer actually says and list it in `uncertain` — the
clause numbering may have shifted, so the initial-box clause references cannot be trusted.

---

## Part 2 — Transcribing it

Paste the block below into a vision-capable LLM and attach the photograph.

---

You are transcribing a completed **Blaine and Associates "Consent to Anaesthesia and
Professional Fees"** form from a photograph. Transcribe only. Do not interpret, summarise,
expand abbreviations, or infer anything not written on the page.

Do not reproduce, quote or summarise the pre-printed clause text. It is fixed and
copyrighted. Only the handwritten or typed entries are transcribed.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

### Structure

```
{
  "consent": {
    "formId": "blaine-consent-v2019",
    "formRevision": "2019",
    "patientName":     "…",
    "guardianName":    "…",
    "signed":          true,
    "signatureDate":   "YYYY-MM-DD",
    "procedure":       "…",
    "procedureDate":   "YYYY-MM-DD",
    "surgeon":         "…",
    "initials": { "risksAndSideEffects": "…", "pleaseNote": "…" }
  },
  "uncertain": [ "dotted.path", … ]
}
```

### Paths

```
consent.formId          always "blaine-consent-v2019" when the anchors match
consent.formRevision    the year in the footer, as printed
consent.patientName     "Full Name of Patient" box, exactly as written
consent.guardianName    "Name of Parent/Guardian (for minors)" box; omit if blank
consent.signed          true if any signature mark is present in the Signature box
consent.signatureDate   the Date inset inside the Signature box
consent.procedure       "Procedure" line, bottom right block
consent.procedureDate   "Date" line, bottom right block
consent.surgeon         "Surgeon" line, bottom right block
consent.initials.risksAndSideEffects   the initial box beside clause 3
consent.initials.pleaseNote            the initial box beside clause 7
```

### Rules

1. Omit anything you cannot read with confidence. A missing value is correct; an invented
   one is not.
2. Record your best reading where a value is partly legible and list its dotted path in
   `uncertain`.
3. **Never transcribe a signature as text.** `consent.signed` is `true` when a mark is
   present in the Signature box and omitted when the box is empty. Do not write `false`,
   and do not read a name out of the signature — the patient's name comes from the
   "Full Name of Patient" box only.
4. Initial boxes are the exception: initials *are* transcribed, as the letters written,
   uppercased, spaces and full stops removed — `A.G.P.` becomes `AGP`. If a box holds a
   scrawl you cannot resolve into letters, record `"✓"` and list the path in `uncertain`.
   If the box is empty, omit the path — an un-initialled clause is a real finding and must
   not be papered over with a tick.
5. Dates `YYYY-MM-DD`. A South African date written `04/03/26` is 4 March 2026.
6. Transcribe the procedure and surgeon exactly, including abbreviations and titles. Do
   not expand `Dr`, `ERCP`, `EUA` or anything else. Do not correct spelling.
7. The two Date fields are independent — the signature date and the procedure date are
   often different. Never copy one into the other, and never fill an empty one from the
   other.
8. `guardianName` is completed only for minors. Blank is the normal case; omit it.
9. If the page is this form but wholly unfilled, return
   `{"consent":{"formId":"blaine-consent-v2019"}}` — that is a blank template, not a case.
10. If the anchors in Part 1 do not match, return
    `{"uncertain":["consent.formId"]}` and nothing else. Do not guess at a form you cannot
    identify.

---

## After transcribing

The seven filled values are the record; the two initials are the compliance check. Before
filing:

- Confirm both initial boxes are present. Clause 3 (risks and side effects) and clause 7
  (fees above the HPCSA base tariff) are the two the form singles out for a separate
  acknowledgement, and a missing initial is exactly what a later fee dispute turns on.
- Confirm the signature box carries a signature and its own date.
- Check the procedure and surgeon against the operating list, not against memory.
- Where the patient is a minor, confirm the guardian block is completed.

`consent.patientName`, `consent.procedure`, `consent.procedureDate` and `consent.surgeon`
map onto `patient`/`case` paths on the SASA form — see `crosswalk` in
`blaine-consent-schema.json` — so a consent photo can seed the case before the record
itself is transcribed.

Transcription is a draft. Keep the source photograph with the case.

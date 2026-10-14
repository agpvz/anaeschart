# Blaine and Associates consent — display specification for an implementing agent

This is the companion to `docs/chart-display-spec.md`. It describes how `index.html` renders
the **Blaine and Associates "Consent to Anaesthesia and Professional Fees"** sheet so that
another application can reproduce it: page, banner, clause list, initial boxes, signature block
and the data behind them. Every value quoted is the one the code uses.

`docs/consent-reference.png` is a render of the sheet with sample data. Compare against it.

**Copyright.** The clause wording is Blaine and Associates' (2019). It is not the software's to
restyle or paraphrase, and it was transcribed from a photograph: the sheet carries a bold caveat
in its footnote until `CLAUSES_VERIFIED` is set to `true` after checking against the practice's
master copy. Carry the same caveat until your copy has been verified.

---

## 1. Page and palette

- **A4 portrait** (210 × 297 mm), single page, `@page { size: A4 portrait; margin: 0 }`. The page
  padding is `11mm 10mm 8mm` (top, sides, bottom). The sheet is a vertical flex column so the
  signature block is pushed to the foot of the page with `margin-top: auto`.
- The consent uses a **different typeface and colour scheme** from the green SASA record. Text is
  black `#000`, in **Calibri** (fallbacks Carlito, Segoe UI, Arial). Nothing green appears.

| token | value | used for |
|---|---|---|
| `--b` | `#4472c4` | title banner fill |
| `--bd` | `#2f5597` | banner's 3 mm left edge |
| `--bl` | `#d9e2f3` | tint behind the initial boxes and the signature-block boxes |
| box border | `#9bb0d4`, 0.2 mm | around initial boxes and signature boxes |
| field rule | `#6b83ad`, 0.2 mm | underline beneath each text field |
| date inset | `#c9d6ea` | darker tint behind the signature date |
| placeholder | `#4a5f80` | "Initial here please" |
| link | `#00f` | the website link in clause 9 |
| entered data | `--ink` `#12356b` | everything the patient types |

Only one form is on screen at a time: `body[data-form="blaine"]` hides the SASA sheets, and the
page size follows the form in view. Both forms share one JSON document.

---

## 2. Elements, top to bottom

1. **Banner.** `CONSENT TO ANAESTHESIA AND PROFESSIONAL FEES` in white capitals, 15 pt bold,
   letter-spacing 0.2 pt, on a solid `#4472c4` bar the full page width, padding `1.6mm 3mm`, with
   a 3 mm solid `#2f5597` left border.
2. **Subtitle.** `(PLEASE READ CAREFULLY AND SIGN OR INITIAL WHERE INDICATED)` centred, 9.5 pt
   bold, margin `3mm 0 2.5mm`.
3. **Clauses.** An ordered list numbered **1 to 12**, 8.1 pt, line-height 1.22, **fully
   justified**, 6 mm left padding for the numbers, 1.1 mm gap between items. Each clause opens
   with an **underlined lead-in label** followed by a colon, then the body in plain text.
   The lead-ins, in order:

   | # | lead-in | initial box |
   |---|---|---|
   | 1 | Consent | |
   | 2 | Unforeseen incidents | |
   | 3 | Risks and side effects | **yes** → `consent.initials.risksAndSideEffects` |
   | 4 | Blood transfusion | |
   | 5 | Personal information | |
   | 6 | Professional Fees | |
   | 7 | PLEASE NOTE | **yes** → `consent.initials.pleaseNote` |
   | 8 | Procedure Codes | |
   | 9 | Estimation of Fees | |
   | 10 | Account Settlement | |
   | 11 | GAP cover | |
   | 12 | Complaints | |

   Inline styling inside the bodies is limited to: bold for **"INFORMATION FOR PATIENTS"** in
   clause 3 (with typographic quotes), and a blue hyperlink on `www.blaineandassociates.co.za`
   in clause 9. The exact wording lives in the `CLAUSES` array in `index.html`; copy it verbatim,
   including its own redundancies.

4. **Initial boxes.** Clauses 3 and 7 each carry a box **floated right**, 26 × 12 mm, tint
   `#d9e2f3`, 0.2 mm `#9bb0d4` border, margin `0 0 1mm 3mm`, so the clause text wraps around its
   left side. The entry is centred, 11 pt bold, **forced upper-case**, maximum 8 characters;
   the placeholder reads `Initial here please` in 5.4 pt regular. The value is stored as text.
5. **Signature block.** A 2 × 2 grid with 2.5 mm gaps, pinned to the page foot:

   | position | contents |
   |---|---|
   | top-left | `Full Name of Patient:` → `consent.patientName` |
   | top-right | `Name of Parent/Guardian (for minors):` → `consent.guardianName` |
   | bottom-left | `Signature:` label; a small checkbox labelled `signed` → `consent.signed` (boolean); and a **`Date:` inset** → `consent.signatureDate` (ISO date), right-aligned, 52 % of the box width, darker tint `#c9d6ea`, pushed to the bottom of a box at least 26 mm tall |
   | bottom-right | three stacked fields: `Procedure:` → `consent.procedure`, `Date:` → `consent.procedureDate` (ISO date), `Surgeon:` → `consent.surgeon` |

   Each box has the `#d9e2f3` tint, 0.2 mm `#9bb0d4` border and `1.6mm 2mm` padding, 8.5 pt.
   Labels are regular weight, black, non-wrapping, on the same baseline as the field; the field
   is a transparent input with a 0.2 mm `#6b83ad` bottom rule and ink-blue text.
   The signature itself is not captured as an image; a tick in `signed` records that the paper
   was signed. Do not invent a drawn signature.
6. **Footer.** `Copyright Blaine and Associates 2019`, right-aligned, 7.5 pt.
7. **Footnote.** 6.6 pt grey `#555`: the clause-verification caveat (bold while unverified),
   then `Software © 2026 Remparts Solutions (Pty) Ltd.`

---

## 3. Data contract

```json
"consent": {
  "patientName": "Maria Elizabeth Botha",
  "guardianName": "",
  "signed": true,
  "signatureDate": "2026-08-11",
  "procedure": "Laparoscopic cholecystectomy",
  "procedureDate": "2026-08-11",
  "surgeon": "Dr N Ndlovu",
  "initials": { "risksAndSideEffects": "MEB", "pleaseNote": "MEB" }
}
```

- Types: `signed` boolean; the two dates `YYYY-MM-DD`; everything else text. Empty fields are
  omitted on export; on import, keys not present are cleared.
- `docs/blaine-consent-schema.json` is the field map and `docs/blaine-consent-prompt.md` the
  transcription prompt. `docs/extraction.schema.json` validates a reply.
- **Form switching on import:** a payload whose only top-level key (ignoring `_meta` and
  `uncertain`) is `consent` switches the view to the consent sheet automatically. A payload with
  both SASA and consent fields fills both and leaves the current sheet showing.
- When the consent is present, export adds `_meta.consentContent = "© Blaine and Associates 2019"`
  and `_meta.active` records which sheet was in view, so a saved file reopens on that sheet.
- Saved files are named `blaine-consent-<patientName>-<procedureDate or signatureDate>`,
  lower-cased, non-word characters collapsed to hyphens.
- **Crosswalk** to the SASA record, so one consent photo can seed the case: `patientName` →
  `patient.surname` / `patient.firstNames` / `account.surname`; `procedure` → `case.procedure`;
  `procedureDate` → `case.date` / `record.date`; `surgeon` → `case.surgeon`;
  `signatureDate` → `agreement.dateEn` / `agreement.dateAf`.

---

## 4. Print

- A4 portrait, margin 0, scale 100 %, **background graphics on** (the banner and tints are
  backgrounds). The toolbar is hidden; focus highlights are removed.
- Only the consent sheet reaches the printer while it is in view; the SASA sheets print as a
  separate two-page landscape job when they are in view.

---

## 5. Checklist for the implementing agent

- [ ] A4 portrait, one page, Calibri, black text; blue banner `#4472c4` with `#2f5597` left edge,
      white capitals.
- [ ] Twelve numbered clauses, justified, each with an underlined lead-in and a colon; the
      wording verbatim from the practice's master copy, with a visible caveat until verified.
- [ ] Right-floated 26 × 12 mm initial boxes on clauses **3** and **7** only, upper-case,
      max 8 characters, placeholder `Initial here please`.
- [ ] 2 × 2 signature grid at the page foot: patient name, guardian name, signature box with
      `signed` tick and inset date, procedure / date / surgeon.
- [ ] Dates stored ISO, `signed` boolean, initials text; empty fields omitted.
- [ ] Footer `Copyright Blaine and Associates 2019`; software notice in the footnote.
- [ ] A consent-only import opens the consent sheet; the crosswalk feeds the SASA record.

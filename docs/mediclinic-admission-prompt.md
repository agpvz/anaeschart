# Mediclinic admission summary → JSON

A photograph of the hospital's system-printed admission sheet, recognised and transcribed
into the shape in `mediclinic-admission-schema.json`.

This is the easiest of the three forms to read and the easiest to get quietly wrong. It is
machine-printed, so legibility is rarely the problem. The problem is that it carries
**three different people** — the patient, the medical-aid main member, and the signatory —
and **two employers**, one belonging to the member and one to the patient. They are
routinely different individuals living at the same address, and a flattened extraction
will attach the member's identity number, employer and email to the patient without
anything looking wrong.

Every value on this page is personal information. Transcribe it into the case record it
belongs to and nowhere else.

---

## Part 1 — Recognising the form

A page is a Mediclinic admission summary when the wordmark matches **and** at least two
other anchors do:

1. **MEDICLINIC wordmark** in blue with the square glyph, at the head of the page, above a
   facility line reading `Mediclinic <site>` with a street address, PO Box, Tel and Fax.
2. **Dot-leader labels** — `Med.Aid....:`, `ID#....:`, `Age....:`, `Fin.Cls...:` — monospace
   labels padded with full stops before the colon. This is the strongest structural
   signature and survives a bad photograph better than the logo does.
3. **Audit line**: `Admit...:` and `Printed:`, each with a `YYYY/MM/DD HH:MM` timestamp and
   a `By:` operator username.
4. **Code table** headed `T.c ID Code Mod Description`, mixing ICD and CPT rows.
5. **Admission information** block with right-aligned `YES/NO` pairs — UCR Consent, Data
   Privacy, Co-Payments, Exclusions, Survey Consent, Prosthesis Limit Explained.
6. **Footer**: `FINAL DIAGNOSIS`, `PROCEDURE`, `SIGNATURE DOCTOR`, `DATE` on ruled lines.
7. **Form code** `D 2700` in a small box at the outer edge.
8. A **barcode sticker** at the head carrying case number, date, bed, age, patient name,
   admitting doctor, date of birth, identity number and scheme.

Orientation: the sheet is portrait but is very often photographed on its side, with the
wordmark running up the left edge. Rotate until the wordmark is horizontal at the top
before reading anything — a sideways read of the two-column layout interleaves the blocks.

Distinguishing it from things it is *not*:

- The **Blaine and Associates consent** (`blaine-consent-prompt.md`) is a blue-bannered
  page of twelve numbered clauses with two initial boxes. No dot-leader labels, no barcode.
- The **SASA record** (`case-extraction-prompt.md`) is landscape, green-ruled and bilingual.
- Another hospital group's admission sheet will carry its own wordmark and form code and
  will usually not use dot leaders. Report it as unrecognised rather than forcing this map.
- A **hospital sticker alone** — the barcode block peeled onto another form — is not this
  form. Transcribe the sticker fields only and set `admission.stickerOnly` to `true`.

---

## Part 2 — Transcribing it

Paste the block below into a vision-capable LLM and attach the photograph.

---

You are transcribing a **Mediclinic admission summary** from a photograph. Transcribe only.
Do not interpret, diagnose, summarise, expand abbreviations, correct, or infer anything not
printed on the page.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

### Structure

```
{
  "admission": {…}, "patient": {…}, "member":  {…}, "medicalAid": {…},
  "signatory": {…}, "patientEmployer": {…},
  "nextOfKin": [ … ], "codes": [ … ], "diagnosis": {…}, "consents": {…},
  "footer": {…},
  "uncertain": [ "dotted.path", … ]
}
```

### Paths

```
admission.formCode  .facility  .facilityAddress  .facilityPostal  .facilityTel
  .facilityFax  .vatNo  .regNo  .practiceNo  .ref  .caseNo  .bed  .bedWard
  .patientType  .finClass  .hsc  .stickerOnly
  .admittedAt (YYYY-MM-DDTHH:MM)  .admittedBy  .printedAt  .printedBy

patient.title  .surname  .firstNames  .initials  .idNo (13 digits)  .birthDate
  .sex ("Male"|"Female")  .ageText  .ageYears (number)  .address1  .address2
  .address3  .postalCode  .tel  .email  .religion
  .referDoc  .familyDoc  .admitDoc  .admitDocPracticeNo

member.title  .surname  .initials  .idNo  .address1  .address2  .address3
  .postalCode  .telHome  .telWork  .celWork  .email
  .employerOccupation  .employerName  .employerAddress1  .employerAddress2

medicalAid.scheme  .plan  .number  .preAuthNo  .dependantCode

signatory.name  .idNo  .address1  .address2  .address3  .postalCode
  .telHome  .email  .isPatient (boolean)

patientEmployer.occupation  .name  .address  .telWork

nextOfKin[n].name  .relationship  .tel
codes[n].seq  .flag  .type ("ICD"|"CPT")  .code  .modifier  .description
diagnosis.description  .finalDiagnosis  .procedure
consents.ucr  .dataPrivacy  .coPayments  .exclusions  .survey
  .prosthesisLimitExplained  .smsEmail       ("yes"|"no")
consents.belongings (1|2)
footer.doctorSigned (boolean)  .date
```

### Rules

1. Omit anything you cannot read with confidence. A missing value is correct; an invented
   one is not.
2. Record your best reading where a value is partly legible and list its dotted path in
   `uncertain`.
3. **Keep the people separate.** `patient`, `member`, `signatory` and the two employer
   blocks are filled strictly from their own headed sections. Never carry a value from one
   into another, even when the names, addresses or telephone numbers match. If the
   signatory block repeats the patient's details, still fill both, and set
   `signatory.isPatient` to `true`.
4. `member` is the medical-aid main member — often a spouse or parent, not the patient.
   `member.employer*` comes from **Member Employer Information**; `patientEmployer` comes
   from **Patient Employer Information**. These two blocks are easily transposed; check the
   heading above each before recording it.
5. Identity numbers are exactly 13 digits, no spaces or dashes. If a number does not read
   as 13 digits, omit it and list its path in `uncertain`.
6. A South African identity number encodes date of birth and sex. **Do not derive either
   from it, and do not correct one against the other.** Transcribe what is printed. If the
   printed date of birth and the identity number disagree, record both and list
   `patient.birthDate` in `uncertain`.
7. Dates are printed `YYYY/MM/DD`; emit `YYYY-MM-DD`. Timestamps emit as
   `YYYY-MM-DDTHH:MM`. Times are 24-hour.
8. `ageText` is copied exactly as printed, e.g. `56y10m`. `ageYears` is the whole-year part
   of that same string — not a calculation from the birth date.
9. Telephone numbers are transcribed as printed, digits and spaces preserved as shown. Do
   not normalise, do not add a country code, do not drop a leading zero. Where the same
   person's number differs between two blocks, record each in its own block and list both
   paths in `uncertain` — the discrepancy is the finding.
10. In the code table, each row carries a sequence and flag (`1.Y`, `9.Y`), a type, the code
    and its description. Record `type` as `ICD` or `CPT` from the printed column. Keep codes
    as strings with any leading zero. Copy the description exactly, including truncations —
    if the printed text is cut off mid-word, transcribe it cut off. Do not complete it.
11. `diagnosis.description` is the free-text line above the code table, including any
    quoted note such as a post-operative destination. Transcribe the quotation marks.
12. Consent items are `"yes"` or `"no"` only when one of the printed pair is circled,
    struck or ticked. If neither is marked, **omit the item**. Do not read an unmarked
    `YES/NO` as `"no"` — unmarked means unanswered, and an unanswered consent is a real
    finding that must reach the reviewer.
13. `consents.belongings` is `1` or `2` from the hand-circled option beneath the belongings
    paragraph. Omit if neither is circled.
14. **Never transcribe a signature as text.** `footer.doctorSigned` is `true` when a mark is
    present on the SIGNATURE DOCTOR line and omitted when the line is blank.
15. Do not transcribe the pre-printed declaration and indemnity paragraphs. They are fixed
    wording, identical on every copy, and carry no case data.
16. `admission.admittedBy` and `.printedBy` are operator usernames as printed. Do not
     expand them into names.
17. Plain ASCII digits, no thousands separators, no units inside values, no trailing commas.
18. If the anchors in Part 1 do not match, return `{"uncertain":["admission.formCode"]}` and
    nothing else.

---

## After transcribing

- **Check the three identities first.** Confirm `patient.idNo` belongs to the patient and
  not the main member, and that `patientEmployer` and `member.employer*` did not swap. This
  is the failure mode of this form; everything else is legible enough to spot by eye.
- Read `medicalAid.number`, `medicalAid.preAuthNo` and `medicalAid.dependantCode` back
  against the sheet. A wrong pre-authorisation number surfaces weeks later as a rejected
  claim, and a wrong dependant code pays the wrong beneficiary.
- Confirm every consent recorded as `"no"` really was marked no rather than left blank, and
  raise any consent omitted for being unmarked.
- Work through `uncertain` before the record is filed.

The crosswalk in `mediclinic-admission-schema.json` maps most of this page onto the SASA
form's `patient`, `account` and `case` paths, so an admission photo can seed a case before
the anaesthetic record is written. Read its `crosswalkCaveats` first: the SASA `account`
block is the person responsible for the account, which on this page is the **member**, and
the CPT procedure codes here are the hospital's, not the anaesthetic billing codes.

**This page is almost entirely personal information.** Keep the transcription with the case,
not in a shared or version-controlled location, and keep the source photograph with it.

Transcription is a draft. Read every identifier back against the source before the record is
signed.

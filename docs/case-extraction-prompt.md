# Whole case, multiple photos → one JSON

Photograph everything you have — hospital sticker, medical aid card, the patient's
completed Section D, the pre-op sheet, the anaesthetic record, the monitor trend
screen — attach them all in one message with the prompt below, and paste the reply
into the form's panel. Auto-apply puts the whole case in at once.

The reply carries both halves: the form fields as a nested object, and the vitals as an
`observations` array. The importer applies the fields first (so `chart.startTime` and
`chart.interval` are in place) and then places the rows against that grid.

`docs/schema.json` is the machine-generated field list this prompt is built from. If
the form gains a field, regenerate it — `JSON.stringify(SASA.schema(), null, 2)` —
rather than editing the prompt by hand.

---

You are transcribing a completed anaesthesia case from several photographs of the same
patient's paperwork and monitor. Transcribe only. Do not interpret, diagnose,
summarise, expand abbreviations, average, smooth, or fill gaps.

The photographs are different parts of one case. Combine them into a single JSON
object. Where two photographs show the same field, use the clearer one; if they
disagree, use neither and list that path in `uncertain`.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

## Structure

```
{
  "patient":    {…},   "account":  {…},   "agreement": {…},
  "case":       {…},   "codes":    {…},   "units":     {…},
  "record":     {…},   "technique":{…},   "ivLine1":   {…},  "ivLine2": {…},
  "monitor":    {…},   "cpb":      {…},   "axc":       {…},
  "chart":      {…},   "agents":   [ … ], "infusions": [ … ],
  "pacu":       {…},   "history":  {…},
  "observations": [ … ],
  "uncertain":  [ "dotted.path", … ]
}
```

## Paths

```
patient.surname  .firstNames  .birthDate (YYYY-MM-DD)

account.medFund  .option  .number  .authorizationNo  .gapCover  .surname  .title
  .initials  .idNo (13 digits, no spaces)  .postalAddress1  .postalAddress2
  .postalCode  .resAddress1  .resAddress2  .cell  .telHome  .telWork  .fax  .email
  .employer  .employerAddress  .familyFriend  .familyFriendTel  .costEstimate

agreement.dateAf  .dateEn                    (signatures are never transcribed)

case.hospital  .date  .surgeon  .procedure  .code  .icd10
  .timeFrom (HH:MM)  .timeTo (HH:MM)  .timeMin (number)  .asa
codes.<code>  → true          e.g. {"codes":{"0039":true,"1204":true}}
units.<code>  → minutes       e.g. {"units":{"0039":"145"}}

record.date  .age  .asa  .weightKg (number)  .heightCm (number)  .fasting  .teeth
  .mouthOpening  .neckExtension  .airwayNotes  .cvs  .resp  .other  .position
  .events  .input  .output  .startTime (HH:MM)  .endTime (HH:MM)  .anaesthetist

technique.sedation  .regional  .general  .preOxygenation  .ett  .ettSize  .dlt
  .dltSide ("R"|"L")  .dltSize  .intubationGrade  .nonTraumatic  .airEntry  .rsi
  .faceMask  .lma  .lmaSize  .circleCircuit  .bainCircuit  .spontaneous
  .mechanicalVentilation  .tidalVolume  .rate  .eyesTaped  .pressurePoints
  .warmer  .calfCompressors

ivLine1.size  .site        ivLine2.size  .site

monitor.ecg  .bp  .sao2  .cvpLine  .cvpSize  .cvpSite  .artLine  .artSize  .artSite
  .nerveStimulator  .temperature  .toe  .machineCheck  .other  .otherLabel
cpb.on  cpb.off  axc.on  axc.off

chart.startTime (HH:MM)  chart.interval ("5"|"15")
chart.gasMix.oxygen  .nitrous  .air

agents[n].agent   .unit ("g"|"mg"|"mcg")   .dose[]     ← doses by column, "" where none
infusions[n].name  .dose[]                              ← rates by column

pacu.hr  .bp  .rr  .sao2  .fio2

history.<item>.yn ("yes"|"no")   history.<item>.details
history.weightKg (number)  .heightM (number)  .lastIntake (HH:MM)
```

`history.<item>` is one of: `previousAnaesthetics previousProblems familyProblems
porphyria allergy medications cortisone hypertension heartDisease thrombosis exercise
asthma recentCold snoring diabetesThyroid jaundice kidney muscleWeakness bleeding
epilepsy pregnant teeth alcohol smoking reflux anythingElse`

## observations

One object per timestamped column on the chart or monitor trend, ascending:

```
{"time":"HH:MM", "hr":n, "bp":"SYS/DIA", "spo2":n, "etco2":n,
 "temp":n, "cvp":n, "urine":n, "bloodloss":n, "uncertain":["key"]}
```

Set `chart.startTime` to the first observation time and `chart.interval` to the
spacing between columns — `"5"` or `"15"`. The grid holds 30 columns, so 5-minute
columns cover 2h25 and 15-minute columns cover 7h15. Choose the interval that fits the
case; observations outside the grid are rejected on import.

## Rules

1. Omit anything you cannot read with confidence. A missing value is correct; an
   invented one is not. Never interpolate between readings or carry a value forward.
2. Record your best reading where a value is partly legible, and list its dotted path
   in the top-level `uncertain` array. Inside `observations`, use the row's own
   `uncertain` key instead.
3. Ticked box, circled word or crossed box → `true`. An empty box → omit the path. Do
   not write `false`: an unticked box usually means unanswered, not answered no.
4. Section D has YES and NO circles per row. Record `"yes"` or `"no"` only for the one
   marked. If neither is marked, omit that item and its details.
5. Transcribe handwriting exactly, including abbreviations, drug names and doses. Do
   not expand `GA`, `RSI`, `SVT` or any other abbreviation. Do not correct spelling.
6. Dates `YYYY-MM-DD`, times 24-hour `HH:MM`. A South African date written `04/03/74`
   is 4 March 1974.
7. A South African ID number is exactly 13 digits, no spaces or dashes. If it does not
   read as 13 digits, omit it and list `account.idNo` in `uncertain`.
8. Weights and heights as plain numbers, no units. `record.heightCm` in centimetres,
   `history.heightM` in metres.
9. Billing codes keep their leading zero and are keys, not an array.
10. Blood pressure exactly as displayed. If only a mean is shown, omit `bp` — do not
    back-calculate systolic and diastolic.
11. Temperature in °C; convert from °F to one decimal if needed.
12. Never transcribe a signature as text.
13. Plain ASCII digits and a decimal point, no commas, no units inside values, no
    trailing commas.
14. If a photograph shows a part of the form you have already transcribed from another
    photograph, do not duplicate it — one object, one value per path.
15. If nothing can be read, return `{}`.

---

## After importing

The panel reports what landed — `148 field(s) populated · 29 row(s) charted`. Then:

- Read the identifiers back against the photographs. A wrong heart rate looks wrong on
  the chart immediately; a wrong ID or medical aid number surfaces weeks later as a
  rejected claim.
- Work through the `uncertain` list before anything else.
- Check `skipped` is empty. Rows outside the grid mean the start time or interval is
  wrong for this case.
- Confirm every Section D `"no"` really was marked no rather than left blank.

The transcription is a draft. Keep the source photographs with the case.

# Form photo → JSON prompt

For everything outside the vitals grid: the hospital sticker, the medical aid card, the
completed Section D history, the pre-op sheet, the technique column of a paper record.

Paste the block below into a vision-capable LLM, attach the photo(s), paste the reply
into the form's panel, press **Import**. The reply is merged into the form, so several
photos can be imported one after another without clearing what came before.

The vitals grid has its own prompt — see `vitals-photo-extraction-prompt.md`. The two
imports coexist.

---

You are transcribing a completed anaesthesia form from photographs. Transcribe only.
Do not interpret, diagnose, summarise, expand abbreviations, or infer anything that is
not written on the page.

Return one JSON object and nothing else. No prose, no markdown fences, no explanation.

Use only the paths below, nested exactly as shown. Omit any path you cannot read — a
missing field is correct, an invented one is not. Include a top-level `"uncertain"`
array listing the paths you recorded but could not read confidently.

```
patient.surname            patient.firstNames         patient.birthDate  (YYYY-MM-DD)

account.medFund            account.option             account.number
account.authorizationNo    account.gapCover           account.surname
account.title              account.initials           account.idNo  (13 digits, no spaces)
account.postalAddress1     account.postalAddress2     account.postalCode
account.resAddress1        account.resAddress2        account.cell
account.telHome            account.telWork            account.fax
account.email              account.employer           account.employerAddress
account.familyFriend       account.familyFriendTel    account.costEstimate

case.hospital              case.date  (YYYY-MM-DD)    case.surgeon
case.procedure             case.code                  case.icd10
case.timeFrom  (HH:MM)     case.timeTo  (HH:MM)       case.timeMin  (number)
case.asa                                              codes.<code>  (true)

record.date                record.age                 record.asa
record.weightKg  (number)  record.heightCm  (number)  record.fasting
record.teeth               record.mouthOpening        record.neckExtension
record.cvs                 record.resp                record.other
record.position            record.events              record.input
record.output              record.startTime  (HH:MM)  record.endTime  (HH:MM)
record.anaesthetist

technique.sedation         technique.regional         technique.general
technique.preOxygenation   technique.ett              technique.ettSize
technique.dlt              technique.dltSide  ("R"|"L")  technique.dltSize
technique.intubationGrade  technique.nonTraumatic     technique.airEntry
technique.rsi              technique.faceMask         technique.lma
technique.lmaSize          technique.circleCircuit    technique.bainCircuit
technique.spontaneous      technique.mechanicalVentilation
technique.tidalVolume      technique.rate             technique.eyesTaped
technique.pressurePoints   technique.warmer           technique.calfCompressors

ivLine1.size   ivLine1.site        ivLine2.size   ivLine2.site

monitor.ecg                monitor.bp                 monitor.sao2
monitor.cvpLine            monitor.cvpSize            monitor.cvpSite
monitor.artLine            monitor.artSize            monitor.artSite
monitor.nerveStimulator    monitor.temperature        monitor.toe
monitor.machineCheck       monitor.other              monitor.otherLabel
cpb.on   cpb.off   axc.on   axc.off

agents[n].agent            agents[n].unit  ("g"|"mg"|"mcg")
infusions[n].name

pacu.hr   pacu.bp   pacu.rr   pacu.sao2   pacu.fio2

chart.gasMix.oxygen        chart.gasMix.nitrous       chart.gasMix.air

history.<item>.yn  ("yes"|"no")     history.<item>.details
history.weightKg  (number)   history.heightM  (number)   history.lastIntake  (HH:MM)
```

`history.<item>` is one of:

```
previousAnaesthetics  previousProblems  familyProblems  porphyria  allergy
medications  cortisone  hypertension  heartDisease  thrombosis  exercise
asthma  recentCold  snoring  diabetesThyroid  jaundice  kidney  muscleWeakness
bleeding  epilepsy  pregnant  teeth  alcohol  smoking  reflux  anythingElse
```

Rules:

1. Ticked box, circled word, or crossed box → `true`. An empty box → omit the path
   entirely. Do not write `false`; an unticked box on paper usually means unanswered,
   not answered no.
2. Section D has a YES and a NO circle per row. Record `"yes"` or `"no"` only for the
   one that is marked. If neither is marked, omit that item — including its `details`.
3. Transcribe handwriting exactly as written, including abbreviations, drug names and
   dosages. Do not expand `GA`, `RSI`, `SVT`, or any other abbreviation. Do not correct
   apparent spelling.
4. Dates as `YYYY-MM-DD`, times as 24-hour `HH:MM`. A South African date written
   `04/03/74` is 4 March 1974.
5. A 13-digit South African ID number goes in `account.idNo` with no spaces or dashes.
   If the number is not exactly 13 digits as read, omit it and list it in `uncertain`.
6. Weights and heights as plain numbers with no unit. Height in centimetres for
   `record.heightCm`, metres for `history.heightM`.
7. Billing codes are keyed by the code itself: a ticked 0039 is `{"codes":{"0039":true}}`.
   Keep the leading zero.
8. Never transcribe a signature as text. Omit `agreement.signedAf`/`signedEn`.
9. If a photograph shows only part of the form, return only what it shows. Do not
   include paths for sections that are not in the image.
10. If nothing can be read, return `{}`.

Example of the expected output shape:

```
{
  "patient": {"surname":"Botha","firstNames":"Maria Elizabeth","birthDate":"1974-03-04"},
  "case": {"hospital":"Mediclinic Vergelegen","procedure":"Laparoscopic cholecystectomy",
           "surgeon":"Dr N Ndlovu","date":"2026-08-11","timeFrom":"07:15","timeTo":"09:40"},
  "record": {"age":"52","asa":"II","weightKg":78.4,"heightCm":164,"fasting":"NPO from 22:00"},
  "technique": {"general":true,"preOxygenation":true,"ett":true,"ettSize":"7.0","rsi":true},
  "monitor": {"ecg":true,"bp":true,"sao2":true,"temperature":true,"machineCheck":true},
  "history": {"hypertension":{"yn":"yes","details":"Amlodipine 5mg daily"},
              "asthma":{"yn":"no"},
              "allergy":{"yn":"yes","details":"Penicillin - rash"},
              "lastIntake":"22:00"},
  "uncertain": ["record.weightKg"]
}
```

---

## Notes

`docs/schema.json` is the machine-generated field list, dumped from the form itself. If
the form gains a field, regenerate it rather than editing this prompt by hand:

```js
// with jsdom, or in the browser console
JSON.stringify(SASA.schema(), null, 2)
```

Two paths are deliberately absent from the prompt: the per-column chart series
(`chart.hr[]`, `agents[n].dose[]` and the rest) belong to the vitals prompt, and the
signature fields are never transcribed.

**Demographic transcription carries the same risk as vitals transcription, with a
longer tail.** A misread ID number or medical aid number surfaces weeks later as a
rejected claim rather than immediately as a wrong-looking chart. Check the identifiers
against the source before the account goes out.

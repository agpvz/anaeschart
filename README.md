# sasaform

A single-file web version of the SASA anaesthesia form, with every field mapped to a
JSON path so a case can be populated from an API and read back the same way.

No build step, no dependencies, no framework. Open `index.html` in a browser.

## What's in it

Two A4 landscape sheets matching the printed form:

- **Sheet 1** — Section A (bilingual agreement), Section B (patient), Section C
  (person responsible for the account), and the billing block.
- **Sheet 2** — the anaesthesia record with an interactive vitals chart, and
  Section D (the 26-item history, yes/no plus details).

`@page` is set to A4 landscape, so printing gives a paper record that matches the
original layout.

## Two forms, one file

The toolbar's form picker switches between the **SASA anaesthesia form** and the
**Blaine and Associates consent to anaesthesia and professional fees**. Only the selected
form is on screen, only it reaches the printer, and the page size follows it — A4 landscape
for the record, A4 portrait for the consent.

Both share one JSON document, so `SASA.data()` returns whichever fields are filled and
`SASA.fill()` populates both. Importing a payload whose only content is a `consent` object
switches to the consent sheet by itself. `Save HTML` and `Save PDF` act on the form in
view, and a saved file reopens on the form it was saved from.

The consent clause wording lives in one array (`CLAUSES` in `index.html`) and was
transcribed from a photograph of the printed form. **Check it against the practice's master
copy before any clinical use**, and note that the clause text is Blaine and Associates'
copyright, not covered by either notice below.

## JSON API

Everything is exposed on `window.SASA`.

| call | does |
|---|---|
| `SASA.data()` | current state as a nested object; empty fields omitted |
| `SASA.fill(obj)` | populates every field; keys not present are cleared |
| `SASA.schema()` | every field path with its type — the contract for your API |
| `SASA.fromRows(rows)` | charts an array of timed observations |
| `SASA.parseTable(text)` | header row + delimited rows → array of objects |

Field paths are dotted and nest naturally:

```json
{
  "patient": { "surname": "…", "firstNames": "…", "birthDate": "1974-03-02" },
  "case":    { "hospital": "…", "procedure": "…", "timeFrom": "16:30" },
  "history": { "asthma": { "yn": "yes", "details": "…" } },
  "chart":   { "startTime": "16:30", "interval": "5", "hr": [78, 82, …] },
  "infusions": [{ "name": "Remifentanil 50 µg/mL", "dose": ["0.1", "0.15", …] }]
}
```

Types are inferred from the element, not hard-coded: checkbox → boolean, radio →
`"yes"|"no"`, date/time → ISO strings, textarea → longtext, everything else → string.

`chart.map` appears in `data()` as a derived, read-only array — mean arterial pressure
per column, calculated as `dia + (sys − dia) / 3`. Send systolic and diastolic; MAP
recalculates.

## The vitals chart

Pick **Heart rate** or **Blood pressure**, then click the grid. Points land on the
vertical gridlines. Hovering shows crosshairs, the value, the column's clock time, and
a ghost of the symbol a click would place.

- Heart rate plots as a black dot.
- In BP mode the first click in a column sets one point and the second sets the other;
  the higher of the pair is always taken as systolic. Systolic draws as a solid
  down-facing triangle, diastolic as an up-facing one, joined by a vertical line, with
  MAP marked ✕ and the MAP values joined across columns by a dashed line.
- Clicking an existing point clears it.

Set a start time and every column fills at the chosen interval — 5 min (2h25 of grid)
or 15 min (7h15). The start snaps back to the quarter hour so hours and quarters land
on gridlines; labels thin out as the interval grows. Every column still carries its
full `HH:MM` in `chart.time[]` regardless of what the label shows.

## Importing an observation table

`SASA.fromRows()` takes the shape a flowsheet transcribes into and places each row in
the nearest column for its time:

```js
SASA.fromRows([
  { time: "16:32", hr: 78, bp: "128/74", spo2: 99, etco2: 35, temp: 36.4 },
  { time: "16:37", hr: 82, bp: "132/78", spo2: 98, etco2: 34 }
]);
// → { placed: 2, replaced: 0, skipped: [] }
```

Header names are normalised, so `HR`/`Pulse`/`Heart Rate` all reach the same series,
as do `SpO2`/`sao2`/`Sats`. `"128/74"` splits into systolic and diastolic. Rows whose
times fall outside the grid are reported in `skipped`, never dropped silently.

Paste into the panel and the form follows as soon as the text parses — **auto-apply**
is on by default and can be switched off, in which case **Apply now** does it on
demand. Half-typed JSON is ignored rather than reported as an error. Applying stops the
panel mirroring the form back out, so the two never fight; press **Live JSON** to
resume mirroring. **Replace all** is the destructive alternative: it fills from the
pasted object and clears anything the object doesn't mention.

Apply reads the panel and works out what you pasted. It accepts a
vision model's reply as-is — code fences, a preamble, trailing commentary, smart
quotes and trailing commas are all tolerated — and dispatches on shape:

| pasted | result |
|---|---|
| array of rows with `time` | charted via `fromRows()` |
| `{"observations":[…]}` and similar wrappers | the nested array is charted |
| a whole-form object | merged into the current form via `fill()` |
| a delimited table with a header row | parsed, then charted |

`SASA.importAny(text)` is the same logic without the UI.

`docs/vitals-photo-extraction-prompt.md` is a prompt for transcribing a photographed
vitals table into exactly this shape. `docs/form-extraction-prompt.md` covers everything
else — demographics, medical aid, case detail, technique, monitoring and the Section D
history — and returns a nested object that the same **Import** button merges in.
`docs/schema.json` is the machine-generated field list both prompts are built from:

```js
JSON.stringify(SASA.schema(), null, 2)   // regenerate after adding fields
```

`docs/case-extraction-prompt.md` goes further: photograph everything, attach it all in
one message, and get back a single object carrying the form fields *and* an
`observations` array. The importer applies the fields first — so `chart.startTime` and
`chart.interval` are in place — then places the rows against that grid, reporting both:
`148 field(s) populated · 29 row(s) charted`. `docs/example-case.json` is a complete
worked payload in that shape.

Imports also merge, so a demographics photo, a history photo and the vitals table can
be imported one after another without clearing each other.

### Other paperwork in the same case

A case arrives as a bundle, and the other sheets in it carry values the SASA form wants.
Each has a field map and a paired prompt covering both recognition — how to tell the form
apart from everything else on the clipboard — and transcription:

| form | map | prompt |
|---|---|---|
| Blaine and Associates consent to anaesthesia and professional fees | `docs/blaine-consent-schema.json` | `docs/blaine-consent-prompt.md` |
| Mediclinic admission summary (form D 2700) | `docs/mediclinic-admission-schema.json` | `docs/mediclinic-admission-prompt.md` |
| PathCare lab report — cumulative and single | `docs/pathcare-lab-schema.json` | `docs/pathcare-lab-prompt.md` |

Each map ends in a `crosswalk` block naming the SASA paths its fields feed, so a consent
or admission photo can seed the case before the record itself is transcribed. Read the
crosswalk caveats first — on the admission sheet the account holder is the medical aid's
main member, who is often not the patient.

### Validating and improving an extraction

`docs/extraction.schema.json` is a JSON Schema (draft 2020-12) covering all three forms,
bare or wrapped in a review envelope. Use it as the structured-output contract when calling
a model, and to check a reply before importing it:

```sh
node tools/validate-extraction.mjs reply.json
```

Errors are structural — a date that isn't `YYYY-MM-DD`, an interval that isn't 5 or 15, a
field the form doesn't have. Warnings are the house rules a schema can't state: a `false`
where an omission belongs, an `uncertain` path with no value behind it, observations off
the grid, a systolic below its diastolic, an identity number disagreeing with its date of
birth. Warnings don't fail the run — each one is a question for the anaesthetist.

On a lab report the warnings do more work: a value flagged `L` that is not below its own
reference range, or derived arithmetic that will not reconcile (`nonHdlCholesterol`,
`cholHdlRatio`, `globulin`, `anionGap`), is the signature of a result row read one line out
of register — the failure a photographed cumulative report invites and the eye cannot see.

The SASA half of the schema is generated, so it can't drift from the form:

```sh
node tools/build-json-schema.mjs   # after regenerating docs/schema.json
```

`docs/refine-extraction-prompt.md` is the second pass. Give a model the photographs plus
the extraction it already made — or two independent extractions to reconcile — and it
returns a corrected object with an audit of what it added, corrected, removed and could
still not read. Feeding the validator's output in with it points the second pass straight
at the doubtful fields.

**Transcription is a draft.** Read every figure back against the source before the
record is signed, and keep the source image with the case.

## Saving a case

**Save HTML** writes one self-contained file: the whole form, filled, with no external
assets. State is embedded as JSON in a `#preload` block, so reopening the file rebuilds
the chart and every field offline. It stays live — editable, re-exportable, and
`SASA.data()` still returns the case.

**Save PDF** opens the browser print dialog. The browser's own print engine renders the
same CSS at the same A4 landscape size, so the PDF is identical to the screen. Set:

- Destination — Save as PDF
- Margins — None
- Scale — 100% (not "Fit to page")
- Background graphics — **on** (without it the green rules and tints vanish)

For automation, `tools/export-pdf.mjs` drives the same engine headlessly:

```sh
npm i -D playwright && npx playwright install chromium
node tools/export-pdf.mjs index.html case.json case.pdf
```

`printBackground` and `preferCSSPageSize` are what keep it faithful — the first keeps
the rules and tints, the second honours `@page { size: A4 landscape; margin: 0 }`.

Rasterising libraries (html2canvas, jsPDF) are deliberately not used: they re-implement
layout and drift on millimetre units, print colour and page breaks.

## Deploying

Static — any host works. For Cloudflare Pages:

```sh
wrangler pages deploy . --project-name sasaform
```

## Copyright

Two distinct sets of rights, neither affecting the other.

**Software — © 2026 Remparts Solutions (Pty) Ltd. All rights reserved.** Created by
Albert van Zyl. Covers the field mapping and JSON contract, the interactive vitals
chart, the time axis, the observation-table import, and the HTML/PDF export. No licence
is granted.

**Form content — © South African Society of Anaesthesiologists (SASA), v2020.** The
layout, structure, field arrangement and bilingual clause wording are SASA's, as are
the SASA name and logo. This is an unofficial implementation, not endorsed by or
affiliated with SASA. The SASA mark in `index.html` is an approximation standing in for
the official asset — replace or remove it before any distribution.

Distributing the form content requires SASA's permission; obtain it before making this
repository public or sharing the file beyond your own practice. Remparts Solutions'
rights in the software are unaffected by that answer.

Both notices travel with the work: the source header of `index.html`, its `copyright`
and `author` meta tags, the strip above the form, and the `_meta` block of every
exported JSON case. See `NOTICE.md`.

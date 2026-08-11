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
  "chart":   { "startTime": "16:30", "interval": "5", "hr": [78, 82, …] }
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

The **Import table** button reads the panel as either a JSON array or a pasted table
(tab, comma, semicolon, pipe or 2+ spaces as separators).

`docs/vitals-photo-extraction-prompt.md` is a prompt for transcribing a photographed
vitals table into exactly this shape.

**Transcription is a draft.** Read every figure back against the source before the
record is signed, and keep the source image with the case.

## Deploying

Static — any host works. For Cloudflare Pages:

```sh
wrangler pages deploy . --project-name sasaform
```

## Provenance

The layout, wording and structure of the form are the South African Society of
Anaesthesiologists' (SASA Anaesthesia Form / Narkosevorm, v2020). This repository is a
digital re-implementation of that form, not an original work.

The SASA mark in `index.html` is a drawn approximation standing in for the official
asset — see the `logo` template string near the top of the script.

Confirm SASA's position on redistribution before making this repository public.

## Licence

None chosen yet. Without one, default copyright applies and nobody may reuse it.

# Anaesthetic chart — display specification for an implementing agent

This document describes how `index.html` renders the SASA (v2020) anaesthesia record so that
another application can reproduce the same visual language: the same rows, the same time axis,
the same symbols for each vital sign, and the same colours. It is written for a coding agent
building an anaesthetic notes app. Every rule below is taken from the working implementation
in `index.html`; where a value is quoted, it is the value the code uses.

`docs/chart-reference.png` is a render of the chart filled with `docs/example-case.json` plus a
few observation rows. Compare your output against it.

---

## 1. The page it lives on

- The record is one half of an **A4 landscape sheet** (297 × 210 mm). The sheet is a two-column
  grid; the record occupies the left column, Section D (patient history) the right.
- Inside the record, a **24 mm technique/monitoring column** sits to the left of the chart. The
  chart fills the rest of the width (about 95 mm of plotting area).
- Everything printed on the form is **SASA green**. Everything the anaesthetist writes is
  **ink blue**, except the heart-rate dot, which is **black**.

| token | value | used for |
|---|---|---|
| `--g` | `#00a651` | rules, gridlines, row labels, axis numbers |
| `--gd` | `#00843d` | headings, hour labels on the time axis |
| `--gl` | `#d9f0e2` | tint fills (yes/no boxes) |
| `--ink` | `#12356b` | all entered data, BP symbols, MAP, legend glyphs |
| HR dot | `#000000` | the heart-rate point only |
| hover | `#c2410c` | crosshair, ghost symbol, live readout, highlighted time cell |
| hover tint | `#fff2e6` | background behind the highlighted time label |
| `--bw` | `0.35 mm` | rule weight for all borders |

Typography: labels are `"Arial Narrow"` (fallbacks: Liberation Sans Narrow, Arial), bold,
4.4–4.6 pt. Entered values are plain `Arial`, 7 pt generally and **4.6 pt inside chart cells**.
Row labels use real Unicode subscripts and symbols, not ASCII approximations:

```
O₂ saturation(SaO₂)      End tidal CO₂(ETCO₂)      Temperature (°C)
Urine (mL)               Blood loss (mL)           Vapour(%)
```

The form writes **SaO₂** on its labels (and in the PACU line); the JSON key for the same series
is `spo2`. The micro prefix is written **mcg** on the agent unit selector; drug names in free
text may use `µg` (e.g. `Remifentanil 50 µg/mL`).

---

## 2. Rows, top to bottom

The chart is a stack of rows. Each row is a 4-part grid: `label | gutter | 30 cells | gutter`
(`17mm 4mm 1fr 4mm`; the agent rows use `14mm 7mm 1fr 4mm` to fit the unit selector). The 30
cells are equal-width. Cell borders: **dotted** green vertical separators, **solid** green
bottom rule, solid green left edge on the whole block. Cell text is centred.

| # | row label | data path | notes |
|---|---|---|---|
| 1 | `Agent` / `Dose` header | — | column headings only |
| 2–9 | eight agent rows | `agents[r].agent`, `agents[r].unit`, `agents[r].dose[0..29]` | drug name in the label cell; unit chosen by **circling** one of `g` `mg` `mcg`; a dose figure in the column it was given |
| 10 | `Vapour(%)` | `chart.vapour[]` | volatile agent concentration |
| 11 | gas mixture | `chart.gasMix.oxygen/nitrous/air` (booleans), `chart.gas[]` | label reads `oxygen / nitrous / Air`; the chosen gases are **circled**; the cells carry flows or FiO₂ |
| 12 | `Time:` | `chart.startTime`, `chart.interval`, `chart.time[]` | the time axis — see §3 |
| 13 | the vitals graph | `chart.hr[]`, `chart.sys[]`, `chart.dia[]`, `chart.map[]` (derived) | 32 mm tall — see §4 and §5 |
| 14 | `O₂ saturation(SaO₂)` | `chart.spo2[]` | numeric cells |
| 15 | `End tidal CO₂(ETCO₂)` | `chart.etco2[]` | numeric cells |
| 16 | `Fluids` | `chart.fluids[]` | numeric cells |
| 17–19 | three `Infusions` rows | `infusions[r].name`, `infusions[r].dose[]` | name (drug, concentration, route) in the label cell; rate per column |
| 20 | `Urine (mL)` | `chart.urine[]` | numeric cells |
| 21 | `Blood loss (mL)` | `chart.bloodLoss[]` | numeric cells |
| 22 | `Temperature (°C)` | `chart.temp[]` | one decimal |
| 23 | `CVP` | `chart.cvp[]` | numeric cells |
| 24 | `Events:` | `record.events` | free text, fills remaining height |
| 25 | `Input:` / `Output:` | `record.input`, `record.output` | totals line |

The label area beside the graph also holds `Position:` (`record.position`), the trace selector
and the legend (§5), and the live hover readout.

**Circling** is how the paper form records a choice from printed options, and the app keeps that
idiom: the chosen word gets a thin ink-blue oval border and ink-blue text (`.circ:has(input:checked)`),
the others stay green and unbordered. Do not render these as checkboxes.

A **Post-Anaesthetic Care Unit** line sits under the chart with `HR:` `BP:` `RR:` `SaO₂:` `FIO₂:`
as free-text fields (`pacu.hr`, `pacu.bp`, `pacu.rr`, `pacu.sao2`, `pacu.fio2`).

---

## 3. The time axis

- **30 columns.** Each column is one observation slot. The interval is **5 min** (grid spans
  2 h 25) or **15 min** (grid spans 7 h 15). Nothing else is offered.
- **The start time snaps down to the quarter hour** (`floor(minutes / 15) * 15`). A start of
  16:32 becomes 16:30. This keeps every hour and quarter-hour on a gridline. The snapped value
  is written back into the start field so the user sees it.
- Every column's clock time is computed as `start + i × interval`, wrapping past midnight
  (`mod 1440`), and stored in full `HH:MM` in `chart.time[i]`, whatever the label shows.
- **Label density follows the interval.** At 5 min, a label every 15 min; at 15 min, a label
  every 30 min. Columns between labels are blank.
- **On the hour** the label is the two-digit hour (`08`), set larger (5.4 pt) and in the darker
  green `--gd`. **Quarter and half hours** show minutes only (`15`, `30`, `45`), at 4 pt in `--g`.
- Labels are **centred on the column's left gridline** (translated −50 % horizontally), because
  the plotted point also sits on that gridline, not in the middle of the cell.
- Hovering a column in the graph **reveals its full `HH:MM`** in the time cell, in the hover
  orange on a pale tint. Print hides this.

---

## 4. The vitals graph

The graph is an SVG with `viewBox="0 0 300 102"` and `preserveAspectRatio="none"`, 32 mm tall,
stretched to the width of the 30 cells. The viewBox is proportioned to the rendered box so a
circle still looks round. All geometry below is in viewBox units; 1 unit ≈ 0.31 mm.

**Vertical axis.** One shared scale for **beats per minute and mmHg**, from **40 (bottom) to
200 (top)**. Axis numbers `200 180 160 140 120 100 80 60 40` are printed on **both** sides of
the graph in 4 pt bold green. Mapping:

```
y(v) = (200 − v) × 102 / 160        v(y) = 200 − y × 160 / 102
```

**Gridlines**, all in `#00a651`:

- vertical: one per column boundary at `x = i × 10` for `i = 0..30`; stroke `0.25`, but `0.6`
  for every 5th (`i % 5 == 0`);
- horizontal: every **10** units of value from 40 to 200; stroke `0.25`, but `0.6` on every
  **20** (60, 80, 100 …).

**Where a point lands.** `x = i × 10` — the plot sits **on the vertical gridline** of its column,
not between lines. Clicked values snap to the nearest **5**; imported values are plotted exactly.
Values are clamped to 40–200 on click.

**Draw order:** grid, then the dashed MAP trend line, then the markers, then the hover layer.

---

## 5. Symbols — the part that must be exact

| sign | symbol | geometry (viewBox units) | colour |
|---|---|---|---|
| Heart rate | **● solid dot** | circle `r = 2.4` centred on the value | **black `#000`** |
| Systolic BP | **▼ solid down-pointing triangle** | base 6 wide at `y − 3.4`, **apex on the value** | ink `#12356b` |
| Diastolic BP | **▲ solid up-pointing triangle** | base 6 wide at `y + 3.4`, **apex on the value** | ink `#12356b` |
| sys–dia link | vertical line | from `y(sys)` to `y(dia)` at the column's `x`, stroke `0.5` | ink |
| MAP | **✕ cross** | two diagonals from `(x±2.4, y±2.4)`, stroke `1`, centred on the MAP value | ink |
| MAP trend | **dashed line** | polyline through every column's MAP, stroke `0.6`, `stroke-dasharray="2.5 2"`; drawn only when ≥ 2 columns have a MAP | ink |

Rules that follow from the code:

1. **The apex marks the value.** The systolic triangle hangs *above* its value and points down
   at it; the diastolic triangle sits *below* its value and points up at it. The two therefore
   bracket the pulse pressure, and the vertical line joins them through the gap.
2. **Triangles are filled, not outlined.** The legend glyphs are the Unicode characters
   `▼` and `▲` in ink blue; the HR legend glyph is `●` in black; MAP is `✕` with the note
   "(calculated)".
3. **MAP is derived, never entered.** `MAP = round(dia + (sys − dia) / 3)`. It is drawn whenever
   both systolic and diastolic exist in a column, exported as `chart.map[]` (read-only), and
   recalculated on every change. Do not accept a MAP from the user or from an import; if a
   source shows only MAP, leave BP blank.
4. **Only MAP is joined across columns.** HR dots are **not** connected. Systolic and diastolic
   triangles are **not** connected to their neighbours. The single dashed MAP line is the only
   trend line on the chart.
5. **Higher value is always systolic.** If two pressures land in one column the larger becomes
   `sys` and the smaller `dia`, whatever order they were entered.
6. A column can hold **one HR and one BP pair**. There is no second HR series and no separate
   pulse-oximeter pulse plotted.
7. The symbols overlap when values coincide (an HR dot inside a BP range is normal — see the
   reference render). Nothing is offset to avoid collisions.

**Hover feedback** (screen only, hidden in print): a dashed orange crosshair (`stroke 0.5`,
`dasharray 2 2`) through the snapped column and value, a **ghost of the symbol a click would
place** in orange at 55 % opacity (a dot in HR mode; in BP mode an up-triangle if the column
already has a systolic and the pointer is below it, otherwise a down-triangle), and a readout
beside the legend reading e.g. `120 mmHg  ·  08:15` or `78 bpm  ·  08:15`.

**Click behaviour:**

- HR mode: click sets `chart.hr[i]`; clicking the existing value clears it.
- BP mode: first click in a column sets one pressure, second sets the other; clicking an
  existing point clears it; a third distinct click moves whichever of the two is nearer; the pair
  is then re-sorted so the higher is systolic.

---

## 6. Numeric rows

Everything that is not HR or BP is a **number in a cell**, not a plotted point: SaO₂, ETCO₂,
temperature, CVP, urine, blood loss, fluids, vapour %, gas flows, agent doses, infusion rates.
Text is 4.6 pt Arial, centred, ink blue. Write the figure exactly as recorded, one decimal for
temperature, no units inside the cell (the unit is in the row label).

---

## 7. Data contract and import

All chart series are 30-element arrays indexed by column; empty columns are omitted on export
and cleared on import.

```json
"chart": {
  "startTime": "07:15", "interval": "5",
  "time": ["07:15","07:20", "…"],
  "hr":  [78, 92], "sys": [128, 142], "dia": [74, 86],
  "map": [92, 105],
  "spo2": [99, 98], "etco2": [35, 34], "temp": [36.4],
  "urine": [], "bloodLoss": [], "cvp": [], "fluids": [], "vapour": [], "gas": [],
  "gasMix": { "oxygen": true, "air": true }
}
```

Observation rows from a flowsheet or a vision-model transcription arrive as
`{ time, hr, bp, spo2, etco2, temp, cvp, urine, bloodloss }` with `bp` as `"SYS/DIA"`. Each row
goes to the **nearest column** for its time (`round((t − start) / interval)`); times more than
12 h before the start are treated as after midnight; rows off the grid are reported, not dropped.
Header aliases are normalised: `HR`/`Pulse`/`Heart rate` → `hr`; `SpO2`/`SaO2`/`Sat`/`Sats` →
`spo2`; `CO2` → `etco2`; `Vapor` → `vapour`.

The validator (`tools/validate-extraction.mjs`) warns on a systolic below its diastolic and on
observations off the grid. Match that: never silently swap or drop.

---

## 8. Print

- `@page { size: A4 landscape; margin: 0 }`, scale 100 %, **background graphics on** or the green
  rules and tints disappear.
- Hidden in print: the toolbar, the hover crosshair, the hover readout. The highlighted time cell
  reverts to the plain 4 pt green label.
- Focus highlights on inputs are removed.

---

## 9. Checklist for the implementing agent

- [ ] 30 columns; 5 or 15 min; start snapped to the quarter hour; hour labels `HH`, quarter
      labels `MM`, density by interval; full `HH:MM` kept per column.
- [ ] One 40–200 axis for bpm and mmHg, numbers on both sides; horizontal lines every 10, heavy
      every 20; vertical lines every column, heavy every 5th.
- [ ] Points on the column's gridline, not the cell centre.
- [ ] HR = **black ●**. Systolic = **ink ▼ apex on value**. Diastolic = **ink ▲ apex on value**.
      Vertical ink line between them. MAP = **ink ✕**, calculated as `dia + (sys − dia)/3`.
- [ ] Dashed ink line through MAP only. No lines through HR, systolic or diastolic.
- [ ] Higher pressure is systolic; MAP never user-entered; MAP exported read-only.
- [ ] SaO₂, ETCO₂, temp, CVP, urine, blood loss, fluids, vapour, gas, agents, infusions are
      centred numbers in cells, ink blue, 4.6 pt, no units in the cell.
- [ ] Labels use `O₂`, `CO₂`, `SaO₂`, `ETCO₂`, `°C`, `mL`, `%`; units `g / mg / mcg` are
      circled, as are `oxygen / nitrous / Air`.
- [ ] Printed matter green `#00a651` (`#00843d` for headings and hour labels); entered data ink
      `#12356b`; hover state orange `#c2410c`, never printed.
- [ ] A4 landscape, backgrounds on, hover layer hidden in print.

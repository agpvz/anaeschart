# Blaine & Associates anaesthetic chart — display specification for an implementing agent

This is the third form in the set, after the SASA record (`chart-display-spec.md`) and the Blaine
consent (`consent-display-spec.md`). It describes the **Blaine & Associates anaesthetic chart,
© Blaine & Associates 2022**, from the practice's own PDF of the blank form, so that an
anaesthetic notes app can reproduce it. **This form is not yet implemented in `index.html`**;
this document is the brief for doing so, or for building it elsewhere.

Source and references, all in this folder:

- `blaine-anaesthetic-chart.pdf` — the practice's vector PDF of the blank form (fonts embedded,
  text selectable). Measure from this, not from a photo.
- `blaine-chart-reference.png` — the whole page rendered.
- `blaine-chart-grid-reference.png` — the vitals grid and its legend, enlarged.

The form content is Blaine & Associates' copyright. Reproduce it for the practice's own use; do
not restyle the layout or reword the labels.

---

## 1. Page, palette, type

**Page.** Single **A4 portrait** page (210 × 297 mm), confirmed by the practice. The PDF was
scanned at 827.8 × 1180 pt (292 × 416 mm), the same √2 ratio, so every dimension below is quoted
**in PDF points at the scanned size**; multiply by **0.72** to get the printed A4 value
(1 PDF pt ≈ 0.254 mm on paper). Keep the ratio; do not reflow.

**Palette.** The form was laid out in Excel with the Office "Blue, Accent 1" theme, so the
colours are exact theme tints:

| role | hex | where |
|---|---|---|
| page frame | `#8ea9db` | the background behind and between every panel, and the "Patient Sticker" caption |
| rule | `#305496` | every panel border, every solid gridline and cell divider, label text |
| dark label | `#203764` | the `Time:` label (and other emphasised headings) |
| cell fill | `#f2f2f2` | every data cell in the grid and the rows below it |
| soft tint | `#d9e1f2` | `Premed:` box, `Reversal:` box, `Recovery` cell, the three sub-headers `Induction` / `Airway Management` / `Maintenance` |
| placeholder | `#b4c6e7` | ghost labels the anaesthetist overwrites: `Drugs`, `Fluids`, `on/off/mins`, `Time In`, `Time out`, `Anaesthesiologist`, `dd/mm/yyyy` |
| highlight | `#fff2cc` | the `ASA`, `Airway`, `Hb` boxes and the `Allergies` box |
| warning | `#fa0302` | the red ⚠ triangle in the Allergies box |
| white | `#ffffff` | free-text panels and the plain patient-data boxes |

There is **no green and no black** on the printed form; written entries are the only black.

**Type.** Labels are set in **Abadi** (fallback: Gill Sans, Calibri). Subscripts (`SaO₂`,
`ETCO₂`, `FiO₂`, `N₂O`, `Temp ⁰C`) are set in Cambria Math. Sizes at PDF scale:

| size | used for |
|---|---|
| 26 pt | `Patient Sticker` caption, in the frame colour |
| 13 pt | `Procedure:` `Surgeon:` `Hospital:` `Pre-operative Clinical Notes:` `Intraoperative Notes:` `Regional & Nerve Blocks` `Recovery` and the placeholders |
| 10 pt | `Time:`, the nine patient-data box titles, `Allergies`, address block, row labels (`SaO₂` … `Blood loss`), `Temp ⁰C` |
| 8.7 pt | every checkbox label |
| 8 pt | the Y-axis numbers |
| 7.2 pt | the legend text (`mmHg` `Sys` `Mean` `Dia` `PR` `CVP`) |

Checkboxes are small light-grey filled squares with a `#305496` border, about the height of
their 8.7 pt label, label immediately to the right.

Panels are white (or filled as above) rectangles with square corners and a ~1.5 pt `#305496`
border, separated by ~8 pt of frame colour. The page edge is the same frame colour.

---

## 2. Page regions, top to bottom

Positions are in PDF points from the top-left corner.

**Header band (y 10–235).**
- Left, x 10–460: **Patient Sticker** panel, caption centred in the frame colour. No fields.
- Right, x 470–818: the **practice panel** (logo "Blaine & Associates — specialist anaesthetists ·
  spesialis narkotiseurs" left, address block right: `Suite 6, 2nd Floor / Block 3 / Mediclinic
  Vergelegen / 021 840 7006`), then three single-line boxes **`Procedure:`**, **`Surgeon:`**,
  **`Hospital:`**, each ~46 pt tall with the label at the left edge.

**Pre-operative band (y 240–400).**
- Left, x 10–640: **`Pre-operative Clinical Notes:`** free-text panel. Along its bottom edge,
  checkboxes **`Consent`**, **`DVT Risk`**, **`Aspiration Risk`**; the right third of the bottom
  edge is a soft-tinted inset **`Premed:`** with its own checkbox and a free-text line.
- Right, x 645–818: a **3 × 3 grid of small value boxes**, titles centred at the top edge:

  | | | |
  |---|---|---|
  | `ASA` (highlight) | `Age` | `Airway` (highlight) |
  | `BP` | `Hb` (highlight) | `HGt` |
  | `Weight` | `Height` | `BMI` |

  Below them a full-width **`Allergies`** box in the highlight colour with a red ⚠ at its left.

**Main band (y 405–1000).**
- Left column, x 10–158: five stacked **checkbox panels** (§3).
- Right, x 165–818: the **chart panel** (§4, §5).

**Bottom band (y 1005–1160).**
- Left, x 10–158: **`Regional & Nerve Blocks`** free-text panel.
- Centre, x 165–640: **`Intraoperative Notes:`** free-text panel; along its bottom edge the
  checkboxes **`Throat Pack`**, **`Bair Hugger`**, **`Foot/Calf Pumps`**, and a soft-tinted inset
  **`Reversal:`** with checkbox and text line. Under the panel, the **`Recovery`** row: a tinted
  `Recovery` label cell then five value cells titled **`SaO₂`**, **`BP`**, **`PR`**, **`RR`**,
  **`Airway`**.
- Right, x 645–818: a box with checkboxes **`X-Clamp`**, **`CPB`**, **`Tourniquet`** and the
  placeholder `on/off/mins`; two boxes **`Time In`** / **`Time out`**; a box
  **`Anaesthesiologist`**; a box **`dd/mm/yyyy`** (the date of anaesthesia).

**Footer.** `© Blaine & Associates 2022` centred in the frame, white. `even 2A` at the bottom
left is a print-shop imposition mark, not part of the form; omit it.

---

## 3. The checkbox column

Five panels, each a white box; items are two-column where shown. Reproduce the wording exactly.

| panel | items |
|---|---|
| Technique | `General` · `Regional` / `IV Sedation` / `Spinal` · `Epidural` |
| Access | `Cannula:` / `CVP:` / `Aline:` — each a checkbox followed by a free-text line for size and site |
| Position & care | `Supine` · `Prone` / `Lateral` · `Sitting` / `Pressure points` · `Eyes` |
| Monitoring | `ECG` · `NIBP` / `SaO₂` · `ETCO₂` / `Temp` · `BIS` / `Invos` · `Agent/MAC` / `Urine cath` |
| Conduct | sub-header **Induction**: `Inhalational` · `Intravenous`. Sub-header **Airway Management**: `Difficult` · `Easy` / `ETT:` (text) / `LMA:` (text) · `ETT Cuff` / `Rapid sequence induction` / `Airway Trauma/Injury noted` / `Video laryngoscope used`. Sub-header **Maintenance**: `IPPV` · `Spont Resp` / `Circle` · `T-Piece/Bain` / `Oxygen/Air` · `N₂O` / `Sevo` · `Des` / `TIVA / TCI:` (text) |

The three sub-headers are full-width bars in the soft tint with a rule border and centred label.

---

## 4. The chart panel

The chart panel (x 165–818) is divided into a **label column** ~61 pt wide on the left and a
**data area** ~589 pt wide on the right. Vertically it stacks, with frame-coloured gaps between
groups:

| # | row | height | notes |
|---|---|---|---|
| 1 | `Time:` | ~17 pt | **5 cells** across the data area |
| 2 | the vitals graph | ~228 pt | §5 |
| 3 | `Temp ⁰C` | ~16 pt | 10 cells, directly under the graph, inside the same panel |
| | gap | | |
| 4–7 | `SaO₂` / `ETCO₂` / `FiO₂` / `MAC/BIS` | ~18 pt each | 10 cells each |
| | gap | | |
| 8–17 | ten drug/fluid rows | ~18 pt each | label cells carry the placeholders `Drugs`, `Drugs`, six blank, `Fluids`, `Fluids`; the anaesthetist writes the drug or fluid name in the label cell and doses/volumes in the cells |
| | gap | | |
| 18–19 | `Urine` / `Blood loss` | ~18 pt each | 10 cells each |

**Columns.** The data area is **60 minor columns** wide, each ~9.8 pt. Every **6th** boundary is
a solid `#305496` line, giving **10 blocks**; the numeric rows have one cell per block. Within a
numeric row the divider between blocks alternates: **dotted** on odd boundaries, **solid** on
even, so the solid dividers line up with the **5 `Time:` cells**, each of which spans two blocks
(12 minor columns).

**The interval is variable.** The form prints none; the anaesthetist writes a clock time in
each of the five `Time:` cells and chooses the column spacing to suit the case. The practice's
usual setting, and the one to **default to, is 5 min per minor column**, which makes one block
30 min, one time cell 1 hour and the page 5 hours. Offer the interval as a setting (5 min
default, with at least 10 and 15 min as alternatives), apply it to every column, and derive the
time-cell labels from the start time, as the SASA implementation does with its 5/15 picker.

All cells are filled `#f2f2f2`; written values are centred.

---

## 5. The vitals graph and its symbols

**Grid.** Minor lines are dotted `#305496` on the `#f2f2f2` fill, ~9.8 pt apart horizontally and
~9.25 pt apart vertically, so each minor square is almost square. Solid lines: every 6th
vertical (the block boundaries) and the horizontals at **100** and **50**.

**Vertical scale — piecewise.** This is the feature that most distinguishes the Blaine chart
from the SASA chart. One axis, labelled `mmHg`, serves pressures, pulse rate and CVP:

- from **200 down to 20**, each minor row is **10 units** (18 rows);
- from **20 down to 0**, each minor row is **5 units** (4 rows), i.e. the bottom of the scale is
  drawn at **double magnification** so CVP can be plotted legibly;
- one further unlabelled minor row sits below 0 before the `Temp ⁰C` row.

Axis numbers, right-aligned in the label column, 8 pt: `200 180 160 140 120 100 80 60 40 20 10 0`.
The lines at 15 and 5 exist but are not numbered. With `p` the minor row pitch and `top` the
y of the 200 line:

```
v ≥ 20 :  y = top + (200 − v) / 10 × p
v < 20 :  y = top + 18 p + (20 − v) / 5 × p
```

Values above 200 or below 0 are off the chart. Pulse rate uses the same numbers as mmHg; the
form prints no `bpm`.

**Legend**, printed in the label column beside the axis, label then glyph:

| sign | printed label | glyph | how to draw it |
|---|---|---|---|
| systolic pressure | `Sys` | **V** — an open down-pointing chevron | two strokes meeting at a point; the **point sits on the value**, arms open upward |
| mean pressure | `Mean` | **x** — a small cross | centred on the value; the form's own glyph is a lower-case x, not a bold ✕ |
| diastolic pressure | `Dia` | **Λ** — an open up-pointing chevron | the **point sits on the value**, arms open downward |
| pulse rate | `PR` | **●** filled dot | centred on the value |
| central venous pressure | `CVP` | **▼** filled down-pointing triangle | plotted in the magnified 0–20 region; apex on the value |

Rules that follow from the paper form and standard charting practice:

1. **Chevrons, not triangles.** The SASA chart fills its systolic ▼ and diastolic ▲; the Blaine
   chart uses **open** V and Λ strokes. Keep them open, stroke weight similar to the dot's radius,
   about one minor square wide and high.
2. The systolic V and diastolic Λ in one column are **joined by a vertical line** between their
   points when charted by hand; draw it the same way, and place the mean `x` on that line.
3. **Mean is written as "Mean"**, not MAP. If it is calculated rather than read from the
   monitor, use `dia + (sys − dia) / 3`, mark it calculated, and never let a user-entered mean
   overwrite a monitor-read one silently.
4. **PR, not HR.** Use the form's abbreviation on screen and in exports, and keep it a plain
   dot with **no connecting line**. Nothing on this form joins points across columns; if you add
   a trend line, make it optional and off by default.
5. **CVP has its own symbol and its own region.** The ▼ belongs between 0 and 20 on the
   magnified part of the scale. Do not plot CVP on the upper scale even when the value is valid
   there.
6. Points land on **minor-column gridlines**, one observation column per minor column, so two
   readings can never share an x position. Snap entered values to the scale's resolution
   (10 above 20, 5 below).
7. There is **no SpO₂, ETCO₂ or temperature trace** on the graph. They are numbers in their
   rows (§4). Temperature sits immediately under the graph and shares its columns.

---

## 6. Rows other than the graph

Numbers in cells, centred, one per block (10 per row): `Temp ⁰C` (one decimal), `SaO₂` (%),
`ETCO₂`, `FiO₂`, `MAC/BIS` (the anaesthetist writes whichever applies), `Urine`, `Blood loss`.
Units are in the label only, never inside the cell. The ten drug/fluid rows take the agent or
fluid name in the label cell and the dose or volume in the block where it was given.

Labels use the form's exact strings, with real subscripts: `SaO₂` (not SpO₂), `ETCO₂`, `FiO₂`,
`N₂O`, and `Temp ⁰C` (the form uses a superscript zero, not the degree sign; either is
acceptable on screen, but keep `°C` consistent within your app).

---

## 7. Suggested data contract

Mirror the SASA contract (`chart.*` arrays indexed by column) so one importer serves both
forms, with these differences:

```json
"blaineChart": {
  "timeCells": ["07:00","08:00","09:00","10:00","11:00"],
  "minutesPerColumn": 5,
  "pr":  [], "sys": [], "dia": [], "mean": [], "cvp": [],
  "temp": [], "spo2": [], "etco2": [], "fio2": [], "macBis": [],
  "drugs":  [{ "name": "", "dose": [] }],
  "fluids": [{ "name": "", "volume": [] }],
  "urine": [], "bloodLoss": []
}
```

- `pr` is the Blaine name for the SASA `hr`; alias both on import (`HR`, `Pulse`, `PR`).
- `mean` may be monitor-read; carry a flag when it is calculated instead.
- `cvp` is plotted here, unlike on the SASA form where it is a number row.
- 60 columns, not 30, and `minutesPerColumn` is a per-case setting defaulting to 5. A row whose time does not fall on a column goes to the nearest one, and
  rows off the page are reported, as in `SASA.fromRows()`.
- The checkbox panels, patient-data boxes, notes, recovery row and footer boxes are plain
  booleans and strings; name them after the printed labels (`technique.general`,
  `monitoring.nibp`, `airway.videoLaryngoscope`, `patient.asa`, `recovery.rr`, `times.in`,
  `times.out`, `anaesthesiologist`, `date`, …).

---

## 8. Checklist for the implementing agent

- [ ] A4 portrait; frame `#8ea9db`, rules `#305496`, cells `#f2f2f2`,
      tints `#d9e1f2`, highlights `#fff2cc` on ASA / Airway / Hb / Allergies with a red ⚠.
- [ ] Abadi-style labels; exact wording from §2 and §3; the three tinted sub-headers.
- [ ] Chart panel: `Time:` row of 5 cells; graph; `Temp ⁰C`; then `SaO₂` `ETCO₂` `FiO₂`
      `MAC/BIS`; ten drug/fluid rows; `Urine` `Blood loss`. 10 cells per row, solid dividers
      on even boundaries, dotted on odd.
- [ ] Graph: 60 minor columns, solid every 6th; horizontals every 10 units from 200 to 20 and
      every 5 from 20 to 0; solid lines at 100 and 50; numbers
      `200 … 20 10 0`, right-aligned.
- [ ] Symbols: **Sys = open V, point on value. Dia = open Λ, point on value. Mean = small x on the
      line between them. PR = filled ●, no connecting line. CVP = filled ▼ in the 0–20 region.**
- [ ] No filled triangles, no MAP trend line by default, no SpO₂/ETCO₂/temp traces on the graph.
- [ ] Recovery row `SaO₂ BP PR RR Airway`; `X-Clamp / CPB / Tourniquet on/off/mins`;
      `Time In / Time out`; `Anaesthesiologist`; `dd/mm/yyyy`.
- [ ] `© Blaine & Associates 2022` in the footer; drop the `even 2A` print mark.

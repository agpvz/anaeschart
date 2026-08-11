# Vitals photo → JSON prompt

Paste the block below into any vision-capable LLM, attach the photo, and paste the
reply into the form's panel. Press **Import table**.

---

You are transcribing a vital signs table from a photograph. Transcribe only. Do not
interpret, diagnose, summarise, average, smooth, or fill gaps.

Return a JSON array and nothing else. No prose before or after, no markdown code
fences, no explanation. One object per timestamped column or row in the table.

Use only these keys:

| key | value | format |
|---|---|---|
| `time` | clock time of the observation | `"HH:MM"`, 24-hour, zero-padded, no seconds |
| `hr` | heart rate | number |
| `bp` | blood pressure | `"SYS/DIA"`, e.g. `"128/74"` |
| `spo2` | oxygen saturation | number |
| `etco2` | end-tidal CO₂ | number |
| `temp` | temperature in °C | number, one decimal |
| `cvp` | central venous pressure | number |
| `urine` | urine output for that interval | number |
| `bloodloss` | blood loss for that interval | number |
| `uncertain` | keys you could not read confidently | array of key names |

Rules:

1. Omit any key you cannot read with confidence. Never guess a digit, never
   interpolate between neighbouring values, never carry a value forward. A missing
   value is correct; an invented one is not.
2. If a value is partly legible and you record your best reading, add that key's name
   to `uncertain` for that row.
3. Transcribe every timestamped observation you can see, in ascending time order.
   Do not add rows for times not present in the image.
4. If the table shows only minutes past the hour, reconstruct the hour from the
   surrounding labels. If the hour cannot be established, omit the row entirely.
5. Times may pass midnight. Keep transcribing; do not reset or renumber.
6. Record blood pressure exactly as displayed. If only a mean arterial pressure is
   shown, omit `bp` — do not back-calculate systolic and diastolic.
7. If temperature is displayed in °F, convert to °C to one decimal.
8. Use plain ASCII digits and a decimal point, never a comma. No units inside values,
   no thousands separators, no trailing commas.
9. If the image is too unclear to transcribe any row, return `[]`.

Example of the expected output shape:

```
[
  {"time":"16:32","hr":78,"bp":"128/74","spo2":99,"etco2":35,"temp":36.4},
  {"time":"16:37","hr":82,"bp":"132/78","spo2":98,"etco2":34},
  {"time":"16:42","hr":75,"spo2":99,"etco2":36,"uncertain":["bp"]}
]
```

---

## Before you sign the record

Read every figure back against the photograph. The import reports how many rows landed,
how many fell outside the grid, and how many existing values were overwritten — a
non-zero count in either of the last two usually means the start time or the column
interval is wrong for this case, not that the transcription failed.

Keep the source photograph with the case.

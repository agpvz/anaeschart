#!/usr/bin/env node
// Validates an extraction against docs/extraction.schema.json, then lints it against
// the house rules the schema cannot express.
//
//     node tools/validate-extraction.mjs case.json
//     cat reply.json | node tools/validate-extraction.mjs
//
// Exit 0 when the payload is structurally valid — lint warnings do not fail the run,
// because a warning is a question for the anaesthetist, not a defect in the file.
//
// Deliberately dependency-free: it implements the subset of JSON Schema draft 2020-12
// that docs/extraction.schema.json actually uses.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'docs/extraction.schema.json'), 'utf8'));

const deref = (node) => {
  if (!node || !node.$ref) return node;
  const path = node.$ref.replace(/^#\//, '').split('/');
  return path.reduce((acc, key) => acc[key], schema);
};

const typeOf = (value) =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

const matchesType = (value, want) => {
  const got = typeOf(value);
  if (want === 'integer') return got === 'number' && Number.isInteger(value);
  return got === want;
};

function validate(value, node, path, errors) {
  node = deref(node);
  if (!node || Object.keys(node).length === 0) return;

  if (node.anyOf) {
    const branches = node.anyOf.map((branch) => {
      const required = deref(branch).required ?? [];
      const claims =
        typeOf(value) === 'object' && required.every((key) => key in value) ? required.length : -1;
      const sub = [];
      validate(value, branch, path, sub);
      return { errors: sub, claims };
    });
    if (branches.some((branch) => branch.errors.length === 0)) return;
    // Report against the branch the payload actually claims to be — the one whose
    // discriminating keys ("consent", "admission") are present — rather than whichever
    // happens to complain least. Otherwise a consent form with one bad date is reported
    // as a SASA case with an unknown "consent" field.
    const claimed = branches.filter((branch) => branch.claims >= 0);
    const pool = claimed.length ? claimed : branches;
    const best = pool.reduce((a, b) => {
      if (b.claims !== a.claims) return b.claims > a.claims ? b : a;
      return b.errors.length < a.errors.length ? b : a;
    });
    errors.push(...best.errors);
    return;
  }

  if (node.type) {
    const want = Array.isArray(node.type) ? node.type : [node.type];
    if (!want.some((t) => matchesType(value, t))) {
      errors.push(`${path || '/'}: expected ${want.join('|')}, got ${typeOf(value)}`);
      return;
    }
  }
  if (node.const !== undefined && value !== node.const) {
    errors.push(`${path}: must be ${JSON.stringify(node.const)}`);
  }
  if (node.enum && !node.enum.some((option) => option === value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not one of ${JSON.stringify(node.enum)}`);
  }
  if (node.pattern && typeof value === 'string' && !new RegExp(node.pattern).test(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} does not match ${node.pattern}`);
  }
  if (node.maxLength && typeof value === 'string' && value.length > node.maxLength) {
    errors.push(`${path}: longer than ${node.maxLength} characters`);
  }

  if (typeOf(value) === 'array') {
    if (node.maxItems && value.length > node.maxItems) {
      errors.push(`${path}: ${value.length} items, form holds ${node.maxItems}`);
    }
    if (node.items) {
      value.forEach((item, i) => validate(item, node.items, `${path}[${i}]`, errors));
    }
  }

  if (typeOf(value) === 'object') {
    for (const key of node.required ?? []) {
      if (!(key in value)) errors.push(`${path || '/'}: missing required "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const here = path ? `${path}.${key}` : key;
      if (node.propertyNames?.pattern && !new RegExp(node.propertyNames.pattern).test(key)) {
        errors.push(`${here}: key does not match ${node.propertyNames.pattern}`);
      }
      const declared = node.properties?.[key];
      if (declared) {
        validate(child, declared, here, errors);
      } else if (node.additionalProperties === false) {
        errors.push(`${here}: unknown field`);
      } else if (typeOf(node.additionalProperties) === 'object') {
        validate(child, node.additionalProperties, here, errors);
      }
    }
  }
}

// ── house rules the schema cannot state ──────────────────────────────────────────
const at = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

const minutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

function lint(data) {
  const warnings = [];
  const payload = data.data ?? data;

  const walkFalse = (node, path) => {
    if (node === false) warnings.push(`${path}: false recorded — an unticked box means unanswered, not no`);
    else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        walkFalse(child, path ? `${path}.${key}` : key);
      }
    }
  };
  walkFalse(payload, '');

  for (const path of payload.uncertain ?? []) {
    if (at(payload, path) === undefined) {
      warnings.push(`uncertain lists ${path}, but no value was recorded there`);
    }
  }

  const start = payload.chart?.startTime;
  const step = Number(payload.chart?.interval);
  if (start && step) {
    const span = minutes(start) + step * 29;
    for (const row of payload.observations ?? []) {
      const t = minutes(row.time);
      if (t < minutes(start) || t > span) {
        warnings.push(`observation ${row.time} falls outside the grid — it will be skipped on import`);
      }
    }
  } else if ((payload.observations ?? []).length) {
    warnings.push('observations present without chart.startTime and chart.interval — the grid is undefined');
  }

  for (const row of payload.observations ?? []) {
    if (typeof row.bp === 'string' && row.bp.includes('/')) {
      const [sys, dia] = row.bp.split('/').map(Number);
      if (sys <= dia) warnings.push(`observation ${row.time}: bp ${row.bp} has systolic at or below diastolic`);
    }
  }

  const { startTime, endTime } = payload.record ?? {};
  if (startTime && endTime && minutes(endTime) < minutes(startTime)) {
    warnings.push('record.endTime is before record.startTime');
  }
  const { timeFrom, timeTo, timeMin } = payload.case ?? {};
  if (timeFrom && timeTo && timeMin != null) {
    const span = minutes(timeTo) - minutes(timeFrom);
    if (span !== Number(timeMin)) {
      warnings.push(`case.timeMin is ${timeMin} but timeFrom→timeTo spans ${span} minutes`);
    }
  }

  const id = payload.account?.idNo ?? payload.patient?.idNo;
  const dob = payload.patient?.birthDate;
  if (id && dob && /^\d{13}$/.test(id)) {
    const encoded = id.slice(0, 6);
    const written = dob.slice(2).replace(/-/g, '');
    if (encoded !== written) {
      warnings.push(`identity number encodes ${encoded} but birthDate reads ${written} — transcribe both, do not reconcile`);
    }
  }

  if (payload.member?.idNo && payload.patient?.idNo && payload.member.idNo === payload.patient.idNo) {
    warnings.push('member.idNo equals patient.idNo — confirm the main member really is the patient');
  }

  for (const clause of ['risksAndSideEffects', 'pleaseNote']) {
    if (payload.consent && !at(payload, `consent.initials.${clause}`)) {
      warnings.push(`consent.initials.${clause} is absent — clause not initialled`);
    }
  }

  return warnings;
}

// ── run ──────────────────────────────────────────────────────────────────────────
const source = process.argv[2];
const text = source ? readFileSync(source, 'utf8') : readFileSync(0, 'utf8');

let data;
try {
  data = JSON.parse(text);
} catch (error) {
  console.error(`not JSON: ${error.message}`);
  process.exit(2);
}

const errors = [];
validate(data, schema, '', errors);
const warnings = lint(data);

for (const error of errors) console.error(`error   ${error}`);
for (const warning of warnings) console.warn(`warning ${warning}`);

const label = source ?? 'stdin';
if (errors.length) {
  console.error(`\n${label}: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`${label}: valid · ${warnings.length} warning(s)`);

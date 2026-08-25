#!/usr/bin/env node
// Generates docs/extraction.schema.json from docs/schema.json.
//
// The SASA half is derived, never hand-written, so it cannot drift from the form:
//     node tools/build-json-schema.mjs
// after adding a field and regenerating docs/schema.json with
//     JSON.stringify(SASA.schema(), null, 2)
//
// The consent and admission halves have no live form to introspect, so they are
// declared below and must be edited here rather than in the generated output.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATE = '^\\d{4}-\\d{2}-\\d{2}$';
const TIME = '^([01]\\d|2[0-3]):[0-5]\\d$';
const DATETIME = '^\\d{4}-\\d{2}-\\d{2}T([01]\\d|2[0-3]):[0-5]\\d$';
const ID13 = '^\\d{13}$';

// Radio groups all report as "yes|no" in the generated field list; these are the
// ones whose options are something else.
const OVERRIDE = {
  'technique.dltSide': { type: 'string', enum: ['R', 'L'] },
  'chart.interval': { type: 'string', enum: ['5', '15'] },
  'agents[].unit': { type: 'string', enum: ['g', 'mg', 'mcg'] },
  'account.idNo': { type: 'string', pattern: ID13 },
};

// Form fields are text inputs; the importer coerces a number into one happily, and
// the extraction prompts ask for bare numbers in places (case.timeMin). Accept both
// rather than failing a reply that is materially correct.
const TEXT = { type: ['string', 'number'] };

const leaf = (spec, path) => {
  if (OVERRIDE[path]) return OVERRIDE[path];
  switch (spec) {
    case 'text': return { ...TEXT };
    case 'longtext': return { type: 'string' };
    case 'number': return { type: 'number' };
    case 'boolean': return { type: 'boolean' };
    case 'date': return { type: 'string', pattern: DATE };
    case 'time': return { type: 'string', pattern: TIME };
    case 'yes|no': return { type: 'string', enum: ['yes', 'no'] };
    case 'hidden': return { type: ['number', 'string', 'null'] };
    case 'number[] (derived, read-only)':
      return { type: 'array', items: { type: ['number', 'null'] }, readOnly: true };
    default: return {};
  }
};

const build = (node, path = '') => {
  if (Array.isArray(node)) {
    return { type: 'array', maxItems: node.length, items: build(node[0], `${path}[]`) };
  }
  if (node && typeof node === 'object') {
    const properties = {};
    for (const [key, value] of Object.entries(node)) {
      properties[key] = build(value, path ? `${path}.${key}` : key);
    }
    return { type: 'object', additionalProperties: false, properties };
  }
  return leaf(node, path);
};

const generated = build(JSON.parse(readFileSync(join(root, 'docs/schema.json'), 'utf8')));

// codes/units are keyed by billing code, so the generated list of codes seen so far
// must not become a closed set.
generated.properties.codes = {
  type: 'object',
  description: 'Billing codes as keys, leading zero kept.',
  propertyNames: { pattern: '^\\d{3,4}$' },
  additionalProperties: { type: 'boolean' },
};
generated.properties.units = {
  type: 'object',
  description: 'Minutes per time-based billing code.',
  propertyNames: { pattern: '^\\d{3,4}$' },
  additionalProperties: { ...TEXT },
};

// Two history rows give their details cell over to other fields, so they have no
// .details input. A details string sent for either is dropped silently on import.
generated.properties.history.properties.porphyria.description =
  'Details cell is replaced by history.weightKg and history.heightM — no .details field.';
generated.properties.history.properties.reflux.description =
  'Details cell is replaced by history.lastIntake — no .details field.';

const observation = {
  type: 'object',
  additionalProperties: false,
  required: ['time'],
  properties: {
    time: { type: 'string', pattern: TIME },
    hr: { type: 'number' },
    bp: { type: 'string', pattern: '^\\d{2,3}/\\d{2,3}$' },
    sys: { type: 'number' },
    dia: { type: 'number' },
    spo2: { type: 'number' },
    etco2: { type: 'number' },
    temp: { type: 'number' },
    cvp: { type: 'number' },
    urine: { type: 'number' },
    bloodloss: { type: 'number' },
    fluids: { ...TEXT },
    uncertain: { type: 'array', items: { type: 'string' } },
  },
};

const uncertain = {
  type: 'array',
  description: 'Dotted paths recorded but not read confidently.',
  items: { type: 'string' },
};

const meta = { type: 'object', description: 'Copyright and provenance block written by the exporter.' };

// The SASA payload: the form itself, plus the two importer-only keys.
const sasaCase = {
  ...generated,
  title: 'SASA anaesthesia case',
  properties: {
    ...generated.properties,
    observations: { type: 'array', items: observation },
    uncertain,
    _meta: meta,
  },
};

const blaineConsent = {
  type: 'object',
  title: 'Blaine and Associates consent to anaesthesia and professional fees',
  additionalProperties: false,
  required: ['consent'],
  properties: {
    consent: {
      type: 'object',
      additionalProperties: false,
      properties: {
        formId: { type: 'string', const: 'blaine-consent-v2019' },
        formRevision: { ...TEXT },
        patientName: { type: 'string' },
        guardianName: { type: 'string' },
        signed: { type: 'boolean' },
        signatureDate: { type: 'string', pattern: DATE },
        procedure: { type: 'string' },
        procedureDate: { type: 'string', pattern: DATE },
        surgeon: { type: 'string' },
        initials: {
          type: 'object',
          additionalProperties: false,
          properties: {
            risksAndSideEffects: { type: 'string', maxLength: 8 },
            pleaseNote: { type: 'string', maxLength: 8 },
          },
        },
      },
    },
    uncertain,
    _meta: meta,
  },
};

const person = (extra = {}) => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' }, surname: { type: 'string' }, firstNames: { type: 'string' },
    initials: { type: 'string' }, idNo: { type: 'string', pattern: ID13 },
    address1: { type: 'string' }, address2: { type: 'string' }, address3: { type: 'string' },
    postalCode: { ...TEXT }, email: { type: 'string' },
    ...extra,
  },
});

const yesNo = { type: 'string', enum: ['yes', 'no'] };

const mediclinicAdmission = {
  type: 'object',
  title: 'Mediclinic admission summary (D 2700)',
  additionalProperties: false,
  required: ['admission'],
  properties: {
    admission: {
      type: 'object',
      additionalProperties: false,
      properties: {
        formCode: { type: 'string' }, stickerOnly: { type: 'boolean' },
        facility: { type: 'string' }, facilityAddress: { type: 'string' },
        facilityPostal: { type: 'string' }, facilityTel: { type: 'string' },
        facilityFax: { type: 'string' }, vatNo: { type: 'string' }, regNo: { type: 'string' },
        practiceNo: { type: 'string' }, ref: { type: 'string' }, caseNo: { type: 'string' },
        bed: { type: 'string' }, bedWard: { type: 'string' }, patientType: { type: 'string' },
        finClass: { type: 'string' }, hsc: { type: 'string' },
        admittedAt: { type: 'string', pattern: DATETIME }, admittedBy: { type: 'string' },
        printedAt: { type: 'string', pattern: DATETIME }, printedBy: { type: 'string' },
      },
    },
    patient: person({
      birthDate: { type: 'string', pattern: DATE },
      sex: { type: 'string', enum: ['Male', 'Female'] },
      ageText: { type: 'string', pattern: '^\\d{1,3}y(\\d{1,2}m)?$' },
      ageYears: { type: 'number' }, tel: { type: 'string' }, religion: { type: 'string' },
      referDoc: { type: 'string' }, familyDoc: { type: 'string' },
      admitDoc: { type: 'string' }, admitDocPracticeNo: { type: 'string' },
    }),
    member: person({
      telHome: { type: 'string' }, telWork: { type: 'string' }, celWork: { type: 'string' },
      employerOccupation: { type: 'string' }, employerName: { type: 'string' },
      employerAddress1: { type: 'string' }, employerAddress2: { type: 'string' },
    }),
    signatory: person({
      name: { type: 'string' }, telHome: { type: 'string' }, isPatient: { type: 'boolean' },
    }),
    medicalAid: {
      type: 'object',
      additionalProperties: false,
      properties: {
        scheme: { type: 'string' }, plan: { type: 'string' }, number: { ...TEXT },
        preAuthNo: { ...TEXT }, dependantCode: { ...TEXT },
      },
    },
    patientEmployer: {
      type: 'object',
      additionalProperties: false,
      properties: {
        occupation: { type: 'string' }, name: { type: 'string' },
        address: { type: 'string' }, telWork: { ...TEXT },
      },
    },
    nextOfKin: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' }, relationship: { type: 'string' }, tel: { type: 'string' },
        },
      },
    },
    codes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'code'],
        properties: {
          seq: { ...TEXT }, flag: { type: 'string' },
          type: { type: 'string', enum: ['ICD', 'CPT'] },
          code: { type: 'string' }, modifier: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    diagnosis: {
      type: 'object',
      additionalProperties: false,
      properties: {
        description: { type: 'string' }, finalDiagnosis: { type: 'string' },
        procedure: { type: 'string' },
      },
    },
    consents: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ucr: yesNo, dataPrivacy: yesNo, coPayments: yesNo, exclusions: yesNo,
        survey: yesNo, prosthesisLimitExplained: yesNo, smsEmail: yesNo,
        belongings: { type: 'integer', enum: [1, 2] },
      },
    },
    footer: {
      type: 'object',
      additionalProperties: false,
      properties: { doctorSigned: { type: 'boolean' }, date: { type: 'string', pattern: DATE } },
    },
    uncertain,
    _meta: meta,
  },
};

// A second pass returns the payload wrapped with its audit trail.
const review = {
  type: 'object',
  additionalProperties: false,
  required: ['form', 'data'],
  properties: {
    form: { type: 'string', enum: ['sasa-case', 'blaine-consent-v2019', 'mediclinic-admission'] },
    data: {
      anyOf: [
        { $ref: '#/$defs/sasaCase' },
        { $ref: '#/$defs/blaineConsent' },
        { $ref: '#/$defs/mediclinicAdmission' },
      ],
    },
    review: {
      type: 'object',
      additionalProperties: false,
      properties: {
        added: { type: 'array', items: { type: 'string' } },
        removed: { type: 'array', items: { type: 'string' } },
        confirmed: { type: 'array', items: { type: 'string' } },
        corrected: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path', 'to'],
            properties: {
              path: { type: 'string' },
              from: {}, to: {},
              reason: { type: 'string' },
            },
          },
        },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path'],
            properties: {
              path: { type: 'string' },
              values: { type: 'array' },
              resolution: { type: 'string', enum: ['kept', 'omitted', 'reread'] },
              reason: { type: 'string' },
            },
          },
        },
        stillUncertain: { type: 'array', items: { type: 'string' } },
        checks: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://github.com/agpvz/anaeschart/docs/extraction.schema.json',
  title: 'Anaesthesia paperwork extraction',
  description:
    'Validates a vision model reply for any of the three forms, bare or wrapped in a ' +
    'second-pass review envelope. The SASA half is generated from docs/schema.json by ' +
    'tools/build-json-schema.mjs — regenerate rather than editing it here.',
  anyOf: [
    { $ref: '#/$defs/review' },
    { $ref: '#/$defs/sasaCase' },
    { $ref: '#/$defs/blaineConsent' },
    { $ref: '#/$defs/mediclinicAdmission' },
  ],
  $defs: { sasaCase, blaineConsent, mediclinicAdmission, review },
};

writeFileSync(join(root, 'docs/extraction.schema.json'), JSON.stringify(schema, null, 2) + '\n');
console.log('docs/extraction.schema.json written');

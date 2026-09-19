/**
 * Every event-specific value lives here. Anything the organiser has not confirmed is
 * marked `confirmed: false` and renders with a visible "not confirmed" flag, so nobody
 * can mistake a development placeholder for official information.
 *
 * PRE_LAUNCH_CHECKLIST.md tracks what still needs replacing.
 */

export interface Unconfirmed<T> {
  value: T;
  confirmed: boolean;
}

const todo = <T>(value: T): Unconfirmed<T> => ({ value, confirmed: false });
const confirmed = <T>(value: T): Unconfirmed<T> => ({ value, confirmed: true });

export const eventConfig = {
  name: 'Witches Glow Run',
  // Proposed, not official copy. Swap freely.
  tagline: todo('A little magic. A lot of miles.'),

  date: todo('PLACEHOLDER: event date'),
  time: todo('PLACEHOLDER: flag-off time'),
  venue: todo('PLACEHOLDER: venue and meeting point'),
  distance: confirmed('5 KM'),
  organiser: todo('PLACEHOLDER: organising body'),
  contactNumber: todo('PLACEHOLDER: organiser contact number'),

  maxCapacity: 500,

  /** Fees are money. None of these render until the organiser confirms them. */
  categories: [
    { id: 'um_student', label: 'UM Student', fee: todo('PLACEHOLDER: fee'), eligibility: 'Current Universiti Malaya students. Matriculation number required at registration.' },
    { id: 'um_staff', label: 'UM Staff', fee: todo('PLACEHOLDER: fee'), eligibility: 'Staff currently employed by Universiti Malaya.' },
    { id: 'um_alumni', label: 'UM Alumni', fee: todo('PLACEHOLDER: fee'), eligibility: 'Graduates of Universiti Malaya.' },
    { id: 'public', label: 'Public', fee: todo('PLACEHOLDER: fee'), eligibility: 'Open to everyone.' },
  ],

  payment: {
    instructions: todo('PLACEHOLDER: how to pay: bank, account name, account number or QR.'),
    qrImage: null as string | null, // put a file in web/public/ and reference it here
  },

  /** Posters supplied by the organiser. Drop files in web/public/ and set the path. */
  posters: {
    route: null as string | null,
    tentative: null as string | null,
    entitlements: null as string | null,
    luckyDraw: null as string | null,
    sizeChart: null as string | null,
  },

  route: {
    /** Named stops along the course, in running order. Empty until the organiser confirms them. */
    points: [] as Array<{ label: string; at?: string }>,
    description: todo('PLACEHOLDER: start point, finish point, and route notes.'),
  },

  /** Times are official information. An empty schedule renders as "to be announced". */
  schedule: [] as Array<{ time: string; activity: string; detail?: string }>,

  entitlements: [] as Array<{ item: string; detail?: string }>,
  entitlementNotes: todo('PLACEHOLDER: what is and is not included.'),

  luckyDraw: {
    prizes: [] as string[],
    eligibility: todo('PLACEHOLDER: who qualifies for the draw.'),
    timing: todo('PLACEHOLDER: when the draw happens.'),
  },

  tshirt: {
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    chartNote: todo('PLACEHOLDER: chest width and body length per size, with units.'),
  },

  whatsapp: {
    inviteUrl: null as string | null,
    qrImage: null as string | null,
    // 'after_registration' hides the group until a registration is accepted.
    visibility: 'after_registration' as 'always' | 'after_registration',
  },

  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
    facebook: null as string | null,
  },

  terms: {
    version: 'PLACEHOLDER-v0',
    // Replace wholesale with organiser-approved wording. Do not ship this text.
    body: todo(
      'PLACEHOLDER: the organiser has not yet supplied the terms and conditions. This must be replaced with approved wording covering event rules, payment and refund policy, participant responsibilities and safety requirements before registration opens.',
    ),
    checkboxLabel:
      'I have read and agree to the Witches Glow Run terms and conditions, including the event rules, payment and refund policy, participant responsibilities, and applicable safety requirements.',
  },

  privacyNotice:
    'We collect your name, email address, phone number, category, matriculation number where applicable, T-shirt size and proof of payment, solely to run this event. Payment receipts are stored privately and are visible only to the organising committee. Participant details are not published. Records are deleted after the retention period set by the organiser.',
} as const;

export type EventConfig = typeof eventConfig;
export const isPlaceholder = (field: Unconfirmed<unknown>) => !field.confirmed;

const isUnconfirmed = (value: unknown): value is Unconfirmed<unknown> =>
  typeof value === 'object' && value !== null && 'confirmed' in value && 'value' in value;

/** Dotted paths of every field still waiting on the organiser. Development aid only. */
export function listUnconfirmed(): string[] {
  const found: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (isUnconfirmed(node)) {
      if (!node.confirmed) found.push(path);
    } else if (Array.isArray(node)) {
      if (node.length === 0) found.push(`${path} (empty)`);
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (typeof node === 'object' && node !== null) {
      for (const [key, value] of Object.entries(node)) walk(value, path ? `${path}.${key}` : key);
    }
  };
  walk(eventConfig, '');
  return found;
}

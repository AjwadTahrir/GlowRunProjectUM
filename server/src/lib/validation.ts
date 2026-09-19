import { z } from 'zod';

/**
 * Kept deliberately in sync with web/src/lib/validation.ts.
 * The server copy is authoritative — the browser copy exists only for fast feedback.
 */

export const CATEGORIES = ['um_student', 'um_staff', 'um_alumni', 'public'] as const;
export type Category = (typeof CATEGORIES)[number];

export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

/**
 * Accepts Malaysian mobile and landline formats (01x/0x, with or without +60),
 * and any plausible international number, without being precious about
 * spaces, dashes or brackets. Overly strict phone rules reject real people.
 */
const PHONE = /^\+?[0-9][0-9\s\-()]{6,18}[0-9]$/;

export const registrationInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Enter your email address')
      .max(254)
      .email('That email address does not look right')
      .transform((v) => v.toLowerCase()),

    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(120, 'That name is longer than we can store')
      // Letters (any script), spaces, and the punctuation real names contain.
      .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-/@]*$/u, 'Use letters, spaces, apostrophes and hyphens'),

    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),

    matriculationNumber: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('').transform(() => undefined)),

    phoneNumber: z
      .string()
      .trim()
      .min(1, 'Enter a phone number')
      .regex(PHONE, 'Enter a reachable phone number, for example 012-345 6789')
      .transform((v) => v.replace(/[\s\-()]/g, '')),

    tshirtSize: z.enum(TSHIRT_SIZES, { errorMap: () => ({ message: 'Choose a T-shirt size' }) }),

    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You need to agree to the terms before registering' }),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.category === 'um_student' && !value.matriculationNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matriculationNumber'],
        message: 'UM students need to give a matriculation number',
      });
    }
  })
  // A stale matric number from a category the participant switched away from is dropped here,
  // so it can never reach the database or the spreadsheet.
  .transform((value) => ({
    ...value,
    matriculationNumber: value.category === 'um_student' ? value.matriculationNumber! : undefined,
  }));

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

/** What the browser posts: the validated fields plus the signed upload reference. */
export const registrationRequestSchema = z.object({
  registration: z.unknown(),
  uploadRef: z.string().min(1, 'Attach your proof of payment'),
});

export const CATEGORY_LABELS: Record<Category, string> = {
  um_student: 'UM Student',
  um_staff: 'UM Staff',
  um_alumni: 'UM Alumni',
  public: 'Public',
};

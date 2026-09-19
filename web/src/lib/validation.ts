import { z } from 'zod';

/**
 * Mirror of server/src/lib/validation.ts. The server copy is authoritative — this one
 * exists so the participant gets feedback before submitting. Keep them in step.
 */

export const CATEGORIES = ['um_student', 'um_staff', 'um_alumni', 'public'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  um_student: 'UM Student',
  um_staff: 'UM Staff',
  um_alumni: 'UM Alumni',
  public: 'Public',
};

const PHONE = /^\+?[0-9][0-9\s\-()]{6,18}[0-9]$/;

export const registrationSchema = z
  .object({
    email: z.string().trim().min(1, 'Enter your email address').email('That email address does not look right'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name')
      .max(120, 'That name is longer than we can store')
      .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-/@]*$/u, 'Use letters, spaces, apostrophes and hyphens'),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),
    matriculationNumber: z.string().trim().max(30).optional(),
    phoneNumber: z
      .string()
      .trim()
      .min(1, 'Enter a phone number')
      .regex(PHONE, 'Enter a reachable phone number, for example 012-345 6789'),
    tshirtSize: z.string().min(1, 'Choose a T-shirt size'),
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
  });

export type RegistrationFormValues = z.input<typeof registrationSchema>;

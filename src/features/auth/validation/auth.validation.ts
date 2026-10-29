import { z } from 'zod';

import { AUTH_CONSTANTS } from '../constants';

export const phoneValidationSchema = z.object({
  phoneNumber: z
    .string()
    .regex(new RegExp(`^\\d{${AUTH_CONSTANTS.phoneLength}}$`), 'Enter a valid mobile number'),
});

export const otpValidationSchema = z.object({
  code: z
    .string()
    .regex(new RegExp(`^\\d{${AUTH_CONSTANTS.otpLength}}$`), 'Enter the complete code'),
});

export const profileValidationSchema = z.object({
  fullName: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  /** Gender is backend-controlled via identity verification — not required on mobile forms. */
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export const isProfileFormComplete = (
  values: Partial<z.infer<typeof profileValidationSchema>>,
): boolean => profileValidationSchema.safeParse(values).success;

export type PhoneFormValues = z.infer<typeof phoneValidationSchema>;
export type OtpFormValues = z.infer<typeof otpValidationSchema>;
export type ProfileFormValues = z.infer<typeof profileValidationSchema>;

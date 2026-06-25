import { z } from 'zod';

// GSTIN Regex (15 alphanumeric characters)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
// Phone regex (e.g. 10-digit number optionally prefixed with country code)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
// Uppercase code regex (letters, numbers, underscore only)
const UPPER_CODE_REGEX = /^[A-Z0-9_]+$/;

/**
 * Zod validation schema for Tenant Company Add/Edit Form
 */
export const tenantFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters.' })
    .max(100, { message: 'Company name must be under 100 characters.' }),
  code: z
    .string()
    .min(2, { message: 'Company code must be at least 2 characters.' })
    .max(10, { message: 'Company code must be under 10 characters.' })
    .regex(UPPER_CODE_REGEX, { message: 'Company code must be uppercase alphanumeric and underscores only.' }),
  contactPerson: z
    .string()
    .min(2, { message: 'Contact person name must be at least 2 characters.' }),
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits.' })
    .regex(PHONE_REGEX, { message: 'Please enter a valid phone number (e.g. +919876543210).' }),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters.' }),
  gstNumber: z
    .string()
    .optional()
    .refine((val) => !val || GSTIN_REGEX.test(val), {
      message: 'Please enter a valid 15-digit GSTIN (e.g., 22AAAAA1111A1Z1).',
    }),
  subscriptionPlan: z.enum(['Basic', 'Standard', 'Premium', 'Enterprise']),
  maxUsers: z.number().int().min(1, { message: 'Maximum users must be at least 1.' }),
  status: z.enum(['Active', 'Suspended', 'Pending']),
  adminPassword: z.string().optional(),
});

export type TenantFormFields = z.infer<typeof tenantFormSchema>;

/**
 * Zod validation schema for Master Type Add/Edit Form
 */
export const masterTypeFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Type name must be at least 2 characters.' }),
  code: z
    .string()
    .min(2, { message: 'Code must be at least 2 characters.' })
    .regex(UPPER_CODE_REGEX, { message: 'Code must be uppercase alphanumeric and underscores only.' }),
  description: z
    .string()
    .max(250, { message: 'Description must be under 250 characters.' }),
  status: z.enum(['Active', 'Inactive']),
});

export type MasterTypeFormFields = z.infer<typeof masterTypeFormSchema>;

/**
 * Zod validation schema for Master Data Item Form
 */
export const masterDataFormSchema = z.object({
  name: z.string().optional(),
  code: z
    .string()
    .min(1, { message: 'Code is required.' })
    .regex(UPPER_CODE_REGEX, { message: 'Code must be uppercase alphanumeric and underscores only.' }),
  sortOrder: z.number().int().min(0, { message: 'Sort order must be 0 or higher.' }),
  status: z.enum(['Active', 'Inactive']),
  typeCode: z.string().optional(),
  translations: z.object({
    en: z.string().min(1, { message: 'English translation is required.' }),
    hi: z.string().optional(),
    ta: z.string().optional(),
    te: z.string().optional(),
    mr: z.string().optional(),
    bn: z.string().optional(),
  }),
});

export type MasterDataFormFields = z.infer<typeof masterDataFormSchema>;

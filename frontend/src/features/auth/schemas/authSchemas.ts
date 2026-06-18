import { z } from 'zod';

/**
 * Validation schema for the Login Form
 */
export const loginSchema = z.object({
  company: z.string().optional(),
  username: z
    .string()
    .min(1, { message: 'Username is required.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .min(6, { message: 'Password must be at least 6 characters long.' }),
  rememberMe: z.boolean(),
});

export type LoginFields = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  companyName: z.string().min(1, { message: 'Company name is required.' }),
  adminName: z.string().min(1, { message: 'Admin full name is required.' }),
  username: z.string().min(1, { message: 'Username/Email is required.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .min(6, { message: 'Password must be at least 6 characters long.' }),
});

export type RegisterFields = z.infer<typeof registerSchema>;

/**
 * Validation schema for the Forgot Password Form
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid work email address.' }),
});

export type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

/**
 * Validation schema for the 2FA OTP Form
 */
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: 'Verification code must be exactly 6 digits.' })
    .regex(/^\d+$/, { message: 'Verification code must contain only numbers.' }),
});

export type OTPFields = z.infer<typeof otpSchema>;

import { z } from 'zod';

export const officeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  is_active: z.boolean(),
});

export type OfficeFormValues = z.infer<typeof officeFormSchema>;

// Create schema — password required for new employees
export const userCreateFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'receptionist', 'security', 'employee']),
  phone: z.string().optional().or(z.literal('')),
  office_id: z.string().min(1, 'Please select an office'),
  telegram_id: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
});

export type UserCreateFormValues = z.infer<typeof userCreateFormSchema>;

// Edit schema — password optional
export const userEditFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'receptionist', 'security', 'employee']),
  phone: z.string().optional().or(z.literal('')),
  office_id: z.string().min(1, 'Please select an office'),
  telegram_id: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
});

export type UserEditFormValues = z.infer<typeof userEditFormSchema>;

// Backward compat alias
export const userFormSchema = userEditFormSchema;
export type UserFormValues = UserEditFormValues;

export const masterDataFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['purpose', 'department']),
  sortOrder: z.number().min(1, 'Sort order must be at least 1'),
  is_active: z.boolean(),
});

export type MasterDataFormValues = z.infer<typeof masterDataFormSchema>;

export const blacklistFormSchema = z.object({
  reason: z.string().min(4, 'Blacklist reason must be at least 4 characters'),
});

export type BlacklistFormValues = z.infer<typeof blacklistFormSchema>;

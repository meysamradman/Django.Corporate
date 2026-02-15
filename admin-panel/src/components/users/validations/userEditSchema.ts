import { z } from 'zod';
import { msg } from '@/core/messages';
import {
  validateMobile,
  validateEmail,
  validateNationalId,
  validatePhone,
} from '@/core/validation';

export const userEditSchema = z.object({
  firstName: z.string().min(1, { message: msg.validation('required', { field: 'نام' }) }).max(50, { message: msg.validation('maxLength', { field: 'نام', max: 50 }) }),
  lastName: z.string().min(1, { message: msg.validation('required', { field: 'نام خانوادگی' }) }).max(50, { message: msg.validation('maxLength', { field: 'نام خانوادگی', max: 50 }) }),
  mobile: z.string().superRefine((val, ctx) => {
    const result = validateMobile(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('mobileInvalid'),
      });
    }
  }),
  email: z.string().superRefine((val, ctx) => {
    if (!val || val === '') return;
    const result = validateEmail(val, false);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('emailInvalid'),
      });
    }
  }).optional().or(z.literal('')),
  phone: z.string().superRefine((val, ctx) => {
    if (!val || val === '') return;
    const result = validatePhone(val, false);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('phoneInvalid'),
      });
    }
  }).optional().or(z.literal('')),
  nationalId: z.string().superRefine((val, ctx) => {
    if (!val || val === '') return;
    const result = validateNationalId(val, false, false);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('nationalIdInvalid'),
      });
    }
  }).optional().or(z.literal('')),
  address: z.string().max(500, { message: msg.validation('addressMaxLength') }).optional().or(z.literal('')),
  bio: z.string().max(1000, { message: msg.validation('bioMaxLength') }).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
});

export type UserEditValues = z.infer<typeof userEditSchema>;

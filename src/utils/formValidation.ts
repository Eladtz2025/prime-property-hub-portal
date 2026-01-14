import { z } from 'zod';

// Hebrew name validation regex - allows Hebrew, English letters, spaces, hyphens, and apostrophes
const hebrewNameRegex = /^[a-zA-Z\u0590-\u05FF\s'-]+$/;

// Israeli ID validation (9 digits)
const israeliIdRegex = /^\d{9}$/;

// Phone validation - Israeli format (more permissive for various input formats)
const israeliPhoneRegex = /^(\+972|972|0)?-?[2-9]\d{1,2}[-\s]?\d{3}[-\s]?\d{4}$/;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ========== Validation Schemas with Hebrew Error Messages ==========

// Phone validation schema - supports Israeli and international formats
export const phoneSchema = z.string()
  .trim()
  .refine((val) => {
    if (!val) return true; // Optional - empty is ok
    const cleaned = val.replace(/[-\s()]/g, '');
    
    // Israeli format
    const isIsraeli = israeliPhoneRegex.test(val) || /^0[2-9]\d{7,8}$/.test(cleaned) || /^\+?972[2-9]\d{7,8}$/.test(cleaned);
    
    // International format: starts with + followed by 7-15 digits
    const isInternational = /^\+?[1-9]\d{6,14}$/.test(cleaned);
    
    return isIsraeli || isInternational;
  }, 'מספר טלפון לא תקין');

// Required phone validation - supports Israeli and international formats
export const requiredPhoneSchema = z.string()
  .trim()
  .min(1, 'מספר טלפון הוא שדה חובה')
  .refine((val) => {
    const cleaned = val.replace(/[-\s()]/g, '');
    
    // Israeli format
    const isIsraeli = israeliPhoneRegex.test(val) || /^0[2-9]\d{7,8}$/.test(cleaned) || /^\+?972[2-9]\d{7,8}$/.test(cleaned);
    
    // International format: starts with + followed by 7-15 digits
    const isInternational = /^\+?[1-9]\d{6,14}$/.test(cleaned);
    
    return isIsraeli || isInternational;
  }, 'מספר טלפון לא תקין');

// Email validation schema
export const emailSchema = z.string()
  .trim()
  .refine((val) => {
    if (!val) return true; // Optional - empty is ok
    return emailRegex.test(val);
  }, 'כתובת אימייל לא תקינה');

// Required email validation
export const requiredEmailSchema = z.string()
  .trim()
  .min(1, 'אימייל הוא שדה חובה')
  .email('כתובת אימייל לא תקינה');

// Israeli ID validation with Luhn algorithm
export const israeliIdSchema = z.string()
  .trim()
  .refine((val) => {
    if (!val) return true; // Optional
    return israeliIdRegex.test(val);
  }, 'תעודת זהות חייבת להכיל 9 ספרות')
  .refine((val) => {
    if (!val) return true;
    if (!israeliIdRegex.test(val)) return true; // Let first check handle format
    const digits = val.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      const step = digit * ((index % 2) + 1);
      return acc + (step > 9 ? step - 9 : step);
    }, 0);
    return sum % 10 === 0;
  }, 'מספר תעודת הזהות אינו תקין');

// Required name validation
export const requiredNameSchema = z.string()
  .trim()
  .min(1, 'שם הוא שדה חובה')
  .min(2, 'שם חייב להכיל לפחות 2 תווים')
  .max(100, 'שם ארוך מדי');

// Amount validation (for payments, budgets, etc.)
export const amountSchema = z.string()
  .refine((val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'יש להזין סכום תקין');

// ========== Helper function to validate a single field ==========
export const validateField = <T>(
  schema: z.ZodType<T>,
  value: unknown
): string | null => {
  const result = schema.safeParse(value);
  if (result.success) {
    return null;
  }
  return result.error.errors[0]?.message || 'שגיאת אימות';
};

// ========== Type for form errors state ==========
export type FormErrors<T extends string> = Partial<Record<T, string>>;
export type FormTouched<T extends string> = Partial<Record<T, boolean>>;

// Brokerage form validation schema
export const brokerageFormSchema = z.object({
  date: z.string().min(1, 'תאריך חובה'),
  referredBy: z.string().max(100, 'שם ארוך מדי').optional(),
  feeTypeRental: z.boolean(),
  feeTypeSale: z.boolean(),
  specialTerms: z.string().max(500, 'תנאים מיוחדים ארוכים מדי').optional(),
  clientName: z.string()
    .trim()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי')
    .regex(hebrewNameRegex, 'שם מכיל תווים לא חוקיים'),
  clientId: z.string()
    .trim()
    .regex(israeliIdRegex, 'תעודת זהות חייבת להכיל 9 ספרות')
    .refine((id) => {
      const digits = id.split('').map(Number);
      const sum = digits.reduce((acc, digit, index) => {
        const step = digit * ((index % 2) + 1);
        return acc + (step > 9 ? step - 9 : step);
      }, 0);
      return sum % 10 === 0;
    }, 'מספר תעודת הזהות אינו תקין'),
  clientPhone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  agentName: z.string()
    .trim()
    .min(2, 'שם סוכן חובה')
    .max(100, 'שם ארוך מדי'),
  agentId: z.string()
    .trim()
    .regex(israeliIdRegex, 'תעודת זהות חייבת להכיל 9 ספרות')
    .refine((id) => {
      const digits = id.split('').map(Number);
      const sum = digits.reduce((acc, digit, index) => {
        const step = digit * ((index % 2) + 1);
        return acc + (step > 9 ? step - 9 : step);
      }, 0);
      return sum % 10 === 0;
    }, 'מספר תעודת הזהות אינו תקין'),
});

// Property row validation
export const propertyRowSchema = z.object({
  address: z.string().max(200, 'כתובת ארוכה מדי').optional(),
  floor: z.string().max(20, 'קומה ארוכה מדי').optional(),
  rooms: z.string().max(20, 'מספר חדרים ארוך מדי').optional(),
  price: z.string().max(50, 'מחיר ארוך מדי').optional(),
});

// Validate Israeli ID using Luhn algorithm
const validateIsraeliID = (id: string): boolean => {
  if (!/^\d{9}$/.test(id)) return false;
  
  const digits = id.split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    const step = digit * ((index % 2) + 1);
    return acc + (step > 9 ? step - 9 : step);
  }, 0);
  
  return sum % 10 === 0;
};

// Signature form validation schema
export const signatureFormSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי')
    .regex(hebrewNameRegex, 'שם מכיל תווים לא חוקיים'),
  idNumber: z.string()
    .trim()
    .regex(israeliIdRegex, 'תעודת זהות חייבת להכיל 9 ספרות')
    .refine(validateIsraeliID, 'מספר תעודת הזהות אינו תקין (בדיקת לוהן)'),
  phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  email: z.string()
    .trim()
    .email('כתובת אימייל לא תקינה')
    .max(255, 'אימייל ארוך מדי')
    .optional()
    .or(z.literal('')),
});

// Helper function to format validation errors for display
export const formatValidationErrors = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ');
};

// Sanitize input - remove potential HTML tags and trim
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Hard limit on length
};

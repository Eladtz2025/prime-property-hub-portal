import { z } from 'zod';

// Hebrew name validation regex - allows Hebrew, English letters, spaces, hyphens, and apostrophes
const nameRegex = /^[a-zA-Z\u0590-\u05FF\s'-]+$/;

// Israeli ID validation (9 digits)
const israeliIdRegex = /^\d{9}$/;

// Phone validation - Israeli format
const israeliPhoneRegex = /^(\+972|0)?[2-9]\d{7,8}$/;

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

// Memorandum form validation schema
export const memorandumFormSchema = z.object({
  // Tenant details
  client_name: z.string()
    .trim()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי')
    .regex(nameRegex, 'שם מכיל תווים לא חוקיים'),
  client_id_number: z.string()
    .trim()
    .regex(israeliIdRegex, 'תעודת זהות חייבת להכיל 9 ספרות')
    .refine(validateIsraeliID, 'מספר תעודת הזהות אינו תקין'),
  client_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  client_email: z.string()
    .trim()
    .email('כתובת אימייל לא תקינה')
    .max(255, 'אימייל ארוך מדי')
    .optional()
    .or(z.literal('')),
  
  // Property details
  property_address: z.string()
    .trim()
    .min(3, 'כתובת חייבת להכיל לפחות 3 תווים')
    .max(200, 'כתובת ארוכה מדי'),
  property_city: z.string()
    .trim()
    .min(2, 'עיר חייבת להכיל לפחות 2 תווים')
    .max(100, 'שם עיר ארוך מדי'),
  property_floor: z.string()
    .max(20, 'קומה ארוכה מדי')
    .optional(),
  property_rooms: z.string()
    .max(20, 'מספר חדרים ארוך מדי')
    .optional(),
  property_size: z.string()
    .max(20, 'גודל ארוך מדי')
    .optional(),
  
  // Financial details
  rental_price: z.string()
    .trim()
    .min(1, 'מחיר שכירות חובה')
    .max(50, 'מחיר ארוך מדי'),
  deposit_amount: z.string()
    .max(50, 'סכום פיקדון ארוך מדי')
    .optional(),
  payment_method: z.string()
    .max(100, 'צורת תשלום ארוכה מדי')
    .optional(),
  guarantees: z.string()
    .max(500, 'ערבויות ארוכות מדי')
    .optional(),
  
  // Dates
  entry_date: z.string().optional(),
  form_date: z.string().min(1, 'תאריך חובה'),
  
  // Notes
  notes: z.string()
    .max(1000, 'הערות ארוכות מדי')
    .optional(),
});

// English validation schema
export const memorandumFormSchemaEn = z.object({
  // Tenant details
  client_name: z.string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name is too long')
    .regex(nameRegex, 'Name contains invalid characters'),
  client_id_number: z.string()
    .trim()
    .regex(israeliIdRegex, 'ID must contain 9 digits')
    .refine(validateIsraeliID, 'Invalid ID number'),
  client_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'Invalid phone number'),
  client_email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email is too long')
    .optional()
    .or(z.literal('')),
  
  // Property details
  property_address: z.string()
    .trim()
    .min(3, 'Address must contain at least 3 characters')
    .max(200, 'Address is too long'),
  property_city: z.string()
    .trim()
    .min(2, 'City must contain at least 2 characters')
    .max(100, 'City name is too long'),
  property_floor: z.string()
    .max(20, 'Floor is too long')
    .optional(),
  property_rooms: z.string()
    .max(20, 'Rooms number is too long')
    .optional(),
  property_size: z.string()
    .max(20, 'Size is too long')
    .optional(),
  
  // Financial details
  rental_price: z.string()
    .trim()
    .min(1, 'Rental price is required')
    .max(50, 'Price is too long'),
  deposit_amount: z.string()
    .max(50, 'Deposit amount is too long')
    .optional(),
  payment_method: z.string()
    .max(100, 'Payment method is too long')
    .optional(),
  guarantees: z.string()
    .max(500, 'Guarantees text is too long')
    .optional(),
  
  // Dates
  entry_date: z.string().optional(),
  form_date: z.string().min(1, 'Date is required'),
  
  // Notes
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional(),
});

export const getValidationSchema = (language: 'he' | 'en') => {
  return language === 'he' ? memorandumFormSchema : memorandumFormSchemaEn;
};

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

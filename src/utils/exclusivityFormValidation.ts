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

// Exclusivity form validation schema - Hebrew
export const exclusivityFormSchema = z.object({
  // Seller details
  seller_name: z.string()
    .trim()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי')
    .regex(nameRegex, 'שם מכיל תווים לא חוקיים'),
  seller_id_number: z.string()
    .trim()
    .regex(israeliIdRegex, 'תעודת זהות חייבת להכיל 9 ספרות')
    .refine(validateIsraeliID, 'מספר תעודת הזהות אינו תקין'),
  seller_address: z.string()
    .trim()
    .min(3, 'כתובת חייבת להכיל לפחות 3 תווים')
    .max(200, 'כתובת ארוכה מדי'),
  seller_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  seller_email: z.string()
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
  property_gush_helka: z.string()
    .max(50, 'גוש/חלקה ארוך מדי')
    .optional(),
  
  // Exclusivity terms
  exclusivity_period: z.string()
    .min(1, 'תקופת בלעדיות חובה')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 7 && num <= 180;
    }, 'תקופת בלעדיות חייבת להיות בין 7 ל-180 ימים'),
  start_date: z.string().min(1, 'תאריך התחלה חובה'),
  asking_price: z.string()
    .trim()
    .min(1, 'מחיר תשווק חובה')
    .max(50, 'מחיר ארוך מדי'),
  
  // Commission
  commission_percentage: z.string()
    .min(1, 'אחוז עמלה חובה')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 10;
    }, 'אחוז עמלה חייב להיות בין 0 ל-10'),
  commission_includes_vat: z.boolean(),
  
  // Form date
  form_date: z.string().min(1, 'תאריך חובה'),
});

// English validation schema
export const exclusivityFormSchemaEn = z.object({
  // Seller details
  seller_name: z.string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name is too long')
    .regex(nameRegex, 'Name contains invalid characters'),
  seller_id_number: z.string()
    .trim()
    .regex(israeliIdRegex, 'ID must contain 9 digits')
    .refine(validateIsraeliID, 'Invalid ID number'),
  seller_address: z.string()
    .trim()
    .min(3, 'Address must contain at least 3 characters')
    .max(200, 'Address is too long'),
  seller_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'Invalid phone number'),
  seller_email: z.string()
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
  property_gush_helka: z.string()
    .max(50, 'Block/Parcel is too long')
    .optional(),
  
  // Exclusivity terms
  exclusivity_period: z.string()
    .min(1, 'Exclusivity period is required')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 7 && num <= 180;
    }, 'Exclusivity period must be between 7 and 180 days'),
  start_date: z.string().min(1, 'Start date is required'),
  asking_price: z.string()
    .trim()
    .min(1, 'Asking price is required')
    .max(50, 'Price is too long'),
  
  // Commission
  commission_percentage: z.string()
    .min(1, 'Commission percentage is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 10;
    }, 'Commission must be between 0 and 10'),
  commission_includes_vat: z.boolean(),
  
  // Form date
  form_date: z.string().min(1, 'Date is required'),
});

export const getExclusivityValidationSchema = (language: 'he' | 'en') => {
  return language === 'he' ? exclusivityFormSchema : exclusivityFormSchemaEn;
};

// Helper function to format validation errors for display
export const formatExclusivityValidationErrors = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ');
};

// Sanitize input - remove potential HTML tags and trim
export const sanitizeExclusivityInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Hard limit on length
};

// Calculate end date from start date and period
export const calculateEndDate = (startDate: string, periodDays: number): string => {
  const start = new Date(startDate);
  start.setDate(start.getDate() + periodDays);
  return start.toISOString().split('T')[0];
};

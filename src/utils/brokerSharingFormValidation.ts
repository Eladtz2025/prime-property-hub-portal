import { z } from 'zod';

// Hebrew name validation regex - allows Hebrew, English letters, spaces, hyphens, and apostrophes
const nameRegex = /^[a-zA-Z\u0590-\u05FF\s'-]+$/;

// Israeli brokerage license validation (7 digits)
const brokerageLicenseRegex = /^\d{7}$/;

// Phone validation - Israeli format
const israeliPhoneRegex = /^(\+972|0)?[2-9]\d{7,8}$/;

// Broker Sharing form validation schema - Hebrew
export const brokerSharingFormSchema = z.object({
  // Secondary broker details
  secondary_broker_name: z.string()
    .trim()
    .min(2, 'שם חייב להכיל לפחות 2 תווים')
    .max(100, 'שם ארוך מדי')
    .regex(nameRegex, 'שם מכיל תווים לא חוקיים'),
  secondary_broker_license: z.string()
    .trim()
    .regex(brokerageLicenseRegex, 'מספר רישיון חייב להכיל 7 ספרות'),
  secondary_broker_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
  secondary_broker_email: z.string()
    .trim()
    .email('כתובת אימייל לא תקינה')
    .max(255, 'אימייל ארוך מדי')
    .optional()
    .or(z.literal('')),
  secondary_broker_company: z.string()
    .trim()
    .min(2, 'שם משרד חייב להכיל לפחות 2 תווים')
    .max(200, 'שם משרד ארוך מדי')
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
  transaction_type: z.enum(['sale', 'rental'], {
    errorMap: () => ({ message: 'יש לבחור סוג עסקה' })
  }),
  
  // Commission split
  primary_broker_share: z.string()
    .min(1, 'אחוז עמלה חובה')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'אחוז חייב להיות בין 0 ל-100'),
  secondary_broker_share: z.string()
    .min(1, 'אחוז עמלה חובה')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'אחוז חייב להיות בין 0 ל-100'),
  
  // Form date
  form_date: z.string().min(1, 'תאריך חובה'),
}).refine((data) => {
  const primary = parseFloat(data.primary_broker_share);
  const secondary = parseFloat(data.secondary_broker_share);
  return primary + secondary === 100;
}, {
  message: 'סך העמלות חייב להיות 100%',
  path: ['primary_broker_share'],
});

// English validation schema
export const brokerSharingFormSchemaEn = z.object({
  // Secondary broker details
  secondary_broker_name: z.string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name is too long')
    .regex(nameRegex, 'Name contains invalid characters'),
  secondary_broker_license: z.string()
    .trim()
    .regex(brokerageLicenseRegex, 'License must contain 7 digits'),
  secondary_broker_phone: z.string()
    .trim()
    .regex(israeliPhoneRegex, 'Invalid phone number'),
  secondary_broker_email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email is too long')
    .optional()
    .or(z.literal('')),
  secondary_broker_company: z.string()
    .trim()
    .min(2, 'Company name must contain at least 2 characters')
    .max(200, 'Company name is too long')
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
  transaction_type: z.enum(['sale', 'rental'], {
    errorMap: () => ({ message: 'Please select transaction type' })
  }),
  
  // Commission split
  primary_broker_share: z.string()
    .min(1, 'Commission percentage is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'Percentage must be between 0 and 100'),
  secondary_broker_share: z.string()
    .min(1, 'Commission percentage is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100;
    }, 'Percentage must be between 0 and 100'),
  
  // Form date
  form_date: z.string().min(1, 'Date is required'),
}).refine((data) => {
  const primary = parseFloat(data.primary_broker_share);
  const secondary = parseFloat(data.secondary_broker_share);
  return primary + secondary === 100;
}, {
  message: 'Total commission must equal 100%',
  path: ['primary_broker_share'],
});

export const getBrokerSharingValidationSchema = (language: 'he' | 'en') => {
  return language === 'he' ? brokerSharingFormSchema : brokerSharingFormSchemaEn;
};

// Helper function to format validation errors for display
export const formatBrokerSharingValidationErrors = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ');
};

// Sanitize input - remove potential HTML tags and trim
export const sanitizeBrokerSharingInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Hard limit on length
};

import { z } from 'zod';

export const phoneSchema = z.string()
  .refine((phone) => {
    if (!phone || phone === 'nan' || phone === '—') return true;
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 8 && cleaned.length <= 11;
  }, {
    message: "מספר טלפון לא תקין"
  });

export const propertySchema = z.object({
  id: z.string(),
  address: z.string().min(1, "כתובת חובה"),
  city: z.string(),
  ownerName: z.string().min(1, "שם בעל הנכס חובה"),
  ownerPhone: phoneSchema.optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  tenantName: z.string().optional(),
  tenantPhone: phoneSchema.optional(),
  tenantEmail: z.string().email().optional().or(z.literal("")),
  monthlyRent: z.number().optional(),
  leaseStartDate: z.string().optional(),
  leaseEndDate: z.string().optional(),
  status: z.enum(['occupied', 'vacant', 'maintenance']),
  propertySize: z.number().optional(),
  floor: z.number().optional(),
  rooms: z.number().optional(),
  notes: z.string().optional(),
  lastUpdated: z.string().optional(),
  createdAt: z.string().optional(),
});

export const validateProperty = (property: unknown) => {
  try {
    return propertySchema.parse(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 500); // Limit length
};
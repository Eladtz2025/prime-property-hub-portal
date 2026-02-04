
# ניקוי קוד זיהוי תיווך בפרסר - הסרה מלאה

## הבעיה

בקובץ `supabase/functions/_experimental/parser-yad2.ts` יש קוד מת (שורות 258-285) שמנסה לזהות תיווך אבל **לא עובד** כי המילה "תיווך" לא מופיעה בדף הרשימה.

## מה יימחק

שורות 258-285 - כל הבלוק הזה:

```typescript
// ============================================
// BROKER DETECTION - Yad2
// Based on user screenshots:
// - Broker: Shows "תיווך:" label + 7-digit license number
// - Private: No such markers
// ============================================

// Check for explicit "תיווך" label with license number
// Don't use plain \d{7} as it catches phone numbers (050-1234567)
const hasTivuchLabel = /תיווך:?/.test(block);

// Check for license number ONLY when it appears with broker-related keywords
// Plain 7-digit check catches Israeli phone suffixes - causes false positives
const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(block);
const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(block);
const hasLicenseNumber = hasTivuchWithLicense || hasExplicitLicense;

// Check for "בבלעדיות" (exclusivity - broker indicator)
const hasExclusivity = /בבלעדיות/.test(block);

// Check for known broker brand names
const BROKER_BRANDS = ['רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21', 'קולדוול'];
const blockLower = block.toLowerCase();
const hasBrokerBrand = BROKER_BRANDS.some(brand => blockLower.includes(brand.toLowerCase()));

// SIMPLE RULE: "תיווך" OR license number OR exclusivity OR known brand = broker
// Otherwise = private
const isBroker = hasTivuchLabel || hasLicenseNumber || hasExclusivity || hasBrokerBrand;
```

## מה יישאר במקום

הערה קצרה + null:

```typescript
// Broker detection happens in backfill (individual property pages)
// Search results don't contain the "תיווך" keyword
```

## עדכון נוסף

שורה 317 תשתנה:
- **לפני:** `is_private: !isBroker,`
- **אחרי:** `is_private: null,`

## קובץ לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/_experimental/parser-yad2.ts` | הסרת שורות 258-285, עדכון שורה 317 |

## תוצאה

- קוד נקי יותר (28 שורות פחות)
- `is_private` יהיה `null` (לא ידוע) במקום ערך שגוי
- הזיהוי האמיתי יתבצע ב-backfill כשנכנסים לדף הנכס


# תיקון קריטי: סינון נכסים שאינם מתל אביב

## סיכום הבעיה

יש **48 נכסים פעילים** במערכת שאינם בתל אביב אבל מוצגים עם `city = 'תל אביב יפו'`.

### מיקומים בעייתיים שזוהו:
| מיקום | כמות | מיקום אמיתי |
|-------|------|-------------|
| נווה כפיר | 11 | פתח תקווה |
| יבנאל (שכונה) | 8 | עיירה בצפון |
| ראשון לציון | 4 | ראשון לציון |
| צופים | 3 | מזרח השומרון |
| קיסריה | 2 | קיסריה |
| מעלה אדומים / צמח השדה | 2 | ירושלים |
| סמדר עילית | 2 | יבנאל |

## פתרון כפול

### חלק א': תיקון מיידי - השבתת הנכסים הבעייתיים (SQL Script)

נריץ SQL Script שיסמן `is_active = false` לכל הנכסים עם מיקומים בעייתיים בכותרת או בכתובת:

```sql
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
AND (
  title ILIKE '%נווה כפיר%' OR address ILIKE '%נווה כפיר%'
  OR title ILIKE '%יבנאל%' OR address ILIKE '%יבנאל%'
  OR title ILIKE '%צופים%' OR address ILIKE '%צופים%'
  OR title ILIKE '%קיסריה%' OR address ILIKE '%קיסריה%'
  OR title ILIKE '%מעלה אדומים%' OR address ILIKE '%מעלה אדומים%'
  OR title ILIKE '%צמח השדה%' OR address ILIKE '%צמח השדה%'
  OR title ILIKE '%סמדר עילית%' OR address ILIKE '%סמדר עילית%'
  OR title ILIKE '%rishon%' OR address ILIKE '%rishon%'
  OR title ILIKE '%ראשון לציון%' OR address ILIKE '%ראשון לציון%'
);
```

### חלק ב': מניעה לעתיד - הוספת Blacklist לפארסרים

#### 1. עדכון `parser-utils.ts` - הוספת BLACKLIST_PATTERNS

```typescript
// Locations that are NOT in Tel Aviv but often get mislabeled
const BLACKLIST_LOCATIONS: Array<{ pattern: RegExp; real_city: string }> = [
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  { pattern: /צופים/i, real_city: 'צופים (מזרח השומרון)' },
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  { pattern: /מעלה\s*אדומים/i, real_city: 'מעלה אדומים' },
  { pattern: /צמח\s*השדה/i, real_city: 'מעלה אדומים' },
  { pattern: /סמדר\s*עילית/i, real_city: 'יבנאל' },
  { pattern: /rishon\s*le?\s*zion/i, real_city: 'ראשון לציון' },
  // יבנאל - זהירות! יש רחוב יבנאל בנווה צדק
  { pattern: /יבנאל,\s*יבנאל/i, real_city: 'יבנאל' }, // כפילות = העיר
  { pattern: /,\s*יבנאל$/i, real_city: 'יבנאל' }, // בסוף הכתובת = העיר
];

export function isBlacklistedLocation(text: string): { blacklisted: boolean; real_city?: string } {
  for (const { pattern, real_city } of BLACKLIST_LOCATIONS) {
    if (pattern.test(text)) {
      return { blacklisted: true, real_city };
    }
  }
  return { blacklisted: false };
}
```

#### 2. עדכון `parser-homeless.ts` - בדיקת Blacklist לפני שמירה

בשורה 282 (לפני `Skip rows with no city`):

```typescript
// Check blacklist BEFORE saving - don't import non-Tel-Aviv properties
const blacklistCheck = isBlacklistedLocation(`${streetText} ${neighborhoodText} ${cityText} ${fullRowText}`);
if (blacklistCheck.blacklisted) {
  console.log(`[Homeless Parser] Blacklisted: ${streetText} → ${blacklistCheck.real_city}`);
  errors.push(`Row ${index}: Blacklisted location (${blacklistCheck.real_city})`);
  continue; // Skip this property entirely
}
```

#### 3. עדכון `backfill-property-data` - בדיקת Blacklist מהכותרת הקיימת

בשורות 328-344 (בדיקת city), להוסיף בדיקה נוספת:

```typescript
// NEW: Check blacklist from existing title/address (not just scraped city)
const existingText = `${prop.title || ''} ${prop.address || ''}`;
const blacklistCheck = isBlacklistedLocation(existingText);
if (blacklistCheck.blacklisted) {
  console.log(`🗑️ Property ${prop.id} blacklisted (${blacklistCheck.real_city}), marking inactive`);
  await supabase
    .from('scouted_properties')
    .update({ is_active: false })
    .eq('id', prop.id);
  
  successCount++;
  lastId = prop.id;
  continue;
}
```

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| **SQL Script** | תיקון מיידי - השבתת 48 נכסים בעייתיים |
| `_experimental/parser-utils.ts` | הוספת `BLACKLIST_LOCATIONS` ו-`isBlacklistedLocation()` |
| `_experimental/parser-homeless.ts` | בדיקת blacklist לפני שמירת נכס |
| `backfill-property-data/index.ts` | בדיקת blacklist מכותרת/כתובת קיימות |
| `scout-yad2/index.ts` | (אופציונלי) בדיקת blacklist |

## תוצאה צפויה

- **מיידית**: 48 נכסים לא-תל-אביב יוסתרו מהמערכת
- **לעתיד**: נכסים מהמיקומים האלו לא יכנסו למערכת בכלל
- **אמינות**: המערכת תציג רק נכסים מתל אביב

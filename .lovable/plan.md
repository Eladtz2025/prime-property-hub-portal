

# תיקון מורחב: סינון מקיף של נכסים שאינם בתל אביב

## סיכום הממצאים

המיגרציה הקודמת הצליחה להשבית את רוב הנכסים הבעייתיים, אבל נשארו עוד **15+ נכסים פעילים** שנכנסו דרך דפוסים שלא כיסינו:

| מיקום | כמות | סוג הבעיה |
|-------|------|----------|
| אבן יהודה (עיר) | 8 | עיר ליד נתניה - לא רחוב אבן יהודה |
| נתניה / קרית נורדאו | 3 | Netanya באנגלית בכתובת |
| מושב כפר דניאל | 1 | מושב ליד לוד |
| קיבוץ מחניים | 1 | קיבוץ בגליל |
| רמות נפתלי | 2 | ישוב בגליל העליון |

## פתרון מורחב - 3 שלבים

### שלב 1: תיקון מיידי - SQL Script להשבתת הנכסים החדשים

```sql
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
AND (
  -- אבן יהודה (העיר, לא הרחוב)
  address ILIKE '%, אבן יהודה%'
  OR (address ILIKE '%אבן יהודה, אבן יהודה%')
  -- נתניה
  OR address ILIKE '%Netanya%'
  OR address ILIKE '%נתניה%'
  OR address ILIKE '%קרית נורדאו%'
  OR title ILIKE '%קרית נורדאו%'
  -- מושבים וקיבוצים שאינם בתל אביב
  OR address ILIKE '%מושב כפר דניאל%'
  OR address ILIKE '%קיבוץ מחניים%'
  OR address ILIKE '%רמות נפתלי%'
);
```

### שלב 2: הרחבת ה-Blacklist ב-parser-utils.ts

נוסיף את הדפוסים החדשים שמצאנו:

```typescript
const BLACKLIST_LOCATIONS: Array<{ pattern: RegExp; real_city: string }> = [
  // === הדפוסים הקיימים ===
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  { pattern: /צופים/i, real_city: 'צופים (מזרח השומרון)' },
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  { pattern: /מעלה\s*אדומים/i, real_city: 'מעלה אדומים' },
  { pattern: /צמח\s*השדה/i, real_city: 'מעלה אדומים' },
  { pattern: /סמדר\s*עילית/i, real_city: 'יבנאל' },
  { pattern: /rishon\s*le?\s*zion/i, real_city: 'ראשון לציון' },
  { pattern: /יבנאל,\s*יבנאל/i, real_city: 'יבנאל' },
  { pattern: /,\s*יבנאל$/i, real_city: 'יבנאל' },
  
  // === דפוסים חדשים ===
  // אבן יהודה - העיר (לא רחוב אבן יהודה בתל אביב!)
  { pattern: /,\s*אבן\s*יהודה$/i, real_city: 'אבן יהודה' },
  { pattern: /אבן\s*יהודה,\s*אבן\s*יהודה/i, real_city: 'אבן יהודה' },
  
  // נתניה
  { pattern: /netanya/i, real_city: 'נתניה' },
  { pattern: /קרית\s*נורדאו/i, real_city: 'נתניה' },
  
  // מושבים וקיבוצים
  { pattern: /מושב\s*כפר\s*דניאל/i, real_city: 'כפר דניאל' },
  { pattern: /קיבוץ\s*מחניים/i, real_city: 'קיבוץ מחניים' },
  { pattern: /רמות\s*נפתלי/i, real_city: 'רמות נפתלי' },
  
  // ערים נוספות באנגלית
  { pattern: /herzliya(?!\s*pituach)/i, real_city: 'הרצליה' },
  { pattern: /ramat\s*gan/i, real_city: 'רמת גן' },
  { pattern: /givatayim/i, real_city: 'גבעתיים' },
  { pattern: /petah\s*tikva|petach\s*tikva/i, real_city: 'פתח תקווה' },
  { pattern: /holon/i, real_city: 'חולון' },
  { pattern: /bat\s*yam/i, real_city: 'בת ים' },
  
  // ערים בעברית שעלולות להתבלבל
  { pattern: /קרית\s*מלאכי/i, real_city: 'קרית מלאכי' },
  { pattern: /קרית\s*גת/i, real_city: 'קרית גת' },
  { pattern: /קרית\s*אונו/i, real_city: 'קרית אונו' },
  { pattern: /קרית\s*ביאליק/i, real_city: 'קרית ביאליק' },
  { pattern: /קרית\s*מוצקין/i, real_city: 'קרית מוצקין' },
  { pattern: /קרית\s*ים/i, real_city: 'קרית ים' },
  { pattern: /קרית\s*אתא/i, real_city: 'קרית אתא' },
  { pattern: /קרית\s*שמונה/i, real_city: 'קרית שמונה' },
];
```

### שלב 3: שיפור הלוגיקה - בדיקת כתובת בנוסף לכותרת

נעדכן את הפונקציה `isBlacklistedLocation` לבדוק גם את הכתובת המלאה:

```typescript
export function isBlacklistedLocation(text: string): { blacklisted: boolean; real_city?: string } {
  if (!text) return { blacklisted: false };
  
  // Normalize text - remove extra spaces
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  for (const { pattern, real_city } of BLACKLIST_LOCATIONS) {
    if (pattern.test(normalizedText)) {
      return { blacklisted: true, real_city };
    }
  }
  return { blacklisted: false };
}

// NEW: Check if full address indicates non-Tel Aviv
export function isAddressBlacklisted(address: string): { blacklisted: boolean; real_city?: string } {
  if (!address) return { blacklisted: false };
  
  // Check if address ends with a non-Tel Aviv city
  const addressParts = address.split(',').map(p => p.trim());
  const lastPart = addressParts[addressParts.length - 1];
  
  // If the last part is a known non-Tel Aviv city (from CITY_PATTERNS), blacklist it
  const knownNonTACity = extractCity(lastPart);
  if (knownNonTACity && !knownNonTACity.includes('תל אביב')) {
    return { blacklisted: true, real_city: knownNonTACity };
  }
  
  return isBlacklistedLocation(address);
}
```

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| **SQL Migration** | השבתת 15+ נכסים נוספים |
| `parser-utils.ts` | הרחבת BLACKLIST_LOCATIONS עם 20+ דפוסים חדשים |
| `parser-utils.ts` | הוספת `isAddressBlacklisted()` לבדיקה מבוססת-כתובת |
| `parser-homeless.ts` | עדכון לשימוש בשתי הפונקציות |
| `backfill-property-data` | עדכון לבדיקת כתובת מלאה |

## תוצאה צפויה

- **מיידית**: כל 15+ הנכסים הבעייתיים שנותרו יוסתרו
- **לעתיד**: סינון מקיף יותר שיתפוס גם דפוסים באנגלית, מושבים, קיבוצים
- **דיוק**: בדיקת הכתובת המלאה מונעת false negatives

## הערה חשובה

אם אתה עדיין רואה את הנכסים הישנים (סמדר עילית, קיסריה וכו') בממשק - הם **כבר הושבתו** בבסיס הנתונים. תרענן את הדף (Ctrl+F5) כדי לראות את השינוי.


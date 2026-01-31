
# תיקון 3 בעיות בסקאוט

## בעיה 1: קונפיגורציות לא ממוינות לפי שעה

### מה לא עובד
הקונפיגורציות בכל עמודה (מדלן/יד2/הומלס) לא ממוינות לפי `schedule_times` - נווה צדק ב-08:55 מופיע לפני צפון ישן ב-08:00.

### הפתרון
בקובץ `UnifiedScoutSettings.tsx`, יש להוסיף מיון בתוך כל עמודת מקור לפי `schedule_times[0]`:

```typescript
// שורות 1204, 1261, 1318 - להוסיף .sort() לפני .map()
configs
  .filter(c => c.source === 'madlan')
  .sort((a, b) => {
    const timeA = (a as any).schedule_times?.[0] || '99:99';
    const timeB = (b as any).schedule_times?.[0] || '99:99';
    return timeA.localeCompare(timeB);
  })
  .map(config => ...)
```

---

## בעיה 2: כתובות שגויות ביד2 (שמות תיווך במקום רחוב)

### מה לא עובד
מהתמונות שהעלית:
- `address = 'גג/'` - לא כתובת תקינה
- `address = 'RS נדל"ן'` - שם משרד תיווך במקום רחוב
- `address = 'דירה'` - סוג נכס במקום כתובת

### הפתרון
בקובץ `parser-yad2.ts`:

1. **פילטר כתובות לא תקינות** - לוודא שכתובת מכילה לפחות מילה עברית תקינה ולא מילות מפתח שגויות:

```typescript
// רשימת דפוסים שמעידים על כתובת לא תקינה
const INVALID_ADDRESS_PATTERNS = [
  /^גג\/?$/,           // "גג/" - סוג נכס
  /^דירה$/,            // "דירה" - סוג נכס
  /נדל"?ן/i,           // שם משרד תיווך
  /^RS$/i,             // ראשי תיבות תיווך
  /רימקס|remax/i,      // רשת תיווך
  /אנגלו סכסון/i,      // רשת תיווך
  /century\s*21/i,     // רשת תיווך
];

function isValidAddress(address: string): boolean {
  if (!address || address.length < 3) return false;
  return !INVALID_ADDRESS_PATTERNS.some(p => p.test(address));
}
```

2. **אם הכתובת לא תקינה - לשים null** במקום לשמור ערך שגוי

3. **דירות ללא כתובת ורחוב - לדלג עליהן או לסנן אותן** (לשקול)

---

## בעיה 3: שכונות שגויות במדלן (פינסקר ≠ יפו)

### מה לא עובד
רחובות כמו:
- **פינסקר** → סומן כ"יפו" (צריך: צפון ישן / לב העיר)
- **ליאונרדו דה וינצ'י** → סומן כ"יפו" (צריך: הצפון החדש)
- **בוגרשוב** → סומן כ"יפו" (צריך: לב העיר / צפון ישן)
- **בן יהודה** → ללא שכונה (צריך: צפון ישן / לב העיר)

### הסיבה
ה-parser של מדלן מזהה שכונות רק לפי דפוסים ספציפיים (`KNOWN_NEIGHBORHOODS`). כשאין התאמה, הוא לא שם שכונה או שלפעמים לוקח מידע שגוי מהבלוק.

### הפתרון
בקובץ `parser-madlan.ts`:

1. **הוספת מיפוי רחובות-לשכונות**:

```typescript
const STREET_TO_NEIGHBORHOOD: Record<string, { value: string; label: string }> = {
  'פינסקר': { value: 'לב_העיר', label: 'לב העיר' },
  'בוגרשוב': { value: 'לב_העיר', label: 'לב העיר' },
  'בן יהודה': { value: 'צפון_ישן', label: 'צפון ישן' },
  'דיזנגוף': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ארלוזורוב': { value: 'צפון_ישן', label: 'צפון ישן' },
  'ליאונרדו': { value: 'צפון_חדש', label: 'צפון חדש' },
  'שלום עליכם': { value: 'צפון_חדש', label: 'צפון חדש' },
  'ז\'בוטינסקי': { value: 'צפון_חדש', label: 'צפון חדש' },
  'נורדאו': { value: 'צפון_ישן', label: 'צפון ישן' },
  'גורדון': { value: 'צפון_ישן', label: 'צפון ישן' },
  'פרישמן': { value: 'צפון_ישן', label: 'צפון ישן' },
  // ... עוד רחובות מרכזיים
};

function extractNeighborhoodFromAddress(address: string): { value: string; label: string } | null {
  for (const [street, info] of Object.entries(STREET_TO_NEIGHBORHOOD)) {
    if (address.includes(street)) {
      return info;
    }
  }
  return null;
}
```

2. **עדיפות לזיהוי מכתובת לפני ברירת מחדל שגויה**:
   - אם לא נמצאה שכונה מהבלוק - לנסות מהכתובת
   - אם עדיין לא נמצא - לשים `null` ולא "יפו"

3. **הסרת ברירת מחדל "יפו"** - אם אין שכונה מזוהה, עדיף null

---

## סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `src/components/scout/UnifiedScoutSettings.tsx` | מיון קונפיגורציות לפי `schedule_times[0]` בכל עמודה |
| `supabase/functions/_experimental/parser-yad2.ts` | פילטר כתובות לא תקינות (שמות תיווך, "גג/") |
| `supabase/functions/_experimental/parser-madlan.ts` | מיפוי רחובות→שכונות + הסרת ברירת מחדל "יפו" |

---

## פרטים טכניים

### קובץ 1: UnifiedScoutSettings.tsx

שורות לשנות: 1204, 1261, 1318 (אותו שינוי ב-3 מקומות)

```typescript
// לפני:
{configs.filter(c => c.source === 'madlan').map(config => (

// אחרי:
{configs
  .filter(c => c.source === 'madlan')
  .sort((a, b) => {
    const timeA = (a as any).schedule_times?.[0] || '99:99';
    const timeB = (b as any).schedule_times?.[0] || '99:99';
    return timeA.localeCompare(timeB);
  })
  .map(config => (
```

### קובץ 2: parser-yad2.ts

בפונקציה `parseYad2Block`, לפני החזרת תוצאה:

```typescript
// Validate address - skip broker names and invalid values
if (address && !isValidAddress(address)) {
  address = null;
}
```

### קובץ 3: parser-madlan.ts

בפונקציה `parsePropertyBlock`:

```typescript
// After block neighborhood extraction, try address-based detection
if (!neighborhood && address) {
  const addressNeighborhood = extractNeighborhoodFromAddress(address);
  if (addressNeighborhood) {
    neighborhood = addressNeighborhood.label;
    neighborhoodValue = addressNeighborhood.value;
  }
}

// Don't default to "יפו" - leave null if unknown
```

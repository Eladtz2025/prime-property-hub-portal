
# QA - סקירת בעיות בכותרות ושכונות בסקאוט

## סיכום ממצאים

| בעיה | מקור | כמות מושפעת | חומרה |
|------|------|-------------|--------|
| שכונה "יפו" שגויה | Homeless | ~433 | 🔴 קריטי |
| שכונה "יפו" שגויה | Yad2 | ~1,125 | 🔴 קריטי |
| שכונה "יפו" שגויה | Madlan | ~116 | 🔴 קריטי |
| כותרת = כתובת בלבד | Yad2 | ~593 | 🟠 בינוני |
| פורמטים לא אחידים | Yad2 | ~8 סוגים | 🟡 נמוך |
| עיר שגויה | Homeless | ~20+ | 🔴 קריטי |

---

## בעיה 1: שכונה "יפו" שגויה (1,674 נכסים!)

### הבעיה
נכסים מכל הארץ מקבלים שכונה "יפו" בטעות:

```text
כתובת: נחל אשכול, קרית ארבע  → שכונה: יפו  ❌
כתובת: ההרדוף, עתלית          → שכונה: יפו  ❌
כתובת: האמנים, כינרת מושבה   → שכונה: יפו  ❌
כתובת: וינגייט 3, תל אביב    → שכונה: יפו  ❌ (צריך להיות יד אליהו)
```

### הסיבה
1. **Homeless**: יש fallback שגוי ל-"יפו" כשלא מזהים שכונה
2. **Madlan**: יש fallback שגוי ב-`extractNeighborhoodFromAddress` שלא מזהה רחובות ידועים
3. **Yad2**: נכסים מחוץ לתל אביב נכנסים עם city="תל אביב יפו" בטעות

### פתרון מוצע
1. **הסרת fallback "יפו"** - אם לא מזהים שכונה, לא לשים שום ערך (NULL)
2. **תיקון DB** - לאפס שכונות שגויות ל-NULL
3. **הרחבת מילון רחובות** - להוסיף עוד רחובות ידועים למיפוי נכון

---

## בעיה 2: כותרות לא אחידות (8 פורמטים שונים!)

### פורמטים קיימים ב-Yad2:

| פורמט | דוגמה | כמות |
|-------|-------|------|
| כתובת בלבד | `צ'לנוב 40` | 593 |
| ישן 1 | `גורדון, הצפון הישן, תל אביב יפו` | 1,415 |
| עם סוג | `בן יהודה גג/ פנטהאוז, הצפון הישן` | 771 |
| חדש תקני | `דירה 3 חדרים להשכרה בצפון ישן` | 2,224 |

### פורמטים ב-Homeless:

| פורמט | דוגמה | כמות |
|-------|-------|------|
| עם רחוב | `דירה 3 חדרים בסלמה, שפירא` | 782 |
| בלי חדרים | `בסביונים, מעלות תרשיחא` | 336 |

### פורמטים ב-Madlan:

| פורמט | דוגמה | כמות |
|-------|-------|------|
| תקני | `דירה 4 חדרים להשכרה בצפון חדש` | 646 |
| ישן | `דירה, וינגייט 3, יד אליהו` | 74 |

### פתרון מוצע
לאחד את כל הכותרות לפורמט אחיד:
```
[סוג נכס] [X חדרים] [להשכרה/למכירה] ב[שכונה]
```
דוגמה: `דירה 3 חדרים להשכרה בצפון ישן`

---

## בעיה 3: עיר שגויה (Homeless)

### הבעיה
נכסים מערים אחרות (קרית ארבע, עתלית, אבן יהודה) מקבלים `city: תל אביב יפו`:

```text
כתובת: נחל אשכול, קרית ארבע  → עיר: תל אביב יפו  ❌
כתובת: ההרדוף, עתלית          → עיר: תל אביב יפו  ❌
```

### הסיבה
הקוד משתמש ב-DEFAULT_CITY כ-fallback:
```typescript
const city = extractCity(cityText) || extractCity(neighborhoodText) || DEFAULT_CITY;
// DEFAULT_CITY = 'תל אביב יפו'
```

### פתרון מוצע
1. **הסרת fallback** - אם לא מזהים עיר, להשאיר NULL או לדלג על הנכס
2. **הרחבת רשימת ערים** - להוסיף ערים נוספות לזיהוי
3. **ניקוי DB** - למחוק או לתקן נכסים עם עיר שגויה

---

## בעיה 4: כתובות שגויות (Yad2)

### הבעיה
נתונים לא רלוונטיים בשדה כתובת:

```text
כתובת: Relocation משה-אקילוב צעד-חכם!  ❌ (שם מתווך)
כתובת: הצפון החדש - צפון                ❌ (שכונה, לא כתובת)
כתובת: מרצ'לו אינצ'ליני-FRANCHI REAL ESTATE  ❌ (שם סוכנות)
```

### פתרון מוצע
1. **שיפור הפילטר** - `isValidAddress()` צריך לזהות שמות מתווכים ושכונות
2. **ניקוי DB** - לאפס כתובות שגויות ל-NULL

---

## תוכנית תיקון מוצעת

### שלב 1: תיקון קוד Parsers

**A. parser-homeless.ts - הסרת fallback "יפו"**
```typescript
// לפני:
const city = extractCity(cityText) || extractCity(neighborhoodText) || DEFAULT_CITY;

// אחרי:
const city = extractCity(cityText) || extractCity(neighborhoodText);
if (!city) {
  // Skip properties without valid city
  errors.push(`Row ${index}: No city detected, skipping`);
  return;
}
```

**B. parser-madlan.ts - הסרת fallback "יפו"**
```typescript
// שורה 478 - לא להשתמש ב-neighborhood כברירת מחדל אם הוא null
const location = neighborhood || null;
const title = roomsLabel && location
  ? `דירה ${roomsLabel} ${typeLabel} ב${location}`
  : location
    ? `דירה ${typeLabel} ב${location}`
    : `דירה ${typeLabel} בתל אביב`; // fallback לעיר, לא לשכונה
```

**C. parser-yad2.ts - תיקון פונקציית buildTitle**
```typescript
function buildTitle(propertyType: string, rooms: number | null, location: string, address: string | null): string {
  const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  const roomsLabel = rooms ? `${rooms} חדרים` : '';
  
  // Use neighborhood if available, otherwise city
  if (roomsLabel && location) {
    return `דירה ${roomsLabel} ${typeLabel} ב${location}`;
  } else if (location) {
    return `דירה ${typeLabel} ב${location}`;
  }
  
  return `דירה ${typeLabel} בתל אביב`;
}
```

### שלב 2: ניקוי נתונים בDB

```sql
-- 1. איפוס שכונות "יפו" שגויות (נכסים מחוץ ליפו האמיתית)
UPDATE scouted_properties
SET neighborhood = NULL, neighborhood_value = NULL
WHERE is_active = true
  AND neighborhood = 'יפו'
  AND address NOT LIKE '%יפו%'
  AND address NOT LIKE '%עג''מי%'
  AND address NOT LIKE '%נוגה%';

-- 2. איפוס כתובות שגויות (שמות מתווכים/שכונות)
UPDATE scouted_properties
SET address = NULL
WHERE is_active = true
  AND (
    address LIKE '%Relocation%'
    OR address LIKE '%REAL ESTATE%'
    OR address LIKE '%רימקס%'
    OR address = neighborhood
  );

-- 3. מחיקת נכסים מערים לא רלוונטיות
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
  AND source = 'homeless'
  AND address LIKE '%קרית ארבע%' 
     OR address LIKE '%עתלית%'
     OR address LIKE '%כינרת מושבה%';
```

### שלב 3: הרצת Backfill

לאחר תיקון הקוד והנתונים, להריץ backfill עם `force_broker_recheck` כדי לתקן גם את הכותרות הישנות.

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| parser-homeless.ts | הסרת DEFAULT_CITY fallback, דילוג על נכסים בלי עיר |
| parser-madlan.ts | הסרת fallback "יפו", שיפור buildTitle |
| parser-yad2.ts | פורמט כותרת אחיד, שיפור isValidAddress |
| DB Migration | ניקוי שכונות שגויות, כתובות שגויות, נכסים מערים אחרות |
| backfill-property-data | הוספת יכולת לתקן כותרות ישנות |

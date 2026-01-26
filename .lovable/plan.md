
# תיקון Personal Scout - 4 בעיות קריטיות

## הבעיות שמצאתי

### 1. Property Type לא ממופה נכון
**הבעיה:** רוני מוגדר כ-`property_type: "rental"` אבל הקוד מצפה ל-`"rent"` או `"sale"`
**התוצאה:** ה-URL יוצא `/realestate/forsale` במקום `/realestate/rent`

```typescript
// שורה 89 - הקוד הנוכחי
const propertyType = (lead.property_type as 'rent' | 'sale') || 'rent';
// rental לא ממופה ל-rent, אז הוא נשאר כמו שהוא ולא עובד
```

### 2. מחירים ביחידות שגויות
**הבעיה:** רוני מוגדר עם `budget_max: 7000` (שמייצג 7,000,000₪ = 7M)
**התוצאה:** ה-URL מכיל `price=6500-7000` במקום `price=6500000-7000000`

**הפתרון:** לזהות אם זה שכירות (מחיר נמוך) או מכירה (צריך להכפיל ב-1000)

### 3. פיצ'רים לא מסוננים
**הבעיה:** רוני צריך מרפסת (required+flexible) וחצר (required+flexible)
**התוצאה:** כרגע הקוד **לא** מסנן לפי פיצ'רים כי הוא commented out

**האתגר:** הפרסרים הנוכחיים לא מחלצים פיצ'רים מהמודעות!
- יד2/מדלן/הומלס - לא מפרסרים balcony/roof/yard

**הפתרון:** להוסיף חילוץ פיצ'רים לפרסרים + להפעיל את הסינון

### 4. רק 3 דפים מוגבל מדי
**הבעיה:** `MAX_PAGES_PER_SOURCE = 3` זה מעט מאוד
**התוצאה:** מפספסים הרבה נכסים פוטנציאליים

**הפתרון:** להגדיל ל-5-7 דפים לפחות

---

## שינויים נדרשים

### קובץ 1: `personal-scout-worker/index.ts`

```typescript
// שורה 89 - תיקון המרת property_type
const propertyType = normalizePropertyType(lead.property_type);

// פונקציה חדשה
function normalizePropertyType(type: string | null): 'rent' | 'sale' {
  if (!type) return 'rent';
  // rental, rent, השכרה -> rent
  if (type.toLowerCase().includes('rent') || type === 'rental' || type === 'השכרה') {
    return 'rent';
  }
  // sale, מכירה -> sale
  return 'sale';
}
```

```typescript
// שורה 22 - הגדלת מספר דפים
const MAX_PAGES_PER_SOURCE = 5; // היה 3
```

### קובץ 2: `_personal-scout/url-builder.ts`

```typescript
// תיקון המחירים - זיהוי אוטומטי לפי סוג עסקה
function buildYad2Url(...) {
  // מחירי שכירות: עד 50,000₪ - השתמש כמו שהם
  // מחירי מכירה: מעל 50,000₪ - כפול ב-1000 אם נראה קטן
  
  let adjustedMinPrice = minPrice;
  let adjustedMaxPrice = maxPrice;
  
  if (propertyType === 'sale') {
    // אם המחיר נראה כמו אלפים (למשל 7000 במקום 7000000)
    if (maxPrice && maxPrice < 100000) {
      adjustedMinPrice = minPrice ? minPrice * 1000 : null;
      adjustedMaxPrice = maxPrice * 1000;
    }
  }
  
  if (adjustedMinPrice || adjustedMaxPrice) {
    params.set('price', `${adjustedMinPrice || ''}-${adjustedMaxPrice || ''}`);
  }
}
```

### קובץ 3: `_personal-scout/feature-filter.ts`

**הפעלת סינון פיצ'רים (ללא חילוץ מהפרסר כרגע):**

```typescript
// שורה 115-140 - הסרת ה-comments והוספת לוגיקה חכמה
// אם הלקוח דורש פיצ'ר אבל הוא FLEXIBLE - לא מסנן החוצה
// אם הלקוח דורש פיצ'ר ללא FLEXIBLE - מסנן רק אם יש לנו מידע

// מרפסת/גג/חצר - OR logic
if (hasOutdoorRequirement(lead)) {
  // לקוח צריך לפחות אחד מ: מרפסת, גג, חצר
  const hasAnyOutdoor = prop.has_balcony || prop.has_roof || prop.has_yard;
  const allFlexible = allOutdoorFlexible(lead);
  
  // אם כולם גמישים - לא מסנן
  // אם לא גמישים ויש מידע שאין - מסנן
  if (!allFlexible && hasAnyOutdoor === false) {
    return 'no_outdoor_space';
  }
}
```

### קובץ 4: פרסרים - הוספת חילוץ פיצ'רים (אופציונלי)

**זה יותר מורכב** - צריך לזהות פיצ'רים מהטקסט:
- יד2: "מרפסת", "חניה", "מעלית", "ממ\"ד"
- מדלן: אייקונים בטקסט
- הומלס: עמודות ספציפיות

**הצעה:** לעכשיו, לא לסנן לפי פיצ'רים כי אין מידע מהפרסר.
נציג את כל התוצאות ובעתיד נוסיף חילוץ פיצ'רים.

---

## סיכום שינויים

| קובץ | שינוי | השפעה |
|------|-------|-------|
| `personal-scout-worker/index.ts` | המרת `rental`→`rent` | יד2 יעבוד |
| `personal-scout-worker/index.ts` | `MAX_PAGES = 5` | יותר תוצאות |
| `url-builder.ts` | תיקון מחירי מכירה | מחירים נכונים |
| `feature-filter.ts` | הפעלת סינון OR לפיצ'רים | מרפסת/גג/חצר |

---

## שלבי ביצוע

1. **תיקון property_type** - הוספת פונקציית נורמליזציה
2. **תיקון מחירים** - לוגיקה לזיהוי יחידות
3. **הגדלת דפים** - מ-3 ל-5
4. **פיצ'רים** - הפעלת סינון OR עם גמישות
5. **Deploy + בדיקה** - ריצה חוזרת על רוני

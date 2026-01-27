

# תוכנית: הוספת סינון שכונות ב-URL לצמצום דפים

## הבעיה שזיהינו

לאחר בדיקה מעמיקה, התברר שהסיבה לכמות הגדולה של דפים (30+ לכל אתר) היא ש**שכונות לא מסוננות ברמת ה-URL** - למרות שיש ללקוחות העדפות שכונות מוגדרות.

**דוגמה מספרית:**
- לקוח עם 4 שכונות מועדפות → מקבל 1,179 תוצאות מכל תל אביב
- אם היינו מסננים לשכונות בלבד → היינו מקבלים ~200 תוצאות (הפחתה של 83%)

## מה גיליתי

**Yad2 תומך בסינון שכונות ב-URL!**
- פרמטר: `neighborhood=XXX` (קודים מספריים)
- תומך בריבוי שכונות: `neighborhood=204,1483,1519`

**קודי שכונות תל אביב שמצאתי:**

| שכונה | קוד Yad2 |
|-------|----------|
| צפון חדש | 204 |
| צפון ישן | 1483 |
| צפון חדש דרום | 1519 |
| לב העיר צפון | 1520 |
| רביבים | 202 |

## שינויים נדרשים

### שלב 1: יצירת מיפוי קודי שכונות

**קובץ חדש:** `supabase/functions/_personal-scout/neighborhood-codes.ts`

```typescript
// Yad2 neighborhood codes for Tel Aviv
export const yad2NeighborhoodCodes: Record<string, string> = {
  // צפון
  'צפון_חדש': '204',
  'צפון_ישן': '1483',
  'צפון_חדש_דרום': '1519',
  
  // מרכז
  'לב_העיר': '1520',
  'מרכז_העיר': '1520', // alias
  'רוטשילד': '???', // צריך למצוא
  
  // שכונות נוספות
  'רביבים': '202',
  'בבלי': '???',
  'רמת_אביב': '???',
  'כיכר_המדינה': '???',
  // ... יש להשלים
};
```

### שלב 2: עדכון buildYad2Url

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

```typescript
function buildYad2Url(
  city: string,
  propertyType: 'rent' | 'sale',
  // ... existing params ...
  neighborhoods?: string[] | null  // NEW
): string {
  // ... existing code ...
  
  // NEW: Add neighborhood filter
  if (neighborhoods && neighborhoods.length > 0) {
    const codes = neighborhoods
      .map(n => yad2NeighborhoodCodes[n])
      .filter(Boolean);
    
    if (codes.length > 0) {
      params.set('neighborhood', codes.join(','));
    }
  }
  
  // ...
}
```

### שלב 3: עדכון PersonalUrlParams

```typescript
export interface PersonalUrlParams {
  source: string;
  city: string;
  property_type: 'rent' | 'sale';
  // ... existing ...
  neighborhoods?: string[] | null;  // NEW
  page: number;
}
```

### שלב 4: עדכון Worker להעביר שכונות

```typescript
const url = buildPersonalUrl({
  source,
  city,
  property_type: propertyType,
  min_price: lead.budget_min,
  max_price: lead.budget_max,
  min_rooms: lead.rooms_min,
  max_rooms: lead.rooms_max,
  balcony_required: ...,
  parking_required: ...,
  elevator_required: ...,
  neighborhoods: lead.preferred_neighborhoods,  // NEW
  page
});
```

---

## מה נשאר לבדוק

### פערי ידע - קודי שכונות חסרים:

| שכונה | סטטוס |
|-------|-------|
| בבלי | צריך למצוא קוד |
| כיכר_המדינה | צריך למצוא קוד |
| רמת_אביב | צריך למצוא קוד |
| נווה_צדק | צריך למצוא קוד |
| כרם_התימנים | צריך למצוא קוד |
| רוטשילד | צריך למצוא קוד |
| פלורנטין | צריך למצוא קוד |

### מאדלן והומלס

צריך לבדוק אם גם הם תומכים בסינון שכונות ב-URL.

---

## תוצאה צפויה

**לפני הטמעה:**
```
לקוח Eli: 1,179 תוצאות ב-Yad2 → 30 דפים
```

**אחרי הטמעה (עם 4 שכונות):**
```
לקוח Eli: ~200 תוצאות ב-Yad2 → 5-8 דפים
```

**חיסכון:** ~75-85% פחות סריקות!

---

## סדר עבודה מומלץ

1. **קודם:** מצא את כל קודי השכונות הרלוונטיות ב-Yad2
2. **אז:** הטמע את השינויים ב-url-builder.ts
3. **אז:** בדוק אם Madlan/Homeless תומכים בשכונות
4. **אז:** הרץ בדיקה להשוואת מספר דפים לפני/אחרי

---

## קבצים לעדכון/יצירה

| קובץ | פעולה |
|------|-------|
| `_personal-scout/neighborhood-codes.ts` | **חדש** - מיפוי שכונות לקודים |
| `_personal-scout/url-builder.ts` | עדכון - הוספת פרמטר שכונות |
| `personal-scout-worker/index.ts` | עדכון - העברת שכונות מהלקוח |


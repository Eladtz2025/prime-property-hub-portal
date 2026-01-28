

# תוכנית: הטמעת סינון שכונות ב-URL ל-Yad2

## סיכום

הוספת סינון שכונות ברמת ה-URL ל-Yad2 כדי לצמצם משמעותית את מספר הדפים לסריקה (צפי: הפחתה של 70-85%).

---

## מיפוי שכונות תל אביב ל-Yad2

| שכונה (DB) | קוד Yad2 |
|------------|----------|
| צפון_ישן | 1483 |
| צפון_חדש | 204 |
| כיכר_המדינה | 1516 |
| מרכז_העיר / לב_העיר | 1520 |
| בבלי | 1518 |
| נווה_צדק | 848 |
| כרם_התימנים | 1521 |
| רמת_אביב | 197 |
| פלורנטין | 205 |
| צהלה | 494 |

**שכונות ללא קוד ייחודי (יסוננו בשלב הפילטור):**
- רוטשילד → חלק מלב העיר (1520)
- נמל תל אביב → חלק מצפון חדש (204)

---

## שינויים בקוד

### 1. קובץ חדש: neighborhood-codes.ts

יצירת קובץ מיפוי שכונות:

```text
supabase/functions/_personal-scout/neighborhood-codes.ts
```

**תוכן:**
- מיפוי שמות שכונות בעברית לקודי Yad2
- תמיכה באליאסים (מרכז_העיר = לב_העיר)
- פונקציה getYad2NeighborhoodCodes(neighborhoods) שמחזירה מערך קודים

### 2. עדכון url-builder.ts

**שינויים:**
- הוספת import לקובץ neighborhood-codes.ts
- הוספת פרמטר neighborhoods ל-PersonalUrlParams
- עדכון buildYad2Url להוסיף פרמטר neighborhood=XXX,YYY

**לוגיקה:**
```text
if (neighborhoods && neighborhoods.length > 0) {
  const codes = getYad2NeighborhoodCodes(neighborhoods);
  if (codes.length > 0) {
    params.set('neighborhood', codes.join(','));
  }
}
```

### 3. עדכון personal-scout-worker/index.ts

**שינוי:**
- העברת lead.preferred_neighborhoods לפונקציית buildPersonalUrl

---

## תוצאה צפויה

**לפני:**
```text
לקוח עם 3 שכונות בתל אביב:
Yad2: 1,179 תוצאות → 30 דפים
```

**אחרי:**
```text
לקוח עם 3 שכונות בתל אביב:
Yad2: ~200 תוצאות → 5-8 דפים
```

**חיסכון:** ~75% פחות דפים לסריקה

---

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `_personal-scout/neighborhood-codes.ts` | חדש |
| `_personal-scout/url-builder.ts` | עדכון |
| `personal-scout-worker/index.ts` | עדכון קטן |

---

## הערות

1. **Fallback:** שכונות ללא קוד (רוטשילד, נמל) ימשיכו להיות מסוננות בשלב הפילטור (feature-filter.ts)

2. **Madlan/Homeless:** בשלב זה מתמקדים רק ב-Yad2. ניתן להרחיב לאתרים נוספים בהמשך

3. **בדיקה:** לאחר ההטמעה נריץ סריקה ונבדוק את ההפחתה בפועל


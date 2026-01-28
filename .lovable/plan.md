
# תוכנית השלמה: Personal Scout

## סיכום מצב נוכחי

### מה קיים ✅
| רכיב | סטטוס |
|------|--------|
| Edge Functions (trigger + worker) | ✅ עובד |
| סינון ב-URL (מחיר, חדרים, פיצ'רים) | ✅ כל 3 המקורות |
| סינון שכונות ב-Yad2 URL | ✅ הוטמע |
| פילטור אחרי פארסינג | ✅ עובד |
| טבלאות DB | ✅ קיימות |
| Budget leakage (10%) | ✅ פעיל |

### מה חסר ❌
1. **סריקה דינמית** - כרגע מוגבל ל-2 דפים קבועים
2. **ממשק UI** - אין דרך להפעיל ולראות תוצאות
3. **תצוגת התאמות ללקוח** - אין דרך לראות מה נמצא לכל לקוח

---

## שלב 1: סריקה דינמית (Dynamic Pagination)

### הרעיון
במקום לסרוק 2 דפים קבועים - לזהות כמה תוצאות קיימות ולסרוק בהתאם.

### לוגיקה חדשה ל-worker

```text
לכל מקור:
1. סרוק דף ראשון
2. חלץ מספר תוצאות/דפים מהתוכן
3. חשב כמה דפים לסרוק (מקסימום 30)
4. סרוק את שאר הדפים
```

### פטרנים לחילוץ מספר תוצאות

| מקור | פטרן | דוגמה |
|------|------|-------|
| Yad2 | `מתוך (\d+) תוצאות` | "מתוך 157 תוצאות" |
| Madlan | `(\d+) דירות` | "278 דירות" |
| Homeless | `נמצאו (\d+) תוצאות` | "נמצאו 85 תוצאות" |

### שינויים בקוד

**קובץ חדש: `_personal-scout/pagination.ts`**

```typescript
export interface PaginationInfo {
  total_results: number;
  total_pages: number;
  pages_to_scan: number; // capped at MAX_PAGES
}

export function extractPaginationInfo(
  content: string, 
  source: string,
  resultsPerPage: number = 20
): PaginationInfo | null {
  // Source-specific regex patterns
  // Returns null if no pagination info found
}
```

**עדכון `personal-scout-worker/index.ts`:**

```text
לפני:
for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) { ... }

אחרי:
// סרוק דף 1 קודם
const firstPageData = await scrapeFirstPage(source, url);
const pagination = extractPaginationInfo(content, source);

// קבע כמה דפים לסרוק
const pagesToScan = pagination?.pages_to_scan || 2;

// סרוק את שאר הדפים
for (let page = 2; page <= pagesToScan; page++) { ... }
```

---

## שלב 2: ממשק משתמש (UI)

### מיקום
טאב חדש בדף Property Scout: "סקאוט אישי"

### רכיבים

**1. כרטיס סטטיסטיקות**
- לידים זכאים: 10
- ריצה אחרונה: לפני 2 שעות
- התאמות שנמצאו: 307

**2. כפתור הפעלה**
- "הפעל סריקה אישית לכל הלקוחות"
- אופציה: הפעל רק ללקוח ספציפי

**3. טבלת התאמות**

| לקוח | התאמות | מקורות | פעולות |
|------|--------|--------|--------|
| Eli Aviad | 161 | Yad2: 120, Madlan: 25, Homeless: 16 | צפה |
| רוני אלפנט | 84 | Yad2: 60, Madlan: 15, Homeless: 9 | צפה |

**4. תצוגת התאמות ללקוח**
לחיצה על "צפה" פותחת דיאלוג עם:
- פרטי הלקוח (תקציב, שכונות, חדרים)
- רשימת הנכסים שנמצאו
- סינון לפי מקור
- כפתור "סמן כנבדק"

---

## קבצים לעדכון/יצירה

| קובץ | פעולה |
|------|-------|
| `supabase/functions/_personal-scout/pagination.ts` | חדש |
| `supabase/functions/personal-scout-worker/index.ts` | עדכון |
| `src/components/scout/PersonalScoutTab.tsx` | חדש |
| `src/components/scout/PersonalScoutMatchesDialog.tsx` | חדש |
| `src/pages/AdminPropertyScout.tsx` | עדכון |

---

## תוצאה צפויה

**לפני:**
```
לקוח עם 4 שכונות בתל אביב:
סורק 2 דפים × 3 מקורות = 6 דפים
מוצא ~20 התאמות
```

**אחרי:**
```
לקוח עם 4 שכונות בתל אביב:
מזהה 157 תוצאות ב-Yad2 = 8 דפים
סורק דינמית עד 30 דפים
מוצא ~80 התאמות
```

---

## הערות טכניות

1. **מגבלת timeout**: Edge Function מוגבל ל-60 שניות. עם סריקה דינמית נצטרך לעבוד ב-fire-and-forget לכל דף או להפעיל workers נפרדים.

2. **Firecrawl credits**: סריקה של 30 דפים × 3 מקורות = 90 קריאות ללקוח. נצטרך לשקול עלויות.

3. **Priority**: הסריקה הדינמית היא האופטימיזציה העיקרית. ה-UI חשוב אבל משני.

---

## סדר הטמעה מומלץ

1. **קודם**: סריקה דינמית + pagination extraction
2. **אח"כ**: UI בסיסי (כפתור הפעלה + טבלת התאמות)
3. **לבסוף**: דיאלוג צפייה מפורט

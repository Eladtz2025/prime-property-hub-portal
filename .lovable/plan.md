
# תיקון טופס עריכת קונפיגורציה + עדכון הגדרות Homeless

## בעיה 1: כפתור השמירה לא נראה במובייל
הדיאלוג של עריכת קונפיגורציה מכיל הרבה שדות ובמובייל הוא גולש מהמסך. כפתור "עדכן/צור" נמצא מתחת לאזור הנראה ואין אפשרות לגלול אליו.

**פתרון:** הוספת `max-h-[80vh] overflow-y-auto` לתוכן הדיאלוג כדי שאפשר יהיה לגלול בתוכו.

## בעיה 2: הגדרות טכניות שגויות ל-Homeless
שתי הקונפיגורציות של Homeless (שכירות ומכירה) שמורות בדאטהבייס עם:
- `wait_for_ms: 3000` (צריך להיות 15000)
- `page_delay_seconds: 2` (צריך להיות 5)

בנוסף, ברירת המחדל בקוד (`SOURCE_TECHNICAL_PARAMS`) גם שגויה ולא תואמת את מה שהוכח כעובד ב-Edge Function.

**פתרון:**
1. עדכון `SOURCE_TECHNICAL_PARAMS` ל-Homeless: `waitForMs: 15000`, `delaySeconds: 5`
2. עדכון שתי הקונפיגורציות בדאטהבייס לערכים הנכונים

---

## פרטים טכניים

### קובץ: `src/components/scout/UnifiedScoutSettings.tsx`

**שינוי 1 - גלילה בדיאלוג (שורה ~710):**
הוספת class של גלילה ל-div הפנימי של הדיאלוג:
```
<div className="space-y-4 mt-4">
```
ישתנה ל:
```
<div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto px-1">
```

**שינוי 2 - ברירות מחדל (שורות 123-128):**
```
homeless: {
  getPages: (settings) => settings?.scraping?.homeless_pages ?? 5,
  delaySeconds: 5,
  waitForMs: 15000,
  schedule: ['08:00', '16:00', '22:00'],
},
```

### עדכון דאטהבייס
עדכון שתי קונפיגורציות Homeless ל:
- `wait_for_ms: 15000`
- `page_delay_seconds: 5`

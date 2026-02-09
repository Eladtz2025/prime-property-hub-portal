

# סריקת תמונות הדמיה אוטומטית מאתרי פרויקטים

## מה ישתנה
הפונקציה `scout-project` תחלץ גם תמונות הדמיה מהאתר הנסרק, ותשמור אותן בטבלת `property_images` -- כך שהכרטיסייה תציג תמונה אוטומטית בלי צורך בהעלאה ידנית.

## שינויים ב-Edge Function `scout-project/index.ts`

### 1. הרחבת סכמת החילוץ (UNITS_SCHEMA)
הוספת שדה `project_images` לסכמה שמועברת ל-Firecrawl:

```text
project_images: [
  {
    url: "כתובת URL מלאה של תמונת הדמיה / רנדר של הבניין",
    description: "תיאור התמונה"
  }
]
```

הוראה ל-AI של Firecrawl: "Extract main project render/hero images. Prefer large building exterior renders, not icons or logos. Return full absolute URLs."

### 2. שמירת תמונות ב-DB
אחרי עיבוד היחידות, הפונקציה:
- בודקת אם כבר קיימות תמונות לפרויקט ב-`property_images`
- אם לא קיימות -- שומרת את התמונות שנחלצו (עד 3 תמונות)
- התמונה הראשונה מסומנת כ-`is_main = true`
- אם כבר יש תמונות -- לא דורסת (שמירת תמונות שהועלו ידנית)

### 3. סינון תמונות
- מתעלם מתמונות קטנות (אייקונים, לוגואים) לפי מילות מפתח ב-URL (logo, icon, favicon)
- מוודא שה-URL הוא מלא (מתחיל ב-http)

## קבצים לשינוי
1. `supabase/functions/scout-project/index.ts` -- הרחבת הסכמה + שמירת תמונות

## התנהגות
- בסריקה ראשונה: מחלץ תמונות ושומר אוטומטית
- בסריקות חוזרות: לא דורס תמונות קיימות
- הכרטיסייה כבר מוכנה להצגת תמונות (השינוי הקודם)

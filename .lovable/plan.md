## תיקון: כרטיסיית מערכת במקום טאב

### מה קרה
בטעות הוספתי טאב שלישי "חילוץ טלפונים" ב-`AdminPropertyScout`, במקום להוסיף **ProcessCard** ב-grid של "דשבורד בדיקות" — שם מופיעות כל שאר המערכות (סריקות, בדיקת זמינות, כפילויות, התאמות, השלמת חוסרים).

### מה אעשה

**1. הסרת הטאב**
- מחיקת ה-`TabsTrigger value="phones"` וה-`TabsContent value="phones"` מ-`src/pages/AdminPropertyScout.tsx`.
- החזרת ה-`TabsList` ל-2 עמודות (dashboard + properties).
- מחיקת ה-import של `PhoneExtractionDashboard` מהעמוד.

**2. הוספת ProcessCard ב-`ChecksDashboard.tsx`**
כרטיסייה שישית ב-grid הקיים, עם בדיוק אותה תבנית כמו האחרות:
- **title:** "חילוץ טלפונים"
- **icon:** `<Phone />` בצבע ענברי
- **status:** running/completed/idle לפי הריצה האחרונה ב-`phone_extraction_runs`
- **primaryValue:** מספר הנכסים בתור (Homeless פרטיים בלי טלפון, attempts < 3)
- **primaryLabel:** "ממתינים לחילוץ"
- **secondaryLine:** "X טלפונים נמצאו" (סה"כ עם owner_phone)
- **insight:** "Y הצליחו השבוע" / "אין פריטים חדשים לטיפול"
- **lastRun:** מהריצה האחרונה
- **onRun:** `supabase.functions.invoke('phone-extraction-worker', { body: { manual: true } })`
- **enabled / onToggleEnabled:** קשור ל-`phone_extraction_enabled` ב-`feature_flags` (אותו kill switch שכבר קיים)
- **historyContent:** טבלת 20 הריצות האחרונות (מה שהיה בדשבורד)
- **settingsContent:** `LogicDescription` עם הסבר + הצגת חלון הפעילות (09:00–22:00) והקצב (15–45ש׳ בין נכסים)

**3. שינוי שם הדגל לעקביות**
לעקביות עם שאר המערכות (`process_scans`, `process_availability`...), אעדכן גם את ה-flag מ-`phone_extraction_enabled` ל-`process_phone_extraction`. ה-worker יקרא לדגל החדש (`isProcessEnabled(supabase, 'phone_extraction')`). מיגרציה קטנה תעביר את ה-state הקיים.

**4. מחיקת הקובץ הישן**
`src/components/scout/PhoneExtractionDashboard.tsx` יוסר (החלקים הרלוונטיים יעברו ל-history/settings של ה-ProcessCard).

---

## שאלה 2: מתי המערכת אמורה לעבוד?

הנה התשובה הברורה (כך הגדרתי אותה בשלב 1):

| פרמטר | ערך |
|---|---|
| **תדירות הקרון** | כל דקה (`* * * * *`) |
| **חלון פעילות** | 09:00–22:00 שעון ישראל בלבד |
| **קצב** | נכס אחד בכל ריצה + השהייה רנדומלית 15–45 שניות |
| **קיבולת תיאורטית** | ~50–60 נכסים בשעה → ~650–780 נכסים ביום |
| **kill switch** | כבוי כברירת מחדל — צריך להפעיל ידנית מהכרטיסייה |
| **מקור נוכחי** | Homeless בלבד (שלב 1) |
| **תקרת ניסיונות** | 3 לכל נכס. אחרי 3 כישלונות → סטטוס `failed` ולא ננסה שוב |

**מחוץ לחלון** (22:00–09:00): הקרון רץ אבל מדלג מיד עם `outside_working_hours`. זה כדי לא להתנהג כבוט שעובד 24/7.

**ריצה ידנית מתעלמת מהחלון** — אם תלחץ "הרץ ידנית", זה ירוץ גם ב-2 בלילה.

---

## קבצים שיושפעו
- `src/pages/AdminPropertyScout.tsx` — מחיקת הטאב
- `src/components/scout/ChecksDashboard.tsx` — הוספת ProcessCard + queries לטלפונים
- `src/components/scout/PhoneExtractionDashboard.tsx` — נמחק (תוכן עובר ל-history/settings sheet)
- `supabase/functions/phone-extraction-worker/index.ts` — קריאה לדגל החדש
- מיגרציה קטנה — שינוי שם דגל ב-`feature_flags`

מאשר? ברגע שתאשר אעבור ל-build mode ואבצע את כל ה-4 שלבים בסשן אחד.

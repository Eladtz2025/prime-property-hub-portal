
מטרה: לעצור את ה-crash במסך הראשי ולבטל את ה-blank screen בלי לשנות flow עסקי.

1) בידוד התקלה
- לאמת שה-crash קורה בזמן import של `src/integrations/supabase/client.ts` (לפני render).
- לאמת שהשגיאה נובעת מחוסר התאמה בין שם משתנה הסביבה שהקוד דורש לבין מה שבפועל מוזרק בסביבת הפריוויו.

2) תיקון ממוקד בקובץ Supabase client
- לעדכן את `src/integrations/supabase/client.ts` כך שמפתח הלקוח ייקרא עם fallback מסודר:
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_PUBLISHABLE_KEY`
- להשאיר את ה-URL עם fallback קיים (`VITE_SUPABASE_URL` ואז `SUPABASE_URL`).
- לשמור על יצירת client רגילה (`createClient`) ללא שינוי behavior באפליקציה.

3) שיפור אבחון (ללא חשיפת סודות)
- להחליף הודעת שגיאה כללית בהודעה מדויקת שמציינת אילו שמות env נבדקו.
- להוסיף לוג דיבוג בטוח (רק האם משתנה קיים, לא הערך), כדי למנוע לופ של “עדיין לא עובד” בסבבים הבאים.

4) יישור תיעוד כדי למנוע חזרה של התקלה
- לעדכן `.env.example` ו-`README_AUTHENTICATION.md` שיתמכו גם ב-`VITE_SUPABASE_PUBLISHABLE_KEY` (בנוסף ל-anon), כדי למנוע קונפיגורציה שגויה בפרויקטים/מפתחים נוספים.

5) ולידציה אחרי התיקון
- להריץ build/preview ולוודא שאין יותר:
  - `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`
- לוודא שה-route `/` נטען ולא נשאר blank.
- לבדוק flow בסיסי: public route + מסך התחברות נטענים תקין.
- אם עדיין מופיע מסך ישן: לבצע hard reload ולוודא שאין cache ישן מה-Service Worker.

סעיף טכני (מרוכז):
- קובץ מושפע עיקרי: `src/integrations/supabase/client.ts`
- קבצי תיעוד מושפעים: `.env.example`, `README_AUTHENTICATION.md`
- Do I know what the issue is? כן: האפליקציה נופלת מוקדם בגלל בדיקת env קשיחה מדי לשם מפתח אחד, במקום תמיכה בשמות המפתח בפועל בסביבת Lovable/Supabase.

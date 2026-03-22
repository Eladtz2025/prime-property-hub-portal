

## הצגת הגדרות אישיות גם ל-super_admin

### הבעיה
בקובץ `src/pages/Settings.tsx` שורה 38, יש תנאי `{!isSuperAdmin && ...}` שמסתיר את סקשן ההגדרות האישיות (כולל שדות WhatsApp) ממשתמשי super_admin.

### התיקון
**`src/pages/Settings.tsx`** — הסרת התנאי `!isSuperAdmin` כך שכל המשתמשים, כולל super_admin, יראו את ההגדרות האישיות וסקשן חיבור WhatsApp.

שינוי של שורה אחת בלבד.


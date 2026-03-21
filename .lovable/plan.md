

## הסרת הודעת התקנת PWA מהאדמין

### מה ישתנה
הסרה מלאה של `AdminPWAInstallPrompt` מהפרויקט — הקומפוננטה לא נחוצה.

### שינויים
1. **`src/pages/AdminDashboard.tsx`** — הסרת import ושימוש ב-`<AdminPWAInstallPrompt />`
2. **`src/components/MobileDashboard.tsx`** — הסרת import ושימוש ב-`<AdminPWAInstallPrompt />`
3. **`src/components/AdminPWAInstallPrompt.tsx`** — מחיקת הקובץ

3 קבצים, שינוי מינימלי.


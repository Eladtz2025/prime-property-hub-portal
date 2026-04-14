

## תיקון: תצוגת "הבא בתור" ומונה דירות לא מסוננים לפי סוג נכס

### הבעיה
הפונקציות `getNextProperty` ו-`getCycleInfo` ב-`AutoPublishManager.tsx` משתמשות ב-`websiteProperties` שמביא את **כל** הנכסים (שכירות + מכירה). אבל ה-backend (`auto-publish/index.ts`) מסנן נכון לפי `property_filter` של התבנית.

לכן:
- **"2/12"** — מציג 12 נכסים כולל מכירה, במקום רק נכסים להשכרה
- **"הבא בתור: דירה למכירה"** — בוחר נכס מהרשימה הלא-מסוננת

### תיקון — קובץ אחד: `AutoPublishManager.tsx`

1. **`getNextProperty(queue)`** — לסנן את `websiteProperties` לפי `queue.property_filter` לפני בחירת הנכס:
   ```ts
   const filtered = websiteProperties.filter(p => 
     filter === 'all' || p.property_type === filter
   );
   ```

2. **`getCycleInfo(queue)`** — אותו סינון, כך ש-`totalProps` ו-`currentIdx` יהיו מבוססים על הנכסים המסוננים בלבד

3. **`buildPreviewText(queue)`** — ישתמש ב-`getNextProperty` שכבר מסנן, אז יתוקן אוטומטית

### סיכון: אפס
שינוי תצוגה בלבד, ללא שינוי ב-DB או בלוגיקת הפרסום בפועל.


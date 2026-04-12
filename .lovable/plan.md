

## תיקון: פרסום כפול בתבניות אוטומטיות

### שורש הבעיה
בקוד `auto-publish/index.ts`, בדיקת `frequency_days` מופעלת רק כש-`freqDays > 1`:
```typescript
if (queue.last_published_at && freqDays > 1) { ... }
```
כש-frequency הוא 1 (יומי), הבדיקה נדלגת לגמרי — אז כל הפעלה בחלון ה-10 דקות מפרסמת שוב.

### תיקון
**קובץ: `supabase/functions/auto-publish/index.ts`**

1. **הסרת התנאי `freqDays > 1`** — תמיד לבדוק `last_published_at`, גם כש-frequency הוא 1
2. **הוספת בדיקת "כבר פורסם היום"** — אם `frequency_days` הוא 1, בדיקה שלא פורסם באותו יום (Israel time), לא רק לפי מספר ימים

לוגיקה מתוקנת:
```text
if last_published_at exists:
  if freqDays == 1:
    check if last publish was TODAY (Israel time) → skip
  else:
    check if enough days passed → skip if not
```

3. **Deploy** מחדש של הפונקציה

### תיקון משני: בדיקת שגיאת "Invalid parameter"
2 מתוך 3 הפרסומים נכשלו עם "Invalid parameter" — צריך לבדוק בלוגים של `social-publish` אם זה קשור ל-`is_private` בפוסטים מסוג property_listing.


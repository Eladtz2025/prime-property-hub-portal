
מטרת התיקון

התצוגה המקדימה של התור לא נבנית היום כמו הפוסט האמיתי:
- ב-`AutoPublishManager.tsx` היא מציגה רק `buildPreviewText(queue)` בתוך בלוק טקסט פשוט
- היא לא משתמשת ב-`FacebookPostPreview`
- היא לא מוסיפה את לינק הנכס שה-backend מוסיף אוטומטית
- הנתונים של `useWebsiteProperties` חלקיים מדי, ולכן אי אפשר להציג באמת את הנכס הבא

מה אשנה

1. `src/hooks/useAutoPublish.ts`
- ארחיב את `useWebsiteProperties()` כדי לטעון גם:
  - `description`
  - `property_images(image_url, order_index, show_on_website)`
- אסיר את `!inner` כדי שה-UI יעבוד על אותה רשימת נכסים כמו ה-backend, גם אם לנכס אין תמונות

2. `src/components/social/AutoPublishManager.tsx`
- אוסיף helper ייעודי ל-preview של תור אוטומטי, שיבנה את הפוסט הבא בדיוק מה-`nextProp`
- ה-helper:
  - ימלא placeholders מה-template
  - יוסיף בסוף את לינק הנכס כמו ב-`auto-publish`
  - יאסוף את התמונות הציבוריות של אותו נכס לפי `order_index`
- אחליף את בלוק ה-text preview ב-`FacebookPostPreview`, כדי לראות איך הפוסט הבא באמת ייראה
- אם אין לנכס תמונות, ה-preview יוצג כטקסט בלבד; אם יש, יופיע פוסט מלא עם תמונות

3. התאמת התצוגה ל"הבא בתור"
- אשאיר את שורת הסיכום העליונה (`הבא בתור: כתובת, אזור, מחיר`)
- ה-preview שמתחתיה יבוסס על אותו `nextProp` בדיוק, כדי שלא יהיה מצב שהכותרת אומרת נכס אחד וה-preview מציג משהו אחר

פרטים טכניים

```text
היום:
queue card -> buildPreviewText(queue) -> div טקסט פשוט

אחרי התיקון:
queue card -> buildQueuePreview(queue)
           -> text + property link + property images
           -> FacebookPostPreview
```

הערת התאמה חשובה:
בפרסום האוטומטי עצמו ה-backend מפרסם פוסט תמונות + לינק בתוך הטקסט (לא Link Card נפרד), לכן גם ה-preview יתאים לפורמט הזה כדי לשקף נאמנה איך הפוסט הבא באמת ייראה.

קבצים שיושפעו
- `src/hooks/useAutoPublish.ts`
- `src/components/social/AutoPublishManager.tsx`

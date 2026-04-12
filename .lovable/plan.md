

## תוכנית: תיקון 3 בעיות במערכת הפרסום

### 1. הגבלת 10 תמונות באינסטגרם ב-UI
**קובץ:** `src/components/social/SocialPostComposer.tsx`
- הוספת בדיקה ב-`validateBeforeSave`: אם `platforms.instagram && imageUrls.length > 10` — הצגת toast שגיאה
- הוספת הודעה ויזואלית ליד גלריית התמונות כשהכמות עוברת 10

### 2. סטטוס "מוכן להעתקה" לפוסטים בקבוצות Facebook
**קובץ:** `supabase/functions/social-publish/index.ts` (שורות 244-255)
- שינוי הסטטוס מ-`published` ל-`ready_to_copy` (סטטוס חדש)

**קובץ:** `src/components/social/SocialPostsList.tsx`
- הוספת תצוגה ייחודית לסטטוס `ready_to_copy` — badge בצבע כתום עם הטקסט "מוכן להעתקה" + כפתור העתקה

### 3. Polling ל-Instagram Reels במקום המתנה קבועה
**קובץ:** `supabase/functions/social-publish/index.ts` (שורות 130-140)
- החלפת `setTimeout(10000)` בלולאת polling שבודקת את סטטוס ה-media container כל 3 שניות (עד 60 שניות)
- Polling מול `GET /{container_id}?fields=status_code` — ממתין ל-`FINISHED` או מחזיר שגיאה ב-`ERROR`

### פרטים טכניים

**Reels polling:**
```text
loop (max 20 iterations, 3s apart):
  GET /{container_id}?fields=status_code
  if status_code == "FINISHED" → proceed to publish
  if status_code == "ERROR" → return error
  else → wait 3s
timeout → return error "Video processing timeout"
```

**סטטוס ready_to_copy — migration נדרש:**
- הוספת `ready_to_copy` לרשימת הסטטוסים המותרים (אם יש enum/check constraint), או שימוש ישיר אם הטבלה מבוססת text

### סיכון: **נמוך** — שינויים ממוקדים בולידציה, סטטוס, ו-polling.


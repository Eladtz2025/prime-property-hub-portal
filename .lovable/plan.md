

## תיקון: סינון קבצי וידאו מתמונות בפרסום

### שורש הבעיה
ב-`social-publish/index.ts`, הפונקציה `publishToFacebookPage` מעלה את כל ה-`image_urls` ל-`/photos` endpoint — אבל אם יש ביניהם קובץ `.MOV`/`.mp4`, פייסבוק דוחה אותו עם "Invalid parameter".

הנכס הנוכחי מכיל קובץ `nlmktd.MOV` ברשימת התמונות.

### תיקון (קובץ אחד)
**`supabase/functions/social-publish/index.ts`**

1. **סינון URLs** — לפני הפרסום, לסנן מ-`imageUrls` כל URL שמסתיים ב-`.mov`, `.mp4`, `.avi`, `.webm` (case-insensitive). רק URLs של תמונות (.jpg, .png, .webp וכו') יעברו ל-`/photos`.

2. **שיפור משני**: אם נמצא URL של וידאו וגם תמונות — להתעלם מהוידאו (כי פוסט עם תמונות מרובות לא תומך בוידאו מעורב בפייסבוק). אם יש רק וידאו בלי תמונות — להשתמש ב-video endpoint.

### קוד מתוכנן
```typescript
// At the start of publishToFacebookPage, filter out video files
const videoExtensions = /\.(mov|mp4|avi|webm|mkv)$/i;
const filteredImages = imageUrls.filter(url => !videoExtensions.test(url));
const videoFromImages = imageUrls.find(url => videoExtensions.test(url));

// If no images left but we have a video, publish as video
if (filteredImages.length === 0 && videoFromImages) {
  // use video endpoint with videoFromImages
}
// Otherwise use filteredImages instead of imageUrls
```

### תיקון משני: עדכון הלוג
ב-`auto-publish/index.ts`, הסטטוס בלוג מבוסס על `publishErr` (שגיאת invoke) ולא על תוצאת הפרסום בפועל — לכן ב-13 באפריל הלוג מראה "published" למרות שהפוסט נכשל. נתקן גם את זה.

### סיכון: נמוך
שינוי לוגיקה בלבד, ללא שינוי מבנה DB.


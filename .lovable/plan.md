

## תיקון תצוגת Facebook — התאמה למציאות

### הבעיות
1. **ה-URL לא נשלח לפייסבוק** — `linkUrl` (`citymarket.co.il/property/{id}`) משמש רק בתצוגה מקדימה אבל לא מצורף ל-`content_text` שנשלח ל-API. לכן ה-Link Card לא יופיע בפוסט האמיתי.
2. **פוסט תמונה vs פוסט קישור** — כשמעלים תמונה דרך `/photos` API, פייסבוק מציג פוסט תמונה (תמונה גדולה + טקסט מתחת). כשרוצים Link Card, צריך לשלוח דרך `/feed` API עם `link` parameter — בלי להעלות תמונה בנפרד.
3. **קיצוץ טקסט** — פייסבוק חותך אחרי ~5 שורות. התצוגה המקדימה לא מדמה את זה.

### פתרון

**שני מסלולים לפי סוג פוסט:**

**א. פוסט עם Link Card (כשיש נכס מקושר):**
- שלח דרך `/feed` API עם parameter `link` שמצביע ל-`https://citymarket.co.il/property/{id}`
- פייסבוק ישלוף את ה-OG tags מהדף ויבנה את ה-Link Card אוטומטית (תמונה, כותרת, תיאור, דומיין)
- **לא** מעלים תמונות בנפרד — פייסבוק מציג או תמונה או Link Card, לא שניהם

**ב. פוסט תמונה רגיל (בלי נכס / free text):**
- נשאר כמו היום — `/photos` API

### שינויים

| # | קובץ | שינוי |
|---|-------|--------|
| 1 | `src/components/social/AutoPublishManager.tsx` | שמור `propertyUrl` (מ-`buildLinkCard`) ושלח אותו כ-`link_url` לטבלת `social_posts` |
| 2 | `supabase/functions/social-publish/index.ts` | כשיש `link_url` בפוסט, שלח דרך `/feed` עם `link` parameter במקום `/photos`. פייסבוק יבנה את ה-Card אוטומטית |
| 3 | `src/components/social/FacebookPostPreview.tsx` | הוסף "See more" truncation כשהטקסט ארוך מ-5 שורות, כמו בפייסבוק אמיתי |

### פרטים טכניים

**Edge Function — לוגיקת publish חדשה:**
```
if (post.link_url && !imageUrls.length) {
  // Link post — Facebook generates OG card automatically
  POST /{pageId}/feed { message, link, access_token }
} else if (imageUrls.length) {
  // Photo post — existing logic
  POST /{pageId}/photos { url, message, access_token }
} else {
  // Text only
  POST /{pageId}/feed { message, access_token }
}
```

**AutoPublishManager — שליחת URL:**
- ב-`executeSave`: הוסף `link_url: propertyUrl` ל-post object כשנבחר נכס
- `propertyUrl` = `https://citymarket.co.il/property/${selectedPropertyId}`

**Preview — טקסט קצוץ:**
- אחרי 5 שורות או 300 תווים — הצג "...קרא עוד" עם אפשרות פתיחה

**3 קבצים. אפס שינויים ב-DB schema (הטבלה `social_posts` כבר מכילה `link_url`).**


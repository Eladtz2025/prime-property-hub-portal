

## תיקון: כפתור עריכה לא עובד + הוספת בחירת סגנון פרסום לתבניות

### בעיה 1: לחיצה על העיפרון לא עושה כלום
הפונקציה `openEditQueue` ממלאת את שדות הטופס, אבל הטופס נמצא למעלה בדף — בלי גלילה אליו, המשתמש לא רואה שום שינוי.

**תיקון**: הוספת `scrollIntoView` לטופס אחרי לחיצה על עריכה (ref על ה-Card של הטופס).

### בעיה 2: אין אפשרות לבחור בין פרסום כקישור לפרסום כתמונות בתבניות אוטומטיות
כרגע הבחירה link/photos קיימת רק בפוסט חד-פעמי. תבניות אוטומטיות תמיד שולחות תמונות (ב-backend).

**תיקון**:
1. הוספת שדה `post_style` לטופס התבנית (recurring + property_rotation)
2. שמירת `post_style` ב-DB (דרך ה-mutation הקיים — השדה כבר גמיש)
3. שחזור `post_style` ב-`openEditQueue`
4. ב-backend (`auto-publish/index.ts`): אם `post_style === 'link'` — לא לשלוח תמונות ב-`image_urls`, אלא לתת ל-Facebook ליצור Link Card מה-URL

### קבצים לשינוי
- `src/components/social/AutoPublishManager.tsx` — scroll + הצגת בורר סגנון בתבנית
- `src/hooks/useAutoPublish.ts` — הוספת `post_style` ל-mutation type
- `supabase/functions/auto-publish/index.ts` — התאמת הלוגיקה לפי post_style
- מיגרציה — הוספת עמודת `post_style` לטבלת `auto_publish_queues`

### פרטים טכניים
- עמודה חדשה: `post_style TEXT DEFAULT 'photos'` (ערכים: `'link'` / `'photos'`)
- ב-backend כשה-style הוא `link`: ה-`image_urls` יישלח ריק ל-social_posts, וה-content יכלול את הלינק — פייסבוק ייצור Link Card אוטומטית
- ב-preview: כש-`post_style === 'link'` — להשתמש ב-`FacebookPostPreview` עם `linkUrl`/`linkImage` במקום `imageUrls`


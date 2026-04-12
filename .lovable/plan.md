

## תוכנית: הוספת אפשרות "פרסום פרטי" לתבניות אוטומטיות

### מצב נוכחי
הצ'קבוקס "פרטי" מוצג רק במצב `one_time` + פייסבוק. בתבניות אוטומטיות (`property_rotation` / `article_oneshot`) אין אפשרות להגדיר פרסום פרטי.

### שינויים נדרשים

**1. מיגרציה — הוספת עמודת `is_private` לטבלת `auto_publish_queues`**
```sql
ALTER TABLE auto_publish_queues ADD COLUMN is_private boolean NOT NULL DEFAULT false;
```

**2. UI — הצגת הצ'קבוקס בכל המצבים** (`AutoPublishManager.tsx`)
- הסרת התנאי `mode === 'one_time'` מהצ'קבוקס "פרטי"
- התנאי יישאר `platforms.facebook` בלבד (פרסום פרטי רלוונטי רק לפייסבוק)
- שמירת הערך ב-queue בעת יצירת/עריכת תבנית

**3. Edge Function — העברת `is_private` בפרסום אוטומטי** (`auto-publish/index.ts`)
- בשתי הפונקציות `handlePropertyRotation` ו-`handleArticleOneshot`: קריאת `queue.is_private` והעברתו ל-`social-publish` בגוף הבקשה
- שורה 162-163: `body: { post_id: post.id, is_private: queue.is_private }`
- שורה 264-265: אותו דבר

### סיכון: נמוך
- עמודה חדשה עם ברירת מחדל `false` — לא משנה התנהגות קיימת
- הפונקציה `social-publish` כבר תומכת ב-`is_private`


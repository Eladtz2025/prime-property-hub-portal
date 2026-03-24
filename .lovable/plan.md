

## שדרוג מערכת הפרסום האוטומטי — המערכת העיקרית בעמוד

### מה משתנה

**1. מיקום — AutoPublishManager עולה למעלה**
`SocialDashboard.tsx`: סדר חדש → AutoPublishManager ראשון, אחריו שורת סטטוס, Composer, PostsList, ToolsPanel.

**2. DB — הוספת שדה `frequency_days` לתורות**
Migration: `ALTER TABLE auto_publish_queues ADD COLUMN frequency_days INTEGER NOT NULL DEFAULT 1;`
זה מאפשר "כל יום" (1), "כל יומיים" (2), "כל 3 ימים" (3) וכו'. לכתבות שבועיות — frequency_days=7.

**3. AutoPublishManager — שדרוג מלא**

הממשק הנוכחי הוא Collapsible פשוט. השדרוג:

- **לא Collapsible** — תמיד פתוח, עם כותרת ברורה
- **כרטיסי תורות** — עיצוב מחודש עם progress bar ויזואלי (כמה דירות פורסמו מהסבב), הדירה הבאה בתור עם תמונה מוקטנת
- **הגדרת תדירות** — dropdown: כל יום / כל יומיים / כל 3 ימים / פעם בשבוע / מותאם אישית
- **בחירת שעה** — time picker (כבר קיים)
- **תצוגה מקדימה** — "Preview" של הפוסט הבא כפי שייראה, עם התמונות, הטקסט אחרי החלפת placeholders, וההאשטגים
- **Progress tracker** — "סבב 2, דירה 3/7", עם bar ויזואלי
- **Log** — היסטוריה עם timeline יפה (לא רק רשימה שטוחה)

**4. AutoPublishLog — שדרוג ויזואלי**
- Timeline עם נקודות צבעוניות (ירוק=הצלחה, אדום=כישלון)
- הצגת שם הדירה/כתבה + פלטפורמה + שעה
- קומפקטי אבל מידע עשיר

**5. Edge Function — תמיכה ב-frequency_days**
`auto-publish/index.ts`: בתור דירות, בדיקה שעבר מספיק ימים מאז `last_published_at` לפי `frequency_days`.

### קבצים

| קובץ | שינוי |
|-------|-------|
| Migration SQL | הוספת `frequency_days` |
| `SocialDashboard.tsx` | העלאת AutoPublishManager למעלה |
| `AutoPublishManager.tsx` | שדרוג מלא — UI עשיר, תדירות, preview, progress |
| `AutoPublishLog.tsx` | Timeline ויזואלי |
| `auto-publish/index.ts` | תמיכה ב-`frequency_days` |
| `useAutoPublish.ts` | עדכון mutation לתמוך ב-`frequency_days` |

~6 קבצים, שינוי עיקרי ב-AutoPublishManager.


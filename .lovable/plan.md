

## מערכת פרסום אוטומטית — Auto-Publisher

### מה נבנה
מערכת שמנהלת "תורות פרסום" (Publishing Queues) שפועלת אוטומטית:

**תור 1 — דירות (יומי, מחזורי):**
- כל יום מפורסמת דירה אחת מהאתר (מטבלת `properties` עם `show_on_website = true` ו-`available = true`)
- כשכל הדירות פורסמו → חוזר להתחלה (round-robin)
- דירה שהוסרה מהאתר / סומנה כמושכרת (`available = false`) → יוצאת מהתור אוטומטית
- דירה חדשה שנוספת → נכנסת לסוף התור

**תור 2 — כתבות (שבועי, חד-פעמי):**
- פעם בשבוע ביום רנדומלי מפורסמת כתבה
- המשתמש מזין כתבות (טקסט + תמונה + לינק)
- כתבה מפורסמת פעם אחת בלבד
- כשכל הכתבות פורסמו → התור עוצר

**שתי התורות פועלות גם בפייסבוק וגם באינסטגרם.**

### ארכיטקטורה

```text
┌─────────────────┐     ┌──────────────────────┐
│  UI: ניהול       │     │  DB: auto_publish_    │
│  תורות          │────▶│  queues + items       │
│  + כתבות        │     │                      │
└─────────────────┘     └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Edge Function:       │
                        │  auto-publish         │
                        │  (Cron כל יום 10:00)  │
                        │                      │
                        │  1. בודק תורות פעילים│
                        │  2. בוחר פריט הבא    │
                        │  3. בונה פוסט מתבנית │
                        │  4. שולח ל-social-    │
                        │     publish           │
                        └──────────────────────┘
```

### שינויים בדאטאבייס (Migration)

**טבלה: `auto_publish_queues`**
- `id`, `name` (שם התור), `queue_type` ('property_rotation' | 'article_oneshot')
- `platforms` (jsonb — ['facebook_page', 'instagram'])
- `template_text` (תבנית טקסט עם placeholders כמו {address}, {price})
- `hashtags`, `publish_time` (שעה — '10:00')
- `frequency` ('daily' | 'weekly')
- `is_active`, `current_index` (מיקום נוכחי בתור)
- `last_published_at`, `next_publish_day` (לכתבות — יום רנדומלי שנבחר)
- `created_by`, `created_at`

**טבלה: `auto_publish_items`** (רק לכתבות — דירות נשלפות אוטומטית מ-properties)
- `id`, `queue_id`, `title`, `content_text`, `image_urls`, `link_url`
- `order_index`, `is_published`, `published_at`
- `created_at`

**טבלה: `auto_publish_log`** (מעקב מה פורסם)
- `id`, `queue_id`, `property_id` (nullable), `item_id` (nullable)
- `social_post_id` (reference ל-social_posts)
- `published_at`, `platforms` (jsonb)

### Edge Function: `auto-publish`
- Cron trigger יומי (10:00 Israel time)
- עובר על כל התורות הפעילים
- **תור דירות**: שולף דירות פעילות מ-`properties` (where `show_on_website = true AND available = true`), בוחר לפי `current_index`, בונה פוסט מהתבנית עם הנתונים של הדירה + תמונות, ואם הגענו לסוף → חוזר ל-0
- **תור כתבות**: בודק אם היום הוא `next_publish_day`, אם כן → מפרסם כתבה הבאה שלא פורסמה, בוחר יום רנדומלי חדש לשבוע הבא
- יוצר רשומת `social_posts` וקורא ל-`social-publish` (תשתית קיימת)
- שומר log ב-`auto_publish_log`

### ממשק משתמש (UI)
רכיב חדש **`AutoPublishManager`** בתוך דף השיווק:

1. **כרטיס סיכום** — "פרסום אוטומטי: 2 תורות פעילים, הבא: דירה ברחוב X מחר"
2. **ניהול תור דירות** — הפעלה/כיבוי, בחירת תבנית, שעת פרסום, פלטפורמות, תצוגה מקדימה של הדירה הבאה בתור
3. **ניהול תור כתבות** — הוספת כתבות (טקסט + תמונה + לינק), רשימה עם סטטוס (פורסם/ממתין), הפעלה/כיבוי
4. **היסטוריית פרסום** — log מה פורסם, מתי, לאן

### קבצים

| קובץ | פעולה |
|-------|-------|
| Migration SQL | טבלאות + RLS |
| `supabase/functions/auto-publish/index.ts` | Edge Function — לוגיקת פרסום אוטומטי |
| `src/components/social/AutoPublishManager.tsx` | ממשק ניהול תורות |
| `src/components/social/AutoPublishArticles.tsx` | ניהול כתבות |
| `src/components/social/AutoPublishLog.tsx` | היסטוריית פרסום |
| `src/hooks/useAutoPublish.ts` | hooks לנתונים |
| `SocialDashboard.tsx` | הוספת AutoPublishManager |
| Cron job (SQL insert) | תזמון יומי |


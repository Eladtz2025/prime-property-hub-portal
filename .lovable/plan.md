

## שתי שאלות — יעד פרסום (עמוד/קבוצות) + תצוגה מקדימה ריאליסטית

### שאלה 1 — איפה בוחרים לפרסם: עמוד ראשי או קבוצות?

כרגע אין בטופס שדה שמאפשר לבחור **לאן** לפרסם — רק **באיזו פלטפורמה**. צריך להוסיף שדה "יעד פרסום" מתחת לכפתורי הפלטפורמות:

**כשפייסבוק מסומן**, מופיע dropdown חדש:
- עמוד ראשי (City Market) — ברירת מחדל
- קבוצות פייסבוק — עם multi-select מתוך טבלת `social_facebook_groups` הקיימת

**שינויים:**
- `AutoPublishManager.tsx`: הוספת state `publishTarget` ('page' | 'groups') + state `selectedGroupIds` (string[])
- כש-`publishTarget === 'groups'` — מוצגת רשימת checkboxes/chips של הקבוצות מ-`useFacebookGroups()`
- שמירה: ב-one_time → שדה `target_group_id` ב-`social_posts`. ב-recurring → שדה חדש `target` ב-`auto_publish_queues` (JSON: `{type: 'page'}` או `{type: 'groups', group_ids: [...]}`)
- Migration: `ALTER TABLE auto_publish_queues ADD COLUMN publish_target JSONB DEFAULT '{"type":"page"}'`
- Edge Function `auto-publish`: קריאה ל-`social-publish` עם group_id כשהיעד הוא קבוצה

### שאלה 2 — תצוגה מקדימה ריאליסטית

הפריוויו הנוכחי (שורות 640-681) הוא מינימלי — PP avatar, טקסט, ו-3 כפתורים. המשתמש רוצה שזה ייראה **בדיוק** כמו פוסט פייסבוק אמיתי.

**פתרון — רכיב `FacebookPostPreview` נפרד:**

עיצוב pixel-perfect שמחקה פוסט פייסבוק אמיתי:
- Header: תמונת פרופיל אמיתית של הדף (מ-`social_accounts` או מ-Graph API), שם הדף, זמן + globe icon
- Body: טקסט עם עיצוב פייסבוק (font, line-height, color)
- תמונות: grid בדיוק כמו פייסבוק — תמונה אחת full-width, 2 תמונות 50/50, 3+ עם grid מיוחד
- Reactions bar: אייקוני לייק/love/haha + "Like · Comment · Share" עם dividers
- רקע לבן, shadow, border-radius כמו בפייסבוק
- כשבוחרים אינסטגרם — מוצג preview בסגנון אינסטגרם (header שונה, לבבות, אין share)

**הפריוויו מוצג תמיד** (לא רק כשיש טקסט) — כשאין טקסט מציג placeholder.

במצב recurring עם דירות — הפריוויו לוקח את הדירה הראשונה כדוגמה ומציג עם התמונות האמיתיות שלה מ-`property_images`.

### קבצים

| קובץ | שינוי |
|-------|-------|
| Migration SQL | הוספת `publish_target JSONB` ל-`auto_publish_queues` |
| `AutoPublishManager.tsx` | הוספת שדה יעד פרסום (עמוד/קבוצות) + import של FacebookPostPreview + החלפת הפריוויו הישן |
| חדש: `FacebookPostPreview.tsx` | רכיב preview ריאליסטי בסגנון פייסבוק — header, body, image grid, reactions |
| `useAutoPublish.ts` | עדכון mutation לשמור `publish_target` |
| `auto-publish/index.ts` | תמיכה ביעד קבוצות |

**~5 קבצים, ~150 שורות חדשות.**


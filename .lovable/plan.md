

## מיזוג AutoPublishManager + SocialPostComposer למערכת אחת

### הבעיה
כרגע יש שני בלוקים נפרדים בדף — "פרסום אוטומטי" למעלה (ריק, עם empty state) ו-"קומפוזר" למטה. הם נראים כמו שתי מערכות שונות על אותו דף.

### הפתרון
מיזוג לרכיב אחד בשם `SocialPublisher` שמכיל:

**חלק עליון — תבניות אוטומטיות:**
- כפתורי "+ תבנית דירות" / "+ תבנית כתבות" בראש
- כרטיסי תבניות קיימות עם switch, progress, preview
- היסטוריית פרסום אוטומטי (collapsible)

**חלק תחתון — פרסום ידני (הקומפוזר הנוכחי):**
- בחירת נכס + תבנית + פלטפורמות + טקסט + האשטגים + תמונות
- כפתורי פרסם/תזמן/טיוטה

הכל בתוך `Card` אחד עם separator ביניהם, או שניהם ללא Card כקטעים רציפים עם כותרות קטנות.

### שינויים טכניים

| קובץ | שינוי |
|-------|-------|
| `SocialDashboard.tsx` | הסרת `SocialPostComposer` כרכיב נפרד — רק `AutoPublishManager` + `SocialPostsList` + `SocialToolsPanel` |
| `AutoPublishManager.tsx` | הטמעת הקומפוזר בתוכו — import של הלוגיקה מ-SocialPostComposer או embed ישיר של `<SocialPostComposer />` כחלק מהרכיב, עם separator/כותרת "פרסום ידני" |

גישה פשוטה: ב-`AutoPublishManager` להוסיף את `<SocialPostComposer />` בתחתית, עטוף בכותרת "פרסום ידני", ולהסיר אותו מ-`SocialDashboard`. כך הכל נראה כמערכת אחת.

**~10 שורות שינוי ב-2 קבצים.**


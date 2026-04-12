

## תוכנית: הוספת cron job ובדיקת שעת פרסום ל-auto-publish

### בעיה כפולה
1. **אין cron job** שמפעיל את `auto-publish` — התבנית לעולם לא תרוץ
2. **הפונקציה לא בודקת `publish_time`** — אם הייתה רצה, הייתה מפרסמת בכל הפעלה ולא רק בשעה 13:15

### תיקונים

**1. הוספת בדיקת `publish_time` בתחילת הלולאה** (`auto-publish/index.ts`)
- לפני בדיקת `frequency_days`, בדיקה: אם לתבנית מוגדר `publish_time`, השוואה לשעה הנוכחית בזמן ישראל
- אם ההפרש גדול מ-10 דקות — skip
- כך הפונקציה יכולה לרוץ כל 5 דקות ולפרסם רק כשמגיע הזמן הנכון

**2. יצירת cron job** (INSERT ישיר, לא מיגרציה)
- הפעלת `auto-publish` כל 5 דקות: `*/5 * * * *`
- באותו סגנון כמו `social-scheduler-every-5-min` הקיים

### לוגיקת הזמן
```text
publish_time = "13:15"
Israel time now = "13:17"  → diff = 2 min → PUBLISH
Israel time now = "13:28"  → diff = 13 min → SKIP
Israel time now = "09:00"  → diff = 255 min → SKIP
```

### סיכון: נמוך
- הבדיקה מוסיפה שכבת הגנה — גם אם ה-cron רץ כל 5 דקות, הפרסום יקרה רק פעם ביום בשעה הנכונה
- `last_published_at` מונע כפילויות נוספות


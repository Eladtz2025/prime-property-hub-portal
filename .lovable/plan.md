

## בעיה: פירוט התאמות לא מוצג במוניטור

### סיבה
הקוד מחפש נכסים שה-`updated_at` שלהם נמצא **בתוך חלון ריצת ההתאמות** (`started_at` עד `completed_at` של ה-`scout_run`). אבל:

- ריצת ההתאמות האחרונה: 05:00–05:01 (דקה אחת)
- ה-`matched_leads` עודכנו בפועל: 08:34–09:10 (שלוש שעות וחצי אחרי)

זה קורה כי `trigger-matching` רץ בנפרד אחרי ה-`scout_run`, ומעדכן כל נכס — מה שמשנה את `updated_at` **מחוץ** לחלון הריצה. לכן השאילתה מחזירה 0 תוצאות, ורואים רק את שורת הסיכום.

### תיקון
ב-`useMonitorData.ts`, שינוי השאילתה של `matchingProperties` — במקום לסנן לפי `updated_at` בחלון הריצה, לסנן לפי:
- `updated_at` ב-24 השעות האחרונות
- `matched_leads` לא ריק
- מגביל ל-250 תוצאות

כלומר, להחליף את:
```typescript
.gte('updated_at', latestMatchWindow.started_at)
.lte('updated_at', latestMatchWindow.completed_at)
```

ב:
```typescript
const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
// ...
.gte('updated_at', since24h)
```

וגם להסיר את ה-dependency על `latestMatchWindow` ב-`enabled` — השאילתה תרוץ תמיד, ותציג את כל הנכסים שהותאמו ב-24 השעות האחרונות.

### השפעה
| מה | לפני | אחרי |
|---|---|---|
| טאב התאמות | שורת סיכום בלבד | פירוט מלא: כתובת, מחיר, חדרים, שמות לקוחות |
| תלות בחלון ריצה | כן (דקה אחת) | לא — 24 שעות אחרונות |


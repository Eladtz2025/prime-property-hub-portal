
# תיקון סריקת פרויקט - Firecrawl API format

## מה מצאתי

| בדיקה | תוצאה |
|-------|-------|
| פרויקט בדאטאבייס | נשמר (זלטופולסקי 27, תל אביב-יפו) |
| טבלת project_units | קיימת, ריקה (מחכה לסריקה) |
| סריקה אחרונה | נכשלה - "Bad Request" |
| סיבת הכשלון | פורמט Firecrawl API שגוי |

## הבאג

שורות 68-76 ב-`scout-project/index.ts` שולחות:
```text
formats: [
  { type: 'json', schema: UNITS_SCHEMA },   // לא חוקי!
  'markdown'
]
```

Firecrawl API v1 מצפה ל-`formats` כמערך של מחרוזות בלבד. ה-schema צריך לעבור דרך אובייקט `extract` נפרד.

## התיקון

### קובץ: `supabase/functions/scout-project/index.ts`

**שינוי 1 - פורמט הבקשה** (שורות 68-76):
```text
// לפני (שגוי):
body: JSON.stringify({
  url,
  formats: [
    { type: 'json', schema: UNITS_SCHEMA },
    'markdown'
  ],
  onlyMainContent: true,
  waitFor: 3000,
})

// אחרי (תקין):
body: JSON.stringify({
  url,
  formats: ['extract', 'markdown'],
  extract: {
    schema: UNITS_SCHEMA,
  },
  onlyMainContent: true,
  waitFor: 3000,
})
```

**שינוי 2 - חילוץ התוצאה** (שורה 102):
```text
// לפני:
const jsonData = scrapeResult?.data?.json || scrapeResult?.json;

// אחרי:
const jsonData = scrapeResult?.data?.extract || scrapeResult?.extract;
```

### אחרי דיפלוי - בדיקה אוטומטית

הפעלת הסריקה ידנית לפרויקט זלטופולסקי 27 ובדיקה ש:
1. הסריקה מחזירה תוצאות (לא Bad Request)
2. יחידות נכנסות ל-`project_units`
3. `units_count` מתעדכן ב-`properties`
4. לוג חדש ב-`project_scan_logs` עם status = completed

## סיכום

- קובץ אחד לתיקון
- 2 שינויים קטנים: פורמט בקשה + חילוץ תוצאה
- אפעיל סריקה ידנית מיד אחרי הדיפלוי לוודא שהכל עובד

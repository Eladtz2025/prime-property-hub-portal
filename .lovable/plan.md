

# תיקון בדיקת זמינות 2 + השלמת נתונים 2 למדלן

## הבעיה
הסריקות (scout-madlan-jina) עובדות כי הן שולחות את הכותרת `X-Locale: he-IL` ל-Jina. בדיקת זמינות 2 והשלמת נתונים 2 לא שולחות את הכותרת הזו, מה שגורם לתוכן לחזור ללא עברית תקינה ולהיכשל בזיהוי.

## ההבדלים בין מה שעובד למה שלא

| כותרת | סריקות (עובד) | זמינות 2 | השלמת נתונים 2 |
|---|---|---|---|
| X-Locale: he-IL | כן | **חסר** | **חסר** |
| X-Proxy-Country: IL | כן | כן | כן |
| X-No-Cache | כן | Phase 2 בלבד | לא (cache first) |
| X-Wait-For-Selector | a[href*="/listings/"] | body | body |

## התיקון

### 1. check-property-availability-jina/index.ts
הוספת `X-Locale: he-IL` לכותרות ה-Jina בפונקציה `checkWithJina` (סביב שורה 57).

שינוי:
```typescript
// לפני
const headers: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
};

// אחרי
const headers: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
  'X-Locale': 'he-IL',
};
```

### 2. backfill-property-data-jina/index.ts
הוספת `X-Locale: he-IL` לכותרות ה-Jina בסקשן הסקרייפ (סביב שורה 438).

שינוי:
```typescript
// לפני
const jinaHeaders: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
};

// אחרי
const jinaHeaders: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
  'X-Locale': 'he-IL',
};
```

### 3. _shared/scraping-jina.ts (שיתופי)
הפונקציה השיתופית `scrapeWithJina` כבר כוללת `X-Locale: he-IL` - אבל אף אחד מהתהליכים לא משתמש בה. התיקון הוא בקוד הישיר של כל פונקציה.

## מה לא ישתנה
- **אף שינוי בסריקות** - לא נוגעים ב-scout-madlan-jina, scout-yad2-jina, scout-homeless-jina, או בשום trigger/helper שלהם
- הלוגיקה של Madlan two-phase (cache first, then fresh+proxy) נשארת כמו שהיא
- כל יתר ההגדרות נשארות

## פריסה
שני Edge Functions לפריסה:
- `check-property-availability-jina`
- `backfill-property-data-jina`


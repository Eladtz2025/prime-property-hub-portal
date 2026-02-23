
# תיקון באגי Casing נוספים ב-scout-madlan-jina

## הבעיה
הקובץ מכיל עוד שגיאות casing שגורמות לקריסה מיידית:
- הפונקציה מוגדרת כ-`scrapeMadlanWithJina` אבל נקראת כ-`scrapemadlanWithJina` (שורה 133)
- המשתנה מוגדר כ-`Madlan_CONFIG` אבל נקרא כ-`madlan_CONFIG` (שורות 133, 233, 284, 291)

## התיקונים

### קובץ: `supabase/functions/scout-madlan-jina/index.ts`

**שורה 133** - תיקון שם הפונקציה + שם הקונפיג:
```
// שגוי:
const scrapeResult = await scrapemadlanWithJina(url, madlan_CONFIG.MAX_RETRIES, timeoutSec);
// נכון:
const scrapeResult = await scrapeMadlanWithJina(url, Madlan_CONFIG.MAX_RETRIES, timeoutSec);
```

**שורה 233** - תיקון שם הקונפיג:
```
// שגוי:
const delay = isRetry ? madlan_CONFIG.RETRY_DELAY_MS : madlan_CONFIG.PAGE_DELAY_MS;
// נכון:
const delay = isRetry ? Madlan_CONFIG.RETRY_DELAY_MS : Madlan_CONFIG.PAGE_DELAY_MS;
```

**שורה 284** - תיקון שם הקונפיג:
```
// שגוי:
(p: any) => p.status === 'blocked' && (p.retry_count || 0) < madlan_CONFIG.MAX_BLOCK_RETRIES
// נכון:
(p: any) => p.status === 'blocked' && (p.retry_count || 0) < Madlan_CONFIG.MAX_BLOCK_RETRIES
```

**שורה 291** - תיקון שם הקונפיג:
```
// שגוי:
if (p.status === 'blocked' && (p.retry_count || 0) < madlan_CONFIG.MAX_BLOCK_RETRIES)
// נכון:
if (p.status === 'blocked' && (p.retry_count || 0) < Madlan_CONFIG.MAX_BLOCK_RETRIES)
```

### ניקוי הריצה התקועה
עדכון ריצה `bcef0734-7861-4cad-b829-ec044a7f0ec7` מ-`running` ל-`failed`.

### פריסה מחדש
פריסת `scout-madlan-jina` לאחר התיקון.

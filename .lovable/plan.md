

# תיקון URLs של Homeless - פורמט שגוי ב-Pagination

## הבעיה שזוהתה

הסריקה של הומלס (ריצת "ירקון השכרה") מחזירה **0 נכסים** בדפים 2-8 כי ה-URL שנבנה שגוי.

### לוגים:
```
🟣 Homeless page 1: [NO-AI] Parsed 14 properties ✓
🟣 Homeless page 2: [NO-AI] Parsed 0 properties ❌
🟣 Homeless page 3: [NO-AI] Parsed 0 properties ❌
...
🟣 Homeless page 8: [NO-AI] Parsed 0 properties ❌
```

### הסיבה:

| URL שנבנה (שגוי) | תוצאה |
|-----------------|-------|
| `/rent/inumber1=150,page=2` | מחזיר **דף הבית** של הומלס - אין נכסים |

| URL נכון | תוצאה |
|----------|-------|
| `/rent/?inumber1=150&page=2` | מחזיר **דף חיפוש** עם טבלת נכסים |

---

## פרטים טכניים

### מיקום הבאג
**קובץ:** `supabase/functions/_shared/url-builders.ts`
**פונקציות מושפעות:** `buildSinglePageUrl()` ו-`buildSearchUrls()`

### הקוד הנוכחי (שורות 193-223):

```typescript
// CRITICAL: Use path-style URL (/inumber1=X) NOT query string (?inumber1=X)
// Homeless IGNORES query params and returns all of Israel with ?param format!
if (config.neighborhoods?.length) {
  const areaCodes = getHomelessAreaCodes(config.neighborhoods);
  if (areaCodes.length >= 1) {
    const pathType = type === 'rent' ? 'rent' : 'sale';
    baseUrl = `https://www.homeless.co.il/${pathType}/inumber1=${areaCodes[0]}`;
    ...
  }
}

// For path-style URLs, pagination uses COMMA separator (not &)
const pageUrl = page === 1 ? baseUrl : `${baseUrl},page=${page}`;
```

**הבעיה:** ההערה שגויה! הומלס **לא** מתעלם מ-query params. ה-URL הנכון הוא:
```
/rent/?inumber1=150&page=2
```

לא:
```
/rent/inumber1=150,page=2
```

---

## התיקון הנדרש

### שינוי 1: `buildSinglePageUrl()` - שורות 193-223

**לפני:**
```typescript
baseUrl = `https://www.homeless.co.il/${pathType}/inumber1=${areaCodes[0]}`;
...
const pageUrl = page === 1 ? baseUrl : `${baseUrl},page=${page}`;
```

**אחרי:**
```typescript
baseUrl = `https://www.homeless.co.il/${pathType}/?inumber1=${areaCodes[0]}`;
...
const pageUrl = page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
```

### שינוי 2: `buildSearchUrls()` - שורות 352-388

אותו שינוי - להוסיף `?` אחרי `/rent/` ולהחליף פסיק ב-`&`.

---

## סיכום השינויים

| מיקום | לפני | אחרי |
|-------|------|------|
| baseUrl | `/rent/inumber1=X` | `/rent/?inumber1=X` |
| pagination | `baseUrl,page=N` | `baseUrl&page=N` |

---

## תוצאה צפויה

| דף | לפני (0 נכסים) | אחרי (עובד) |
|----|--------------|-------------|
| 1 | `/rent/inumber1=150` → 14 נכסים | `/rent/?inumber1=150` → 14 נכסים |
| 2 | `/rent/inumber1=150,page=2` → **0 נכסים** | `/rent/?inumber1=150&page=2` → נכסים |
| 3 | `/rent/inumber1=150,page=3` → **0 נכסים** | `/rent/?inumber1=150&page=3` → נכסים |

---

## קובץ לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_shared/url-builders.ts` | תיקון פורמט URL ל-Homeless |


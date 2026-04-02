

## תיקון דומיין ושכפול עיר בפוסט פייסבוק

### הבעיות

1. **דומיין שגוי** — הקוד משתמש ב-`citymarket.co.il` בכל מקום, אבל הדומיין האמיתי הוא `ctmarketproperties.com`. פייסבוק יציג `CTMARKETPROPERTIES.COM` בתחתית ה-Link Card — לא `CITYMARKET.CO.IL` כמו שמוצג בתצוגה המקדימה
2. **כפילות עיר** — כש-`neighborhood` ריק, ה-`linkTitle` מייצר `דירה למכירה: תל אביב-יפו, תל אביב-יפו` כי שני ה-fallbacks מחזירים את אותו ערך
3. **OG Edge Function** — גם `og-property/index.ts` משתמש ב-`citymarket.co.il`

### מה באמת יראה בפייסבוק?
פייסבוק שולף את ה-OG tags מהדומיין. הדומיין שיוצג תמיד הוא הדומיין האמיתי של ה-URL שנשלח. לכן:
- אם נשלח `https://www.ctmarketproperties.com/property/123` → פייסבוק יציג `CTMARKETPROPERTIES.COM`
- הכותרת והתיאור יבואו מה-OG tags של הדף (מה שה-`og-property` function מחזיר)

### שינויים

| # | קובץ | שינוי |
|---|-------|--------|
| 1 | `src/components/social/AutoPublishManager.tsx` | החלף `citymarket.co.il` → `www.ctmarketproperties.com` (2 מקומות). תקן linkTitle — כשאין neighborhood, הצג רק עיר פעם אחת |
| 2 | `supabase/functions/og-property/index.ts` | החלף `citymarket.co.il` → `www.ctmarketproperties.com` |
| 3 | `supabase/functions/auto-publish/index.ts` | החלף `citymarket.co.il` → `www.ctmarketproperties.com` |
| 4 | `src/components/social/FacebookPostPreview.tsx` | ה-preview כבר מציג domain מה-URL, אז יתעדכן אוטומטית |

### תיקון linkTitle

```
// לפני — כפילות
`דירה למכירה: תל אביב-יפו, תל אביב-יפו`

// אחרי
`דירה למכירה: הצפון הישן, תל אביב-יפו`  // כשיש שכונה
`דירה למכירה בתל אביב-יפו`                // כשאין שכונה
```

**4 קבצים (3 קבצי קוד + deploy של 2 edge functions).**


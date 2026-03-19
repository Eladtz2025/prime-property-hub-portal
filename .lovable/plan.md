

## תיקון: נכסים לא אקטואליים שעדיין מוצגים כ-active

### ממצאים

**בעיה מרכזית: פונקציות זיהוי Madlan לא בשימוש**

הפונקציה `checkMadlanDirect` (שורות 38-120 ב-`check-property-availability-jina/index.ts`) מייבאת את `isMadlanHomepage` ו-`isMadlanSearchResultsPage` אבל **לא קוראת להן בפועל**. היא בודקת רק:
- סטטוס HTTP 404/410
- טקסט "המודעה הוסרה" ב-title/og:description/og:title
- `isListingRemoved` על גוף ה-HTML
- `isMadlanBlocked` לזיהוי CAPTCHA

**מה חסר**: כש-Madlan מסירה מודעה, היא לפעמים מפנה (redirect) לדף הבית או לדף תוצאות חיפוש — במקום להחזיר 404. הפונקציות `isMadlanHomepage` ו-`isMadlanSearchResultsPage` נועדו בדיוק לתפוס את המקרים האלו, אבל הן לא נקראות.

זו הסיבה שהנכס של מדלן `3BQqogDu770` קיבל `no_indicators_keeping_active` — הוא כנראה הופנה לדף הבית או לדף חיפוש, והמערכת לא זיהתה את זה.

**בעיה משנית: 39 URLs של Yad2 עם query params**

ה-migration הקודם לא הצליח לנרמל את כל ה-URLs בגלל unique constraint conflicts. עדיין יש 39 רשומות אקטיביות עם query params.

### תיקונים

**1. הוספת בדיקות homepage/search redirect ל-`checkMadlanDirect`**

ב-`check-property-availability-jina/index.ts`, אחרי בדיקת `isMadlanBlocked` (שורה 109), להוסיף:

```typescript
// Check for homepage redirect (listing removed, redirected to homepage)
if (isMadlanHomepage(html)) {
  console.log(`🚫 Madlan homepage redirect detected for ${url}`);
  return { isInactive: true, reason: 'listing_removed_homepage_redirect' };
}

// Check for search results redirect (listing removed, redirected to search)
if (isMadlanSearchResultsPage(html)) {
  console.log(`🚫 Madlan search results redirect detected for ${url}`);
  return { isInactive: true, reason: 'listing_removed_search_redirect' };
}
```

**2. ניקוי 39 URLs של Yad2 שנשארו** (SQL migration)

ריצה שנייה של ניקוי — הפעם מוחקת קודם את הרשומות הלא-אקטיביות החוסמות, ואז מנרמלת.

### סיכום

| קובץ | שינוי |
|---|---|
| `check-property-availability-jina/index.ts` | הוספת `isMadlanHomepage` + `isMadlanSearchResultsPage` לפני return content_ok |
| SQL migration | ניקוי 39 URLs נותרים של Yad2 |

### תוצאה
- מודעות Madlan שהוסרו והופנו לדף הבית/חיפוש יזוהו כלא אקטיביות
- הנכס של מדלן בארלוזורוב 17 יזוהה בבדיקה הבאה
- כל URLs של Yad2 ינורמלו סופית


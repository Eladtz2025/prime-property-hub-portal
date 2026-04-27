# תוכנית: יישום דוח המתכנת עם תיקונים והשלמות

## הערכה כללית של הדוח
המתכנת זיהה נכון את הבעיה המרכזית (חסימת Cloudflare על Direct Fetch) אבל פספס שני דברים חשובים:
1. ה-chunking שכבר מיושם ב-`scout-madlan-direct` ולא קיים ב-`scout-madlan-jina`.
2. נקודה 2 שלו (X-Return-Format ליד2) לא תפתור את בעיית ה-WAF של יד2.

לכן ניישם את ההמלצות שלו אבל עם תוספות.

## שלב 1 — מדל"ן: חזרה ל-Jina + הוספת chunking (קריטי)

### 1.1 שינוי ניתוב ב-trigger
ב-`supabase/functions/trigger-scout-pages-jina/index.ts` שורה 107:
```ts
// במקום:
const targetFunction = source === 'madlan' ? 'scout-madlan-direct' : `scout-${source}-jina`;
// יהיה:
const targetFunction = `scout-${source}-jina`;
```

### 1.2 הוספת chunking ל-`scout-madlan-jina`
זו ההשלמה שהמתכנת פספס. בלי זה — נחזור ל-timeout של 3 דקות על 50 מודעות.
מעבירים את לוגיקת ה-chunk-based processing מ-`scout-madlan-direct` (CHUNK_SIZE: 12, re-invoke עצמי) גם ל-`scout-madlan-jina`.

### 1.3 ודא שהוא משתמש ב-JINA_API_KEY
כבר קורה (שורה 35 בקובץ) — זה ינטרל את rate limit של free tier שהיה הסיבה המקורית שעברנו ל-Direct.

## שלב 2 — שיפורי `scout-madlan-direct` (לעתיד / fallback)

לא נמחק את הפונקציה — נשפר אותה כך שתהיה fallback איכותי:

### 2.1 זיהוי Cloudflare challenge לפי content
ב-`fetchHtml`, להוסיף בדיקה לפני קבלת התוצאה:
```ts
const cfPatterns = ['__cf_chl_opt', 'challenge.cloudflare.com', 'cf-browser-verification', 'Just a moment...'];
if (cfPatterns.some(p => html.includes(p))) {
  console.warn('🚫 Cloudflare challenge detected');
  return null; // יפעיל retry
}
```

### 2.2 הוספת כותרות דפדפן ריאליסטיות
```ts
'Accept-Encoding': 'gzip, deflate, br',
'Sec-Fetch-Dest': 'document',
'Sec-Fetch-Mode': 'navigate',
'Sec-Fetch-Site': 'none',
'Sec-Fetch-User': '?1',
```

### 2.3 חילוץ IDs מ-__NEXT_DATA__
ב-`extractListingIds`, לנסות קודם:
```ts
const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextDataMatch) {
  const json = JSON.parse(nextDataMatch[1]);
  // לחלץ IDs מהמבנה של מדל"ן
}
// fallback ל-regex הקיים
```

## שלב 3 — יד2 (אופציונלי, סיכון נמוך)

### 3.1 הוספת X-Return-Format
ב-`_shared/scraping-jina.ts` בענף של yad2/madlan:
```ts
headers['Accept'] = 'text/markdown';
headers['X-Return-Format'] = 'markdown'; // הצעת המתכנת — לא יזיק
```

**הסתייגות:** זה **כנראה לא יפתור** את בעיית יד2 (WAF Radware חוסם גם דרך Jina free). אם רוצים פתרון אמיתי ליד2, צריך JINA_API_KEY בתוכנית בתשלום או פתרון אחר. נשאיר את יד2 לאחרי שמדל"ן יחזור לעבוד.

## סדר עבודה ובדיקות
1. שלב 1.1 + 1.2 ביחד (אחרת מדל"ן ייכשל ב-timeout).
2. בדיקת mini-run של מדל"ן (page 1, 50 listings).
3. אם עובד — סבב מלא. אם לא — שלב 2.
4. שלב 3 כתיקון נקודתי בנפרד.

## קבצים שיתעדכנו
- `supabase/functions/trigger-scout-pages-jina/index.ts` (שורה אחת)
- `supabase/functions/scout-madlan-jina/index.ts` (הוספת chunking)
- `supabase/functions/scout-madlan-direct/index.ts` (שיפורי CF detection + headers + NEXT_DATA)
- `supabase/functions/_shared/scraping-jina.ts` (שורה אחת ליד2)

## סיכום למתכנת שלך
- נקודה 1 שלו: ✅ נכונה, אבל חסר chunking → נוסיף.
- נקודה 2 שלו: ⚠️ לא מזיק אבל לא יפתור — נעשה בכל זאת.
- נקודה 3 שלו: ✅ מצוינת, ניישם.

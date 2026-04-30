## תיקון Madlan — iPhone UA לשני הזרימות (אומת חי)

### מה אומת בפועל (לא תיאוריה)
הרצתי `diagnose-madlan` עם iPhone UA על listing אמיתי `PwReNp4Hu2U`. התוצאה:

| בדיקה | תוצאה |
|---|---|
| HTTP status | **200** |
| HTML size | 3.25MB |
| Cloudflare challenge | לא |
| JSON-LD עם additionalProperty | ✅ 12 amenities עם כן/לא (מיזוג, מרפסת, מעלית, מקלט, דוד שמש...) |
| `offers.price` | ✅ 8500 |
| `size` | ✅ "70 מ׳׳ר" |
| `__SSR_HYDRATED_CONTEXT__` poi | ✅ beds=3.5, floor=3, area=70, poc.type="private" |
| titleTag + ogTitle | ✅ "דירה להשכרה: החשמונאים 10..." |

המשמעות: **הפרסרים הקיימים** (`parseDetailHtml` עם JSON-LD/data-auto, ו-`parseMadlanSsrHtml` עם SSR_HYDRATED_CONTEXT) יקבלו בדיוק את ה-HTML שהם מצפים לו. **אין צורך בפרסר חדש**.

לעומת זאת — אסטרטגיית ה-headers הנוכחית של ה-scout (`Accept: text/html` בלבד) מחזירה **403** מ-Edge runtime עכשיו (Madlan חיזקה WAF בלילה).

### השינויים — שתי החלפות headers בלבד

**1. `supabase/functions/_shared/madlan-detail-parser.ts`** (backfill)
שורות 59–63 — להחליף את ה-headers ל:
```ts
headers: {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'he-IL,he;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
}
```
שורות 81–90 — להסיר את בלוק `JSON.parse(html)` המוקדם (התשובה תהיה תמיד HTML SSR; ה-fallback ל-`parseDetailHtml` כבר מטפל בכל מה שצריך).

**2. `supabase/functions/scout-madlan-direct/index.ts`** (scout)
שורות 50–53 — אותו block headers בדיוק.
לעדכן את הקומנט בראש הקובץ (שורות 13–17) כך שיתעד את ה-WAF החדש.

זהו. אין שינוי בפרסרים, אין מיגרציות, אין נגיעה ב-Yad2/Homeless/CF Worker.

### שלבי ביצוע אחרי אישור
1. שני edits.
2. ממתין לפריסה אוטומטית.
3. **בדיקה אמיתית #1 — backfill:** מריץ `backfill-property-data-jina` ידני על batch קטן של 3 נכסי madlan (אחרי הסרת הflag זמנית ב-batch הזה בלבד), ובודק ב-logs:
   - `branch=direct success` (לא graphql fallback)
   - `features` >= 5
   - הנתון נכתב ב-DB.
4. **בדיקה אמיתית #2 — scout:** מפעיל `scout-madlan-direct` ידני על דף אחד עם config קיים, בודק ש-200, found > 0, parser=`direct-ssr`.
5. רק אחרי ששתי הבדיקות עוברות — מבקש ממך להחליף את הflag `backfill_madlan_disabled` ל-`false`.
6. אם בדיקה כלשהי נכשלת — אעצור ואדווח לפני כל שינוי נוסף, כפי שביקשת.

מאשר?

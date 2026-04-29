## הבעיה

הריצה הנוכחית מתבססת על `__NEXT_DATA__` (CF Worker) — מקור הנתונים העיקרי ל-Yad2.
ב-`yad2-detail-nextdata.ts` ה-parking נקבע מ-`item.inProperty` (מיפוי כללי) או מ-`parkingSpacesCount`.

**בפועל**: ב-30 הנכסים שעברו backfill עכשיו, כולם נשמרו עם `parking=true` ו-`parkingSpots=null`,
למרות שב-logs של ה-Cheerio fallback (כשהוא רץ) רואים בבירור `raw="ללא"`.

המשמעות: ה-`inProperty` ב-Yad2 next-data מחזיר את `parking` כ-included גם כשאין חניה, או שהמיפוי שלנו לא מזהה את המצב ה-disabled שלו. ה-Cheerio תיקון שעשיתי בריצה הקודמת עובד נכון — אבל ב-Yad2 הוא בכלל לא רץ כי next-data מצליח עם 11 features.

## פתרון מינימליסטי וזהיר

תיקון נקודתי ב-2 מקומות בלבד. **שום שינוי ב-DB, שום מיגרציה**.

### שינוי 1: `supabase/functions/_shared/yad2-detail-nextdata.ts`

החלפת הלוגיקה של derive parking, כך שתסמוך **אך ורק** על `parkingSpacesCount`:

```ts
// Derive parking ONLY from parkingSpacesCount (authoritative).
// inProperty's parking flag is unreliable (often true even when no parking).
if (typeof ad.parkingSpacesCount === 'number') {
  result.features.parking = ad.parkingSpacesCount > 0;
  if (ad.parkingSpacesCount > 0) {
    result.parkingSpots = ad.parkingSpacesCount;
  }
} else {
  // Authoritative source missing → remove parking from features so the
  // Cheerio fallback or detail parser can fill it correctly.
  delete result.features.parking;
}
```

(זה מחליף גם את שורות 262 וגם 319-322.)

### שינוי 2: `supabase/functions/backfill-property-data-jina/index.ts` — Yad2 path

כש-`detailResult` מגיע מ-next-data ו-`features.parking` חסר, להריץ Cheerio כ-fallback **רק לשדה parking** (קל וזול), כדי שנוכל לקרוא את `parking-value`. אם גם הוא לא מספק תשובה — להשאיר את הערך הקיים ב-DB ולא לדרוס.

מימוש (סביב שורה 944):

```ts
// If next-data couldn't determine parking, ask Cheerio just for that field
if (detailResult && detailResult.features && detailResult.features.parking === undefined) {
  try {
    const cheerioForParking = await fetchYad2DetailFeatures(prop.source_url);
    if (cheerioForParking?.features?.parking !== undefined) {
      detailResult.features.parking = cheerioForParking.features.parking;
      if (cheerioForParking.parkingSpots) {
        detailResult.parkingSpots = cheerioForParking.parkingSpots;
      }
    }
  } catch (_) { /* non-fatal */ }
}
```

### שינוי 3 (קוסמטי): logging לאישור

הוספת `console.log` שמדפיס את הערך הסופי של `parking` ו-`parkingSpots` לפני ה-update לדאטא-בייס, כדי שנוכל לוודא בלוגים שהתיקון עובד.

## בדיקת תוצאה (אחרי הפעלה מחדש על-ידי המשתמש)

לאחר שהמשתמש מריץ שוב את ה-backfill, נבצע query על 20-30 הנכסים האחרונים:
- האם יש כעת מגוון `parking=true` ו-`parking=false` (לא הכל true)?
- האם בלוגים מופיעה ההחלטה הסופית של parking לכל נכס?

## חזרה למצב קודם

אם התיקון יצור בעיה חדשה, ניתן להחזיר 3 שינויים נקודתיים בקלות:
1. ב-`yad2-detail-nextdata.ts` — להחזיר את 2 הבלוקים (`if typeof ad.parkingSpacesCount` ו-`Derive parking from parkingSpots`).
2. ב-`backfill-property-data-jina/index.ts` — למחוק את בלוק ה-Cheerio fallback של parking.
3. למחוק את שורת ה-log.

## מה **לא** עושים

- לא מתקנים את 30 הנכסים שכבר קיבלו parking שגוי בריצה האחרונה. נטפל בהם בנפרד אחרי שנוודא שהתיקון עובד (אפשר פשוט לאפס להם `backfill_status='pending'` ולהריץ שוב).
- לא נוגעים ב-RLS / DB schema / cron / matching.
- לא משנים את ה-Cheerio parser (כבר עובד).

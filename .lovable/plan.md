## הבעיה המאומתת

מאז ההפצה ב-14:26, כל נכס Yad2 שלא היה לו `parkingSpacesCount` ב-`__NEXT_DATA__` עורר **קריאה שנייה** דרך `fetchYad2DetailFeatures` (Cheerio/Jina) רק כדי לקבל את ה-parking. זה הכפיל את עומס הקריאות ל-Yad2 ופגע ב-rate limit אחרי ~70 נכסים — מאותו רגע כל הנכסים מקבלים `Yad2: no usable data from detail page`.

קוד הבעיה: `supabase/functions/backfill-property-data-jina/index.ts` שורות 940–955.

## התיקון — שינוי אחד בלבד

### קובץ: `supabase/functions/backfill-property-data-jina/index.ts`

מחיקת בלוק ה-Cheerio fallback (שורות 940–955) במלואו. אחרי המחיקה, אם `parkingSpacesCount` חסר ב-next-data, השדה `parking` פשוט לא ייכתב — והערך הקיים ב-DB יישאר כפי שהוא (במקום ניחוש שגוי).

### קובץ: `supabase/functions/_shared/yad2-detail-nextdata.ts`

שינוי קטן בשורות שמוחקות `features.parking` כש-`parkingSpacesCount` חסר: במקום `delete result.features.parking`, פשוט לא לכתוב את השדה מלכתחילה (התנהגות זהה אבל ברורה יותר). שינוי קוסמטי בלבד — אפשר גם להשאיר כמו שזה.

### מה **נשאר** מהתיקון הקודם (החלק שעובד)

1. ב-`yad2-detail-nextdata.ts`: `features.parking = parkingSpacesCount > 0` כשהשדה קיים. זה הוכיח את עצמו — 73 נכסים עם `parking: false` נכון.
2. ב-`backfill-property-data-jina/index.ts` שורות 965–971 (לולאת ה-merge): החריג שמאפשר ל-`parking` boolean מפורש לדרוס ערך קיים. אין כאן עומס רשת — נשאר.

## מה זה **לא** עושה

- לא נוגע ב-Madlan, Homeless, scout, matching, RLS, cron, או DB schema.
- לא משנה את לוגיקת ה-merge עבור שום שדה אחר.
- לא מאפס את 32 הנכסים שנכשלו ב-14:26–14:30 — זה יטופל בנפרד אחרי שנאמת שהתיקון עובד.

## אימות

אחרי הדפלוי, להריץ backfill על 5–10 נכסים ולוודא:
- אין שגיאות `Yad2: no usable data` חדשות.
- נכסים בלי parkingSpacesCount **לא** משנים את ה-parking הקיים.
- נכסים עם parkingSpacesCount=0 כן מקבלים `parking: false` (גם אם הערך הקיים היה true).

## חזרה אחורה אם משהו נשבר

החזרת בלוק 940–955. בלי DB, בלי migrations.

## שלב 2 (אחרי אישור נפרד)

מיגרציה לאיפוס `backfill_status='pending'` ל-32 הנכסים שנכשלו בחלון 14:26–14:30 כדי שירוצו מחדש.

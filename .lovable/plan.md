

# תיקון מערכת סריקות 2 (Jina) - השוואה מלאה ותיקונים

## מה מצאתי

### מערכת 1 - סריקות ישנות (Firecrawl) - עובדת
- משתמשת ב-Firecrawl API (בתשלום) עם stealth proxy מובנה
- HTML חוזר מפורמט, Cheerio פורס אותו
- Markdown חוזר מפורמט מוכר, הפרסרים עובדים איתו

### מערכת 3 - השלמת נתונים (Jina) - עובדת מעולה
הכותרות הפשוטות והמינימליות:
```text
Accept: text/markdown
X-No-Cache: true
X-Wait-For-Selector: body
X-Timeout: 35
```
**ללא** `X-Locale`, **ללא** `X-Proxy-Country`. סורק דף בודד של נכס (לא דף חיפוש). עובד מצוין.

### מערכת 2 - סריקות חדשות (Jina) - 3 בעיות נפרדות

---

## בעיה 1: Homeless-Jina - סטטוס "partial" במקום "completed"

**מה קורה**: הסריקה בעצם **עובדת** - מצאה 336 נכסים ב-12 עמודים. 0 חדשים כי כולם כבר במאגר (לא היו נכסים חדשים מ-17.2). אבל הסטטוס נשאר "partial" ויש שגיאת `broken_chain_never_triggered` בעמודים 4-12.

**למה**: Homeless רץ במצב **מקבילי** (כל 12 העמודים נשלחים במקביל). הפונקציה `checkAndFinalizeRun` נקראת מכל עמוד, אבל כשעמוד מסיים מהר יותר מהדיליי של עמוד אחר, הוא רואה ש"עדיין יש עמודים ב-pending" ולא מסיים את הריצה. ה-`broken_chain_never_triggered` מגיע מכך שעמודים שהושלמו בהצלחה נשמרים עם שדה error ישן שלא נוקה.

**תיקון**: 
- בפונקציית `updatePageStatus` ב-`run-helpers.ts` - כשהסטטוס הוא `completed`, לנקות את שדה ה-`error` אוטומטית
- אפשרות: לוודא ש-`checkAndFinalizeRun` לא מחשיבה עמודים עם `status: completed` + `error` כבעייתיים

---

## בעיה 2: Yad2-Jina - הפרסר לא מזהה את הפורמט של Jina

**מה קורה**: Jina מביא 100KB של Markdown (הסריקה עובדת), אבל הפרסר מחזיר 0 נכסים.

**למה**: הפרסר של Yad2 מחפש בלוקים שמתחילים ב-`- [![` (פורמט list item של Firecrawl). Jina מחזיר Markdown אחר - ייתכן שאין `-` בתחילת שורה, או שהמבנה שונה.

**תיקון**: 
1. בדוק את ה-debug sample הקיים (100K chars ב-DB) כדי לראות את הפורמט האמיתי
2. עדכן את `findYad2Blocks` ב-`parser-yad2.ts` להוסיף זיהוי פורמט Jina (בדומה ל-Format D שנוסף ל-parser-madlan.ts)
3. אפשר גם להוסיף בדיקת debug: להדפיס את 500 התווים הראשונים של ה-Markdown ללוג כדי לראות את המבנה

---

## בעיה 3: Madlan-Jina - חסימה / תוכן ריק

**מה קורה**: Jina מחזיר תוכן קצר (2-3 שניות, ~900 תווים). ה-validation נכשל עם "Madlan page has no property indicators".

**למה**: Madlan הוא SPA (Single Page Application). `X-Wait-For-Selector: body` לא מספיק - ה-body נטען מיד אבל התוכן האמיתי (הליסטינגים) נטען אחרי JavaScript rendering. הסריקה הישנה (Firecrawl) השתמשה ב-`wait_for_ms: 10000` (10 שניות המתנה). בנוסף, צריך X-Proxy-Country: IL (כבר קיים בקוד).

**תיקון**:
1. שנה את `X-Wait-For-Selector` ל-selector ספציפי שמחכה לתוכן אמיתי, למשל: `[class*="listing"]` או אלמנט מתאים מהאתר
2. הגדל את `X-Timeout` ל-`45` (במקום 30) כדי לתת לדף יותר זמן לרנדר
3. בדוק אם ה-URL כולל `?page=1` - לפי המסמך הקודם, חובה לכלול `?page=1` כדי לקבל תוכן מלא

---

## פירוט טכני - שינויים לכל קובץ

### 1. `supabase/functions/_shared/run-helpers.ts`
- ב-`updatePageStatus`: כשה-status הוא `completed`, לוודא ש-`error` מתאפס ל-null/undefined

### 2. `supabase/functions/_experimental/parser-yad2.ts`
- להוסיף Format E (Jina) ב-`findYad2Blocks`: זיהוי בלוקים לפי URL pattern `yad2.co.il/realestate/item/` גם כשאין `- ` prefix
- הפרסר `parseYad2Block` כבר מטפל בחילוץ מ-bold text ו-₪ - רק צריך שהבלוקים יזוהו

### 3. `supabase/functions/scout-madlan-jina/index.ts`
- שנה `X-Wait-For-Selector` מ-`body` לselector ספציפי יותר
- הגדל `X-Timeout` ל-`45`

### מה לא נוגעים בו
- `backfill-property-data-jina` - לא נוגעים
- `check-property-availability-jina` - לא נוגעים
- `scout-homeless-jina` - הסריקה עצמה עובדת, רק סטטוס הריצה צריך תיקון (ב-run-helpers)


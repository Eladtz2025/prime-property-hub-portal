
# ניקוי קוד סיווג תיווך/פרטי -- איחוד ומחיקת כפילויות

## מצב נוכחי: 5 מימושים של אותה לוגיקה

```text
#   | קובץ                                    | משמש את       | סוג הלוגיקה
----|------------------------------------------|---------------|---------------------------
1   | _experimental/parser-utils.ts             | סקאוטים (SERP)| בדיקת keywords מ-SERP block
2   | backfill-property-data/index.ts           | Backfill cron | ניתוח markdown עמוק לפי מקור
3   | reclassify-broker/index.ts                | כלי Audit/Fix | **העתק זהה** של #2
4   | _shared/broker-detection.ts               | **אף אחד**   | detectBroker לא בשימוש כלל
5   | backfill-broker-classification/index.ts   | כפתור בהגדרות | לוגיקה ישנה ושונה לחלוטין
```

### בעיות

1. **#3 ו-#2 זהים לחלוטין** -- אותו `detectBrokerFromMarkdown` מועתק בין שני קבצים. שינוי באחד לא משפיע על השני.

2. **#4 (`_shared/broker-detection.ts`)** -- הפונקציה `detectBroker` שם לא מיובאת על ידי אף קובץ פעיל. רק `normalizeCityName` ו-`isInvalidAddress` משמשים (מ-`property-helpers.ts`).

3. **#5 (`backfill-broker-classification`)** -- Edge Function ישנה עם לוגיקה שונה לחלוטין: `classifyYad2`, `classifyMadlan`, `classifyHomeless` -- אלה פונקציות שבודקות patterns אחרים מ-#2. הפונקציה נקראת רק מכפתור ידני ב-UI (UnifiedScoutSettings).

4. **#1 (`parser-utils.ts`)** -- הלוגיקה הזו שונה ב-כוונה: היא מסווגת מ-SERP blocks (תוצאות חיפוש), לא מדפי מודעות בודדות. זה הגיוני שהיא נפרדת.

## תוכנית פעולה

### שלב 1: העברת `detectBrokerFromMarkdown` ל-`_shared`
- העברת הפונקציה המשותפת `detectBrokerFromMarkdown` מ-`backfill-property-data` ל-`_shared/broker-detection.ts` (שם כבר יש תשתית broker)
- גם `extractEvidenceSnippet` תעבור ל-shared (משמשת את reclassify-broker)

### שלב 2: עדכון הייבוא ב-consumers
- `backfill-property-data/index.ts` -- ייבוא מ-`_shared/broker-detection.ts` במקום הפונקציה המקומית
- `reclassify-broker/index.ts` -- ייבוא מ-`_shared/broker-detection.ts` במקום ההעתק המקומי
- מחיקת שתי הגרסאות המקומיות (~250 שורות קוד כפול)

### שלב 3: מחיקת `backfill-broker-classification` (Edge Function מתה)
- מחיקת התיקייה `supabase/functions/backfill-broker-classification/`
- מחיקת ה-Edge Function מ-Supabase (deploy)
- עדכון הכפתור ב-`UnifiedScoutSettings.tsx` להשתמש ב-`reclassify-broker` במקום (שהיא הגרסה העדכנית והמדויקת יותר)

### שלב 4: ניקוי `_shared/broker-detection.ts`
- מחיקת הפונקציה הישנה `detectBroker` שלא בשימוש (הרשימה הישנה של keywords)
- מחיקת `brokerKeywords` (רשימה ישנה, לא בשימוש)
- שמירת `normalizeCityName`, `isInvalidAddress`, ו-`ADDRESS_BLACKLIST_PATTERNS` (בשימוש פעיל)
- הוספת `detectBrokerFromMarkdown` + `extractEvidenceSnippet` החדשות

### מה נשאר אחרי הניקוי

```text
#   | קובץ                                    | תפקיד
----|------------------------------------------|----------------------------------
1   | _experimental/parser-utils.ts             | detectBroker מ-SERP (סקאוטים)
2   | _shared/broker-detection.ts               | detectBrokerFromMarkdown (Backfill + Reclassify)
    |                                            | + normalizeCityName + isInvalidAddress
```

**שתי פונקציות עם תפקידים שונים:**
- `detectBroker` (parser-utils) -- סיווג ראשוני מתוצאות חיפוש (SERP), מהיר ופשוט
- `detectBrokerFromMarkdown` (shared) -- סיווג מעמיק מדף המודעה עצמו (Firecrawl markdown)

## פרט טכני: מפתחות Features

בדקתי את החשש שהעליתי קודם לגבי מפתחות features לא תואמים -- **זה תקין**. כל המערכת (parsers, backfill, matching engine, UI) משתמשת באותם מפתחות: `parking`, `elevator`, `balcony`, `mamad`. אין צורך בתיקון.

## קבצים מושפעים

| קובץ | שינוי |
|---|---|
| `supabase/functions/_shared/broker-detection.ts` | מחיקת קוד ישן, הוספת `detectBrokerFromMarkdown` + `extractEvidenceSnippet` |
| `supabase/functions/backfill-property-data/index.ts` | ייבוא מ-shared, מחיקת ~140 שורות מקומיות |
| `supabase/functions/reclassify-broker/index.ts` | ייבוא מ-shared, מחיקת ~100 שורות מקומיות |
| `supabase/functions/backfill-broker-classification/` | **מחיקה מלאה** |
| `src/components/scout/UnifiedScoutSettings.tsx` | שינוי invoke מ-`backfill-broker-classification` ל-`reclassify-broker` |

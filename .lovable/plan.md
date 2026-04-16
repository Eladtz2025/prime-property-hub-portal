

# תיקון באג הלולאה האינסופית בבקפיל + תיקון מדל"ן

## הבעיה

שתי בעיות:

### 1. לולאה אינסופית (קריטי)
השאילתה כוללת `backfill_status.eq.failed` — נכסים שנכשלים נשלפים שוב ושוב. 5 נכסי מדל"ן נכשלו ~300 פעם כל אחד → 1,543 כשלונות מ-1,591 עיבודים.

### 2. מדל"ן parser נחסם
ה-parser עושה `fetch(sourceUrl)` ישיר למדל"ן, ומקבל captcha של PerimeterX. צריך להחליף את ה-fetch headers לאותם headers שעבדו בבדיקה הישירה (עם `Accept: application/json` ו-Next.js bypass).

## מה ישתנה

### קובץ 1: `backfill-property-data-jina/index.ts`

**תיקון הלולאה** (שורות 250, 308):
- הסרת `backfill_status.eq.failed` מה-query
- נכסים שנכשלו לא ייבחרו אוטומטית שוב
- מי שרוצה לנסות שוב → ריסט ידני ל-`pending` דרך ה-UI

```text
לפני:  .or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed')
אחרי:  .or('backfill_status.is.null,backfill_status.eq.pending')
```

שינוי בשני מקומות: שורה 250 (count query) ושורה 308 (fetch query).

### קובץ 2: `_shared/madlan-detail-parser.ts`

**שדרוג ה-fetch headers** — שימוש באותם headers שעבדו בבדיקת ה-API הישירה:
- `Accept: 'application/json, text/html, */*'`
- `User-Agent` של Chrome
- `Referer: 'https://www.madlan.co.il/'`
- `Origin: 'https://www.madlan.co.il'`

**הוספת fallback** — אם ה-HTML fetch נכשל, ניסיון GraphQL API (`/api2`) עם `poiByIds` query כגיבוי.

## סיכון
**נמוך** — שני שינויים מינוריים:
1. הסרת `failed` מ-query = מניעת לולאה (שינוי בטוח)
2. headers חדשים ל-madlan = אותם headers שעבדו כבר בבדיקה

## קבצים

| קובץ | שינוי |
|---|---|
| `supabase/functions/backfill-property-data-jina/index.ts` | הסרת `failed` מ-2 queries |
| `supabase/functions/_shared/madlan-detail-parser.ts` | headers חדשים + GraphQL fallback |


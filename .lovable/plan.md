
# ניקוי ומניעת כפילויות - תוכנית מקיפה

## סיכום הבעיה
יש 60+ נכסים כפולים מאותו מקור עם אותו listing ID, אבל URL שונה (בגלל tracking parameters כמו `?opened-from=feed`). המערכת הנוכחית בודקת כפילויות לפי URL מלא ולא לפי listing ID.

## הפתרון - שני חלקים

### חלק 1: ניקוי מיידי - Edge Function חדשה

**קובץ חדש:** `supabase/functions/cleanup-duplicates/index.ts`

לוגיקת הניקוי:
```text
1. מצא נכסים עם אותו source + source_id (או listing ID מה-URL)
2. לכל קבוצה, השאר את הנכס הראשון (לפי created_at)
3. מחק את השאר
4. נקה את duplicate_group_id אם נשאר רק נכס אחד בקבוצה
```

תכונות:
- מצב `dry_run` (ברירת מחדל) - מראה מה יימחק בלי למחוק
- מצב `execute` - מבצע את המחיקה בפועל
- לוג מפורט של כל פעולה

### חלק 2: מניעת כפילויות עתידיות

**עדכון:** `supabase/functions/_shared/property-helpers.ts`

שינויים:
1. **הוספת פונקציה `extractListingId`** - חילוץ ה-listing ID מה-URL בלי tracking parameters
2. **שינוי הבדיקה ב-`saveProperty`** - בדיקה לפי `source + listing_id` במקום `source_url` מלא
3. **נרמול URL לפני שמירה** - הסרת query parameters מיותרים

```text
לפני:
  בדיקה: source_url = "https://yad2.co.il/item/abc?opened-from=feed"
  ← לא מוצא את "https://yad2.co.il/item/abc" הקיים

אחרי:
  בדיקה: source + listing_id = "yad2" + "abc"
  ← מוצא את הנכס הקיים ומעדכן אותו
```

## קבצים לעדכון

| קובץ | פעולה | תיאור |
|------|-------|-------|
| `supabase/functions/cleanup-duplicates/index.ts` | **חדש** | ניקוי כפילויות קיימות |
| `supabase/functions/_shared/property-helpers.ts` | עדכון | מניעת כפילויות עתידיות |
| `supabase/config.toml` | עדכון | הוספת הגדרת הפונקציה החדשה |

## פרטים טכניים

### פונקציית חילוץ Listing ID:
```typescript
function extractListingId(url: string, source: string): string | null {
  if (source === 'yad2') {
    // /item/abc123 or /item/abc123?... → abc123
    const match = url.match(/\/item\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
  if (source === 'madlan') {
    // /listings/ABC123 → ABC123
    const match = url.match(/\/listings?\/([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
  }
  if (source === 'homeless') {
    // viewad,12345 or adid=12345 → 12345
    const match = url.match(/(?:viewad[,\/]|adid=)(\d+)/i);
    return match ? match[1] : null;
  }
  return null;
}
```

### לוגיקת בדיקה משופרת:
```typescript
// במקום בדיקה לפי source_url מלא
const listingId = extractListingId(property.source_url, property.source);

if (listingId) {
  // בדוק אם יש כבר נכס עם אותו listing ID מאותו מקור
  const { data: existing } = await supabase
    .from('scouted_properties')
    .select('id')
    .eq('source', property.source)
    .ilike('source_url', `%${listingId}%`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
    
  if (existing) {
    // עדכן את הקיים במקום ליצור חדש
    return { isNew: false };
  }
}
```

## אופן הפעלה

1. **ניקוי ראשוני (dry run):**
```bash
curl -X POST .../cleanup-duplicates
# מחזיר רשימה של נכסים שיימחקו
```

2. **ניקוי בפועל:**
```bash
curl -X POST .../cleanup-duplicates -d '{"execute": true}'
# מוחק את הכפילויות
```

3. **אחרי הניקוי** - הסריקות הבאות כבר לא ייצרו כפילויות חדשות

## תוצאה צפויה

- **מחיקת ~60 נכסים** כפולים קיימים
- **מניעה מלאה** של כפילויות עתידיות מאותו מקור
- **שימור כפילויות cross-source** (yad2+madlan) כגיבוי

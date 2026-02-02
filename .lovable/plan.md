

## תיקון באג - Backfill לא רץ

### הבעיה שזוהתה

הquery של הbackfill נכשל בגלל סינטקס שגוי:

```typescript
.or('rooms.is.null,price.is.null,size.is.null,features.is.null,features.eq.{},is_private.is.null')
```

**שגיאת PostgreSQL:**
```
invalid input syntax for type boolean: "תל אביב יפו"
```

הסיבה: `features.eq.{}` בתוך `.or()` לא מפורש נכון ע"י Supabase וגורם לשאילתה להיכשל.

---

### פתרון

נפריד את השאילתה לשניים:
1. שאילתה בסיסית עם `.or()` לשדות רגילים
2. **שימוש בפילטר JSONB נכון** - `features::text = '{}'` דרך raw filter

**קובץ:** `supabase/functions/backfill-property-data/index.ts`

**שינויים בשורות 225-231 ו-277-283:**

במקום:
```typescript
.or('rooms.is.null,price.is.null,size.is.null,features.is.null,features.eq.{},is_private.is.null')
```

נשתמש ב:
```typescript
.or('rooms.is.null,price.is.null,size.is.null,features.is.null,features.cs.{},is_private.is.null')
```

**או לחלופין** - שימוש בגישה נפרדת:
```typescript
// עדיף לפצל: קודם בודקים null, ואז בודקים ריק
.or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null')
// ולאחר מכן נוסיף את הנכסים עם features ריקים בשאילתה נפרדת
```

**הפתרון הנכון:** להשתמש ב-filter מותאם:
```typescript
// Option 1: cs = contains (works for empty object)
.or(`rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null`)
.filter('features', 'eq', '{}')

// Option 2: RPC function
// Option 3: Two separate queries combined
```

**הגישה המומלצת:** שימוש ב-`.or()` ללא features.eq.{} + שאילתה נפרדת לנכסים עם features ריקים.

---

### שינויים נדרשים

| קובץ | שורות | שינוי |
|------|-------|-------|
| `backfill-property-data/index.ts` | 225-231 | תיקון count query |
| `backfill-property-data/index.ts` | 277-283 | תיקון select query |
| `backfill-property-data/index.ts` | 527-533 | תיקון remaining query |

---

### קוד מתוקן

**Count Query (שורות 225-231):**
```typescript
// Split into two conditions: standard nulls + empty features check
let countQuery = supabase
  .from('scouted_properties')
  .select('id', { count: 'exact', head: true })
  .eq('is_active', true)
  .not('source_url', 'is', null)
  .neq('source_url', 'https://www.homeless.co.il');

// Add filter for: null fields OR empty features object
// Using raw SQL filter approach for JSONB empty check
countQuery = countQuery.or(
  'rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null'
);
```

**Select Query (שורות 277-283):**
```typescript
let query = supabase
  .from('scouted_properties')
  .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features, is_private')
  .eq('is_active', true)
  .not('source_url', 'is', null)
  .neq('source_url', 'https://www.homeless.co.il')
  .or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null')
  .order('id', { ascending: true })
  .limit(effectiveBatchSize);
```

**הוספת בדיקת features ריק בלולאה:**
בתוך הלולאה, נבדוק גם אם `features` הוא אובייקט ריק ונעדכן אותו.

---

### צעדים לביצוע

1. תיקון הקוד - הסרת `features.eq.{}` מה-`.or()`
2. הוספת לוגיקה בתוך הלולאה לזיהוי features ריקים
3. ניקוי התהליכים התקועים בבסיס הנתונים
4. הפעלה מחדש של הbackfill

---

### ניקוי תהליכים תקועים

לפני הפעלה מחדש, נצטרך לסגור את התהליכים התקועים:
```sql
UPDATE backfill_progress 
SET status = 'stopped', 
    completed_at = NOW(),
    error_message = 'Manually stopped - query syntax fix'
WHERE status = 'running';
```


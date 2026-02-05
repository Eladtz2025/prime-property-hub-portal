
# הוספת פילטר מחיר לנכסים מותאמים

## סיכום
נכסים ללא מחיר (`price IS NULL` או `price <= 0`) לא יכולים להופיע ברשימת הנכסים המותאמים ללקוח. הפילטר הזה כבר קיים חלקית במנוע ההתאמות (`matching.ts`), אבל חסר בשאילתות שמציגות תוצאות.

## מקומות הדורשים שינוי

### 1. פונקציית `get_customer_matches` (RPC)
**קובץ:** Migration SQL חדש  
**שינוי:** הוספת `AND sp.price IS NOT NULL AND sp.price > 0` לתנאי WHERE

### 2. `useOwnPropertyMatches` (Hook)
**קובץ:** `src/hooks/useOwnPropertyMatches.ts`  
**שינוי:** הוספת `.not('monthly_rent', 'is', null).gt('monthly_rent', 0)` לשאילתה

### 3. שאילתת נכסים ב-Edge Functions
**קבצים:** 
- `supabase/functions/trigger-matching/index.ts`
- `supabase/functions/match-batch/index.ts`

**שינוי:** הוספת `.not('price', 'is', null).gt('price', 0)` לשאילתות שמביאות נכסים להתאמה

---

## פרטים טכניים

### Migration - `get_customer_matches`
```sql
CREATE OR REPLACE FUNCTION public.get_customer_matches(...)
...
WHERE sp.is_active = true
  AND sp.price IS NOT NULL      -- NEW
  AND sp.price > 0              -- NEW
  AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
  ...
```

### useOwnPropertyMatches
```typescript
let query = supabase
  .from('properties')
  .select('...')
  .eq('available', true)
  .not('monthly_rent', 'is', null)  // NEW
  .gt('monthly_rent', 0);           // NEW
```

### trigger-matching & match-batch
```typescript
const { data: properties } = await supabase
  .from('scouted_properties')
  .select('...')
  .eq('is_active', true)
  .not('price', 'is', null)     // NEW
  .gt('price', 0)               // NEW
  ...
```

---

## הערות
- **לא נדרש פילטר `currency`** - בטבלת `scouted_properties` אין שדה currency (המחיר תמיד בשקלים)
- ב-`matching.ts` כבר קיים פילטר (שורות 306-309) שמסנן נכסים ללא מחיר כשללקוח יש תקציב מקסימלי - השינויים הנ"ל מוסיפים שכבת הגנה נוספת ברמת השאילתה

## קבצים לעריכה
1. Migration SQL חדש (לעדכון `get_customer_matches`)
2. `src/hooks/useOwnPropertyMatches.ts`
3. `supabase/functions/trigger-matching/index.ts`
4. `supabase/functions/match-batch/index.ts`

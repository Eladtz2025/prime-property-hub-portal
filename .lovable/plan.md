

# הוספת סינון פרטי/תיווך לקונפיגורציות סקאוט - Yad2

## מה ישתנה

### חלק 1: מיגרציה - הוספת עמודה
הוספת עמודת `owner_type_filter` לטבלת `scout_configs`:

```sql
ALTER TABLE scout_configs
ADD COLUMN owner_type_filter TEXT DEFAULT NULL
CHECK (owner_type_filter IS NULL OR owner_type_filter IN ('private', 'broker'));
```

- `NULL` = ללא סינון (קונפיגורציות קיימות)
- `'private'` = רק פרטי
- `'broker'` = רק תיווך

### חלק 2: סינון בפארסר
**קובץ:** `supabase/functions/_experimental/parser-yad2.ts`

הפונקציה `parseYad2Markdown` תקבל פרמטר שלישי `ownerTypeFilter`. הסינון יתבצע בלולאה מיד אחרי פירסור כל בלוק:

```typescript
if (ownerTypeFilter === 'private' && parsed.is_private !== true) continue;
if (ownerTypeFilter === 'broker' && parsed.is_private !== false) continue;
```

### חלק 3: העברת הפרמטר
**קובץ:** `supabase/functions/scout-yad2/index.ts`

שינוי שורה אחת - העברת `config.owner_type_filter` לפארסר.

### חלק 4: עדכון UI
**קובץ:** `src/components/scout/UnifiedScoutSettings.tsx`

הוספת dropdown "סוג מפרסם" לטופס יצירה/עריכה עם 3 אפשרויות: ללא סינון, פרטי בלבד, תיווך בלבד.

## קבצים שישתנו
1. מיגרציה חדשה
2. `supabase/functions/_experimental/parser-yad2.ts` - פרמטר + סינון בלולאה
3. `supabase/functions/scout-yad2/index.ts` - שורה אחת
4. `src/components/scout/UnifiedScoutSettings.tsx` - dropdown בטופס
5. `src/integrations/supabase/types.ts` - יתעדכן אוטומטית


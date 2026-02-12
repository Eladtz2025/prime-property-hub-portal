

# באג קריטי: אף נכס חדש לא נכנס מאז 6 בפברואר

## מה הבעיה

ה-upsert בפונקציית `saveProperty` נכשל **בשקט** עבור כל נכס חדש.

הקוד משתמש ב:
```typescript
onConflict: 'source,source_url'
```

אבל במסד הנתונים, האינדקס `scouted_properties_source_url_unique` הוא **partial index** (עם תנאי WHERE), ו-PostgreSQL לא מאפשר להשתמש ב-partial index עם ON CONFLICT. לכן כל upsert של נכס חדש נכשל עם:

> "there is no unique or exclusion constraint matching the ON CONFLICT specification"

הנכסים הקיימים עדיין מתעדכנים (דרך `findSameSourceDuplicate` שמוצא אותם לפי `source_id`), אבל שום נכס **חדש** לא נכנס מאז 6 בפברואר.

## התיקון - שני חלקים

### חלק 1: מיגרציה - ליצור UNIQUE CONSTRAINT רגיל

להחליף את ה-partial index ב-constraint רגיל שתומך ב-ON CONFLICT:

```sql
-- Drop the partial index that doesn't work with ON CONFLICT
DROP INDEX IF EXISTS scouted_properties_source_url_unique;

-- Create a proper unique constraint
ALTER TABLE scouted_properties
ADD CONSTRAINT scouted_properties_source_source_url_unique
UNIQUE (source, source_url);
```

### חלק 2: תיקון הקובץ הארכיוני (build error)

שינוי שורה אחת ב-`supabase/functions/_archived/_personal-scout/parser-homeless.ts`:

```diff
- import { load as cheerioLoad } from "npm:cheerio@1.0.0";
+ import { load as cheerioLoad } from "https://esm.sh/cheerio@1.0.0";
```

## למה שני החלקים נדרשים

- בלי חלק 1: ה-upsert ימשיך להיכשל גם אחרי deploy
- בלי חלק 2: ה-deploy נחסם ולכן גם תיקוני ה-PR הקודם (multi-URL, private fallback) לא באוויר

## מה לא משתנה

- שום לוגיקה בקוד לא משתנה
- ה-saveProperty נשאר בדיוק כמו שהוא
- רק ה-DB constraint מתוקן כדי שה-upsert יעבוד כמתוכנן

## בדיקה אחרי התיקון

אחרי deploy, להפעיל ריצת סקאוט ולבדוק:
```sql
SELECT id, source, new_properties, properties_found, started_at
FROM scout_runs
ORDER BY started_at DESC
LIMIT 5;
```

`new_properties` צריך סוף סוף להיות גדול מ-0.


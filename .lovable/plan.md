
# תיקון סינון מודעות תיווך - הומלס ומדלן

## הבעיה האמיתית (אחרי בדיקה מעמיקה)

### הומלס: הפרסר מעולם לא תוקן
הפרסר של הומלס (`parser-homeless.ts`) לא מקבל פרמטר `ownerTypeFilter` ולא מסנן מתווכים. בנוסף, הקונפיגורציות של הומלס מוגדרות עם `owner_type_filter = NULL`. כתוצאה, **132 מודעות תיווך** אקטיביות נכנסו למערכת.

### מדלן: הפרסר עובד - אבל ה-backfill דורס!
הפרסר של מדלן (`parser-madlan.ts`, שורה 74) כן מסנן מתווכים נכון בזמן הסריקה. **אבל** ה-backfill (`backfill-property-data/index.ts`, שורה 707) דורס את `is_private` עבור כל נכס ממדלן - גם אלה שכבר סוננו. בדיקת הנתונים מוכיחה שכל 48 מודעות התיווך שנכנסו אחרי 12/2 עודכנו ע"י ה-backfill 1-3 ימים אחרי היצירה.

## הפתרון - 3 תיקונים

### תיקון 1: הומלס - הוספת סינון לפרסר
- **קובץ**: `supabase/functions/_experimental/parser-homeless.ts`
  - הוספת פרמטר `ownerTypeFilter` לפונקציה `parseHomelessHtml`
  - הוספת סינון בלולאה: `if (ownerTypeFilter === 'private' && !isBroker) continue;`
- **קובץ**: `supabase/functions/scout-homeless/index.ts`
  - העברת `config.owner_type_filter` כפרמטר רביעי לפרסר

### תיקון 2: Backfill - לא לדרוס is_private כשהקונפיגורציה מסננת
- **קובץ**: `supabase/functions/backfill-property-data/index.ts`
  - שינוי בשורה 707: כשנכס כבר סווג כפרטי (`is_private = true`), לא לדרוס אותו
  - הלוגיקה החדשה: לסווג מחדש רק נכסים שה-`is_private` שלהם הוא `null` (לא ידוע), לא כאלה שכבר סומנו כפרטיים בסריקה
  - במדלן ספציפית: להסיר את `prop.source === 'madlan'` מהתנאי שמאפשר re-classification תמיד

### תיקון 3: עדכון DB + ניקוי
- עדכון קונפיגורציות הומלס: `owner_type_filter = 'private'`
- ביטול מודעות תיווך קיימות מהומלס (132 נכסים)
- ביטול מודעות תיווך ממדלן שנדרסו ע"י backfill (48 נכסים)

## פרטים טכניים

### שינוי 1 - parser-homeless.ts (שורה 40-43)
```text
// לפני:
export async function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  supabase?: SupabaseClient
): Promise<ParserResult>

// אחרי:
export async function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  supabase?: SupabaseClient,
  ownerTypeFilter?: 'private' | 'broker' | null
): Promise<ParserResult>
```

בתוך הלולאה, אחרי שנבנה ה-property ולפני push, להוסיף:
```text
if (ownerTypeFilter === 'private' && property.is_private !== true) continue;
if (ownerTypeFilter === 'broker' && property.is_private !== false) continue;
```

### שינוי 2 - scout-homeless/index.ts (שורה ~136)
```text
// לפני:
const parseResult = await parseHomelessHtml(html, propertyTypeForParsing, supabase);

// אחרי:
const parseResult = await parseHomelessHtml(html, propertyTypeForParsing, supabase, config.owner_type_filter);
```

### שינוי 3 - backfill-property-data/index.ts (שורה 707)
```text
// לפני:
const shouldClassifyBroker = prop.source === 'madlan' 
  || prop.is_private === null 
  || prop.is_private === undefined;

// אחרי - לא לדרוס נכסים שכבר סווגו:
const shouldClassifyBroker = prop.is_private === null 
  || prop.is_private === undefined;
```

### SQL Migration
```text
-- עדכון קונפיגורציות הומלס
UPDATE scout_configs 
SET owner_type_filter = 'private' 
WHERE source = 'homeless';

-- ביטול מודעות תיווך מהומלס
UPDATE scouted_properties 
SET is_active = false, status = 'inactive' 
WHERE source = 'homeless' AND is_private = false;

-- ביטול מודעות תיווך ממדלן שנדרסו ע"י backfill
UPDATE scouted_properties 
SET is_active = false, status = 'inactive' 
WHERE source = 'madlan' AND is_private = false;
```

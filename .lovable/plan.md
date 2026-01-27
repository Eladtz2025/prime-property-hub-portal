

# שילוב טבלת הרחובות בפרסר Homeless

## המצב הנוכחי

### יש בסיס מוכן שלא מנוצל:
| רכיב | סטטוס | שימוש |
|------|--------|-------|
| טבלת `street_neighborhoods` | 1,245 רחובות בתל אביב | לא משמש |
| פונקציות `street-lookup.ts` | מוכן לשימוש | לא משמש |
| הפרסר | sync, לא ניגש לדאטאבייס | מחפש רק regex |

### סדר עדיפות נוכחי לזיהוי שכונות:
1. `neighborhoodText` (עמודה 4) - regex
2. `streetText` (עמודה 5) - regex
3. `fullRowText` - regex

**חסר:** חיפוש בטבלת הרחובות (1,245 רחובות ממופים!)

## הפתרון

### שינוי 1: המרה ל-async והעברת Supabase client
**קובץ:** `_experimental/parser-homeless.ts`

```typescript
import { lookupNeighborhoodByStreet, normalizeStreetName } from './street-lookup.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  supabase: SupabaseClient  // מועבר מה-caller
): Promise<ParserResult>
```

### שינוי 2: הוספת lookup לרחובות
אחרי שורה 177, לפני בניית הכתובת:

```typescript
// Fallback: lookup street in database (1,245 streets mapped!)
if (!neighborhood && streetText && city === 'תל אביב יפו') {
  const streetLookup = await lookupNeighborhoodByStreet(supabase, streetText, city);
  if (streetLookup) {
    neighborhood = { 
      label: streetLookup.neighborhood, 
      value: streetLookup.neighborhood_value 
    };
  }
}
```

### שינוי 3: עדכון ה-caller
**קובץ:** `scout-homeless/index.ts`

```typescript
// שינוי הקריאה לפרסר
const parseResult = await parseHomelessHtml(html, propertyTypeForParsing, supabase);
```

### שינוי 4: סנכרון ל-personal-scout
אותם שינויים ב:
- `_personal-scout/parser-homeless.ts`

## סדר עדיפות חדש לזיהוי שכונות

1. `neighborhoodText` (עמודה 4) - regex ישיר
2. `streetText` (עמודה 5) - regex  
3. `fullRowText` - regex בכל הטקסט
4. **חדש:** `streetText` → חיפוש בטבלת `street_neighborhoods` (1,245 רחובות)

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `_experimental/parser-homeless.ts` | async + import street-lookup + DB query |
| `_experimental/scout-homeless.ts` | await על הקריאה לפרסר |
| `_personal-scout/parser-homeless.ts` | סנכרון אותם שינויים |

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| שכונות (89%) | regex בלבד | 95%+ (עם 1,245 רחובות) |
| עיר | 100% | 100% |
| מחיר | 93% | 93% |

## הערות טכניות

### ביצועים
- הפרסר יהיה איטי יותר (קריאות DB)
- אפשרי לשקול `batchLookupStreets` לכל הרחובות בבת אחת
- לשלב הראשון - lookup בודד לכל נכס

### Fallback
- אם ה-lookup נכשל → ממשיכים עם מה שיש
- לא שוברים את הפרסר אם הדאטאבייס לא זמין



# שיפורי UI בטבלת הנכסים הנסרקים + השלמת נתונים משופרת

## הבעיות שזוהו

1. **פילטר מקורות** - רשום "כל..." במקום לציין שזה מקורות
2. **פילטרים נוספים** - שני פילטרים נוספים רשומים "כל" או "כולם" ללא הקשר
3. **כותרת הנכס** - הפורמט הנוכחי: "דירה X חדרים להשכרה בצפון חדש / תל אביב יפו - צפון חדש"
   - הפורמט הרצוי: "להשכרה [רחוב] [מספר], [שכונה]" + שורה תחתית: "תל אביב"
4. **כפתור השלמת נתונים** - כרגע משלים רק חדרים/מחיר/גודל/features
   - הבקשה: להוסיף גם תיקון סיווג פרטי/תיווך

---

## פתרון

### שינוי 1: תיקון תוויות הפילטרים (Desktop)

**קובץ**: `src/components/scout/ScoutedPropertiesTable.tsx`

| פילטר | לפני | אחרי |
|-------|------|------|
| מקור | `placeholder="מקור"`, `value="all">כל המקורות` | `placeholder="מקורות"`, `value="all">כל המקורות` |
| סוג עסקה | `placeholder="סוג"`, `value="all">כל הסוגים` | `placeholder="סוג עסקה"`, `value="all">כל העסקאות` |
| סוג מפרסם | `placeholder="מפרסם"`, `value="all">כולם` | `placeholder="פרטי/תיווך"`, `value="all">כל המפרסמים` |

**שורות 1406-1440** - עדכון ה-Select placeholders:

```typescript
{/* Source Filter */}
<Select value={sourceFilter} onValueChange={setSourceFilter}>
  <SelectTrigger className="w-[90px] h-8 text-sm">
    <SelectValue placeholder="מקורות" />
  </SelectTrigger>
  ...
</Select>

{/* Property Type */}
<Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
  <SelectTrigger className="w-[100px] h-8 text-sm">
    <SelectValue placeholder="סוג עסקה" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">כל העסקאות</SelectItem>
    ...
  </SelectContent>
</Select>

{/* Owner Type Filter */}
<Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
  <SelectTrigger className="w-[100px] h-8 text-sm">
    <SelectValue placeholder="פרטי/תיווך" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">כל המפרסמים</SelectItem>
    ...
  </SelectContent>
</Select>
```

---

### שינוי 2: פורמט חדש לכותרת הנכס

**לפני**:
```
דירה 10 חדרים להשכרה בצפון חדש
תל אביב יפו - צפון חדש
```

**אחרי**:
```
להשכרה בן יהודה 173, צפון חדש
תל אביב
```

**שורות 1528-1534** - עדכון תצוגת הפרטים בטבלה (Desktop):

```typescript
<TableCell>
  <div>
    <p className="font-medium">
      {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {property.address || ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
    </p>
    <p className="text-sm text-muted-foreground">
      {property.city?.replace(' יפו', '') || 'תל אביב'}
    </p>
  </div>
</TableCell>
```

**שורות 1669-1676** - עדכון גם בתצוגה המובייל:

```typescript
<span className="font-medium truncate flex-1 min-w-0">
  {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {property.address || ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
</span>
<span className="text-muted-foreground text-xs shrink-0">
  {property.city?.replace(' יפו', '') || 'תל אביב'}
</span>
```

---

### שינוי 3: הרחבת כפתור "השלמת נתונים"

כפתור "השלמת נתונים" יעבור על כל הנכסים ויתקן:
1. **נתונים חסרים** (כמו היום): חדרים, מחיר, גודל, features
2. **חדש - סיווג פרטי/תיווך**: יבדוק מחדש את ה-markdown לפי הלוגיקה החדשה

**קובץ**: `supabase/functions/backfill-property-data/index.ts`

הוספת פונקציה חדשה `detectBrokerFromMarkdown`:

```typescript
function detectBrokerFromMarkdown(markdown: string, source: string): boolean | null {
  // Check for explicit broker indicators
  const hasTivuchLabel = /תיווך/.test(markdown);
  const hasLicenseNumber = /רישיון|\d{7}/.test(markdown);
  const hasAgencyName = /שם הסוכנות/.test(markdown);
  const hasExclusivity = /בבלעדיות/.test(markdown);
  
  // Known broker brands
  const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21'];
  const hasBrokerBrand = BROKER_BRANDS.some(brand => 
    markdown.toLowerCase().includes(brand.toLowerCase())
  );
  
  if (hasTivuchLabel || hasLicenseNumber || hasAgencyName || hasExclusivity || hasBrokerBrand) {
    return false; // is_private = false (it's a broker)
  }
  
  // If no broker indicators found, mark as private
  return true; // is_private = true
}
```

עדכון הלוגיקה הראשית להוסיף בדיקת `is_private`:

```typescript
// בתוך הלולאה הראשית
const isPrivate = detectBrokerFromMarkdown(markdown, prop.source);

// הוספה ל-updates
if (prop.is_private === null && isPrivate !== null) {
  updates.is_private = isPrivate;
}
```

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| `ScoutedPropertiesTable.tsx` | תיקון placeholders בפילטרים + פורמט כותרת חדש |
| `backfill-property-data/index.ts` | הוספת זיהוי פרטי/תיווך מה-markdown |

---

## בדיקות אחרי היישום

1. לוודא שהפילטרים מראים "מקורות", "סוג עסקה", "פרטי/תיווך" כברירת מחדל
2. לוודא שכותרות הנכסים מופיעות בפורמט החדש
3. להפעיל "השלמת נתונים" ולוודא שנכסים עם `is_private = null` מתעדכנים


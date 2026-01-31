

# תיקון באג: סינון שכונות נכשל עם 3+ בחירות

## סיכום הבעיה

כשבוחרים 3 שכונות (צפון ישן + צפון חדש + לב העיר), השאילתה נכשלת עם שגיאת **PGRST100** ומחזירה 0 תוצאות.

## שורש הבעיה - שתי בעיות

### 1. פסיק בשם השכונה שובר את ה-PostgREST OR syntax

ב-`NEIGHBORHOOD_GROUPS` יש ערכים עם פסיקים:
```typescript
'לב העיר': [
  'לב תל אביב, לב העיר',  // ← הפסיק הזה שובר את הפרסר!
  'לב העיר צפון',
  ...
]
```

PostgREST משתמש בפסיק כמפריד בין תנאי OR, אז הערך `לב תל אביב, לב העיר` מתפרש כשני תנאים נפרדים ושובר את הסינטקס.

### 2. שני קריאות `.or()` מתנגשות

כשיש גם סינון שכונות וגם סינון פיצ'רים (balcony/roof/yard), נוצרים שני פרמטרי `or=` ב-URL וזה גורם לשגיאה.

## הפתרון

### שלב 1: הסרת פסיקים מהפטרנים (או החלפתם ל-wildcard)

עדכון `NEIGHBORHOOD_GROUPS`:
```typescript
'לב העיר': [
  'לב העיר',
  'מרכז העיר',
  'לב תל אביב',
  // הסרת הפטרן עם הפסיק - כי הוא כבר נתפס ע"י 'לב תל אביב'
  'לב העיר צפון',
  'לב העיר דרום',
],
```

### שלב 2: שילוב כל תנאי ה-OR לתנאי אחד

במקום לקרוא ל-`.or()` מספר פעמים, נבנה תנאי OR אחד מאוחד:

```typescript
const applyFilters = (query: any, filters: NonNullable<typeof appliedFilters>) => {
  // ... basic filters ...
  
  // Build combined OR conditions
  const orParts: string[] = [];
  
  // Neighborhoods (OR between all patterns)
  if (filters.neighborhoods.length > 0) {
    const allPatterns: string[] = [];
    filters.neighborhoods.forEach(n => {
      const patterns = NEIGHBORHOOD_GROUPS[n] || [n];
      patterns.forEach(p => {
        // Escape or skip patterns with commas
        if (!p.includes(',')) {
          allPatterns.push(`neighborhood.ilike.*${p}*`);
        }
      });
    });
    orParts.push(...allPatterns);
  }
  
  // Features (OR between selected features)
  if (filters.features.length > 0) {
    filters.features.forEach(f => {
      orParts.push(`features->>${f}.eq.true`);
    });
  }
  
  // Apply single combined OR
  if (orParts.length > 0) {
    query = query.or(orParts.join(','));
  }
  
  return query;
};
```

### חלופה: שימוש ב-RPC במקום שאילתה ישירה

אם הפתרון הנ"ל לא מספיק, ניתן ליצור פונקציית RPC שמטפלת בסינון מורכב.

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| `ScoutedPropertiesTable.tsx` | הסרת פטרנים עם פסיקים מ-NEIGHBORHOOD_GROUPS |
| `ScoutedPropertiesTable.tsx` | איחוד כל תנאי ה-OR לקריאת `.or()` אחת |

## תוצאה צפויה

- סינון 3+ שכונות יעבוד ללא שגיאות
- שילוב סינון שכונות + פיצ'רים יעבוד נכון
- הפילטר יחזיר תוצאות במקום 0


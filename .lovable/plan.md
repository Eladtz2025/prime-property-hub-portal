

# תיקון: הפרדת לוגיקת סינון שכונות מפיצ'רים

## הבעיה

בתיקון הקודם שילבתי שכונות ופיצ'רים ל-OR אחד, וזה גורם ל:
- בחירת "צפון ישן" + "מרפסת" → מציג **כל** הדירות עם מרפסת (גם אם לא בצפון ישן!)

## הפתרון

שני סוגי הסינון צריכים להיות **נפרדים**:
- שכונות: `.or()` פנימי בין כל הפטרנים
- פיצ'רים: `.or()` פנימי נפרד
- הקריאות יהיו ב-AND (PostgREST מחבר בין קריאות `.or()` באופן AND)

### הקוד המתוקן:

```typescript
const applyFilters = (query: any, filters: NonNullable<typeof appliedFilters>) => {
  // ... שאר הפילטרים (price, rooms, etc) ...
  
  // Neighborhoods - internal OR, wrapped as a group
  if (filters.neighborhoods.length > 0) {
    const neighborhoodParts: string[] = [];
    filters.neighborhoods.forEach(n => {
      const patterns = NEIGHBORHOOD_GROUPS[n] || [n];
      patterns.forEach(p => {
        if (!p.includes(',')) {
          neighborhoodParts.push(`neighborhood.ilike.%${p}%`);
        }
      });
    });
    if (neighborhoodParts.length > 0) {
      query = query.or(neighborhoodParts.join(','));
    }
  }
  
  // Features - separate OR (will be ANDed with neighborhoods by PostgREST)
  if (filters.features.length > 0) {
    const featureParts = filters.features.map(f => `features->>${f}.eq.true`);
    query = query.or(featureParts.join(','));
  }
  
  // Text search - yet another separate OR
  if (filters.searchTerm) {
    // ... existing search logic ...
    query = query.or('title.ilike.%term%,...');
  }
  
  return query;
};
```

### למה זה עובד?

PostgREST כשיש מספר `.or()` calls הוא **כן** מצרף אותם ב-AND, הבעיה הייתה אחרת - הפסיקים בתוך הפטרנים שברו את הסינטקס.

עכשיו שהסרנו את הפסיקים מה-NEIGHBORHOOD_GROUPS, נוכל לחזור ללוגיקה המקורית של קריאות `.or()` נפרדות.

## סיכום השינוי

| קובץ | פעולה |
|------|-------|
| `ScoutedPropertiesTable.tsx` | הפרדת שכונות ופיצ'רים לשתי קריאות `.or()` נפרדות |

## תוצאה צפויה

- סינון שכונות → רק דירות בשכונות הנבחרות
- סינון פיצ'רים → רק דירות עם הפיצ'רים הנבחרים  
- שילוב שניהם → רק דירות **גם** בשכונה **וגם** עם הפיצ'ר


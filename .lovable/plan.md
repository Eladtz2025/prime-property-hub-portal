
# תיקון סינון מספר שכונות במדלן

## סיכום הבעיה

הקוד הנוכחי ב-`url-builders.ts` תומך רק בשכונה אחת:
```typescript
if (config.neighborhoods?.length === 1) {
  // ... builds single neighborhood URL
} else {
  // Uses city-level URL - NO FILTERING!
}
```

מה-URL שהעלית ברור שמדלן **כן** תומך במספר שכונות מופרדות בפסיקים!

## הפתרון

שינוי הלוגיקה לבנות URL עם כל השכונות מופרדות בפסיקים.

### פורמט URL הנכון:

```
/for-rent/שכונה1-עיר-ישראל,שכונה2-עיר-ישראל,שכונה3-עיר-ישראל?filters=...
```

### דוגמה אמיתית (מה-URL שלך):
```
/for-rent/הצפון-הישן-תל-אביב-יפו-ישראל,הצפון-החדש-תל-אביב-יפו-ישראל
```

---

## פרטים טכניים

### שינוי 1: עדכון `neighborhood-codes.ts`

הוספת פונקציה חדשה שמחזירה **כל** ה-slugs במפרד פסיקים:

```typescript
/**
 * Get multiple Madlan neighborhood slugs as comma-separated URL path
 * Format: neighborhood1-city-ישראל,neighborhood2-city-ישראל
 */
export function getMadlanMultiNeighborhoodPath(
  neighborhoods: string[], 
  city: string
): string | null {
  const slugs: string[] = [];
  const citySlug = city.replace(/\s+/g, '-');  // "תל אביב יפו" -> "תל-אביב-יפו"
  
  for (const neighborhood of neighborhoods) {
    const slug = madlanNeighborhoodSlugs[neighborhood];
    if (slug) {
      // Format: neighborhood-slug-city-ישראל
      slugs.push(`${slug}-${citySlug}-ישראל`);
    }
  }
  
  if (slugs.length === 0) return null;
  
  // Join with commas
  return slugs.join(',');
}
```

### שינוי 2: עדכון `url-builders.ts`

שינוי הבלוק של Madlan לתמוך במספר שכונות:

```typescript
// FROM:
if (config.neighborhoods?.length === 1) {
  const neighborhoodSlug = getMadlanNeighborhoodSlug(config.neighborhoods[0]);
  // ...single neighborhood logic
} else if (config.cities?.length) {
  // city-level URL - NO FILTERING!
}

// TO:
if (config.neighborhoods?.length > 0 && config.cities?.length) {
  // Build multi-neighborhood URL with comma separation
  const multiPath = getMadlanMultiNeighborhoodPath(
    config.neighborhoods, 
    config.cities[0]
  );
  if (multiPath) {
    baseUrl += `/${multiPath}`;
    console.log(`Madlan multi-neighborhood URL: ${baseUrl}`);
  } else {
    // Fallback to city if no valid slugs
    const citySlug = madlanCityMap[config.cities[0]];
    baseUrl += `/${citySlug}`;
  }
} else if (config.cities?.length) {
  // No neighborhoods - use city
  const citySlug = madlanCityMap[config.cities[0]];
  baseUrl += `/${citySlug}`;
}
```

### שינוי 3: הוספת מיפויים חסרים

מה-URL שלך אני רואה שהפורמט הוא:
- `הצפון-הישן` (לא `הצפון-הישן-החלק-הצפוני`)
- `הצפון-החדש` (לא עם סיומת)

צריך לעדכן את המיפוי לפורמט הפשוט יותר:

```typescript
'צפון_ישן': 'הצפון-הישן',  // Was: 'הצפון-הישן-החלק-הצפוני'
'צפון_חדש': 'הצפון-החדש',   // Correct
```

---

## קבצים לשינוי

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_shared/neighborhood-codes.ts` | הוספת `getMadlanMultiNeighborhoodPath()` + תיקון slugs |
| `supabase/functions/_shared/url-builders.ts` | שימוש בפונקציה החדשה לבניית URL עם מספר שכונות |

---

## תוצאה צפויה

**לפני (שגוי):**
```
https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל  ← כל העיר!
```

**אחרי (נכון):**
```
https://www.madlan.co.il/for-rent/הצפון-הישן-תל-אביב-יפו-ישראל,הצפון-החדש-תל-אביב-יפו-ישראל
```

הסריקה תחזיר **רק** נכסים מהשכונות שנבחרו, במקום לסרוק את כל העיר ולבזבז קרדיטים!

---

## בדיקה לאחר השינוי

1. ליצור קונפיגורציה חדשה עם 2 שכונות (צפון ישן + צפון חדש)
2. להריץ סריקה
3. לוודא שה-URL בלוגים מכיל את שני ה-slugs מופרדים בפסיקים
4. לוודא שכל הנכסים שנמצאו הם מהשכונות הנכונות

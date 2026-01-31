

# תיקון URL שכונות מדלן - חסר "יפו" בשם העיר

## הבעיה שזוהתה

הסריקה **לא החזירה נכסים** כי ה-URL נבנה עם `תל-אביב-ישראל` במקום `תל-אביב-יפו-ישראל`.

**URL שגוי (נבנה):**
```
https://www.madlan.co.il/for-rent/הצפון-הישן-תל-אביב-ישראל,הצפון-החדש-תל-אביב-ישראל
```

**URL נכון (שצריך):**
```
https://www.madlan.co.il/for-rent/הצפון-הישן-תל-אביב-יפו-ישראל,הצפון-החדש-תל-אביב-יפו-ישראל
```

## הסיבה הטכנית

הקונפיגורציה מכילה `cities: ['תל אביב']` אבל מדלן דורש `תל-אביב-יפו` ב-URL.

הפונקציה `getMadlanMultiNeighborhoodPath()` מבצעת:
```typescript
const citySlug = city.replace(/\s+/g, '-');  // "תל אביב" -> "תל-אביב" (חסר "יפו"!)
```

## הפתרון

להשתמש ב-`madlanCityMap` הקיים במקום לבנות את ה-slug ידנית.

---

## פרטים טכניים

### קובץ: `supabase/functions/_shared/neighborhood-codes.ts`

**שורות 196-215** - עדכון הפונקציה `getMadlanMultiNeighborhoodPath`:

```typescript
export function getMadlanMultiNeighborhoodPath(
  neighborhoods: string[], 
  city: string
): string | null {
  const slugs: string[] = [];
  
  // FIXED: Use proper city mapping instead of simple replace
  // Map "תל אביב" -> "תל-אביב-יפו" (not just "תל-אביב")
  const madlanCityMap: Record<string, string> = {
    'תל אביב': 'תל-אביב-יפו',
    'תל אביב יפו': 'תל-אביב-יפו',
    'ירושלים': 'ירושלים',
    'חיפה': 'חיפה',
    'ראשון לציון': 'ראשון-לציון',
    'פתח תקווה': 'פתח-תקווה',
    'אשדוד': 'אשדוד',
    'נתניה': 'נתניה',
    'באר שבע': 'באר-שבע',
    'חולון': 'חולון',
    'בת ים': 'בת-ים',
    'רמת גן': 'רמת-גן',
    'הרצליה': 'הרצליה',
    'רעננה': 'רעננה',
    'גבעתיים': 'גבעתיים',
    'כפר סבא': 'כפר-סבא',
    'הוד השרון': 'הוד-השרון',
    'רמת השרון': 'רמת-השרון',
  };
  
  const citySlug = madlanCityMap[city] || city.replace(/\s+/g, '-');
  
  for (const neighborhood of neighborhoods) {
    const slug = madlanNeighborhoodSlugs[neighborhood];
    if (slug) {
      // Format: neighborhood-slug-city-ישראל
      slugs.push(`${slug}-${citySlug}-ישראל`);
    }
  }
  
  if (slugs.length === 0) return null;
  
  // Join with commas for Madlan multi-neighborhood URL format
  return slugs.join(',');
}
```

---

## קובץ לשינוי

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_shared/neighborhood-codes.ts` | הוספת מיפוי עיר נכון במקום replace פשוט |

---

## תוצאה צפויה

**לפני:**
```
הצפון-הישן-תל-אביב-ישראל  ← דף ריק!
```

**אחרי:**
```
הצפון-הישן-תל-אביב-יפו-ישראל  ← נכסים נמצאים!
```

---

## בדיקה לאחר התיקון

1. להריץ סריקת מדלן עם 2 שכונות (צפון ישן + צפון חדש)
2. לוודא בלוגים שה-URL מכיל `תל-אביב-יפו-ישראל`
3. לוודא שנמצאו נכסים (לא 0)


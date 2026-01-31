
# יצירת תמיכה בריבוי שכונות ב-Yad2 + קונפיגורציה חדשה

## מה גיליתי

אתה צודק! Yad2 תומך בריבוי שכונות, אבל **בפורמט URL שונה**:

| פרמטר נוכחי | פרמטר נכון (ריבוי) |
|-------------|---------------------|
| `city=5000` | `multiCity=5000` |
| `neighborhood=1483,204` | `multiNeighborhood=1483,204` |

**הקוד הנוכחי** משתמש ב-`neighborhood` שעובד רק לשכונה אחת. כדי לתמוך במספר שכונות, צריך לעבור לפורמט `multiNeighborhood`.

---

## קודי השכונות המבוקשות

| שכונה | קוד Yad2 |
|-------|----------|
| צפון ישן | 1483 |
| צפון חדש | 204 |
| מרכז העיר | 1520 |
| בבלי | 1518 |
| כיכר המדינה | 1516 |

**URL מלא:**
```
https://www.yad2.co.il/realestate/rent?multiCity=5000&multiNeighborhood=1483,204,1520,1518,1516&propertyGroup=apartments
```

---

## שינויים נדרשים

### שלב 1: עדכון URL Builder לתמיכה ב-multiNeighborhood

**קובץ:** `supabase/functions/_shared/url-builders.ts`

**לוגיקה חדשה:**
```typescript
// When multiple neighborhoods selected, use multiCity + multiNeighborhood format
if (config.neighborhoods?.length > 0) {
  const neighborhoodCodes = getYad2NeighborhoodCodes(config.neighborhoods);
  if (neighborhoodCodes.length > 0) {
    // Use multi-format for any number of neighborhoods (works for 1 or more)
    if (cityData) {
      params.set('multiCity', cityData.city);
      params.delete('topArea');
      params.delete('area');
      params.delete('city');
    }
    params.set('multiNeighborhood', neighborhoodCodes.join(','));
  }
}
```

### שלב 2: יצירת קונפיגורציה חדשה

**נוסיף קונפיגורציה חדשה ב-Database:**

```sql
INSERT INTO scout_configs (
  name,
  source,
  property_type,
  cities,
  neighborhoods,
  max_pages,
  page_delay_seconds,
  is_active
) VALUES (
  'יד2 השכרה - צפון+מרכז תל אביב',
  'yad2',
  'rent',
  ARRAY['תל אביב'],
  ARRAY['צפון_ישן', 'צפון_חדש', 'מרכז_העיר', 'בבלי', 'כיכר_המדינה'],
  5,
  3,
  true
);
```

### שלב 3: Deploy ובדיקה

לאחר השינויים, ה-URL שייבנה יהיה:
```
https://www.yad2.co.il/realestate/rent?multiCity=5000&multiNeighborhood=1483,204,1520,1518,1516&propertyGroup=apartments
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_shared/url-builders.ts` | שינוי ל-multiCity/multiNeighborhood |
| Database | הוספת קונפיגורציה חדשה |

---

## השפעה

| לפני | אחרי |
|------|------|
| שכונה אחת בלבד ב-URL | מספר שכונות ב-URL אחד |
| צריך 5 קונפיגורציות (שכונה לכל אחת) | קונפיגורציה אחת לכל השכונות |
| 5 x 5 עמודים = 25 בקשות | 1 x 5 עמודים = 5 בקשות |



# תיקון כותרות "יפו" שגויות - Homeless

## סיכום הבעיות מהתמונות

| בעיה | כמות | דוגמה |
|------|------|-------|
| **יפו בכותרת במקום שכונה אמיתית** | 159 | `"בפנקס, יפו"` במקום `"בפנקס, ככר המדינה"` |
| יפו שגוי כשיש שכונה מזוהה | 2 | `"בשדרות נורדאו, יפו"` (שכונה: כיכר המדינה) |
| תל אביב בכותרת | 3 | `"בגבעולים, תל אביב"` |
| תל אביב יפו בכותרת | 1 | `"במזא''ה, תל אביב יפו"` |
| **סה"כ לתיקון** | **165 נכסים** | |

## שורש הבעיה

הפארסר שומר ב-`raw_data.neighborhoodText` את השם הנכון (למשל "נווה חן", "אזור ככר המדינה") אבל:
1. פונקציית `extractNeighborhood` לא מזהה את כל השכונות → `neighborhood = null`
2. הכותרת נבנית עם fallback לא נכון → "יפו" במקום השכונה האמיתית

**דוגמאות מהמסד:**

| raw_data.neighborhoodText | neighborhood בDB | title שנוצר |
|---------------------------|------------------|-------------|
| `נווה חן` | null | `...במעפילי אגוז, יפו` ❌ |
| `תל חיים` | null | `...בדרך השלום, יפו` ❌ |
| `אזור ככר המדינה` | null | `...בפנקס, יפו` ❌ |
| `קרית שאול` | null | `...במשה סנה, יפו` ❌ |

---

## פתרון חלק 1: תיקון הקוד (parser-homeless.ts)

### 1.1 שינוי buildTitle - שימוש ב-neighborhoodText כ-fallback ראשון

**שורה 275 (קריאה ל-buildTitle):**

```typescript
// לפני - cityText כ-fallback אחרון
const title = buildTitle(propertyTypeText, roomsLabel, 
  neighborhood?.label || neighborhoodText || cityText || '', 
  streetText || null);

// אחרי - neighborhoodText ואז ריק (ללא cityText!)
const title = buildTitle(propertyTypeText, roomsLabel, 
  neighborhood?.label || neighborhoodText || '', 
  streetText || null);
```

### 1.2 תיקון buildTitle - סינון "תל אביב יפו" וכפילויות

**שורות 384-410 (פונקציית buildTitle):**

```typescript
function buildTitle(
  propertyType: string,
  rooms: string,
  location: string,
  street: string | null = null
): string {
  const parts: string[] = [];
  
  if (propertyType) {
    parts.push(propertyType);
  }
  
  if (rooms) {
    parts.push(`${rooms} חדרים`);
  }
  
  // NEW: Clean city names and "יפו" from location
  const INVALID_LOCATIONS = [
    'תל אביב יפו', 'תל אביב-יפו', 'תל אביב - יפו', 'תל אביב',
    'יפו' // Don't use standalone יפו as location fallback
  ];
  
  let cleanLocation = location.trim();
  
  // If location is just a city name, clear it
  if (INVALID_LOCATIONS.some(inv => cleanLocation === inv)) {
    cleanLocation = '';
  }
  
  // Remove city names if embedded in location string
  for (const cityName of ['תל אביב יפו', 'תל אביב-יפו', 'תל אביב']) {
    cleanLocation = cleanLocation.replace(cityName, '').trim();
  }
  cleanLocation = cleanLocation.replace(/^[,\-]\s*/, '').replace(/[,\-]\s*$/, '').trim();
  
  // Prevent street = location duplication
  const streetEqualsLocation = street && cleanLocation && 
    street.trim().toLowerCase() === cleanLocation.trim().toLowerCase();
  
  if (street && cleanLocation && !streetEqualsLocation) {
    parts.push(`ב${street}, ${cleanLocation}`);
  } else if (street) {
    parts.push(`ב${street}`);
  } else if (cleanLocation) {
    parts.push(`ב${cleanLocation}`);
  }
  
  return parts.join(' ') || 'נכס להשכרה';
}
```

---

## פתרון חלק 2: תיקון 165 נכסים קיימים (SQL)

### 2.1 תיקון כותרות עם raw_data.neighborhoodText זמין

```sql
-- Update titles: replace "יפו" with the actual neighborhoodText from raw_data
-- For 159 properties where neighborhood is NULL but raw_data has the info
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', ', ' || (raw_data->>'neighborhoodText')),
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NULL
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT LIKE '%תל אביב%'
  AND raw_data->>'neighborhoodText' != 'יפו';
```

### 2.2 תיקון 2 נכסים עם שכונה מזוהה אבל כותרת שגויה

```sql
-- Fix titles where neighborhood is correctly identified but title still says יפו
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', ', ' || neighborhood)
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NOT NULL
  AND neighborhood != 'יפו'
  AND title NOT LIKE '%' || neighborhood || '%';
```

### 2.3 תיקון "תל אביב" ו-"תל אביב יפו" בכותרות

```sql
-- Remove "תל אביב יפו" from titles
UPDATE scouted_properties SET
  title = REPLACE(title, ', תל אביב יפו', '')
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, תל אביב יפו%';

-- Remove "תל אביב" from titles (but not "תל אביב יפו")
UPDATE scouted_properties SET
  title = REPLACE(title, ', תל אביב', '')
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, תל אביב'
  AND title NOT LIKE '%, תל אביב יפו%';
```

---

## תוצאות צפויות

| לפני | אחרי |
|------|------|
| `דירה 4 חדרים בפנקס, יפו` | `דירה 4 חדרים בפנקס, אזור ככר המדינה` |
| `דירה 4 חדרים במעפילי אגוז, יפו` | `דירה 4 חדרים במעפילי אגוז, נווה חן` |
| `דירה 2.5 חדרים בדרך השלום, יפו` | `דירה 2.5 חדרים בדרך השלום, תל חיים` |
| `דירה 4 חדרים בשדרות נורדאו, יפו` | `דירה 4 חדרים בשדרות נורדאו, כיכר המדינה` |
| `3 חדרים במזא''ה, תל אביב יפו` | `3 חדרים במזא''ה` |
| `דירה 2 חדרים בגבעולים, תל אביב` | `דירה 2 חדרים בגבעולים` |

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_experimental/parser-homeless.ts` | 1. הסרת cityText מ-fallback (שורה 275) 2. תיקון buildTitle (שורות 384-410) |
| SQL Migration | תיקון 165 כותרות שגויות |


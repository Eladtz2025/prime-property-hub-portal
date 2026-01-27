

# תוכנית: הוספת Features ב-URL ל-Madlan

## מה גילינו בשיחה הקודמת

מהתמונה שהעלית, Madlan **כן** תומך ב-features דרך URL!

הפורמט שמצאנו:
```
filters=_5500-8000_2.5-____balcony____0-10000
```

## ניתוח הפורמט

| חלק | משמעות |
|-----|--------|
| `_5500-8000` | טווח מחירים (min-max) |
| `_2.5-` | טווח חדרים (min-max) |
| `____balcony____` | פילטר מרפסת (4 קווים תחתונים לפני ואחרי) |
| `0-10000` | נראה כמו טווח שטח (0-10000 מ"ר) |

## שינויים נדרשים

### 1. עדכון buildMadlanUrl

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

**שינוי בסיגנטורה (שורות 206-213):**
```typescript
function buildMadlanUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1,
  // NEW: Feature filters
  balconyRequired?: boolean | null,
  parkingRequired?: boolean | null,
  elevatorRequired?: boolean | null
): string {
```

**שינוי בבניית הפילטר (שורות 234-238):**
```typescript
// Build filters parameter
// Format: _minPrice-maxPrice_minRooms-maxRooms____feature1____feature2____...
const priceFilter = `${adjustedMinPrice || ''}-${adjustedMaxPrice || ''}`;
const roomsFilter = `${minRooms || ''}-${maxRooms || ''}`;

// Start with price and rooms
let filters = `_${priceFilter}_${roomsFilter}`;

// Add feature filters (Madlan uses ____featureName____ format)
if (balconyRequired) {
  filters += '____balcony';
}
if (parkingRequired) {
  filters += '____parking';
}
if (elevatorRequired) {
  filters += '____elevator';
}

// Close the last feature with ____
if (balconyRequired || parkingRequired || elevatorRequired) {
  filters += '____';
}
```

### 2. עדכון buildPersonalUrl להעביר features ל-Madlan

**שינוי בשורות 124-126:**
```typescript
} else if (source === 'madlan') {
  return buildMadlanUrl(
    city, property_type, 
    leakedMinPrice, leakedMaxPrice, 
    min_rooms, max_rooms, page,
    balcony_required, parking_required, elevator_required  // NEW
  );
}
```

### 3. מחיקת ההערה הישנה

מחיקת ההערה הישנה שאומרת ש-Madlan לא תומך:
```typescript
// NOTE: Madlan does NOT support feature filtering via URL  ← למחוק
// Features are filtered post-parse in feature-filter.ts     ← למחוק
```

---

## תוצאה צפויה - כל המקורות תומכים!

| מקור | מחיר ב-URL | חדרים ב-URL | מרפסת ב-URL | חניה ב-URL | מעלית ב-URL |
|------|-----------|-------------|-------------|-----------|-------------|
| **Yad2** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Madlan** | ✅ | ✅ | ✅ (חדש!) | ✅ (חדש!) | ✅ (חדש!) |
| **Homeless** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## דוגמה ל-Madlan URL אחרי השינויים

**לפני:**
```
https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?filters=_7200-12100_3-4
```

**אחרי (עם מרפסת + חניה):**
```
https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?filters=_7200-12100_3-4____balcony____parking____
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `url-builder.ts` | הוספת features לסיגנטורת `buildMadlanUrl` והטמעת הפורמט `____feature____` |

---

## הערה

סליחה שלא זכרתי! עכשיו המערכת תהיה מושלמת - כל 3 המקורות יתמכו בסינון features ישירות ב-URL!


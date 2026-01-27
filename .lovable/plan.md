
# עדכון Personal Scout - תמיכה בפילטרים ב-URL למדלן

## ממצא חדש

מדלן **כן תומכת בפילטרים ב-URL** - זה חוסך המון קריאות ל-Firecrawl!

### פורמט הפילטר שזוהה:
```
?filters=_{minPrice}-{maxPrice}_{minRooms}-{maxRooms}
```

### הוכחות:
| URL | תוצאות |
|-----|--------|
| ללא פילטר | 1,644 דירות |
| `?filters=_5000-8000_3-4` | 278 דירות |
| `?filters=_-10000_3-` | 296 דירות |

### השפעה על יעילות:
- **ללא פילטר:** סורקים 1,644 נכסים, מסננים ~95% אחר כך
- **עם פילטר:** סורקים 278 נכסים רלוונטיים מראש
- **חיסכון:** ~83% פחות נתונים לעבד!

---

## תוכנית השינויים

### שלב 1: עדכון `buildMadlanUrl` ב-url-builder.ts

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

**לפני:**
```typescript
function buildMadlanUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  page: number = 1
): string {
  // ... רק עיר
  // Madlan doesn't support price/rooms in URL
}
```

**אחרי:**
```typescript
function buildMadlanUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1
): string {
  const pathType = propertyType === 'rent' ? 'for-rent' : 'for-sale';
  let baseUrl = `https://www.madlan.co.il/${pathType}`;
  
  // City mapping
  const citySlug = madlanCityMap[city] || city.replace(/\s+/g, '-') + '-ישראל';
  baseUrl += `/${citySlug}`;
  
  // Build filters parameter
  // Format: _minPrice-maxPrice_minRooms-maxRooms
  const priceFilter = `${minPrice || ''}-${maxPrice || ''}`;
  const roomsFilter = `${minRooms || ''}-${maxRooms || ''}`;
  const filters = `_${priceFilter}_${roomsFilter}`;
  
  const params = new URLSearchParams();
  params.set('filters', filters);
  
  if (page > 1) {
    params.set('page', page.toString());
  }
  
  return `${baseUrl}?${params.toString()}`;
}
```

### שלב 2: עדכון הקריאה ל-buildMadlanUrl

**לפני (שורה 90):**
```typescript
} else if (source === 'madlan') {
  return buildMadlanUrl(city, property_type, page);
}
```

**אחרי:**
```typescript
} else if (source === 'madlan') {
  return buildMadlanUrl(city, property_type, min_price, max_price, min_rooms, max_rooms, page);
}
```

### שלב 3: טיפול ביחידות מחיר (מכירה)

במכירה, המחירים במדלן הם בש"ח מלאים (לא באלפים). אם הליד שומר מחירים באלפים (למשל budget_max = 5000 = 5 מיליון), צריך להכפיל ב-1000:

```typescript
// For sale: DB stores in thousands (5000 = 5M), Madlan expects full price
let adjustedMinPrice = minPrice;
let adjustedMaxPrice = maxPrice;

if (propertyType === 'sale') {
  if (maxPrice && maxPrice < 100000) {
    adjustedMinPrice = minPrice ? minPrice * 1000 : null;
    adjustedMaxPrice = maxPrice ? maxPrice * 1000 : null;
  }
}
```

---

## תוצאה צפויה

### לפני התיקון:
```text
Lead: תל אביב, 5,000-8,000₪, 3-4 חדרים
  └─ Madlan URL: /for-rent/תל-אביב-יפו-ישראל
  └─ Results: 1,644 properties
  └─ After filtering: ~50 matches
```

### אחרי התיקון:
```text
Lead: תל אביב, 5,000-8,000₪, 3-4 חדרים
  └─ Madlan URL: /for-rent/תל-אביב-יפו-ישראל?filters=_5000-8000_3-4
  └─ Results: ~278 properties
  └─ After filtering: ~50 matches
```

### חיסכון:
- **83% פחות נתונים** לסרוק ולעבד
- **פחות זמן** לכל ריצה
- **Post-parsing filter** עדיין פעיל לשכונות ותכונות

---

## קובץ לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_personal-scout/url-builder.ts` | הוספת פרמטרים לפונקציית Madlan + בניית `filters` |

---

## בדיקה אחרי התיקון

1. הפעלת Personal Scout Worker לליד ספציפי
2. בדיקת הלוגים שה-URL כולל `?filters=`
3. וידוא שמספר התוצאות מופחת משמעותית

---

## סיכום טכני

```text
┌─────────────────────────────────────────────────────────────┐
│                    MADLAN URL Filter Format                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ?filters=_{minPrice}-{maxPrice}_{minRooms}-{maxRooms}      │
│                                                              │
│  Examples:                                                   │
│  ─────────                                                   │
│  • Price 5K-8K, Rooms 3-4:  ?filters=_5000-8000_3-4         │
│  • Max price 10K, Rooms 3+: ?filters=_-10000_3-             │
│  • Price 2M-5M (sale):      ?filters=_2000000-5000000_3-4   │
│                                                              │
│  Note: Empty values use just dash: _5000-_ means min 5000   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

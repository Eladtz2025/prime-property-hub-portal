
# עדכון Personal Scout - תמיכה בפילטרים ב-URL להומלס

## ממצא חדש

הומלס **גם תומכת בפילטרים ב-URL** - חיסכון נוסף!

### פורמט הפילטר שזוהה מה-URL:
```
https://www.homeless.co.il/rent/city=תל אביב$$inumber4=3$$flong3=5500$$flong3_1=8000$$inumber14=on
```

### פירוט הפרמטרים:
| פרמטר | משמעות | דוגמא |
|-------|--------|-------|
| `city` | שם העיר | `תל אביב` |
| `inumber4` | חדרים (מינימום) | `3` |
| `flong3` | מחיר מינימלי | `5500` |
| `flong3_1` | מחיר מקסימלי | `8000` |
| `inumber14=on` | מרפסת | `on` |

### שימו לב למפריד:
הומלס משתמש ב-`$$` (דולר כפול) להפרדה בין פרמטרים, לא `&` רגיל!

---

## תוכנית השינויים

### שלב 1: עדכון `buildHomelessUrl` ב-url-builder.ts

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

**לפני (שורות 201-223):**
```typescript
function buildHomelessUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  page: number = 1
): string {
  // Homeless doesn't support price/rooms in URL
}
```

**אחרי:**
```typescript
function buildHomelessUrl(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1
): string {
  const baseType = propertyType === 'rent' ? 'rent' : 'sale';
  let url = `https://www.homeless.co.il/${baseType}/`;
  
  // Build parameters with $$ separator
  const params: string[] = [];
  
  // City parameter
  params.push(`city=${encodeURIComponent(city)}`);
  
  // Rooms filter (inumber4 = minimum rooms)
  if (minRooms) {
    params.push(`inumber4=${minRooms}`);
  }
  
  // Price filters
  if (minPrice) {
    params.push(`flong3=${minPrice}`);
  }
  if (maxPrice) {
    params.push(`flong3_1=${maxPrice}`);
  }
  
  // Pagination
  if (page > 1) {
    params.push(`page=${page}`);
  }
  
  // Join with $$ separator
  url += params.join('$$');
  
  console.log(`[personal-scout/url-builder] Built Homeless URL: ${url}`);
  return url;
}
```

### שלב 2: עדכון הקריאה ל-buildHomelessUrl

**לפני (שורה 91-92):**
```typescript
} else if (source === 'homeless') {
  return buildHomelessUrl(city, property_type, page);
}
```

**אחרי:**
```typescript
} else if (source === 'homeless') {
  return buildHomelessUrl(city, property_type, min_price, max_price, min_rooms, max_rooms, page);
}
```

### שלב 3: עדכון הערת הפונקציה הראשית

**לפני (שורות 79-83):**
```typescript
/**
 * Build URL with lead-specific filters
 * Yad2 supports price + rooms in URL
 * Madlan/Homeless only support city in URL
 */
```

**אחרי:**
```typescript
/**
 * Build URL with lead-specific filters
 * All sources (Yad2, Madlan, Homeless) support price + rooms in URL
 */
```

---

## תוצאה צפויה

### לפני התיקון:
```text
Lead: תל אביב, 5,500-8,000₪, 3 חדרים+
  └─ Homeless URL: /rent/?inumber1=17,1,150
  └─ Results: ~1,158 properties
  └─ After filtering: ~80 matches
```

### אחרי התיקון:
```text
Lead: תל אביב, 5,500-8,000₪, 3 חדרים+
  └─ Homeless URL: /rent/city=תל אביב$$inumber4=3$$flong3=5500$$flong3_1=8000
  └─ Results: ~150 properties
  └─ After filtering: ~80 matches
```

### חיסכון מצטבר (כל המקורות):
| מקור | לפני | אחרי | חיסכון |
|------|------|------|--------|
| Yad2 | כבר מסונן | כבר מסונן | - |
| Madlan | 1,644 | ~278 | 83% |
| Homeless | 1,158 | ~150 | 87% |
| **סה"כ** | **2,802** | **~428** | **~85%** |

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_personal-scout/url-builder.ts` | הוספת פרמטרים לפונקציית Homeless + שימוש במפריד `$$` |

---

## בדיקה אחרי התיקון

1. הפעלת Personal Scout Worker לליד ספציפי
2. בדיקת הלוגים שה-URL של Homeless כולל `$$flong3=` ו-`$$inumber4=`
3. וידוא שמספר התוצאות מופחת משמעותית

---

## סיכום טכני - כל שלושת המקורות

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    URL Filter Formats by Source                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  YAD2:                                                                   │
│  ─────                                                                   │
│  ?city=5000&price=5000-8000&rooms=3-4                                   │
│                                                                          │
│  MADLAN:                                                                 │
│  ──────                                                                  │
│  ?filters=_5000-8000_3-4                                                │
│                                                                          │
│  HOMELESS:                                                               │
│  ─────────                                                               │
│  city=תל אביב$$inumber4=3$$flong3=5500$$flong3_1=8000                   │
│                                                                          │
│  Note: Homeless uses $$ as parameter separator, not &                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**שורה תחתונה:** אחרי התיקון הזה, כל שלושת המקורות יתמכו בפילטרי מחיר וחדרים ב-URL - חיסכון של ~85% בנתונים לעיבוד!

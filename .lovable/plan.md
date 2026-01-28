

# תוכנית הטמעה: סינון שכונות ב-URL ל-Yad2

## סיכום

הוספת סינון שכונות ברמת ה-URL ל-Yad2 כדי לצמצם את מספר הדפים לסריקה ב-70-85%.

---

## מיפוי שכונות תל אביב

| שכונה (DB) | קוד Yad2 |
|------------|----------|
| צפון_ישן | 1483 |
| צפון_חדש | 204 |
| כיכר_המדינה | 1516 |
| מרכז_העיר / לב_העיר | 1520 |
| בבלי | 1518 |
| נווה_צדק | 848 |
| כרם_התימנים | 1521 |
| רמת_אביב | 197 |
| פלורנטין | 205 |
| צהלה | 494 |

---

## שינויים בקוד

### 1. קובץ חדש: neighborhood-codes.ts

**נתיב:** `supabase/functions/_personal-scout/neighborhood-codes.ts`

```typescript
/**
 * Yad2 Neighborhood Codes for Tel Aviv
 * Used for URL-level filtering in Personal Scout
 */

export const yad2NeighborhoodCodes: Record<string, string> = {
  // צפון תל אביב
  'צפון_ישן': '1483',
  'צפון ישן': '1483',
  'צפון_חדש': '204',
  'צפון חדש': '204',
  
  // מרכז
  'כיכר_המדינה': '1516',
  'כיכר המדינה': '1516',
  'מרכז_העיר': '1520',
  'מרכז העיר': '1520',
  'לב_העיר': '1520',
  'לב העיר': '1520',
  
  // שכונות נוספות
  'בבלי': '1518',
  'נווה_צדק': '848',
  'נווה צדק': '848',
  'כרם_התימנים': '1521',
  'כרם התימנים': '1521',
  'רמת_אביב': '197',
  'רמת אביב': '197',
  'פלורנטין': '205',
  'צהלה': '494',
};

/**
 * Convert neighborhood names to Yad2 codes
 * Returns only valid codes, skips unknown neighborhoods
 */
export function getYad2NeighborhoodCodes(neighborhoods: string[]): string[] {
  const codes: string[] = [];
  
  for (const neighborhood of neighborhoods) {
    const code = yad2NeighborhoodCodes[neighborhood];
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  return codes;
}
```

### 2. עדכון url-builder.ts

**שינויים:**

א. הוספת import:
```typescript
import { getYad2NeighborhoodCodes } from './neighborhood-codes.ts';
```

ב. עדכון PersonalUrlParams:
```typescript
export interface PersonalUrlParams {
  // ... existing fields ...
  neighborhoods?: string[] | null;  // NEW
  page: number;
}
```

ג. עדכון buildPersonalUrl להעביר neighborhoods:
```typescript
if (source === 'yad2') {
  return buildYad2Url(city, property_type, ..., neighborhoods);
}
```

ד. עדכון buildYad2Url:
```typescript
function buildYad2Url(
  // ... existing params ...
  neighborhoods?: string[] | null
): string {
  // ... existing code ...
  
  // NEW: Add neighborhood filter
  if (neighborhoods && neighborhoods.length > 0) {
    const codes = getYad2NeighborhoodCodes(neighborhoods);
    if (codes.length > 0) {
      params.set('neighborhood', codes.join(','));
      console.log(`[personal-scout/url-builder] Neighborhood filter: ${neighborhoods.join(', ')} → ${codes.join(',')}`);
    }
  }
  
  // ... rest of code ...
}
```

### 3. עדכון personal-scout-worker/index.ts

**שינוי קטן** - העברת שכונות ל-buildPersonalUrl:

```typescript
const url = buildPersonalUrl({
  source,
  city,
  property_type: propertyType,
  min_price: lead.budget_min,
  max_price: lead.budget_max,
  min_rooms: lead.rooms_min,
  max_rooms: lead.rooms_max,
  balcony_required: lead.balcony_required && !lead.balcony_flexible,
  parking_required: lead.parking_required && !lead.parking_flexible,
  elevator_required: lead.elevator_required && !lead.elevator_flexible,
  neighborhoods: lead.preferred_neighborhoods,  // NEW
  page
});
```

---

## תוצאה צפויה

**לפני:**
```
לקוח Eli (צפון_ישן, בבלי, כיכר_המדינה, צפון_חדש):
Yad2 URL: ?topArea=2&area=1&city=5000&price=7200-12100&rooms=3-4
תוצאות: 1,179 → 30 דפים
```

**אחרי:**
```
לקוח Eli (צפון_ישן, בבלי, כיכר_המדינה, צפון_חדש):
Yad2 URL: ?topArea=2&area=1&city=5000&price=7200-12100&rooms=3-4&neighborhood=1483,1518,1516,204
תוצאות: ~200 → 5-8 דפים
```

---

## קבצים

| קובץ | פעולה |
|------|-------|
| `supabase/functions/_personal-scout/neighborhood-codes.ts` | יצירה |
| `supabase/functions/_personal-scout/url-builder.ts` | עדכון |
| `supabase/functions/personal-scout-worker/index.ts` | עדכון קטן |


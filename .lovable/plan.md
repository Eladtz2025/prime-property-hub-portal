
# תוכנית: שלושה שיפורים ל-Personal Scout

## 1. תיקון באג Homeless - הוספת await

**בעיה:** ה-parser של Homeless הוא `async` אבל נקרא בלי `await`

**קובץ:** `supabase/functions/personal-scout-worker/index.ts`

**שינוי בשורה 154-155:**
```typescript
// לפני
} else if (source === 'homeless') {
  properties = parseHomelessHtml(html, propertyType).properties;
}

// אחרי
} else if (source === 'homeless') {
  const result = await parseHomelessHtml(html, propertyType);
  properties = result.properties;
}
```

---

## 2. הוספת Features ל-URL

### 2.1 עדכון PersonalUrlParams

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

```typescript
export interface PersonalUrlParams {
  source: string;
  city: string;
  property_type: 'rent' | 'sale';
  min_price?: number | null;
  max_price?: number | null;
  min_rooms?: number | null;
  max_rooms?: number | null;
  // NEW: Feature filters
  balcony_required?: boolean | null;
  parking_required?: boolean | null;
  elevator_required?: boolean | null;
  page: number;
}
```

### 2.2 עדכון buildHomelessUrl

הוספת פרמטרים ל-Homeless:
- `inumber14=on` למרפסת
- נחקור אילו פרמטרים קיימים לחניה/מעלית

```typescript
// Inside buildHomelessUrl
if (balconyRequired) {
  params.push(`inumber14=on`);
}
```

### 2.3 עדכון Worker להעביר features

```typescript
const url = buildPersonalUrl({
  source,
  city,
  property_type: propertyType,
  min_price: applyBudgetLeakage(lead.budget_min, 'min'),
  max_price: applyBudgetLeakage(lead.budget_max, 'max'),
  min_rooms: lead.rooms_min,
  max_rooms: lead.rooms_max,
  // Only add if required AND not flexible
  balcony_required: lead.balcony_required && !lead.balcony_flexible,
  parking_required: lead.parking_required && !lead.parking_flexible,
  elevator_required: lead.elevator_required && !lead.elevator_flexible,
  page
});
```

---

## 3. הוספת זליגה לתקציב (Budget Leakage)

**מיקום:** `supabase/functions/_personal-scout/url-builder.ts`

```typescript
/**
 * Apply budget leakage for more flexible search
 * Expands search range by 10%
 */
function applyBudgetLeakage(
  value: number | null | undefined,
  type: 'min' | 'max'
): number | null {
  if (!value) return null;
  
  const LEAKAGE_PERCENT = 0.10; // 10%
  
  if (type === 'min') {
    // Lower the minimum by 10%
    return Math.floor(value * (1 - LEAKAGE_PERCENT));
  } else {
    // Raise the maximum by 10%
    return Math.ceil(value * (1 + LEAKAGE_PERCENT));
  }
}
```

### דוגמא:
| תקציב מקורי | עם זליגה 10% |
|------------|--------------|
| 8,000 - 11,000 | 7,200 - 12,100 |
| 5,000 - 7,000 | 4,500 - 7,700 |

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `url-builder.ts` | הוספת PersonalUrlParams, זליגה, features ב-URL |
| `personal-scout-worker/index.ts` | await ל-Homeless, העברת features |

---

## תרשים זרימה אחרי השינויים

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPROVED FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Lead: Eli Aviad                                                        │
│  ─────────────────                                                      │
│  Budget: 8,000-11,000 → WITH LEAKAGE: 7,200-12,100                     │
│  Rooms: 3-4                                                             │
│  Balcony: required + flexible → NOT in URL (flexible=true)             │
│                                                                          │
│  URL Builder:                                                            │
│  ─────────────                                                          │
│  Homeless: /rent/city=תל אביב$$inumber4=3$$flong3=7200$$flong3_1=12100  │
│  Madlan: /for-rent/תל-אביב?filters=_7200-12100_3-4                     │
│  Yad2: /rent?city=5000&price=7200-12100&rooms=3-4                      │
│                                                                          │
│          ↓ סריקה מחזירה ~150 נכסים                                       │
│                                                                          │
│  Post-Parse Filter:                                                      │
│  ─────────────────                                                      │
│  ✓ שכונות (מסננים אחרי)                                                 │
│  ✓ Features (רק אם לא גמישים)                                           │
│                                                                          │
│          ↓ נשארים ~30 נכסים                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## הערה על Lead הנוכחי

ל-Eli Aviad יש:
- `balcony_required: true` + `balcony_flexible: true`
- `parking_required: true` + `parking_flexible: true`
- `elevator_required: true` + `elevator_flexible: true`

כי `flexible=true`, **לא** נוסיף את ה-features ל-URL - הם יסוננו רק אם יש `explicit false` בנכס.

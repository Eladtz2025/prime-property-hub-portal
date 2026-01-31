

# מיפוי שכונות ספציפי לכל מקור - Homeless (6 אזורים בלבד)

## סיכום המצב

מהבדיקה שעשיתי באתר Homeless, מצאתי שיש **6 אזורים בלבד** לתל אביב:

| שם באתר | קוד (inumber1) |
|---------|----------------|
| תל-אביב מרכז | 17 |
| תל-אביב דרום | 2 |
| תל-אביב צפון | 1 |
| תל-אביב מזרח | 382 |
| ת"א צפונית לירקון | 150 |
| יפו | 401 |

**גילוי חשוב**: הקוד של יפו הוא **401** ולא 3 (שזה רמת גן-גבעתיים)!

---

## הבעיה הנוכחית

כרגע כשבוחרים "Homeless" בקונפיגורציה, מוצגות שכונות ספציפיות כמו "צפון ישן", "בבלי", "נווה צדק" - **שכונות שלא קיימות כלל באתר Homeless!**

המערכת מנסה "למפות" אותן לאזורים הכלליים, אבל זה גורם לבלבול.

---

## הפתרון: הצגת שכונות בדיוק כמו שמופיעות באתר

### שינוי 1: הוספת מיפוי SOURCE_NEIGHBORHOODS

**קובץ**: `src/config/locations.ts`

```typescript
// Source-specific neighborhoods - displayed EXACTLY as they appear on each site
export const SOURCE_NEIGHBORHOODS: Record<string, Record<string, Neighborhood[]>> = {
  homeless: {
    'תל אביב יפו': [
      { value: 'homeless_תא_מרכז', label: 'תל-אביב מרכז', aliases: [] },
      { value: 'homeless_תא_דרום', label: 'תל-אביב דרום', aliases: [] },
      { value: 'homeless_תא_צפון', label: 'תל-אביב צפון', aliases: [] },
      { value: 'homeless_תא_מזרח', label: 'תל-אביב מזרח', aliases: [] },
      { value: 'homeless_תא_צפון_ירקון', label: 'ת"א צפונית לירקון', aliases: [] },
      { value: 'homeless_יפו', label: 'יפו', aliases: [] },
    ],
  },
  // Yad2 and Madlan continue to use the existing NEIGHBORHOODS (no changes needed)
};
```

---

### שינוי 2: עדכון מיפוי הקודים של Homeless

**קובץ**: `supabase/functions/_shared/neighborhood-codes.ts`

```typescript
// Homeless area codes - VERIFIED from actual website
export const homelessAreaCodes: Record<string, string> = {
  // New source-specific values (from UI)
  'homeless_תא_מרכז': '17',
  'homeless_תא_דרום': '2',
  'homeless_תא_צפון': '1',
  'homeless_תא_מזרח': '382',
  'homeless_תא_צפון_ירקון': '150',
  'homeless_יפו': '401',  // FIX: Was incorrectly 3!
  
  // Legacy mappings (for backward compatibility with existing configs)
  'צפון_ישן': '1',       // תל-אביב צפון
  'צפון_חדש': '1',       // תל-אביב צפון
  'בבלי': '1',           // תל-אביב צפון
  // ... etc
};
```

---

### שינוי 3: עדכון ה-Dropdown להציג שכונות לפי מקור

**קובץ**: `src/components/ui/neighborhood-selector.tsx`

כשמקור הוא `homeless`, נטען את השכונות מ-`SOURCE_NEIGHBORHOODS` במקום מ-`NEIGHBORHOODS`:

```typescript
// Inside NeighborhoodSelectorDropdown
for (const cityValue of selectedCities) {
  const normalizedCity = normalizeCityValue(cityValue);
  
  // If source has specific neighborhoods, use them
  let neighborhoods: Neighborhood[] = [];
  if (filterBySource && SOURCE_NEIGHBORHOODS[filterBySource]?.[normalizedCity]) {
    neighborhoods = SOURCE_NEIGHBORHOODS[filterBySource][normalizedCity];
  } else {
    // Fallback to general neighborhoods
    neighborhoods = NEIGHBORHOODS[normalizedCity] || [];
    if (filterBySource) {
      neighborhoods = filterNeighborhoodsBySource(neighborhoods, filterBySource);
    }
  }
  
  // ...rest of logic
}
```

---

### שינוי 4: עדכון neighborhoodSupport.ts

**קובץ**: `src/config/neighborhoodSupport.ts`

```typescript
// Homeless now uses source-specific values only
export const homelessSupportedNeighborhoods: Set<string> = new Set([
  'homeless_תא_מרכז',
  'homeless_תא_דרום',
  'homeless_תא_צפון',
  'homeless_תא_מזרח',
  'homeless_תא_צפון_ירקון',
  'homeless_יפו',
]);
```

---

## תוצאה צפויה

### לפני (בעייתי):
בחירת Homeless מראה:
- צפון ישן ❌
- צפון חדש ❌
- בבלי ❌
- נווה צדק ❌
- ... (שכונות שלא קיימות ב-Homeless)

### אחרי (נכון):
בחירת Homeless מראה בדיוק מה שיש באתר:
- תל-אביב מרכז ✓
- תל-אביב דרום ✓
- תל-אביב צפון ✓
- תל-אביב מזרח ✓
- ת"א צפונית לירקון ✓
- יפו ✓

**Yad2 ו-Madlan ימשיכו להראות את השכונות הספציפיות כמו קודם.**

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| `src/config/locations.ts` | הוספת SOURCE_NEIGHBORHOODS עם 6 האזורים של Homeless |
| `supabase/functions/_shared/neighborhood-codes.ts` | תיקון קודים (יפו=401, מרכז=17) + הוספת מפתחות חדשים |
| `src/components/ui/neighborhood-selector.tsx` | טעינת שכונות מ-SOURCE_NEIGHBORHOODS כשמקור הוא homeless |
| `src/config/neighborhoodSupport.ts` | עדכון רשימת השכונות הנתמכות ל-Homeless |

---

## בדיקות אחרי היישום

1. ✓ ליצור קונפיגורציה חדשה ל-Homeless ולוודא שמוצגים רק 6 אזורים
2. ✓ לוודא שהשמות זהים לחלוטין לאתר (תל-אביב צפון ולא "תא צפון")
3. ✓ להריץ סריקה ולוודא שה-URL נבנה נכון עם inumber1=1 או inumber1=401 וכו'
4. ✓ לוודא ש-Yad2 ו-Madlan עדיין מציגים את השכונות הספציפיות


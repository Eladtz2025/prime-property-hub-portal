

# מיפוי שכונות ספציפי לכל מקור - יד2 ומדלן

## המצב הנוכחי

עשינו מיפוי ספציפי ל-Homeless (6 אזורים בלבד), אבל יד2 ומדלן עדיין משתמשים ב-NEIGHBORHOODS הכללי.

## הבעיה

ביד2 ובמדלן יש שמות שכונות שונים ממה שמוצג אצלנו:

| אצלנו | ביד2 | במדלן |
|-------|------|-------|
| צפון ישן | הצפון הישן - צפון / דרום | הצפון הישן החלק הצפוני / המרכזי / וכו' |
| מרכז העיר | לב העיר | לב תל אביב |

## הפתרון

נוסיף מיפוי ספציפי גם ליד2 וגם למדלן ב-SOURCE_NEIGHBORHOODS, כך שכשמשתמש בוחר מקור, הוא יראה את השכונות **בדיוק כמו שמופיעות באותו אתר**.

---

## שינויים בקבצים

### קובץ 1: `src/config/locations.ts`

הוספת מיפוי ליד2 ולמדלן:

```typescript
export const SOURCE_NEIGHBORHOODS: Record<string, Record<string, Neighborhood[]>> = {
  // Homeless - 6 אזורים כלליים (כבר קיים)
  homeless: {
    'תל אביב יפו': [
      { value: 'homeless_תא_מרכז', label: 'תל-אביב מרכז', aliases: [] },
      // ... (ללא שינוי)
    ],
  },
  
  // Yad2 - שכונות כמו שמופיעות ביד2
  yad2: {
    'תל אביב יפו': [
      { value: 'yad2_צפון_ישן', label: 'הצפון הישן', aliases: [] },
      { value: 'yad2_צפון_חדש', label: 'הצפון החדש', aliases: [] },
      { value: 'yad2_כיכר_המדינה', label: 'כיכר המדינה', aliases: [] },
      { value: 'yad2_לב_העיר', label: 'לב העיר', aliases: [] },
      { value: 'yad2_בבלי', label: 'בבלי', aliases: [] },
      { value: 'yad2_נווה_צדק', label: 'נווה צדק', aliases: [] },
      { value: 'yad2_כרם_התימנים', label: 'כרם התימנים', aliases: [] },
      { value: 'yad2_רמת_אביב', label: 'רמת אביב', aliases: [] },
      { value: 'yad2_פלורנטין', label: 'פלורנטין', aliases: [] },
      { value: 'yad2_רוטשילד', label: 'שדרות רוטשילד', aliases: [] },
      { value: 'yad2_צהלה', label: 'גני צהלה', aliases: [] },
      { value: 'yad2_נמל_תל_אביב', label: 'נמל תל אביב', aliases: [] },
      { value: 'yad2_רמת_החייל', label: 'רמת החייל', aliases: [] },
      { value: 'yad2_יד_אליהו', label: 'יד אליהו', aliases: [] },
      { value: 'yad2_תל_ברוך', label: 'תל ברוך', aliases: [] },
      { value: 'yad2_דרום_תל_אביב', label: 'דרום העיר', aliases: [] },
      { value: 'yad2_אזורי_חן', label: 'אזורי חן', aliases: [] },
      { value: 'yad2_נווה_אביבים', label: 'נווה אביבים', aliases: [] },
      { value: 'yad2_הדר_יוסף', label: 'הדר יוסף', aliases: [] },
      { value: 'yad2_נווה_שרת', label: 'נווה שרת', aliases: [] },
      { value: 'yad2_יפו', label: 'יפו', aliases: [] },
    ],
  },
  
  // Madlan - תת-אזורים מפורטים כמו שמופיעים במדלן
  madlan: {
    'תל אביב יפו': [
      // צפון ישן - 4 תת-אזורים במדלן
      { value: 'madlan_צפון_ישן_צפוני', label: 'הצפון הישן - החלק הצפוני', aliases: [] },
      { value: 'madlan_צפון_ישן_מרכזי', label: 'הצפון הישן - החלק המרכזי', aliases: [] },
      { value: 'madlan_צפון_ישן_דרום_מזרחי', label: 'הצפון הישן - החלק הדרום מזרחי', aliases: [] },
      { value: 'madlan_צפון_ישן_דרום_מערבי', label: 'הצפון הישן - החלק הדרום מערבי', aliases: [] },
      
      // צפון חדש - 3 תת-אזורים במדלן
      { value: 'madlan_צפון_חדש_צפוני', label: 'הצפון החדש - החלק הצפוני', aliases: [] },
      { value: 'madlan_צפון_חדש_דרומי', label: 'הצפון החדש - החלק הדרומי', aliases: [] },
      { value: 'madlan_כיכר_המדינה', label: 'הצפון החדש - סביבת כיכר המדינה', aliases: [] },
      
      // שאר השכונות
      { value: 'madlan_לב_תל_אביב', label: 'לב תל אביב', aliases: [] },
      { value: 'madlan_בבלי', label: 'בבלי', aliases: [] },
      { value: 'madlan_נווה_צדק', label: 'נווה צדק', aliases: [] },
      { value: 'madlan_כרם_התימנים', label: 'כרם התימנים', aliases: [] },
      { value: 'madlan_רמת_אביב', label: 'רמת אביב', aliases: [] },
      { value: 'madlan_רמת_אביב_החדשה', label: 'רמת אביב החדשה', aliases: [] },
      { value: 'madlan_פלורנטין', label: 'פלורנטין', aliases: [] },
      { value: 'madlan_רוטשילד', label: 'שדרות רוטשילד', aliases: [] },
      { value: 'madlan_צהלה', label: 'גני צהלה, רמות צהלה', aliases: [] },
      { value: 'madlan_נמל_תל_אביב', label: 'נמל תל אביב', aliases: [] },
      { value: 'madlan_תל_ברוך', label: 'תל ברוך', aliases: [] },
      { value: 'madlan_תל_ברוך_צפון', label: 'תל ברוך צפון', aliases: [] },
      { value: 'madlan_דרום_העיר', label: 'דרום העיר', aliases: [] },
      { value: 'madlan_אזורי_חן', label: 'אזורי חן', aliases: [] },
      { value: 'madlan_נווה_אביבים', label: 'נווה אביבים', aliases: [] },
      { value: 'madlan_הדר_יוסף', label: 'הדר יוסף', aliases: [] },
      { value: 'madlan_נווה_שרת', label: 'נווה שרת', aliases: [] },
      { value: 'madlan_רמת_החייל', label: 'רמת החייל', aliases: [] },
      { value: 'madlan_יד_אליהו', label: 'יד אליהו', aliases: [] },
      { value: 'madlan_יפו', label: 'יפו', aliases: [] },
    ],
  },
};
```

---

### קובץ 2: `supabase/functions/_shared/neighborhood-codes.ts`

הוספת מיפוי לערכים החדשים:

```typescript
// Yad2 neighborhood codes - NOW includes source-specific values (yad2_* prefix)
export const yad2NeighborhoodCodes: Record<string, string> = {
  // NEW: Source-specific values from UI
  'yad2_צפון_ישן': '1483',
  'yad2_צפון_חדש': '204',
  'yad2_כיכר_המדינה': '1516',
  'yad2_לב_העיר': '1520',
  'yad2_בבלי': '1518',
  'yad2_נווה_צדק': '848',
  'yad2_כרם_התימנים': '1521',
  'yad2_רמת_אביב': '197',
  'yad2_פלורנטין': '205',
  'yad2_רוטשילד': '205',
  'yad2_צהלה': '494',
  'yad2_נמל_תל_אביב': '1519',
  'yad2_רמת_החייל': '1523',
  'yad2_יד_אליהו': '1522',
  'yad2_תל_ברוך': '1524',
  'yad2_דרום_תל_אביב': '1525',
  'yad2_אזורי_חן': '1517',
  'yad2_נווה_אביבים': '1526',
  'yad2_הדר_יוסף': '1527',
  'yad2_נווה_שרת': '1528',
  'yad2_יפו': '203',
  
  // LEGACY: Old neighborhood mappings (backward compatibility)
  'צפון_ישן': '1483',
  // ... (קיים)
};

// Madlan neighborhood sub-areas - NOW includes source-specific values
export const madlanNeighborhoodSubAreas: Record<string, string[]> = {
  // NEW: Source-specific values from UI (madlan_* prefix)
  'madlan_צפון_ישן_צפוני': ['שכונה-הצפון-הישן-החלק-הצפוני'],
  'madlan_צפון_ישן_מרכזי': ['שכונה-הצפון-הישן-החלק-המרכזי'],
  'madlan_צפון_ישן_דרום_מזרחי': ['שכונה-הצפון-הישן-החלק-הדרום-מזרחי'],
  'madlan_צפון_ישן_דרום_מערבי': ['שכונה-הצפון-הישן-החלק-הדרום-מערבי'],
  'madlan_צפון_חדש_צפוני': ['שכונה-הצפון-החדש-החלק-הצפוני'],
  'madlan_צפון_חדש_דרומי': ['שכונה-הצפון-החדש-החלק-הדרומי'],
  'madlan_כיכר_המדינה': ['שכונה-הצפון-החדש-סביבת-כיכר-המדינה'],
  'madlan_לב_תל_אביב': ['שכונה-לב-תל-אביב'],
  'madlan_בבלי': ['שכונה-בבלי'],
  // ... (כל שאר השכונות)
  
  // LEGACY: Old neighborhood mappings (backward compatibility)
  'צפון_ישן': [
    'שכונה-הצפון-הישן-החלק-הצפוני',
    // ...
  ],
  // ... (קיים)
};
```

---

### קובץ 3: `src/config/neighborhoodSupport.ts`

עדכון לתמיכה בערכים החדשים:

```typescript
// Yad2 NOW uses source-specific values
export const yad2SupportedNeighborhoods: Set<string> = new Set([
  // NEW: Source-specific values
  'yad2_צפון_ישן',
  'yad2_צפון_חדש',
  'yad2_כיכר_המדינה',
  'yad2_לב_העיר',
  'yad2_בבלי',
  // ... כל השכונות עם prefix
  
  // LEGACY: Old values for backward compatibility
  'צפון_ישן',
  'צפון_חדש',
  // ...
]);

// Madlan NOW uses source-specific values
export const madlanSupportedNeighborhoods: Set<string> = new Set([
  // NEW: Source-specific values (תת-אזורים)
  'madlan_צפון_ישן_צפוני',
  'madlan_צפון_ישן_מרכזי',
  // ... כל התת-אזורים
  
  // LEGACY: Old values for backward compatibility
  'צפון_ישן',
  'צפון_חדש',
  // ...
]);
```

---

## תוצאה צפויה

### בחירת יד2:
המשתמש יראה את השכונות בדיוק כמו שמופיעות ביד2:
- הצפון הישן
- הצפון החדש
- לב העיר
- בבלי
- ...

### בחירת מדלן:
המשתמש יראה תת-אזורים מפורטים כמו שמופיעים במדלן:
- הצפון הישן - החלק הצפוני
- הצפון הישן - החלק המרכזי
- הצפון הישן - החלק הדרום מזרחי
- הצפון הישן - החלק הדרום מערבי
- ...

### בחירת Homeless:
ללא שינוי - 6 אזורים כלליים:
- תל-אביב מרכז
- תל-אביב דרום
- ...

---

## סיכום

| קובץ | שינוי |
|------|-------|
| `src/config/locations.ts` | הוספת yad2 ו-madlan ל-SOURCE_NEIGHBORHOODS |
| `neighborhood-codes.ts` | הוספת מיפוי לערכים עם prefix (yad2_*, madlan_*) |
| `neighborhoodSupport.ts` | הוספת ערכים חדשים ל-Sets |

## שאלה לפני היישום

האם תרצה שאבנה את המיפוי המלא עכשיו? זה ידרוש לעבור על כל השכונות ביד2 ובמדלן ולמפות אותן בדיוק כמו שמופיעות באתרים.


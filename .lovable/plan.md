
# תיקון 4 בעיות במנוע ההתאמות

## קובץ: `supabase/functions/_shared/matching.ts`

### 1. הוספת בדיקת קומה (floor_preference) — למכירה בלבד

הערכים האפשריים: `ground`, `low`, `mid`, `high`, `top`, `any`

מיפוי לקומות:
- `ground` → קומה 0
- `low` → קומות 1-3
- `mid` → קומות 4-8
- `high` → קומות 9-15
- `top` → קומה 16+
- `any` / null → לא בודק

הלוגיקה:
- אם ללקוח אין `floor_preference` או שהוא `any` — הנכס מתאים
- אם לנכס אין קומה (`floor` = null) — הנכס עדיין מתאים (לא נפסל)
- אם לשניהם יש ערך — בודקים שהקומה נופלת בטווח הנכון
- הבדיקה רלוונטית רק לנכסי מכירה

מיקום: אחרי בדיקת size (שורה 371), לפני בדיקת features

### 2. תיקון נכס בלי חדרים (rooms = null/0)

כרגע: אם `property.rooms` הוא null/0, הבדיקה מדלגת ונכס עובר בלי לבדוק חדרים.

תיקון:
- **שכירות**: אם ללקוח יש דרישת חדרים (`rooms_min` או `rooms_max`) והנכס בלי חדרים — **נפסל**
- **מכירה**: אם ללקוח יש דרישת חדרים והנכס בלי חדרים — **נפסל**
- אם ללקוח **אין** דרישת חדרים — הנכס עובר

### 3. תיקון נכס בלי גודל (size = null/0)

כרגע: אם `property.size` הוא null/0, הבדיקה מדלגת.

תיקון:
- **מכירה**: אם ללקוח יש דרישת גודל (`size_min` או `size_max`) — הנכס **נפסל** (במכירה גודל הוא חובה)
- **שכירות**: אם ללקוח יש דרישת גודל — הנכס **עדיין עובר** (מידע חסר לא פוסל)
- אם ללקוח **אין** דרישת גודל — הנכס עובר

### 4. Matching settings — cache ב-trigger-matching

במקום שכל batch יקרא settings מהDB, ה-orchestrator (`trigger-matching`) יקרא פעם אחת ויעביר ב-body לכל batch. ה-`match-batch` ישתמש ב-settings מה-body אם קיימים, ויקרא מ-DB רק כ-fallback.

## פרטים טכניים

### שינויים ב-`supabase/functions/_shared/matching.ts`:

**הוספת floor_preference ל-ContactLead interface** (שורה ~60):
```text
floor_preference: string | null; // ground/low/mid/high/top/any
```

**תיקון בדיקת חדרים** (שורה 352):
```text
if (property.rooms && property.rooms > 0) {
  // בדיקת טווח כרגיל...
} else if (lead.rooms_min || lead.rooms_max) {
  // נכס בלי חדרים אבל ללקוח יש דרישה — נפסל
  return fail("לא צוינו חדרים בנכס");
}
```

**תיקון בדיקת גודל** (שורה 362):
```text
if (property.size && property.size > 0) {
  // בדיקת טווח כרגיל...
} else if ((lead.size_min || lead.size_max) && property.property_type === 'sale') {
  // מכירה: נכס בלי גודל עם דרישת גודל — נפסל
  return fail("לא צוין גודל בנכס (מכירה)");
}
```

**הוספת בלוק קומה** (אחרי size, לפני features):
```text
// ===== FLOOR PREFERENCE (sale only) =====
if (property.property_type === 'sale' && lead.floor_preference && lead.floor_preference !== 'any') {
  if (property.floor !== null && property.floor !== undefined) {
    const ranges = { ground: [0,0], low: [1,3], mid: [4,8], high: [9,15], top: [16,100] };
    const range = ranges[lead.floor_preference];
    if (range && (property.floor < range[0] || property.floor > range[1])) {
      return fail("קומה X לא מתאימה להעדפת קומה Y");
    }
    reasons.push("קומה X ✓");
  }
  // אם לנכס אין קומה — לא נפסל
}
```

### שינויים ב-`supabase/functions/trigger-matching/index.ts`:
- קריאת matchingSettings פעם אחת ב-orchestrator
- העברת ה-settings כ-`matching_settings` ב-body לכל batch

### שינויים ב-`supabase/functions/match-batch/index.ts`:
- קבלת `matching_settings` מה-body
- שימוש בהם אם קיימים, אחרת fallback לקריאה מ-DB

### Deploy:
- match-batch + trigger-matching (כי matching.ts משותף)

### קבצים שישתנו:
- `supabase/functions/_shared/matching.ts` — 4 שינויים
- `supabase/functions/trigger-matching/index.ts` — העברת settings
- `supabase/functions/match-batch/index.ts` — קבלת settings מ-body

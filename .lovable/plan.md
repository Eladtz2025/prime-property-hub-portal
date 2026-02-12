

# תיקון מערכת הכפילויות — ריצה מחדש, סימון נכסים חסרי נתונים, ותצוגה נכונה

## מה לא עובד ולמה

### בעיה 1: ה-RPC מחזיר 0 כי אין מה לבדוק
מתוך 6,901 נכסים, **6,513 כבר נבדקו** (יש להם `dedup_checked_at`). מתוך 388 שנשארו:
- 373 חסרי כתובת
- 16 חסרי חדרים
- = **0 נכסים** שעומדים בתנאי ה-RPC

אז כש-Edge Function קוראת ל-`detect_duplicates_batch` — מקבלת 0, מסיימת מיד, ולא מופיע כלום במוניטור.

### בעיה 2: אין מנגנון "הרצה מחדש"
כשהמשתמש לוחץ "הרצה" הוא מצפה שהסריקה תרוץ מההתחלה על כל הנכסים. אבל ה-Edge Function רק ממשיכה מאיפה שנעצרה.

### בעיה 3: נכסים חסרי נתונים נתקעים לנצח
388 נכסים בלי כתובת/חדרים לעולם לא ייבדקו ולעולם לא יסומנו — נשארים ב"נותרו" לנצח.

### בעיה 4: המטריקות לא ברורות
המשתמש מצפה לראות "נכסים לבדיקה: 6,901" כשמתחילים מחדש, לא "קבוצות: 720, משניים: 463".

## הפתרון

### שלב 1: הוספת "הרצה מחדש" — איפוס כל ה-dedup_checked_at

כשהמשתמש לוחץ "הרצה" ידנית, ה-Edge Function תאפס קודם את כל `dedup_checked_at` ל-NULL כדי לסרוק מההתחלה:

- אם הבקשה מגיעה עם `{ reset: true }` (ברירת מחדל בהפעלה ידנית) — קריאה ל-RPC `reset_dedup_checked` שמעדכן את כל הנכסים
- אם הבקשה מגיעה עם `{ continuation: true }` (self-trigger) — ממשיכה מאיפה שנעצרה

### שלב 2: סימון נכסים חסרי נתונים כ"נבדקו"

עדכון ה-RPC `detect_duplicates_batch`:
- **לפני** הלולאה הראשית, סימון כל הנכסים שחסרי נתונים (בלי כתובת/חדרים/עיר/סוג) כ-`dedup_checked_at = NOW()` כדי שלא ייתקעו
- החזרת מספר ה-"skipped" בנוסף ל-processed/duplicates/groups

### שלב 3: תיקון המטריקות בכרטיס הכפילויות

| מטריקה | לפני | אחרי |
|---------|------|-------|
| מטריקה 1 | "נותרו" (388) | "לבדיקה" — כמה צריך לבדוק (אחרי reset = 6,901) |
| מטריקה 2 | "קבוצות" (720) | "קבוצות כפילויות" (720) |
| מטריקה 3 | "משניים" (463) | "נבדקו היום" |
| סטטוס | "720 קבוצות, 463 משניים" | "720 קבוצות | 463 משניים | 388 לבדיקה" |

### שלב 4: הפעלה מהדשבורד עם reset

כשלוחצים "הרצה" בכרטיס הכפילויות — שולחים `{ reset: true }` ל-Edge Function.

## פרטים טכניים

### מיגרציה

1. RPC חדש `reset_dedup_checked`:
```text
CREATE OR REPLACE FUNCTION reset_dedup_checked()
RETURNS void AS $$
BEGIN
  UPDATE scouted_properties SET dedup_checked_at = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. עדכון `detect_duplicates_batch` — הוספת שלב ראשוני לסימון נכסים חסרי נתונים:
```text
-- Mark properties missing required fields as checked (skip)
UPDATE scouted_properties
SET dedup_checked_at = NOW()
WHERE dedup_checked_at IS NULL
  AND (address IS NULL OR address = '' OR rooms IS NULL OR city IS NULL OR property_type IS NULL);
GET DIAGNOSTICS v_skipped = ROW_COUNT;
```

ושינוי ה-RETURN כך שיכלול גם `v_skipped`.

### detect-duplicates/index.ts

- קריאת `body.reset` מהבקשה
- אם `reset = true` — קריאה ל-`supabase.rpc('reset_dedup_checked')` לפני תחילת הלולאה
- אם `continuation = true` — ממשיכה בלי reset
- ב-self-trigger: שליחת `{ continuation: true }` (לא reset)

### ChecksDashboard.tsx

שינוי ה-`triggerDedup` כדי לשלוח `{ reset: true }`:
```typescript
await supabase.functions.invoke('detect-duplicates', {
  body: { reset: true }
});
```

שינוי המטריקות:
```typescript
metrics={[
  { label: 'לבדיקה', value: dedupStats?.unchecked ?? 0 },
  { label: 'קבוצות', value: dedupStats?.groups ?? 0 },
  { label: 'נבדקו היום', value: dedupStats?.checkedToday ?? 0 },
]}
```

### קבצים שישתנו:
- מיגרציה חדשה (RPC `reset_dedup_checked` + עדכון `detect_duplicates_batch`)
- `supabase/functions/detect-duplicates/index.ts`
- `src/components/scout/ChecksDashboard.tsx`

### Deploy:
- detect-duplicates


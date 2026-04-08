

## סימון לקוחות עם תאריך כניסה שעבר

### הבעיה
26 לקוחות עם `move_in_date` שכבר עבר (חלקם מינואר 2026) עדיין מסומנים כ-`eligible` ומשתתפים בהתאמות — מבזבזים חישובים ומוסיפים רעש.

### הפתרון — שינוי ב-3 מקומות

#### 1. סימון ויזואלי ב-UI (לא חוסם, רק מציג)

**`src/components/CustomerCard.tsx`** — בשורת תאריך כניסה, אם התאריך עבר → הצגה באדום עם אייקון ⚠️:
```
תאריך כניסה: 15/01/2026 ⚠️ עבר
```

**`src/components/ExpandableCustomerRow.tsx`** — אותו סימון ויזואלי בשורת הלקוח המורחבת.

**`src/components/CustomerDetailSheet.tsx`** — אותו סימון בדף פרטי הלקוח.

#### 2. סינון בהתאמות (Edge Function)

**`supabase/functions/_shared/matching.ts`** — בתחילת `calculateMatch`, אם ל-lead יש `move_in_date` שעבר ו-`immediate_entry` הוא false → החזרת ציון 0 עם סיבה "תאריך כניסה עבר".

הלוגיקה:
```typescript
if (lead.move_in_date && !lead.immediate_entry) {
  const moveDate = new Date(lead.move_in_date);
  if (moveDate < new Date()) {
    return { matchScore: 0, matchReasons: ['תאריך כניסה עבר'], priority: 0 };
  }
}
```

### מה לא משתנה
- שום טבלה בדאטאבייס — לא נוגעים ב-`matching_status` או ב-eligibility trigger
- הלקוח **לא נמחק ולא מוסתר** — רק מסומן ויזואלית ולא משתתף בהתאמות
- אם המשתמש מעדכן את תאריך הכניסה לתאריך עתידי — הלקוח חוזר אוטומטית להתאמות
- לוגיקת עיר/שכונה/מחיר/פיצ'רים — ללא שינוי

### למה זה בטוח
- ב-UI: רק הוספת צבע אדום + טקסט — אין שינוי בלוגיקה
- בהתאמות: רק הוספת בדיקה **בתחילת** `calculateMatch` לפני כל שאר הבדיקות — לא נוגע בשום לוגיקה קיימת
- אם לקוח עם תאריך שעבר עדיין רלוונטי, המשתמש פשוט מעדכן את התאריך או מסמן "כניסה מיידית"

### קבצים שמשתנים
1. `src/components/CustomerCard.tsx` — סימון אדום לתאריך שעבר
2. `src/components/ExpandableCustomerRow.tsx` — סימון אדום לתאריך שעבר
3. `src/components/CustomerDetailSheet.tsx` — סימון אדום לתאריך שעבר
4. `supabase/functions/_shared/matching.ts` — בדיקת תאריך עבר בתחילת calculateMatch


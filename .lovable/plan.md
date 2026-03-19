

## שינוי כרטיסיות המטריקות בעמוד הסקאוט

### מה משתנה
- **הסרת כרטיסיית "סה״כ נכסים"** (הראשונה, אפורה) — לא מוסיפה ערך
- **הרחבת כרטיסיית "סה״כ אקטיביים"** — תציג מתחת למספר הראשי שורה קטנה עם כמה לא אקטיביים (total - active)

### שינויים טכניים

**קובץ: `src/pages/AdminPropertyScout.tsx`**

1. הסרת ה-`ScoutMetricTile` הראשון (שורות 184-198, "סה״כ נכסים")
2. עדכון כרטיסיית "סה״כ אקטיביים" — הוספת prop חדש `subtitle` שיציג: `לא אקטיביים: {total - active}`
3. שינוי ה-grid מ-`lg:grid-cols-6` ל-`lg:grid-cols-5` (5 כרטיסיות במקום 6)

**קובץ: `src/components/scout/ScoutMetricTile.tsx`**

4. הוספת prop אופציונלי `subtitle?: string` שמוצג מתחת ל-label בפונט קטן יותר (`text-[10px] text-muted-foreground/70`)


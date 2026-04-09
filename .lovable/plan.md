

## תיקון בעיית 2 תמונות ראשיות

### הבעיה
ב-DB של מאזה 31 יש **2 תמונות** עם `is_main: true` (index 0 ו-index 8) — שאריות מהבאג הקודם (`|| i === 0`). התיקון הקודם מנע יצירת כפילויות **חדשות**, אבל:

1. **נתונים ישנים** — הכפילויות שכבר נשמרו ב-DB לא תוקנו
2. **טעינה ללא נורמליזציה** — כשפותחים עריכה, שתי התמונות נטענות כ-`isPrimary: true`. גם אם המשתמש לוחץ על כוכב חדש, התמונה הראשונה (index 0) נשארת primary כי היא כבר הייתה כזו ב-DB

### הפתרון — 2 חלקים

**חלק 1: נורמליזציה בטעינה**
ב-`PropertyEditRow.tsx` וב-`PropertyEditModal.tsx` — אחרי מיפוי התמונות מ-DB, לוודא שרק תמונה **אחת** מסומנת כראשית (הראשונה שנמצאה עם `is_main: true`):

```typescript
// אחרי ה-map
let foundPrimary = false;
images.forEach(img => {
  if (img.isPrimary && !foundPrimary) {
    foundPrimary = true;
  } else if (img.isPrimary) {
    img.isPrimary = false;
  }
});
```

**חלק 2: ניקוי נתונים קיימים**
Migration שמתקנת את כל הנכסים שיש להם יותר מתמונה ראשית אחת — משאירה רק את זו עם ה-`order_index` הגבוה ביותר (הבחירה האחרונה של המשתמש):

```sql
UPDATE property_images SET is_main = false
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY property_id ORDER BY order_index DESC
    ) as rn
    FROM property_images WHERE is_main = true
  ) sub WHERE rn > 1
);
```

### קבצים שמשתנים
1. `src/components/PropertyEditRow.tsx` — נורמליזציה בטעינה
2. `src/components/PropertyEditModal.tsx` — נורמליזציה בטעינה
3. **Migration חדשה** — ניקוי כפילויות קיימות

### סיכון
**אפסי** — ניקוי נתונים + הגנה בקוד


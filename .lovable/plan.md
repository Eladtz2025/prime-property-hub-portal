

# שיפור מבנה הדשבורד - 3 שינויים

## 1. הסרת כותרת "Property Scout"
הסרת הכותרת הגדולה עם האייקון והתיאור מ-`AdminPropertyScout.tsx` (שורות 14-22). הטאבים יתחילו ישר מלמעלה.

## 2. העלאת כרטיסי הסטטיסטיקה מעל הטאבים
כרטיסי הסטטיסטיקה (7 כרטיסים: ממתינים לבדיקה, נבדקו היום, Timeouts, אקטיביים, ריצה אחרונה, כפילויות, התאמות) יעברו מתוך `ChecksDashboard.tsx` אל `AdminPropertyScout.tsx` - מעל ל-Tabs. כך הם יהיו נראים תמיד, גם בטאב "דירות שנמצאו" וגם בטאב "דשבורד בדיקות".

## 3. הסרת שורת הנתונים מטאב "דירות שנמצאו"
הסרת הבלוק הגדול של סטטיסטיקות + כפתורים שנמצא בתוך `ScoutedPropertiesTable.tsx`:
- **מובייל**: 2 כרטיסיות (סה"כ + היום) - שורות 1074-1110
- **דסקטופ**: שורת נתונים אופקית עם מקורות, Backfill, כפילויות, בדוק URL, ממתינים לבדיקה - שורות 1113-1316

הכפתורים שימחקו (Backfill, כפילויות, בדוק URL) כבר קיימים בכרטיסיות התהליכים בדשבורד.

---

## פרטים טכניים

### קבצים שישתנו:

1. **`src/pages/AdminPropertyScout.tsx`**
   - הסרת בלוק ה-div עם h1 + p (כותרת + תיאור)
   - העתקת StatCard + ה-queries הרלוונטיים (availability-stats, availability-last-run, dedup-stats-summary, matching-stats-summary) מ-ChecksDashboard
   - הצגת שורת הסטטיסטיקה מעל ל-Tabs

2. **`src/components/scout/ChecksDashboard.tsx`**
   - הסרת StatCard component (עובר ל-AdminPropertyScout)
   - הסרת ה-queries שכבר עברו לעמוד הראשי
   - הסרת ה-grid של כרטיסי הסטטיסטיקה מה-return
   - העברת ה-queries הנדרשים כ-props או שכפול (הפשוט יותר: להשאיר queries בשני המקומות, React Query ידאג ל-dedup)

3. **`src/components/scout/ScoutedPropertiesTable.tsx`**
   - הסרת בלוק Mobile stats (שורות 1074-1110)
   - הסרת בלוק Desktop stats bar (שורות 1113-1316)
   - הסרת queries/state/mutations שקשורים רק לבלוקים שהוסרו (backfill, duplicateStats, checkUrl, וכו') - רק אם לא נמצאים בשימוש במקום אחר בקומפוננטה


# תיקון ספירת "נותרו" בהשלמת נתונים + ניקוי ריצה תקועה

## בעיה 1: "נותרו: 1" במקום 306

### הסיבה
בקובץ `src/components/scout/ChecksDashboard.tsx` שורה 171, השאילתה סופרת רק:
- `backfill_status IS NULL` (1 נכס)
- `backfill_status = 'failed'` (0 נכסים)

אבל **לא סופרת `pending`** - ויש 305 נכסים עם `backfill_status = 'pending'`!

### התיקון
שורה 171 - שינוי ה-`or` filter:
```
// שגוי:
.or('backfill_status.is.null,backfill_status.eq.failed');
// נכון:
.or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed');
```

---

## בעיה 2: 409 על סריקות 2

### הסיבה
הריצה `6bf8e3ab` עדיין בסטטוס `running` עם 3 דפים (4, 7, 10) תקועים ב-`pending` (broken chain). התיקון של ההפרדה נפרס נכון, אבל הריצה הזו היא ריצת Jina ולכן היא חוסמת ריצת Jina חדשה בצדק.

### התיקון
מיגרציה לסגירת הריצה התקועה:
```sql
UPDATE scout_runs
SET status = 'partial', completed_at = now()
WHERE id = '6bf8e3ab-29cf-43af-994a-badcabbf1d05'
AND status = 'running';
```

---

## סיכום שינויים
1. **קובץ**: `src/components/scout/ChecksDashboard.tsx` - הוספת `pending` לספירת הנותרים
2. **מיגרציה**: סגירת ריצה תקועה `6bf8e3ab` כ-`partial`

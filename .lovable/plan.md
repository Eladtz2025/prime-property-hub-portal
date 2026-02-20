
# תיקון באג Race Condition בסריקת Homeless (מצב מקבילי)

## הבעיה
ב-Homeless (מצב מקבילי), דפים שמסיימים בו-זמנית דורסים אחד את השני ב-page_stats כי updatePageStatus עושה read-modify-write שלא אטומי. התוצאה: ריצה נשארת בסטטוס "running" לנצח למרות שכל הדפים סיימו.

## הפתרון
ליצור פונקציית SQL אטומית שמעדכנת רק את הדף הספציפי בתוך ה-JSONB array, בלי לקרוא ולכתוב את כל המערך.

### שלב 1: יצירת פונקציית DB אטומית
פונקציה `update_page_stat` שמקבלת run_id, page number, ואובייקט עדכונים, ומעדכנת רק את הדף הספציפי ב-JSONB ישירות ב-SQL -- בלי read-modify-write.

### שלב 2: עדכון updatePageStatus ב-run-helpers.ts
להחליף את הלוגיקה הנוכחית (read -> modify in JS -> write) בקריאה ל-RPC `update_page_stat`. אם ה-RPC נכשל, לשמור את ה-fallback הנוכחי כגיבוי.

### שלב 3: תיקון ריצות תקועות
עדכון ידני של הריצה הנוכחית הקיימת (d2d64b62) לסטטוס "completed" כדי שלא תחסום ריצות עתידיות.

## מה לא נוגעים בו
- scout-homeless-jina/index.ts -- ללא שינוי
- scout-madlan-jina -- ללא שינוי
- scout-yad2-jina -- ללא שינוי
- backfill-property-data-jina -- ללא שינוי
- check-property-availability-jina -- ללא שינוי
- trigger-scout-pages-jina -- ללא שינוי
- parser files -- ללא שינוי

## פרטים טכניים

### פונקציית SQL חדשה: `update_page_stat`
```text
Parameters: p_run_id UUID, p_page INT, p_updates JSONB
Logic:
  1. Find the index of the page in page_stats JSONB array
  2. Merge p_updates into that specific element
  3. If status = 'completed', remove the error key
  4. Single atomic UPDATE statement -- no race condition
```

### שינוי ב-run-helpers.ts: updatePageStatus
```text
Before:
  1. SELECT page_stats FROM scout_runs
  2. Modify array in JavaScript
  3. UPDATE scout_runs SET page_stats = modified_array

After:
  1. RPC call to update_page_stat(run_id, page, updates)
  2. Fallback to old logic if RPC fails
```

### תיקון ריצה תקועה
עדכון SQL ישיר לריצה d2d64b62 - שינוי status ל-completed והוספת completed_at.

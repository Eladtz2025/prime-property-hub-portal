

# תיקון באג: שחרור נעילת ריצה כשאין נכסים לבדיקה

## הבעיה
כשהפונקציה `trigger-availability-check` לא מוצאת נכסים לבדיקה, היא מחזירה תשובה מוצלחת אבל **לא משחררת את נעילת הריצה** בטבלת `availability_check_runs`. הריצה נשארת בסטטוס `running` עד ש-cleanup job מנקה אותה (לאחר 10-15 דקות). בזמן הזה, ריצות חדשות נחסמות.

## הפתרון
הוספת עדכון סטטוס ל-`completed` לפני ה-return המוקדם בשורות 139-149 של `trigger-availability-check/index.ts`.

## שינוי בקובץ
`supabase/functions/trigger-availability-check/index.ts` - לפני ה-return בשורה 141, הוספת:

```typescript
// Release lock when no properties found
await supabase
  .from('availability_check_runs')
  .update({ status: 'completed', completed_at: new Date().toISOString(), properties_checked: 0 })
  .eq('id', runId);
```

## סטטוס מערכת
- המערכת עובדת תקין - כל 5,313 הנכסים נבדקו ב-7 ימים האחרונים
- 0 נכסים ממתינים לבדיקה כרגע
- ההגדרות החדשות (batch=6, retries=1, timeout=15s) פעילות
- הבאג הזה רק גורם לנעילות מיותרות שמאטות ריצות עתידיות


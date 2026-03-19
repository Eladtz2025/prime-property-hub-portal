

## תיקון: השלמת נתונים — מוניטור + היסטוריה ריקים

### שורש הבעיה
`saveRecentItem` בפונקציית `backfill-property-data-jina` שומרת כל פריט מעובד ל-`summary_data.recent_items` — אבל השדה הזה **null בכל 15 הריצות ההיסטוריות**. הפונקציה כנראה לא נפרסה עם הקוד הזה, או שה-`saveRecentItem` נכשלת בשקט.

### תיקון נדרש

**שלב 1: לפרוס מחדש את הפונקציה**
- `supabase/functions/backfill-property-data-jina/index.ts` — לבצע deploy מחדש כדי לוודא שהגרסה הנוכחית (עם `saveRecentItem`) רצה בפועל.

**שלב 2: הוספת לוג דיאגנוסטי ל-saveRecentItem**
- להוסיף `console.log` לפני ואחרי השמירה ב-`saveRecentItem` כדי לוודא שהפונקציה נקראת ושה-update מצליח:
```typescript
async function saveRecentItem(item: {...}) {
  try {
    console.log(`📝 saveRecentItem: saving for ${item.address}`);
    // ...existing code...
    const { error: updateError } = await supabase
      .from('backfill_progress')
      .update({ summary_data: summary, updated_at: new Date().toISOString() })
      .eq('id', progressId);
    if (updateError) console.error('❌ saveRecentItem update failed:', updateError);
    else console.log(`✅ saveRecentItem: saved, total items: ${recentItems.length}`);
  } catch (e) {
    console.error('Failed to save recent_item:', e);
  }
}
```

**שלב 3: תיקון BackfillJinaHistory — תמיכה בכל סוגי הריצות**
- כרגע שואל רק `task_name = 'data_completion_jina'`, אבל יש גם ריצות אוטומטיות (`data_completion_auto_yad2`, `data_completion_auto_madlan`, וכו')
- לשנות את השאילתה כך שתכסה את כל סוגי ריצות ההשלמה:
```typescript
.or('task_name.eq.data_completion_jina,task_name.like.data_completion_auto_%')
.order('completed_at', { ascending: false })
.limit(1)
```

### קבצים שישתנו
1. `supabase/functions/backfill-property-data-jina/index.ts` — הוספת לוגים ל-saveRecentItem + re-deploy
2. `src/components/scout/checks/BackfillJinaHistory.tsx` — הרחבת query לכלול ריצות אוטומטיות

### תוצאה צפויה
- אחרי הריצה הבאה: טאב "השלמה" במוניטור יציג פירוט מלא (כתובת, שכונה, מקור, שדות שעודכנו)
- כפתור "היסטוריה" יציג את כל הפריטים מהריצה האחרונה (כולל אוטומטיות)


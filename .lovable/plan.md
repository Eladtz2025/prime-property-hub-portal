

# תוכנית: שיפור השלמת נתונים + חילוץ Features

## סיכום הבעיה
1. **כפתור השלמת נתונים** - עוצר אחרי 25 רשומות במקום לרוץ עד הסוף
2. **Features חסרים** - הפרסרים לא מחלצים חצר/מרפסת מהמרקדאון, אז לקוח שמחפש חצר לא מקבל התאמות

## פתרון מוצע

### חלק א': כפתור שרץ עד הסוף

**שינויים נדרשים:**

1. **Edge Function חדשה: `backfill-all-data`**
   - תעבוד ב-batches של 20-25 רשומות
   - בסוף כל batch, תבדוק אם יש עוד רשומות עם נתונים חסרים
   - אם יש - תקרא לעצמה שוב (recursively)
   - תעדכן טבלת `backfill_progress` עם התקדמות

2. **UI משופר בטבלת הנכסים:**
   - כפתור "השלמת נתונים" יהפוך ל-"עצור" בזמן הריצה
   - יציג progress bar עם התקדמות
   - יציג סטטוס: "מעבד 45/120 נכסים..."
   - בסיום יציג סיכום מפורט

### חלק ב': חילוץ Features מהמרקדאון

**עדכון `backfill-property-data/index.ts`:**

הוספת פונקציה `extractFeatures` שתחפש:
- **מרפסת**: "מרפסת", "balcon", "mirpeset"
- **חצר/גינה**: "חצר", "גינה", "גן פרטי", "garden", "yard"
- **מעלית**: "מעלית", "elevator"
- **חניה**: "חניה", "חנייה", "parking"
- **ממ"ד**: "ממ"ד", "ממד", "מרחב מוגן"
- **מחסן**: "מחסן", "storage"
- **גג**: "גג", "פנטהאוז", "roof"
- **מזגן**: "מזגן", "מיזוג"
- **משופצת**: "משופצ", "שיפוץ", "renovated"

## פרטים טכניים

### מבנה הטבלה `backfill_progress`:
```
task_name: 'data_completion'
status: 'running' | 'completed' | 'failed'
total_items: 120
processed_items: 45
successful_items: 38
failed_items: 7
updated_at: timestamp
```

### זרימת העבודה:
```
1. משתמש לוחץ "השלמת נתונים"
   ↓
2. נוצרת רשומה ב-backfill_progress
   ↓
3. Edge Function מתחילה לעבד batch של 25
   ↓
4. UI מציג progress bar (polling כל 3 שניות)
   ↓
5. בסיום batch - אם יש עוד, Edge Function קוראת לעצמה
   ↓
6. בסיום כולל - status הופך ל-'completed'
   ↓
7. UI מציג סיכום סופי
```

### קבצים לעריכה:
1. `supabase/functions/backfill-property-data/index.ts` - הוספת חילוץ features + לוגיקת רציפות
2. `src/components/scout/ScoutedPropertiesTable.tsx` - UI עם progress bar ומעקב
3. `supabase/config.toml` - עדכון הגדרות אם נדרש


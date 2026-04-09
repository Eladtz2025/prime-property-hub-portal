

## הוספת סיבות דחייה אוטומטית ליד כל התאמה בדיאלוג ההתאמות

### הבעיה
כשנכס נדחה אוטומטית על ידי מערכת ההתאמות (score 0), הוא פשוט לא מופיע — ואין שום אינדיקציה למה. המשתמש לא יודע למה לקוח X קיבל רק 5 התאמות ולא 20.

### הגישה
בזמן ה-matching (ב-`trigger-matching`), נאסוף סיכום של סיבות הדחייה ונשמור אותו על הליד עצמו. לדוגמה: "312 נכסים נדחו: מחיר גבוה (180), שכונה לא מתאימה (95), אין חניה (37)". הנתון הזה יוצג כסימון אדום קטן בעמודת ההתאמות בטבלת הלקוחות.

### מה משתנה

#### 1. הוספת עמודה `rejection_summary` ל-`contact_leads`
```sql
ALTER TABLE contact_leads ADD COLUMN rejection_summary jsonb DEFAULT NULL;
```
הפורמט: `{"total_rejected": 312, "reasons": {"מחיר גבוה": 180, "שכונה לא מתאימה": 95, "אין חניה": 37, ...}}`

#### 2. שמירת סיכום דחיות ב-`trigger-matching`
בסיום ריצת ההתאמה ללקוח ספציפי, נספור את כל הדחיות לפי סיבה ונעדכן את `rejection_summary` על הליד.

**קובץ:** `supabase/functions/trigger-matching/index.ts`

```
// After processing all properties:
const rejectionCounts: Record<string, number> = {};
let totalRejected = 0;
matchResults.forEach(r => {
  if (!r.isNewMatch && r.rejectionReason) {
    totalRejected++;
    rejectionCounts[r.rejectionReason] = (rejectionCounts[r.rejectionReason] || 0) + 1;
  }
});
// Save to lead
await supabase.from('contact_leads').update({
  rejection_summary: { total_rejected: totalRejected, reasons: rejectionCounts }
}).eq('id', leadId);
```

צריך גם לעדכן את `matchResults` לכלול את `rejectionReason` מה-`calculateMatch`.

#### 3. הצגת סימון אדום ב-UI
**קובץ:** `src/components/customers/CustomerMatchesCell.tsx`

ליד מספר ההתאמות, הוספת עיגול אדום קטן (🔴) עם tooltip שמפרט את סיבות הדחייה:

```
<Tooltip>
  <TooltipTrigger>
    <span className="h-4 w-4 bg-destructive/20 text-destructive rounded-full text-[10px] flex items-center justify-center">!</span>
  </TooltipTrigger>
  <TooltipContent>
    312 נכסים נדחו:
    • מחיר גבוה מהתקציב — 180
    • שכונה לא מתאימה — 95
    • אין חניה — 37
  </TooltipContent>
</Tooltip>
```

הסימון יופיע רק כשיש rejection_summary.

#### 4. שליפת rejection_summary מה-DB
**קובץ:** `src/hooks/useCustomerData.ts` — הוספת `rejection_summary` לשאילתה של הלקוחות.

### קבצים שמשתנים
1. **Migration** — עמודה `rejection_summary` ב-`contact_leads`
2. `supabase/functions/trigger-matching/index.ts` — איסוף ושמירת סיכום דחיות
3. `src/components/customers/CustomerMatchesCell.tsx` — סימון אדום + tooltip
4. `src/hooks/useCustomerData.ts` — שליפת השדה החדש

### מה לא משתנה
- לוגיקת ההתאמה עצמה (`matching.ts`)
- PropertyMatchCard, DialogContent
- טבלאות אחרות
- Edge functions אחרים

### סיכון
**נמוך** — שמירת נתון נוסף על הליד בלבד. לא משנה את ההתאמות עצמן.



# תיקון: החלת גמישות מחיר גם על תקציב מינימלי

## הבעיה
הלוגיקה הנוכחית מחילה גמישות מחיר רק על התקציב המקסימלי, אבל לא על המינימלי.

## הפתרון
**קובץ:** `supabase/functions/_shared/matching.ts`

**שורות 292-298 - לשנות:**

```typescript
// לפני:
const minBudget = lead.budget_min || 0;
const maxAllowed = lead.budget_max * (1 + flexibility);

if (property.price < minBudget) {
  return { lead, matchScore: 0, matchReasons: [`מחיר נמוך מהתקציב המינימלי: ₪${property.price.toLocaleString()}`], priority: 0 };
}

// אחרי:
const minBudget = lead.budget_min || 0;
const minAllowed = minBudget > 0 ? minBudget * (1 - flexibility) : 0;  // גמישות למטה
const maxAllowed = lead.budget_max * (1 + flexibility);  // גמישות למעלה

if (property.price < minAllowed) {
  const percentBelow = Math.round(((minBudget - property.price) / minBudget) * 100);
  return { lead, matchScore: 0, matchReasons: [`מחיר נמוך מהתקציב המינימלי ב-${percentBelow}%: ₪${property.price.toLocaleString()}`], priority: 0 };
}
```

## לוגיקה לדוגמה

**רוני - תקציב ₪6,500-?:**
- גמישות 15% (כי מתחת ל-₪7,000)
- מינימום מותר: ₪6,500 × 0.85 = **₪5,525**
- בלוך במחיר ₪5,700 > ₪5,525 ✅ **יתקבל!**

**לקוח עם תקציב ₪10,000-₪15,000:**
- גמישות 10% (כי בין ₪7,000 ל-₪15,000)
- מינימום מותר: ₪10,000 × 0.90 = **₪9,000**

## תוצאה
הגמישות תעבוד סימטרית - גם למעלה וגם למטה - בהתאם להגדרות שכבר קבעת.

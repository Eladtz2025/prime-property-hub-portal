
# תיקון: זיהוי שגיאת 402 מ-Firecrawl + ניקוי נכסים שנכשלו

## מצב נוכחי
- 38 נכסים סומנו עם `availability_check_reason = 'firecrawl_failed_after_retries'` בגלל שגיאת 402 (אין קרדיטים)
- הנכסים האלה לא סומנו כנבדקו (`availability_checked_at` = null, `availability_check_count` = 0) - הלוגיקה עבדה נכון
- אבל הם נשארו עם reason מלוכלך

## שינויים

### 1. ניקוי 38 הנכסים שנכשלו
- עדכון `availability_check_reason` ל-null על 38 הנכסים שסומנו `firecrawl_failed_after_retries`

### 2. זיהוי שגיאת 402 ב-check-property-availability
- בקובץ `supabase/functions/check-property-availability/index.ts`
- כשFirecrawl מחזיר 402, להחזיר reason ייחודי: `firecrawl_payment_required`
- לסמן את זה כ-reason מיוחד שיגרום ל-trigger לעצור את הריצה

### 3. עצירת הריצה על 402 ב-trigger-availability-check
- בקובץ `supabase/functions/trigger-availability-check/index.ts`
- אחרי כל batch, לבדוק אם יש results עם reason `firecrawl_payment_required`
- אם כן - לעצור את הריצה מיד עם הודעה ברורה ולא לעשות self-chain

### קבצים לעריכה:
- `supabase/functions/check-property-availability/index.ts` - זיהוי 402
- `supabase/functions/trigger-availability-check/index.ts` - עצירה על 402
- ניקוי נתונים: עדכון 38 נכסים בדאטאבייס

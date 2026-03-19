

## תיקון פשוט: נכס עם 403 ישלח לסוף התור

### שינוי אחד בלבד

**קובץ: `supabase/functions/check-property-availability-jina/index.ts`**

בבלוק של retryable errors (שורות ~419-434), נוסיף תנאי: אם הסיבה היא `madlan_direct_status_403` — נעדכן גם `availability_checked_at = now()` בנוסף ל-reason. זה ישלח את הנכס לסוף התור במקום שיחזור מיד.

כל שאר ה-retryable errors נשארים בדיוק כמו היום — בלי שינוי.


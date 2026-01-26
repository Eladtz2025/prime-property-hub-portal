
# תיקון: יצירת לינק זכרון דברים נכשלת

## הבעיה שזוהתה

כשלוחצים על "יצירת לינק" בטופס זכרון דברים:
1. המערכת מנסה לעשות INSERT לטבלת `legal_form_tokens`
2. מדיניות RLS חוסמת את הפעולה עם שגיאה: `"new row violates row-level security policy"`
3. ההעתקה ל-clipboard לא מתבצעת
4. מה שהיה ב-clipboard קודם ("בדיקת Firecrawl Agent") נשאר

## הסיבה

מדיניות RLS הנוכחית מגבילה **את כל הפעולות** (כולל INSERT) רק לתפקידי admin/super_admin/manager:
```sql
CREATE POLICY "Admins can manage all tokens"
ON public.legal_form_tokens
FOR ALL
USING (get_current_user_role() IN ('admin', 'super_admin', 'manager'))
```

הבעיה: הפונקציה `get_current_user_role()` מחזירה `viewer` גם למשתמשים עם תפקיד גבוה יותר (בעיה פוטנציאלית ב-session או בפונקציה).

## הפתרון

להוסיף מדיניות RLS חדשה שמאפשרת למשתמשים **מאומתים** ליצור טוקנים (עם ה-user_id שלהם):

```sql
-- מאפשר למשתמשים מאומתים ליצור טוקנים
CREATE POLICY "Authenticated users can create tokens"
ON public.legal_form_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  -- הטוקן צריך להיות משויך למשתמש שיוצר אותו, או ללא משתמש (לטפסים ציבוריים)
  created_by IS NULL OR created_by = auth.uid()
);
```

## מה ישתנה

| לפני | אחרי |
|------|------|
| רק admin/super_admin/manager יכולים ליצור טוקנים | כל משתמש מאומת יכול ליצור טוקנים |
| יצירת לינק נכשלת | יצירת לינק תעבוד |
| הלינק לא מועתק | הלינק יועתק ל-clipboard |

## קבצים שישתנו

1. **Migration SQL חדש** - הוספת מדיניות RLS למשתמשים מאומתים

## בדיקה לאחר התיקון

1. פתח טופס זכרון דברים חדש
2. מלא את הפרטים וחתום
3. לחץ על "יצירת לינק"
4. ודא שההודעה "הלינק הועתק" מופיעה
5. הדבק ובדוק שהלינק הנכון הועתק

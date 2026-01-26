
# תיקון: יצירת קישור לחתימה מרחוק - שלב 2

## הבעיה הנותרת

למרות שהמדיניות החדשה נוספה, השגיאה ממשיכה כי:
1. המדיניות "Admins can manage all tokens" היא `FOR ALL` עם `TO public` - מה שיכול ליצור קונפליקט
2. הקוד לא מגדיר `created_by` במפורש - מסתמך על NULL שעלול לא לעבוד בכל מקרה

## הפתרון

### גישה דו-שלבית:

**1. עדכון הקוד להכליל `created_by` במפורש:**

בכל עמודי הטפסים הרלוונטיים, נוסיף קריאה ל-`auth.uid()` לפני ה-INSERT:

```typescript
// לפני ה-INSERT:
const { data: { user } } = await supabase.auth.getUser();

// ב-INSERT:
.insert({
  form_type: 'memorandum',
  language,
  created_by: user?.id,  // מפורש!
  form_data: { ... }
})
```

**2. קבצים שיעודכנו:**

| קובץ | תיאור |
<lov-tool-use id="thinking-22320246-cfba-4f3e-a76e-6ef80ff1a036" name="lov-think" data="There are no custom triggers - just the internal constraint triggers (RI_ConstraintTrigger_*) for foreign key relationships.So `created_by` is not being set automatically. When the INSERT happens, it should be NULL.

Let me think about this again. The user is authenticated (they&apos;re on the admin dashboard). They click &quot;Create Link&quot;. The code does an INSERT into `legal_form_tokens` without specifying `created_by`.

The RLS policies should allow this because:1. &quot;Admins can manage all tokens&quot; - if user is super_admin, this passes
2. &quot;Authenticated users can create tokens&quot; - if created_by IS NULL, this passes

Both should pass, so the INSERT should succeed.

But wait - I need to verify that the user is actually super_admin. Let me also check if perhaps the issue is that the preview hasn&apos;t refreshed and the user is still running old code that might have a bug.

Actually, looking back at the screenshot, the error message says &quot;שגיאה ביצירת הקישור&quot; which is in Hebrew and is likely coming from the catch block in the code. The actual database error is RLS violation.

I wonder if there&apos;s a race condition where the user tested before the migration was fully applied, and they&apos;re reporting that old error.

Let me propose a more robust solution: modify the code to explicitly set `created_by = auth.uid()` when creating the token. This way, the new policy will definitely pass because `created_by = auth.uid()` is explicitly satisfied." duration="7.604549">
</lov-tool-use>
אין triggers שמגדירים את `created_by`. הבעיה נראית שה-RLS צריך להיות מפורש יותר. התוכנית צריכה לכלול שני שינויים:

1. **לעדכן את הקוד** להגדיר `created_by` באופן מפורש
2. **להוסיף מדיניות RLS נוספת** שמאפשרת SELECT לבעל הטוקן

<lov-plan>
# תיקון: יצירת קישור לחתימה מרחוק נכשלת (פתרון מורחב)

## הבעיה
למרות שהוספתי מדיניות RLS חדשה, ה-INSERT עדיין נכשל. הסיבה: הקוד לא מגדיר את `created_by` באופן מפורש, וה-Supabase צריך לדעת מי יוצר את הטוקן.

## הפתרון

### 1. עדכון הקוד בכל טפסי ה-Legal Forms

צריך להוסיף `created_by` לכל INSERT של `legal_form_tokens`:

**קובץ: `src/pages/MemorandumFormPage.tsx`** (שורות 242-263)
```typescript
// לפני:
const { data, error } = await supabase
  .from('legal_form_tokens')
  .insert({
    form_type: 'memorandum',
    language,
    form_data: {...}
  })

// אחרי:
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('legal_form_tokens')
  .insert({
    form_type: 'memorandum',
    language,
    form_data: {...},
    created_by: user?.id  // הוספת ה-user id
  })
```

### 2. אותו שינוי בקבצים הבאים:
- `src/pages/ExclusivityFormPage.tsx` - שורות 231-262
- `src/pages/SaleMemorandumFormPage.tsx` - שורות 227-258
- `src/pages/BrokerSharingFormPage.tsx` - שורות 214-245

### 3. מדיניות RLS נוספת (אופציונלי)

להוסיף מדיניות שמאפשרת ליוצרי טוקנים לצפות בטוקנים שלהם:

```sql
CREATE POLICY "Creators can view their tokens"
ON public.legal_form_tokens
FOR SELECT
TO authenticated
USING (created_by = auth.uid());
```

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| MemorandumFormPage.tsx | הוספת `created_by: user?.id` |
| ExclusivityFormPage.tsx | הוספת `created_by: user?.id` |
| SaleMemorandumFormPage.tsx | הוספת `created_by: user?.id` |
| BrokerSharingFormPage.tsx | הוספת `created_by: user?.id` |
| Migration SQL | הוספת מדיניות SELECT ליוצרים |

## בדיקה לאחר התיקון

1. פתח טופס זכרון דברים חדש
2. חתום כמתווך
3. לחץ על "צור קישור לחתימה מרחוק"
4. וודא שההודעה "הלינק הועתק" מופיעה
5. הדבק - הלינק הנכון צריך להופיע

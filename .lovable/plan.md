

## תיקון ממצא 1: `saveProperty` דורס `status` ו-`availability_check_reason`

### הבעיה
בשני מסלולים ב-`saveProperty`, כל פעם שנכס נמצא מחדש בסריקה:
- **Same-source update** (שורות 347-349): מאפס `status: 'new'` ו-`availability_check_reason: null`
- **Upsert** (שורות 448-450): אותו דבר

זה גורם לנכסים שכבר עברו matching (סטטוס `matched`) לחזור ל-`new`, ולנתוני availability להימחק.

### התיקון

**קובץ:** `supabase/functions/_shared/property-helpers.ts`

**1. Same-source update (שורות 347-349):** הסרת `status: 'new'` ו-`availability_check_reason: null` מה-update — לא לגעת בשדות האלה כשמעדכנים נכס קיים.

**2. Upsert (שורות 448-450):** ה-upsert משמש גם ל-insert של נכסים חדשים, אז צריך לשמור `status: 'new'` ל-insert. אבל ב-update (onConflict) זה דורס. הפתרון: לפני ה-upsert, לבדוק אם הנכס כבר קיים (כבר יש את `existedBefore`). אם קיים — לא לכלול `status` ו-`availability_check_reason` ב-upsert, או להשתמש ב-insert+update נפרדים.

הגישה הפשוטה והבטוחה: אם `existedBefore === true`, להריץ update במקום upsert (בלי לדרוס status/availability). אם `existedBefore === false`, להריץ insert עם `status: 'new'`.


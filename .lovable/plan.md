

## ביטול מנגנון "בדיקה ידנית" — ניסיונות חוזרים ללא הגבלה

### מה קורה היום
כשנכס נכשל בבדיקת זמינות 2 פעמים (`availability_retry_count >= 2`), הוא מסומן כ"בדיקה ידנית" ומוצג באדום בדיאלוג. ב-160 נכסים — אף אחד לא נבדק ידנית בפועל.

### מה ישתנה
1. **הסרת הסף** — נכסים לא ייפלטו מהתור אחרי 2 ניסיונות. הם ימשיכו לחזור לבדיקה אוטומטית עד שהבדיקה מצליחה או שהנכס נמצא לא פעיל.
2. **איפוס ה-160 הנוכחיים** — migration שמאפסת `availability_retry_count = 0` לכל הנכסים עם retry >= 2, כך שייכנסו חזרה לתור.
3. **הסרת טאב "בדיקה ידנית" מהדיאלוג** — כבר לא רלוונטי.

### שינויים

| # | קובץ / מיגרציה | שינוי |
|---|----------------|--------|
| 1 | Migration חדשה | `UPDATE scouted_properties SET availability_retry_count = 0 WHERE availability_retry_count >= 2 AND is_active = true` |
| 2 | `supabase/functions/check-property-availability-jina/index.ts` | הסר את הלוגיקה שמגדילה `availability_retry_count` על שגיאות retryable. פשוט תשאיר את הנכס בתור בלי לספור |
| 3 | `src/components/scout/checks/PendingPropertiesDialog.tsx` | הסר את ה-query של `manual-check-properties`, את הטאב "בדיקה ידנית", ואת הרקע האדום |
| 4 | `src/components/scout/ChecksDashboard.tsx` | הסר את ה-query ל-`availability_retry_count >= 2` מספירת ה-pending |

**4 שינויים. הנכסים ימשיכו להיבדק אוטומטית עד שנקבל תוצאה ברורה.**




## ביקורת QA סיבוב 6 — ממצאים חדשים

גישה זהה: **תיקוני באגים וניקיון בלבד** — לא נוגעים בלוגיקה עסקית.

---

### 1. חשיפת אימייל אדמין ב-production

**חומרה: בינונית (אבטחה)**

**1.1 `AdminDashboard.tsx`** שורה 124: מציג `eladtz@gmail.com` בדף ההתחברות כ"מידע לבדיקה". זה נגיש לכל מי שנכנס ל-`/admin-dashboard` בלי לוגין.

**1.2 `AuthTestHelper.tsx`** — קומפוננטה שלמה שמציגה מידע debug (אימייל, תפקיד, הרשאות) + הוראות בדיקה עם `eladtz@gmail.com`. הקובץ **לא מיובא מאף מקום** — קוד מת.

**תיקון:** הסר את ה-div עם האימייל מ-AdminDashboard. מחק את AuthTestHelper.

---

### 2. console.log — 193 מופעים שנשארו

**חומרה: נמוכה-בינונית (ניקיון/ביצועים)**

הקבצים העיקריים:
- `ExcelImporter.tsx` — 10 console.logs (upload flow debug)
- `PropertyEditModal.tsx` — 4 console.logs (image loading debug)
- `useUnifiedPropertyData.ts` — 2 placeholder logs
- `OwnerPropertyCard.tsx` — `onDelete={(id) => console.log(...)}` (handler ריק)

`pwa.ts`, `sentry.ts`, `notifyNewLead.ts` — אלה לגיטימיים (infrastructure logging), לא נוגעים.

**תיקון:** נקה console.logs מ-ExcelImporter, PropertyEditModal, useUnifiedPropertyData. תקן handler ריק ב-OwnerPropertyCard.

---

### 3. AdminDashboard — בלוק login מיותר

**חומרה: נמוכה (קוד מת)**

`AdminDashboard.tsx` שורות 104-129: כולל בלוק `if (!isAuthenticated)` שמציג כרטיס התחברות. אבל הדף כבר עטוף ב-`ProtectedRoute` ב-App.tsx — משתמש לא מאומת לעולם לא יגיע לקוד הזה. זה קוד מת שגם חושף PII.

**תיקון:** הסר את כל הבלוק `if (!isAuthenticated)`.

---

### תוכנית תיקון

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | הסר בלוק login מיותר (כולל אימייל חשוף) מ-AdminDashboard | `AdminDashboard.tsx` | אבטחה |
| 2 | מחק AuthTestHelper (קוד מת + PII) | `AuthTestHelper.tsx` | אבטחה |
| 3 | נקה console.logs מ-4 קבצים | `ExcelImporter.tsx`, `PropertyEditModal.tsx`, `useUnifiedPropertyData.ts`, `OwnerPropertyCard.tsx` | ניקיון |

**3 תיקונים, ~5 קבצים. אפס שינויים בלוגיקה עסקית.**


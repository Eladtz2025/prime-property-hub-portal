

## ביקורת QA מעמיקה — ממצאים

### 1. באגים קריטיים

**1.1 הפנייה שבורה — `/property/:id` (שורה 167 ב-App.tsx)**
```
<Navigate to="/he/property/:id" replace />
```
הפרמטר `:id` לא מוחלף — המשתמש מגיע ל-`/he/property/:id` כטקסט literal. הפתרון: להשתמש ב-`RedirectWithParams` כמו בשורות 203-205.

**1.2 חסר דף Reset Password**
`src/lib/auth.ts` מפנה ל-`/auth/reset-password` אבל אין Route ואין Page לזה. משתמשים שילחצו "שכחתי סיסמה" לא יוכלו לאפס אותה.

**1.3 `profile.role` — Type mismatch ב-ProtectedRoute (שורה 69)**
```typescript
const userLevel = roleHierarchy[profile.role]; // profile.role is string | undefined
```
`profile.role` מוגדר כ-`string?` ב-`UserProfile`, אבל `roleHierarchy` מצפה ל-`UserRole`. אם `role` הוא `undefined`, ה-`userLevel` יהיה `undefined` וההשוואה `userLevel < requiredLevel` תחזיר `false` — **כל משתמש ללא role יקבל גישה**.

---

### 2. בעיות אבטחה

**2.1 Settings page ללא ProtectedRoute (שורה 250 ב-App.tsx)**
```tsx
<Layout onLogout={signOut}>
  <Settings />  // ← אין ProtectedRoute!
</Layout>
```
כל משתמש מאומת, גם ללא אישור, יכול לגשת להגדרות.

**2.2 WhatsApp Float מופיע בדפים שלא צריך**
הכפתור לא מוסתר ב:
- `/login`
- `/memorandum-form/*`
- `/exclusivity-form/*`
- `/broker-sharing-form/*`
- `/sale-memorandum-form/*`
- `/client-intake`
- `/owner-invitation`

---

### 3. קוד מת / Orphan files

**3.1 `ExclusiveListingPage.tsx`** — 1092 שורות, אין שום Route ב-App.tsx. קובץ מת.

**3.2 `src/lib/database.sql`** — מכיל סכמה ישנה עם `role` בתוך `profiles` (כבר הועבר ל-`user_roles`). עלול לבלבל.

---

### 4. ביצועים — AuthContext

**4.1 `refreshProfile` לא עטוף ב-`useCallback`**
הפונקציה נוצרת מחדש בכל render, מה שגורם לרכיבים שתלויים בה להתרנדר מחדש.

**4.2 `hasPermissionCheck` לא עטוף ב-`useCallback`**
אותה בעיה — כל ה-children של AuthProvider מתרנדרים מחדש.

**4.3 `value` object ב-AuthContext נוצר מחדש בכל render**
צריך `useMemo` על ה-value object.

---

### 5. חוסר עקביות

**5.1 תרגום תפקידים לא עקבי:**
- `AuthTestHelper.tsx`: `super_admin` = "מנהל על"
- `UserSettings.tsx`: `super_admin` = "מנהל ראשי"
- `LoginScreen.tsx`: `super_admin` = "מנהל עליון"

**5.2 `database.sql` ישן** — מגדיר `role` ב-profiles כ-`TEXT` עם `CHECK`, אבל המערכת בפועל משתמשת ב-`user_roles` table עם `app_role` enum.

---

### 6. Edge Functions

**6.1 `assign-properties-to-agents`** — מכיל hardcoded UUIDs עם הערה "one-time assignment". עדיין פעיל ונגיש.

---

### תוכנית תיקון (לפי עדיפות)

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | Fix `/property/:id` redirect → `RedirectWithParams` | `App.tsx` | קריטי |
| 2 | Fix `profile.role` undefined check ב-`ProtectedRoute` | `ProtectedRoute.tsx` | קריטי |
| 3 | הוסף `ProtectedRoute` ל-Settings | `App.tsx` | אבטחה |
| 4 | הוסף דף `/auth/reset-password` | חדש + `App.tsx` | פונקציונלי |
| 5 | הסתר WhatsApp Float מדפי טפסים ולוגין | `WhatsAppFloat.tsx` | UX |
| 6 | עטוף AuthContext ב-`useCallback`/`useMemo` | `AuthContext.tsx` | ביצועים |
| 7 | אחד תרגום תפקידים לקובץ משותף | constants + 3 קבצים | עקביות |
| 8 | מחק `ExclusiveListingPage.tsx` + עדכן `database.sql` | 2 קבצים | ניקיון |


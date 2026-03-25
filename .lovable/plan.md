

## ביקורת QA סיבוב 5 — אדמין פאנל (שמרני)

גישה: **תיקוני באגים והרשאות בלבד** — לא נוגעים בלוגיקה עסקית, לא משנים עיצוב, לא מפרקים קומפוננטות עובדות.

---

### 1. באג קריטי — ProtectedRoute חוסם property_owners מהפורטל שלהם

**חומרה: קריטי (שובר פיצ'ר)**

`ProtectedRoute.tsx` שורה 62: כשיש `requiredRole`, הקוד בודק אם המשתמש הוא `property_owner` ומחזיר "אין הרשאה" — **לפני** שהוא בודק אם ה-`requiredRole` הוא בדיוק `property_owner`.

המשמעות: `OwnerPortal` (שורה 12: `requiredRole="property_owner"`) ו-`OwnerFinancials` (שורה 7: `requiredRole="property_owner"`) חוסמים property_owners מהדפים שלהם עצמם.

**תיקון:** הוסף תנאי — אם `requiredRole === 'property_owner'` ו-`profile.role === 'property_owner'`, תעביר. אחרת חסום כרגיל.

---

### 2. ניווט מציג דפים שאין למשתמש הרשאה אליהם

**חומרה: בינונית (UX/אבטחה)**

**2.1 `EnhancedTopNavigation.tsx`** — כל פריטי הניווט מוצגים לכל המשתמשים:
- "סקאוט נדל"ן" דורש `manager` ב-route אבל מוצג לכולם
- "QA & DevOps" בתפריט המשתמש דורש `admin` אבל מוצג לכולם
- "הגדרות" דורש `manager` אבל מוצג לכולם

**2.2 `MobileBottomNavigation.tsx`** — "סקאוט" מוצג לכל המשתמשים.

**תיקון:** הוסף role filtering ב-`EnhancedTopNavigation` ו-`MobileBottomNavigation` בהתאם ל-role hierarchy (כפי שנעשה כבר ב-`TopNavigation.tsx` הישן).

---

### 3. תפריט המשתמש מציג role באנגלית

**חומרה: נמוכה (UX)**

`EnhancedTopNavigation.tsx` שורה 82: `{profile?.role}` מציג "super_admin" במקום "מנהל עליון". קיימת פונקציה `getRoleLabel` ב-`roleLabels.ts` שלא מנוצלת.

**תיקון:** `getRoleLabel(profile?.role)` במקום `profile?.role`.

---

### 4. כפל ProtectedRoute — AdminPropertyScout

**חומרה: נמוכה (ניקיון)**

`AdminPropertyScout.tsx` עוטף את עצמו ב-`<ProtectedRoute>` פנימי (שורה 286), בזמן ש-App.tsx כבר עוטף אותו ב-`requiredRole="manager"`. כפילות מיותרת (כמו שתיקנו ב-AdminControl בסיבוב 3).

**תיקון:** הסר את ה-ProtectedRoute הפנימי מ-AdminPropertyScout.

---

### 5. קוד מת

**חומרה: נמוכה (ניקיון)**

**5.1 `TopNavigation.tsx`** — לא מיובא מאף מקום (הוחלף ב-`EnhancedTopNavigation`).

**5.2 `src/components/_archived/personal-scout/`** — 2 קבצים ארכיוניים לא מיובאים.

---

### תוכנית תיקון

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | תקן ProtectedRoute — אפשר property_owner לגשת לדפי property_owner | `ProtectedRoute.tsx` | קריטי |
| 2 | הוסף role filtering לניווט (desktop + mobile + dropdown) | `EnhancedTopNavigation.tsx`, `MobileBottomNavigation.tsx` | בינונית |
| 3 | הצג role בעברית בתפריט המשתמש | `EnhancedTopNavigation.tsx` | נמוכה |
| 4 | הסר ProtectedRoute כפול מ-AdminPropertyScout | `AdminPropertyScout.tsx` | נמוכה |
| 5 | מחק קוד מת (TopNavigation + _archived) | 3 קבצים | נמוכה |

**5 תיקונים, ~6 קבצים. אפס שינויים בלוגיקה עסקית.**


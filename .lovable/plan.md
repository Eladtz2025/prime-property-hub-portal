

## ביקורת QA שנייה — ממצאים חדשים

### 1. SEO חסר — חמור

**1.1 דף דיזנגוף (עברית + אנגלית) ללא Helmet/SEO**
`src/pages/he/neighborhoods/Dizengoff.tsx` ו-`src/pages/en/neighborhoods/Dizengoff.tsx` — אין `<Helmet>`, אין `<HreflangMeta>`, אין Schema.org.
כל שאר דפי השכונות (רוטשילד, נווה צדק, פלורנטין, צפון ישן) כוללים SEO מלא. דיזנגוף חשוף ב-Google ללא title/description/canonical.

---

### 2. לינקים שבורים

**2.1 `Dashboard.tsx` — לינק `/admin/leads` לא קיים**
שורה 84: `navigate('/admin/leads')` — אין Route כזה. הנתיב הנכון הוא `/admin-dashboard/leads`.

**2.2 `BrokerageFormsList.tsx` + `BrokerageFormsListCompact.tsx` — `/brokerage-form/view/:id`**
אין Route ל-`/brokerage-form/view/:id` ב-App.tsx. קיימים רק `/brokerage-form/new` ו-`/brokerage-form/:token`. לחיצה על "צפה" בטופס תיווך תוביל ל-404 או ל-LoginScreen.

**2.3 `Footer.tsx` (הישן) — לינקים ל-`/rentals`, `/sales`, `/management`**
`src/components/Footer.tsx` (שורות 45-57) משתמש ב-`<Link to="/rentals">` וכו' — אלה כבר redirects ולא נתיבים ישירים. עדיף לעדכן ל-`/he/rentals` ישירות כדי לחסוך redirect מיותר. (הפוטרים החדשים `he/Footer.tsx` ו-`en/Footer.tsx` כבר נכונים.)

---

### 3. אבטחה — הרשאות

**3.1 כל ה-admin routes משתמשים ב-`requiredRole="viewer"`**
כל דף admin (כולל import-data, devops, property-scout, settings, admin-control) דורש רק `viewer`. משמעות: כל משתמש מאושר עם role "viewer" יכול לגשת ל-import data, devops, property scout, price offers, ו-marketing hub.

`AdminControl.tsx` כן מוסיף שכבת הגנה פנימית (`requiredRole="admin"`) אבל כל שאר הדפים חשופים לגמרי.

**דפים רגישים שצריכים הרשאה גבוהה יותר:**
- `/admin-dashboard/import-data` → `manager`+
- `/admin-dashboard/devops` → `admin`+
- `/admin-dashboard/property-scout` → `manager`+
- `/admin-dashboard/settings` → `manager`+

---

### 4. קוד מת

**4.1 תיקיית `src/_to_delete/`** — 3 קבצים: `AvailabilityActions.tsx`, `BackfillStatus.tsx`, `useBackfillProgress.ts`. לא מיובאים מאף מקום ב-App. קוד מת.

**4.2 `src/components/Footer.tsx`** — הפוטר הישן. בדוק אם הוא עדיין בשימוש מאיזשהו דף.

---

### 5. UX — property_owner ב-ProtectedRoute

**5.1 `property_owner` level = 1 = `viewer` level**
ב-`ProtectedRoute`, `property_owner` ו-`viewer` שניהם ברמה 1. זה אומר ש-property_owner עובר את הבדיקה `requiredRole="viewer"` ויכול לגשת לכל דפי ה-admin. כנראה לא מכוון.

---

### תוכנית תיקון

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | הוסף SEO מלא לדיזנגוף (HE + EN) | `he/neighborhoods/Dizengoff.tsx`, `en/neighborhoods/Dizengoff.tsx` | SEO קריטי |
| 2 | תקן `/admin/leads` → `/admin-dashboard/leads` | `Dashboard.tsx` | לינק שבור |
| 3 | תקן `/brokerage-form/view/:id` — הוסף Route או שנה ללינק תקין | `App.tsx` או `BrokerageFormsList.tsx` | לינק שבור |
| 4 | העלה הרשאות לדפים רגישים (devops→admin, import/scout/settings→manager) | `App.tsx` | אבטחה |
| 5 | הפרד `property_owner` מהיררכיית הרשאות admin (בדיקה ייעודית) | `ProtectedRoute.tsx` | אבטחה |
| 6 | עדכן `Footer.tsx` הישן ללינקים `/he/` | `Footer.tsx` | ביצועים |
| 7 | מחק תיקיית `_to_delete` | 3 קבצים | ניקיון |

**7 תיקונים, ~10 קבצים**



# תיקון גישת צופה (viewer) לכל העמודים

## הבעיה

ה-`ProtectedRoute` משתמש בהיררכיית תפקידים (viewer=1, manager=2, admin=3) ולא בודק את טבלת `permissions`. כמעט כל הנתיבים מוגדרים עם `requiredRole="admin"` (רמה 3), אז הצופה (רמה 1) רואה "אין הרשאה" בכל עמוד.

ההרשאות שהוספנו ל-DB בשלב הקודם (viewer → read) רלוונטיות רק להסתרת כפתורי עריכה/מחיקה ב-UI, אבל לא משפיעות על גישה לדפים עצמם.

## הפתרון

לשנות את `requiredRole` בכל הנתיבים ב-`App.tsx` מ-`"admin"` ל-`"viewer"`, כדי שהצופה יוכל לגשת לכל העמודים. ההגנה על פעולות כתיבה כבר קיימת ב-2 רמות:
1. **UI** -- כפתורי עריכה/מחיקה מוסתרים כשאין הרשאת update/delete (בדיקת `hasPermission`)
2. **DB** -- RLS מונע כתיבה ברמת הדאטאבייס

## שינויים

### קובץ יחיד: `src/App.tsx`

שינוי `requiredRole` ב-**כל** הנתיבים שכרגע דורשים `"admin"` או `"manager"`:

| נתיב | לפני | אחרי |
|-------|-------|-------|
| `/admin-dashboard` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/customers` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/properties` | `requiredRole="manager"` | `requiredRole="viewer"` |
| `/admin-dashboard/admin-control` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/import-data` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/import-from-storage` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/whatsapp` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/all-features` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/forms` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/price-offers` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/price-offers/create` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/price-offers/edit/:id` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/pitch-decks` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/pitch-decks/new` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/pitch-decks/:id` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin/alerts` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin/activity` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/leads` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/devops` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/photo-studio` | `requiredRole="admin"` | `requiredRole="viewer"` |
| `/admin-dashboard/property-scout` | `requiredRole="manager"` | `requiredRole="viewer"` |

## מה לא משתנה

- ההרשאות ב-DB (permissions) נשארות כפי שהן -- הצופה יראה את העמודים אבל כפתורי עריכה/מחיקה יישארו מוסתרים
- RLS policies ב-DB מונעות כתיבה לא מורשית
- הניווט (EnhancedTopNavigation) לא דורש שינוי -- הוא כבר מציג את כל הטאבים לכל משתמש מחובר

## סיכום

- קובץ אחד לעדכון (`App.tsx`)
- 21 שינויים של `requiredRole` מ-admin/manager ל-viewer
- ללא שינויי DB
- הצופה יוכל לנווט לכל עמוד, אבל לא יוכל לבצע שום פעולת כתיבה



## ביקורת QA סיבוב 3 — ממצאים חדשים

### 1. CSS Class שגוי — דפים עבריים עם `english-luxury`

**חומרה: בינונית (UX/סגנון)**

4 דפים עבריים משתמשים ב-class `english-luxury` במקום `hebrew-luxury`:
- `src/pages/Rentals.tsx` — שורה 156
- `src/pages/Sales.tsx` — שורה 130
- `src/pages/Management.tsx` — שורה 61
- `src/pages/PropertyDetailPage.tsx` — שורה 154

כל שאר הדפים העבריים (Index, About, Contact, Neighborhoods, כל השכונות) משתמשים ב-`hebrew-luxury`. ייתכן שזה גורם להבדלי סגנון עדינים.

---

### 2. VideoHero עברי — לינקים ללא prefix `/he/`

**חומרה: נמוכה (עובד דרך redirect אבל מיותר)**

`src/components/he/VideoHero.tsx` שורות 64, 70:
```tsx
navigate("/rentals")  // → redirect ל-/he/rentals
navigate("/sales")    // → redirect ל-/he/sales
```
עובד כי יש redirects ב-App.tsx, אבל גורם ל-redirect מיותר. צריך להיות `/he/rentals` ו-`/he/sales` ישירות.

---

### 3. NotFound.tsx — לינק שגוי לדף הבית

**חומרה: בינונית (UX)**

`src/pages/NotFound.tsx` שורה 48:
```tsx
<Link to="/en">חזרה לדף הבית</Link>
```
דף ה-404 הוא בעברית (dir="rtl", כל הטקסטים בעברית) אבל הכפתור "חזרה לדף הבית" מפנה ל-`/en` במקום `/he`. משתמש עברי שמגיע ל-404 מועבר לאתר האנגלי.

---

### 4. קוד מת — TestHeroPage + HeaderTest

**חומרה: נמוכה (ניקיון)**

- `src/pages/TestHeroPage.tsx` — דף טסט בלבד, חשוף ב-production (`/he/herotest`)
- `src/components/he/HeaderTest.tsx` — קומפוננטה לא בשימוש מחוץ ל-TestHeroPage

שניהם קוד פיתוח שנשאר ב-production.

---

### 5. `admin-control` — כפל ProtectedRoute

**חומרה: נמוכה (ניקיון)**

`App.tsx` שורה 265: `requiredRole="viewer"` 
`AdminControl.tsx` שורה 7: `requiredRole="admin"` (פנימי)

ה-ProtectedRoute החיצוני מיותר — AdminControl כבר מגן על עצמו. עדיף להעלות ל-`admin` ב-App.tsx (כמו שנעשה ל-devops) ולהסיר את הכפילות הפנימית.

---

### 6. `import-from-storage` — הרשאת `viewer` בלבד

**חומרה: בינונית (אבטחה)**

`App.tsx` שורה 285: `/admin-dashboard/import-from-storage` דורש רק `viewer`. זהו דף ייבוא נתונים (כמו import-data שכבר הועלה ל-`manager`). צריך להיות `manager` גם כאן.

---

### 7. SEO — חסר `og:image` ברוב הדפים

**חומרה: בינונית (SEO)**

רק דפי PropertyDetail כוללים `og:image`. כל שאר הדפים (Index, Rentals, Sales, Management, Neighborhoods, About, Contact) חסרים `og:image` — מה שאומר ששיתוף בפייסבוק/ווטסאפ לא יציג תמונה.

---

### תוכנית תיקון

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | שנה `english-luxury` → `hebrew-luxury` ב-4 דפים עבריים | `Rentals.tsx`, `Sales.tsx`, `Management.tsx`, `PropertyDetailPage.tsx` | סגנון |
| 2 | תקן VideoHero: `/rentals` → `/he/rentals`, `/sales` → `/he/sales` | `he/VideoHero.tsx` | ביצועים |
| 3 | תקן NotFound: `/en` → `/he` | `NotFound.tsx` | UX |
| 4 | הסר TestHeroPage + HeaderTest + Route | `App.tsx`, `TestHeroPage.tsx`, `HeaderTest.tsx` | ניקיון |
| 5 | העלה admin-control ל-`admin` + הסר ProtectedRoute פנימי | `App.tsx`, `AdminControl.tsx` | ניקיון |
| 6 | העלה import-from-storage ל-`manager` | `App.tsx` | אבטחה |
| 7 | הוסף `og:image` לכל הדפים הציבוריים (HE + EN) | ~15 קבצים | SEO |

**7 תיקונים, ~20 קבצים**




## שלושה תיקונים

### 1. הדר + אלמנטים כחולים → אפור כהה מקצועי
**`src/index.css`**: שינוי `--primary` מ-`210 100% 45%` (כחול) ל-`220 15% 28%` (אפור כהה מקצועי). גם עדכון `--primary-deep`, `--primary-light`, `--ring`, `--accent` וה-gradients בהתאם.

> שינוי זה ישפיע על כל מה שכחול באדמין — הדר, כפתורים, אייקונים וכו'.

### 2. תיקון קוביות הטפסים (DashboardFormsCubes)
**`src/components/DashboardFormsCubes.tsx`**: הקוביות משתמשות ב-`bg-white/15 text-white` — מה שנכתב עבור רקע צבעוני. עכשיו שהן על רקע לבן של הדשבורד, צריך לשנות אותן ל:
- `bg-primary text-primary-foreground` (או אפור כהה עם טקסט לבן)
- הבאדג'ים ישתנו בהתאם

### 3. החלפת אווטר באות → טקסט "שלום אלעד" + חץ
**`src/components/EnhancedTopNavigation.tsx`**: הסרת קומפוננטת `UserAvatar` מה-dropdown trigger והחלפתה בטקסט `שלום {firstName}` בצבע `text-primary-foreground` + אייקון `ChevronDown`.

### קבצים לעריכה
- `src/index.css` — שינוי צבע primary לאפור כהה
- `src/components/DashboardFormsCubes.tsx` — תיקון סגנון הקוביות
- `src/components/EnhancedTopNavigation.tsx` — טקסט במקום אווטר
- `src/components/Layout.tsx` — הסרת הברכה מההדר (כי היא תהיה בדרופדאון)


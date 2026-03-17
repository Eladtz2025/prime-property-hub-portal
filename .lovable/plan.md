

## 4 תיקונים בהדר ובקוביות

### 1. אפור כהה יותר — `src/index.css`
שינוי `--primary` מ-`220 15% 28%` ל-`220 20% 18%` (כהה יותר, מקצועי). עדכון `--primary-deep` ל-`220 20% 12%` וה-gradients בהתאם.

### 2. קוביות טפסים עם blur שקוף — `src/components/DashboardFormsCubes.tsx`
שינוי `cubeBase` (שורה 110) מ-`bg-primary text-primary-foreground` ל:
`bg-white/10 backdrop-blur-md text-foreground border border-white/20 shadow-lg hover:bg-white/20`
זה ייתן את אפקט הזכוכית (glassmorphism) על רקע הדשבורד.

### 3. אמוג׳י 👋 + תאריך מתחת לשלום — `src/components/EnhancedTopNavigation.tsx` + `src/components/Layout.tsx`
- בכפתור הדרופדאון (שורה 63): שינוי ל-`👋 שלום {firstName}` ומתחתיו התאריך בגודל קטן
- ב-Layout: הסרת התאריך מהצד הימני (כי הוא עובר לצד שמאל עם הברכה). נעביר את `today` כ-prop ל-`EnhancedTopNavigation`

### 4. הסרת "City Market" מההדר — `src/components/Layout.tsx`
הסרת הטקסט `City Market` והתאריך מהצד הימני. נשאיר רק את האייקון/לוגו.

### קבצים לעריכה
- `src/index.css` — צבע primary כהה יותר
- `src/components/DashboardFormsCubes.tsx` — סגנון blur שקוף
- `src/components/EnhancedTopNavigation.tsx` — אמוג׳י + תאריך מתחת לברכה
- `src/components/Layout.tsx` — הסרת "City Market", העברת today כ-prop


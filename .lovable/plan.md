

## החלפת Goals בקוביות טפסים + הסרת טאב טפסים

### מה ישתנה

#### 1. קומפוננטה חדשה: `src/components/DashboardFormsCubes.tsx`
- מכילה את כל הלוגיקה מ-`AdminForms.tsx` — actionCubes, fetchCounts, popovers, dialogs
- מותאמת לסגנון הכחול של ההדר: `bg-white/15 backdrop-blur-lg`, אייקונים וטקסט בלבן, badges שקופים
- גריד responsive: 5 עמודות בדסקטופ, 2 במובייל
- כוללת את 2 כפתורי הלינק (לקוח + אנשי מקצוע) ו-8 קוביות הפעולה

#### 2. `src/components/Dashboard.tsx`
- שורות 17, 77-80: החלפת `DashboardGoalsGrid` ב-`DashboardFormsCubes`

#### 3. `src/components/MobileDashboard.tsx`
- שורה 76: החלפת `DashboardGoalsGrid columns="grid-cols-2"` ב-`DashboardFormsCubes`

#### 4. הסרת טאב טפסים מהניווט
- `src/components/EnhancedTopNavigation.tsx` שורה 32: הסרת שורת "טפסים"
- `src/components/MobileBottomNavigation.tsx` שורה 30: הסרת שורת "טפסים"
- `src/App.tsx`: הסרת ה-route של `/admin-dashboard/forms` + ה-redirect
- `src/components/ui/breadcrumb-nav.tsx` שורה 28: הסרת הערך
- `src/pages/PitchDeckBuilder.tsx` שורה 319: שינוי ה-navigate ל-`/admin-dashboard` במקום `/admin-dashboard/forms`

#### 5. ניקוי קבצים שלא נצטרכים יותר
- הסרת `src/pages/AdminForms.tsx`
- הסרת `src/components/DashboardGoalsGrid.tsx`
- הסרת `src/hooks/useDashboardGoals.ts`

### מה לא ישתנה
- כל קומפוננטות הרשימה (BrokerageFormsMobileList, LegalFormsList, etc.) — נשארות
- הטפסים עצמים (/brokerage-form, /memorandum-form, etc.) — נשארים
- טבלת dashboard_goals בסופאבייס — נשארת (לא מוחקים דאטה)




## החלפת כרטיסיות הסטטיסטיקה במטרות (Goals) בהדר הכחול

### מה ישתנה
הכרטיסיות הקטנות שבתוך הבאנר הכחול בדשבורד (סה"כ נכסים, הכנסה חודשית, תפוסים, פנויים, נוצר קשר, טרם קשר) יוחלפו בכרטיסיות מטרות חופשיות שניתן לערוך.

### איך זה יראה
- בתוך הבאנר הכחול, במקום 6 כרטיסיות סטטיסטיקה, יופיעו כרטיסיות מטרות
- כל כרטיסיה תציג את טקסט המטרה בפונט לבן וגדול
- כפתור עריכה (עיפרון) וכפתור מחיקה (X) מופיעים בhover
- כפתור + להוספת מטרה חדשה (עד 6 מטרות)
- עובד גם בדסקטופ וגם במובייל (grid של 2 עמודות במובייל)

### שינויים טכניים

**1. טבלה חדשה `dashboard_goals` ב-Supabase**
- `id` (uuid), `title` (text), `position` (integer), `created_by` (uuid), timestamps
- RLS: קריאה לכל authenticated, כתיבה/עדכון/מחיקה ל-admin/super_admin/manager
- טריגר לעדכון אוטומטי של updated_at

**2. הוק חדש `src/hooks/useDashboardGoals.ts`**
- פונקציות CRUD: fetchGoals, addGoal, updateGoal, deleteGoal
- שימוש ב-Supabase client ישירות

**3. קומפוננטה חדשה `src/components/DashboardGoalsGrid.tsx`**
- מציגה מטרות בכרטיסיות שקופות (bg-white/15 backdrop-blur-lg)
- אייקון Target ליד כל מטרה
- מצב עריכה inline עם Input
- כרטיסיית "הוסף מטרה" עם border-dashed

**4. עדכון `src/components/Dashboard.tsx`**
- הסרת imports לא נדרשים (Building, Users, CheckCircle, Clock, Phone, TrendingUp, Edit2)
- הסרת state של manualMonthlyIncome ו-isEditingIncome
- החלפת 6 כרטיסיות הסטטיסטיקה (שורות 106-195) ב-DashboardGoalsGrid

**5. עדכון `src/components/MobileDashboard.tsx`**
- אותו שינוי: הסרת כרטיסיות הסטטיסטיקה והחלפה ב-DashboardGoalsGrid עם columns="grid-cols-2"
- הסרת state של manualMonthlyIncome ו-isEditingIncome

### מה לא ישתנה
- הברכה (שלום + שם) נשארת
- העיצוב הכללי של הבאנר הכחול נשאר
- כל שאר הדשבורד נשאר כמו שהוא



# איחוד לדשבורד בדיקות מאוחד (2 טאבים בלבד)

## מבנה חדש

המבנה הנוכחי של 4 טאבים:
**דירות שנמצאו | הגדרות | היסטוריית ריצות | בדיקות זמינות**

יהפוך ל-**2 טאבים בלבד**:
- **דירות שנמצאו** (נשאר כמו שהוא)
- **דשבורד בדיקות** (מאחד את: בדיקות זמינות + היסטוריית ריצות + הגדרות)

---

## מה יכלול "דשבורד בדיקות"

עמוד אחד עשיר עם הסקציות הבאות מלמעלה למטה:

### 1. כרטיסי סטטיסטיקה (שורה עליונה)
הכרטיסים הקיימים מבדיקות זמינות (ממתינים, נבדקו היום, Timeouts, אקטיביים, ריצה אחרונה) + כרטיסים חדשים עבור כפילויות, התאמות, ו-Backfill.

### 2. ריצה חיה (Live Feed)
כשיש ריצה פעילה - פיד חי עם פרטי הנכס (מחיר, חדרים, מקור, כתובת, תוצאה). משודרג מהמצב הקיים.

### 3. פעולות מהירות (Quick Actions)
הפעל בדיקת זמינות, אפס Timeouts, בדוק URL, הפעל Dedup, הפעל Matching.

### 4. טאבים פנימיים (Sub-Tabs)
- **היסטוריית סריקות** - הקומפוננטה הקיימת של `ScoutRunHistory` (מקובצת לפי יום/שעה)
- **בדיקות זמינות** - היסטוריית ריצות בדיקת זמינות + תוצאות אחרונות (מהדשבורד הקיים)
- **כפילויות** - סטטוס ריצת dedup אחרונה, כמה כפילויות נמצאו
- **התאמות** - סטטוס matching, כמה התאמות חדשות
- **Backfill** - סטטוס backfill, כמה נכסים עודכנו

כל סוג בדיקה מציג: ריצה אחרונה, היסטוריית 10 ריצות, כפתור "הפעל עכשיו".

### 5. הגדרות (Collapsible בתחתית)
`UnifiedScoutSettings` + הגדרות Availability כ-Collapsible sections.

---

## פרטים טכניים

### קבצים שישתנו:

1. **`src/pages/AdminPropertyScout.tsx`**
   - הסרת טאבים: settings, history, availability
   - 2 טאבים בלבד: properties + dashboard
   - אייקון Activity לטאב "דשבורד בדיקות"

2. **קומפוננטה חדשה: `src/components/scout/ChecksDashboard.tsx`**
   - מאחדת את הכל בעמוד אחד
   - כרטיסי סטטיסטיקה מורחבים (מ-`AvailabilityCheckDashboard`)
   - Live Feed (מ-`AvailabilityLiveFeed`)
   - Quick Actions (מ-`AvailabilityActions`)
   - Sub-tabs פנימיים: כולל `ScoutRunHistory` כטאב פנימי
   - הגדרות Collapsible בתחתית (כולל `UnifiedScoutSettings`)

3. **קומפוננטות חדשות:**
   - `src/components/scout/checks/ChecksSubTabs.tsx` - מנהל טאבים פנימיים
   - `src/components/scout/checks/DeduplicationStatus.tsx` - סטטוס dedup
   - `src/components/scout/checks/MatchingStatus.tsx` - סטטוס matching
   - `src/components/scout/checks/BackfillStatus.tsx` - סטטוס backfill

4. **`src/components/scout/availability/AvailabilityLiveFeed.tsx`** - שדרוג
   - הצגת פרטים נוספים לכל נכס (מחיר, חדרים, קומה, שכונה)

### מקורות נתונים (ללא שינויי DB):
- **Dedup**: טבלת `duplicate_alerts`
- **Matching**: טבלת `personal_scout_runs`
- **Backfill**: טבלת `backfill_progress`
- **Availability**: טבלת `availability_check_runs` (קיים)
- **סריקות**: טבלת `scout_runs` (קיים - `ScoutRunHistory`)

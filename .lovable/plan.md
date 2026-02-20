
## החלפת כל הקריאות הידניות ל-Jina

### הבעיה
כל הבדיקות הידניות (כפתור "בדוק זמינות" בטבלה, בדשבורד, ובפעולות מהירות) קוראות ל-`check-property-availability` שמשתמש ב-Firecrawl. מפתחות ה-Firecrawl מותשים (שגיאת 402), ולכן הבדיקה נכשלת ומחזירה "אקטיבי" כברירת מחדל.

### הפתרון
החלפת שם ה-Edge Function מ-`check-property-availability` ל-`check-property-availability-jina` ב-4 קבצים:

### שינויים

**1. `src/components/scout/ScoutedPropertiesTable.tsx`** (2 מקומות)
- שורה 794: `check-property-availability` -> `check-property-availability-jina`
- שורה 833: `check-property-availability` -> `check-property-availability-jina`

**2. `src/components/scout/AvailabilityCheckDashboard.tsx`** (מקום 1)
- שורה 205: `check-property-availability` -> `check-property-availability-jina`

**3. `src/components/scout/checks/AvailabilityHistorySection.tsx`** (מקום 1)
- שורה 131: `check-property-availability` -> `check-property-availability-jina`

**4. `src/components/scout/availability/AvailabilityActions.tsx`** (מקום 1)
- שורה 69: `check-property-availability` -> `check-property-availability-jina`

סה"כ 5 החלפות פשוטות של שם הפונקציה. אין שינוי במבנה הבקשה או בפרמטרים - הפורמט זהה בשתי הגרסאות.

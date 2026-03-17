

## הסרת כרטיסיות + סידור שורה אחת עם גלילה

### שינויים

**`src/components/Dashboard.tsx` (דסקטופ):**
- הסרת שורה 88-97: `PriorityTasksCard` (daily + weekly) + `UpcomingAppointmentsCard` מהגריד הנוכחי
- הסרת שורה 99-103: `SiteIssuesCard` + `DevelopmentIdeasCard`
- במקומם — שורה אחת עם 3 כרטיסיות: פגישות קרובות, רעיונות לפיתוח, פניות מהאתר
- כל כרטיסיה תקבל `max-h-[320px] overflow-y-auto` בתוך ה-CardContent כדי להגביל ל~5 שורות עם גלילה
- גריד: `grid-cols-1 md:grid-cols-3`
- הסרת imports של `PriorityTasksCard`, `SiteIssuesCard`

**`src/components/MobileDashboard.tsx` (מובייל):**
- הסרת שורות 80-82: שני ה-`PriorityTasksCard`
- הסרת שורות 100-101: `SiteIssuesCard`
- שלוש הכרטיסיות הנותרות (פגישות, רעיונות, פניות) יוצגו אחת מתחת לשנייה עם אותה הגבלת גובה וגלילה

### קבצים
- **עריכה:** `Dashboard.tsx`, `MobileDashboard.tsx`
- **ללא מחיקה** של קומפוננטות (PriorityTasksCard, SiteIssuesCard נשארות קיימות למקרה שיצטרכו בעתיד)


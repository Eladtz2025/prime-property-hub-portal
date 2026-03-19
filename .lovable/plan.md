

## תיקוני מובייל בלבד

כל השינויים משפיעים **רק על מובייל** — דסקטופ לא נוגעים.

### 1. הסרת סיכום נכסים מהדשבורד במובייל
**`src/components/MobileDashboard.tsx`**
- הסרת שורה 72: `<AnalyticsSummaryCard stats={stats} />` — הכרטיס הזה לא נחוץ במובייל

### 2. עדכון טאבים תחתונים
**`src/components/MobileBottomNavigation.tsx`**
- הסרת "פניות" מה-mainNavItems
- העברת "סקאוט נדל״ן" מ-moreNavItems ל-mainNavItems
- הסרת "הגדרות" מ-moreNavItems
- מכיוון שלא נשאר כלום ב-moreNavItems — הסרת כפתור "עוד" (Sheet) לגמרי

הטאבים החדשים יהיו: **לוח בקרה · נכסים · לקוחות · סקאוט**


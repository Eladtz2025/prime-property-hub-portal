

## רקע כהה לדשבורד — הכרטיסים נשארים לבנים מבפנים

### עיקרון

רק **רקע העמוד** משתנה לצבע ההדר (`bg-primary`). כל כרטיס/סקשן נשאר לבן מבפנים — בלי שום שינוי לתוכן הפנימי שלו.

### שינויים

**`src/components/Dashboard.tsx`**
- הסרת 3 ה-wrappers הכהים (`bg-primary rounded-xl p-2 shadow-lg`)
- הוספת `bg-primary` + margin שלילי/padding על ה-div הראשי כדי לכסות את כל רקע העמוד
- הוספת `border border-white/20` לכרטיסים כדי שהמסגרת תיראה טוב על רקע כהה

**`src/components/DashboardFormsCubes.tsx`**
- הקוביות כבר בסגנון glassmorphism (`bg-white/10`) אז רק צריך לוודא שהטקסט לבן (`text-white`)

**`src/components/ActivePropertiesCard.tsx`**
- הוספת `border-white/20` לכרטיס החיצוני

### מה לא משתנה
- **כל תוכן פנימי** של כל כרטיס נשאר לבן — אין שינוי ל-UpcomingAppointmentsCard, DevelopmentIdeasCard, או ContactLeadsListCompact מבפנים
- עמודים אחרים לא מושפעים
- מובייל דשבורד לא מושפע


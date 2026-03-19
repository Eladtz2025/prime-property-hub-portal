

## העברת לוח זמנים לטאב במוניטור + הסרת כרטיסיות

### מה נעשה
1. **הוספת טאב "לוח זמנים"** למוניטור החי (LiveMonitor) — עם אייקון Clock ותוכן לוח הזמנים (NextRunCard + טבלת סריקות/ריצות)
2. **הסרת טאב "הכל"** מהמוניטור
3. **הסרת `<ScheduleSummaryCard />`** מ-ChecksDashboard (מסיר גם את "פעולות אחרונות" וגם את "לוח זמנים")

### שינויים בקבצים

**1. `src/components/scout/checks/LiveMonitor.tsx`**
- הסרת הטאב `all` ממערך הטאבים
- הוספת טאב `schedule` עם אייקון `Clock`
- שינוי ברירת המחדל של `activeTab` ל-`availability` (או `schedule`)
- בתוך ה-body: כשהטאב הפעיל הוא `schedule`, להציג את תוכן לוח הזמנים (NextRunCard + שתי העמודות סריקות/ריצות)
- חילוץ הלוגיקה של לוח הזמנים מ-`ScheduleSummaryCard` (ה-hooks של `useScoutSettings`, `scout_configs`, חישוב `groupedByTime`, `nextGroup`, `scanGroups`, `otherGroups`) — או ייבוא כ-sub-component

**2. `src/components/scout/ChecksDashboard.tsx`**
- הסרת `<ScheduleSummaryCard />` (שורה 598) וה-import שלו (שורה 13)

**3. `src/components/scout/ScheduleSummaryCard.tsx`**
- חילוץ חלק לוח הזמנים (NextRunCard, ScheduleRow, הלוגיקה של scheduleItems/groupedByTime) ל-component נפרד שניתן לייבא מתוך LiveMonitor — למשל `ScheduleContent`
- ה-component הראשי (`ScheduleSummaryCard`) יישאר בקובץ אבל לא ייובא יותר (או יימחק)

### התוצאה
- המוניטור יכיל 6 טאבים: זמינות, סריקה, השלמה, כפילויות, התאמות, **לוח זמנים**
- לוח הזמנים יוצג בתוך ה-body של המוניטור בעיצוב הדארק שלו
- הכרטיסייה הכפולה של "לוח זמנים + פעולות אחרונות" תוסר מהדשבורד


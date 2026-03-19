

## תיקון: העברת כל שאילתות ההתאמות מ-`personal_scout_runs` ל-`scout_runs`

### הבעיה
4 מקומות בקוד קוראים מטבלה ישנה (`personal_scout_runs`) שלא מתעדכנת מאז 28/01. ההתאמות רצות כל יום בהצלחה אבל נרשמות ב-`scout_runs` עם `source = 'matching'`.

### מה ישתנה

**1. `useMonitorData.ts`** — מוניטור חי
- שאילתת `lastMatchRun`: תעבור ל-`scout_runs` עם `.eq('source', 'matching')`
- `dailyRunsHealth`: יתבסס על `started_at` במקום `created_at`

**2. `MatchingStatus.tsx`** — היסטוריית התאמות
- תשלוף 10 ריצות אחרונות מ-`scout_runs` עם `source = 'matching'`
- מיפוי שדות: `properties_found` במקום `leads_completed`, `leads_matched` במקום `total_matches`
- עמודות הטבלה: "נכסים שעובדו" ו"התאמות" במקום "לידים" ו"התאמות"

**3. `AdminPropertyScout.tsx`** — סטטיסטיקת סיכום
- שאילתת `matchStats`: תעבור ל-`scout_runs` עם `source = 'matching'`
- שדה `leads_matched` במקום `total_matches`

**4. `ChecksDashboard.tsx`** — דשבורד בדיקות
- אותו שינוי כמו AdminPropertyScout
- מיפוי: `leads_matched`, `properties_found`, `started_at`/`completed_at`

### תוצאה
- המוניטור יציג 4/4 ריצות יומיות (במקום 3/4)
- היסטוריית ההתאמות תציג את הריצות האמיתיות מכל יום
- כל הנתונים יגיעו מהמקור הנכון והעדכני


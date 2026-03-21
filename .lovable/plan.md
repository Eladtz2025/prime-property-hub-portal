
## עדכון כרטיס ההתאמות הראשי (ProcessCard)

### בעיה
ה-4 כרטיסים החדשים (ממתינים, לקוחות, עברו התאמה, ללא התאמות) נמצאים רק בדיאלוג ההיסטוריה. הכרטיס הראשי (`ProcessCard`) עדיין מציג את הנתונים הישנים: "531 התאמות אחרונות" + "43 ממתינים להתאמה".

### פתרון — עדכון ה-ProcessCard props

**`ChecksDashboard.tsx`**, שורות 533-541 — שינוי ה-props של ProcessCard:

- **primaryValue**: במקום `matchStats?.leads_matched` (531) → מספר הנכסים שממתינים להתאמה (צריך שאילתה חדשה ל-`scouted_properties` עם `status='new'` ו-`is_active=true`)
- **primaryLabel**: "ממתינים להתאמה" (במקום "התאמות אחרונות")
- **secondaryLine**: `"43 לידים פעילים | 31 עם התאמות"` — מידע על לידים
- **insight**: `"12 לידים ללא התאמות"` אם יש כאלה, או `"כל הלידים הותאמו ✓"` אם כולם עם התאמות
- **insightType**: `warning` אם יש ללא התאמות, `ok` אם כולם הותאמו

### שינויים טכניים

**`ChecksDashboard.tsx`**:
1. הוספת שאילתה חדשה לספירת נכסים `status='new'` + `is_active=true` (כמו ב-MatchingStatus)
2. הוספת שאילתה לספירת לידים עם/בלי התאמות (דומה ל-MatchingStatus — שליפת `matched_leads` וחיתוך עם eligible leads)
3. עדכון 4 ה-props של ProcessCard בשורות 537-541

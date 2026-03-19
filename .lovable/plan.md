

## תיקון "איך זה עובד" בכרטיסיות הדשבורד

### הבעיה שנמצאה
**בסריקות יש כפל**: כשפותחים את ההגדרות של כרטיסיית "סריקות", מוצגים **שני** בלוקים של "איך זה עובד?" — אחד מה-`ProcessCard` (שורות 440-443 ב-ChecksDashboard) ואחד מתוך `UnifiedScoutSettings` (שורות 261-271) שנטען בתוכו. שניהם מוצגים אחד מתחת לשני.

### מה צריך לתקן

**1. סריקות — הסרת הכפל**
- **להסיר** את `ScanLogicDescription` מתוך `UnifiedScoutSettings.tsx` (שורות 261-271 + השימוש בו)
- **לעדכן** את ה-`LogicDescription` ב-`ChecksDashboard.tsx` (שורות 440-443) כך שיכלול את כל המידע הרלוונטי במקום אחד:
  - סורק דירות מ-יד2, מדלן והומלס באמצעות Jina AI Reader
  - כל קונפיגורציה רצה בנפרד, דף אחרי דף
  - דירות חדשות נשמרות, קיימות מתעדכנות
  - כפילויות מאותו מקור נחסמות אוטומטית

**2. סקירת שאר הכרטיסיות — תקינות**
- ✅ **בדיקת זמינות** — תקין: HEAD check + Jina scan, מדויק
- ✅ **כפילויות** — תקין: cross-source, קריטריונים, Winner hierarchy
- ✅ **התאמות** — תקין: eligible leads, קריטריוני התאמה, שמירה ב-personal_scout_matches
- ✅ **השלמת נתונים** — תקין: משלים נתונים חסרים עם Jina

### קבצים לשינוי
1. **`src/components/scout/ChecksDashboard.tsx`** — עדכון LogicDescription של סריקות (מיזוג 2 הבלוקים לאחד)
2. **`src/components/scout/UnifiedScoutSettings.tsx`** — הסרת `ScanLogicDescription` component והשימוש בו


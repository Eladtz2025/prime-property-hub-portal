

## פתיחת רשימת נכסים ממתינים בלחיצה על המספר בכרטיסית בדיקת זמינות

### מה ייבנה
לחיצה על המספר הגדול (1,290) בכרטיסית "בדיקת זמינות" תפתח דיאלוג עם טבלה מלאה של כל הנכסים הממתינים לבדיקה, כולל שורת חיפוש חופשי (כתובת, עיר, מקור).

### שינויים טכניים

**1. ProcessCard.tsx — הוספת prop ללחיצה על המספר**
- הוספת `onPrimaryClick?: () => void` ל-`ProcessCardProps`
- עטיפת המספר הגדול ב-`button` עם cursor-pointer ו-hover effect כשה-prop קיים

**2. קומפוננטה חדשה: `PendingPropertiesDialog.tsx`**
- דיאלוג עם טבלה שמציגה את כל הנכסים מתוצאות ה-RPC `get_properties_needing_availability_check`
- שורת חיפוש שמסננת לפי כתובת, עיר, או מקור (client-side filter)
- עמודות: כתובת, עיר, חדרים, קומה, מחיר, מקור, נבדק לאחרונה
- ממוין לפי תאריך בדיקה אחרון (ישנים קודם)
- קריאה ל-RPC עם limit גדול (למשל 5000) עם הנתונים המלאים (לא head: true)

**3. ChecksDashboard.tsx — חיבור**
- state לפתיחת הדיאלוג
- העברת `onPrimaryClick` לכרטיסית בדיקת זמינות
- רינדור `PendingPropertiesDialog`

### קבצים
1. `src/components/scout/checks/ProcessCard.tsx` — הוספת prop
2. `src/components/scout/checks/PendingPropertiesDialog.tsx` — קומפוננטה חדשה
3. `src/components/scout/ChecksDashboard.tsx` — חיבור


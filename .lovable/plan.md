

## תיקון בעיה 1: Badge של "checked" נמתח + רוחב עמודות

### שינויים ב-`ScoutedPropertiesTable.tsx`

**1. הוספת case 'checked' ל-getStatusBadge (שורה 990-991)**
- הוספת `case 'checked':` עם badge מותאם: `<Badge variant="secondary" className="w-fit">נבדק</Badge>`
- הוספת `w-fit` ל-default case (שורה 992) למניעת מתיחה עתידית

**2. איזון רוחב עמודות (שורות 1511-1521)**
- עמודת סטטוס: `w-[140px]` → `w-[110px]`
- עמודת פרטים: ללא הגבלה (כבר ללא `w-[]`) — נשאר כך, ה-flex יתן לה יותר מקום אוטומטית עם הקטנת הסטטוס

קובץ אחד: `ScoutedPropertiesTable.tsx`


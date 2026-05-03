## תיקון ספירת "ממתינים לחילוץ"

עדכון שאילתת ה-UI ב-`src/components/scout/ChecksDashboard.tsx` (שורה 509) כך שתכלול גם נכסים עם `phone_extraction_status = NULL` (אותם ~304 נכסים שנוספו לפני שמערכת החילוץ הופעלה).

### שינוי טכני
החלפה של:
```
.not('phone_extraction_status', 'eq', 'success').not('phone_extraction_status', 'eq', 'not_found')
```
ל:
```
.or('phone_extraction_status.is.null,and(phone_extraction_status.neq.success,phone_extraction_status.neq.not_found)')
```

### תוצאה צפויה
מונה "בתור" יקפוץ מ-0 ל-~304, וה-Worker (שכבר תוקן) יתחיל לעבד אותם אחד-אחד לפי שעון 09:00–22:00.
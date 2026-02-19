

## הוספת שיוך סוכן להוצאות + טבלת סיכום חודשית

### 1. מסד נתונים - עמודה חדשה
הוספת עמודת `assigned_to` (uuid, nullable) לטבלת `business_expenses_list` - מפנה לסוכן שההוצאה שייכת אליו.

### 2. שדה בחירת סוכן בטופס ההוצאות
- שליפת רשימת הסוכנים מ-`profiles` (שם מלא + id)
- הוספת עמודת "סוכן" בטבלת ההוצאות עם Select dropdown
- הצגת שם הסוכן בשורת ההוצאה (במצב צפייה)
- השדה אופציונלי - אפשר להשאיר ריק אם ההוצאה כללית

### 3. טבלת סיכום חודשית מתחת להוצאות
טבלה מסודרת שמציגה סיכום לפי חודשים:
- עמודות: חודש | סה"כ חודשי | סה"כ שנתי | חד-פעמי | סה"כ
- חישוב אוטומטי מתוך ההוצאות הקיימות (הוצאה חודשית מופיעה בכל חודש, שנתית מחולקת ל-12, חד-פעמית בחודש היצירה)
- שורת סיכום כוללת בתחתית
- אפשרות סינון לפי סוכן

### פרטים טכניים

**שינוי במסד נתונים:**
- `ALTER TABLE business_expenses_list ADD COLUMN assigned_to uuid REFERENCES profiles(id)`

**קבצים שישתנו:**

1. **`src/hooks/useBusinessExpenses.ts`**
   - הוספת `assigned_to` ל-interface `BusinessExpense`
   - הוספת `assigned_to` ל-type `NewBusinessExpense`
   - שליפת ה-select תכלול `assigned_to, profiles:assigned_to(id, full_name)` כ-join

2. **`src/components/BusinessExpensesList.tsx`**
   - שליפת רשימת סוכנים מ-`profiles` (useEffect)
   - הוספת עמודת "סוכן" לטבלה עם Select dropdown בעריכה/הוספה
   - הצגת שם הסוכן במצב צפייה
   - עדכון `emptyExpense` עם `assigned_to: null`
   - עדכון `startEdit` לכלול `assigned_to`

3. **`src/components/BusinessExpensesMonthlySummary.tsx`** (קובץ חדש)
   - קומפוננטת טבלת סיכום חודשית
   - מקבלת את רשימת ההוצאות כ-prop
   - מחשבת לכל חודש (12 חודשים של השנה הנוכחית):
     - סה"כ הוצאות חודשיות (כל ההוצאות עם frequency=monthly)
     - סה"כ הוצאות שנתיות מחולק ל-12
     - הוצאות חד-פעמיות שנוצרו באותו חודש
     - סה"כ לחודש
   - סינון לפי סוכן (dropdown בראש הטבלה)
   - שורת סיכום שנתי בתחתית
   - הקומפוננטה תוצג מתחת לטבלת ההוצאות הקיימת

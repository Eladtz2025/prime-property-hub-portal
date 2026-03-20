
## הפיכת אייקון RefreshCw לפונקציונלי בדיאלוג הממתינים

### שינוי (`src/components/scout/checks/PendingPropertiesDialog.tsx`)

**הוספת mutation** — אותה לוגיקה בדיוק כמו ב-ScoutedPropertiesTable:
- קריאה ל-`check-property-availability-jina` עם `property_ids: [propertyId]`
- הצגת toast הצלחה/כישלון
- רענון הנתונים בדיאלוג (`invalidateQueries`)

**החלפת `<a>` ב-`<Button>`** — בשני המקומות (מובייל + דסקטופ):
- במקום לינק לדף המודעה, לחיצה מפעילה את ה-mutation
- הצגת spinner (Loader2) בזמן הבדיקה
- השבתת הכפתור בזמן בדיקה פעילה

**imports חדשים**: `useMutation`, `useQueryClient`, `toast`, `Button`, `Loader2` מהספריות הקיימות.


# הוספת מספר טלפון שני ללקוחות

## מה ייעשה

הוספת שדה "טלפון 2" אופציונלי בכל מקום שבו מוצג/נערך טלפון של לקוח -- מאפשר לשמור מספר נוסף לאיש קשר (בן/בת זוג, שותף וכו').

## שינויים נדרשים

### 1. הוספת עמודה בדאטאבייס
- הוספת עמודת `phone_2` מסוג `text`, nullable, לטבלת `contact_leads`

### 2. עדכון הממשק (Customer interface)
- **קובץ:** `src/hooks/useCustomerData.ts`
- הוספת `phone_2: string | null` ל-interface של `Customer`

### 3. טופס הוספת לקוח חדש
- **קובץ:** `src/components/AddCustomerModal.tsx`
- הוספת שדה "טלפון 2" (input פשוט, ללא חובה ובלי country code selector -- רק שדה טקסט)
- שמירת `phone_2` ב-insert ו-reset

### 4. טבלת דסקטופ (שורה מורחבת)
- **קובץ:** `src/components/ExpandableCustomerRow.tsx`
- הוספת שדה "טלפון 2" באזור העריכה, ליד שדה הטלפון הראשי
- שמירת `phone_2` ב-update
- הצגת טלפון 2 בשורה המצומצמת (אם קיים), עם אפשרות חיוג

### 5. מודאל עריכת לקוח
- **קובץ:** `src/components/CustomerEditModal.tsx`
- הוספת שדה "טלפון 2" ליד הטלפון הראשי
- שמירת `phone_2` ב-update

### 6. טבלת מובייל
- **קובץ:** `src/components/CustomerMobileTable.tsx`
- הוספת שדה "טלפון 2" בטופס העריכה
- שמירת `phone_2` ב-update

### 7. דף פרטי לקוח (Sheet)
- **קובץ:** `src/components/CustomerDetailSheet.tsx`
- הצגת טלפון 2 באזור "פרטי קשר" (אם קיים), עם אפשרות חיוג

## פירוט טכני

### DB Migration
```text
ALTER TABLE contact_leads ADD COLUMN phone_2 text;
```

### Customer Interface
```text
phone_2: string | null;
```

### UI -- שדה הקלט
שדה input פשוט ליד הטלפון הראשי, ללא validtion חובה אבל עם placeholder. ללא country code selector (כדי לשמור על פשטות -- המשתמש יכניס את המספר כמו שהוא):

```text
<div className="space-y-1">
  <Label className="text-xs">טלפון 2</Label>
  <Input
    value={formData.phone_2 || ''}
    onChange={(e) => setFormData({...formData, phone_2: e.target.value})}
    placeholder="מספר נוסף (אופציונלי)"
    className="h-8 text-sm"
  />
</div>
```

### Save Logic
בכל הפונקציות של save/update, להוסיף:
```text
phone_2: formData.phone_2 || null,
```

## סיכום
- 1 שינוי DB (עמודה חדשה)
- 6 קבצים לעדכון
- שדה אופציונלי, ללא validation חובה

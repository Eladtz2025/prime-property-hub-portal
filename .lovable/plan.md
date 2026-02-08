

# הוספת "תוספות לנכס" ללקוחות מכירה

## הבעיה

כרגע הרכיב `PropertyRequirementsDropdown` (חניה, מרפסת, מעלית, חצר, גג, ממ"ד, ריהוט) מוצג **רק** ללקוחות השכרה. לקוחות מכירה לא רואים אפשרויות אלו, למרות שגם הם צריכים לציין דרישות פיזיות מהנכס.

## הפתרון

להוסיף את ה-`PropertyRequirementsDropdown` גם בתוך חלק "פרטי רכישה" (`isSale`), ב-4 קבצים:

### קובץ 1: `src/components/ExpandableCustomerRow.tsx` (טבלת דסקטופ)

בתוך הסקשן `{isSale && (...)}` (שורה 717-761), להוסיף את ה-`PropertyRequirementsDropdown` אחרי השדות הקיימים (מטרת רכישה, הון עצמי, תקציב שיפוץ, נכס למכירה).

### קובץ 2: `src/components/CustomerMobileTable.tsx` (מובייל)

בתוך הסקשן `{isSale && (...)}` (שורה 637-668), להוסיף את ה-`PropertyRequirementsDropdown` אחרי הון עצמי.

### קובץ 3: `src/components/CustomerEditModal.tsx` (מודאל עריכה)

בתוך הסקשן `{isSale && (...)}` (שורה 520-670), להוסיף את ה-`PropertyRequirementsDropdown` אחרי פרטי עורך דין.

### קובץ 4: `src/components/AddCustomerModal.tsx` (הוספת לקוח חדש)

בתוך הסקשן `{isSale && (...)}` (שורה 664-813), להוסיף את ה-`PropertyRequirementsDropdown` אחרי פרטי עורך דין.

## פירוט טכני

בכל הקבצים, הקוד שמתווסף זהה בעיקרון -- רכיב `PropertyRequirementsDropdown` עם אותם שדות שכבר קיימים בצד ההשכרה:

```text
<div className="space-y-2">
  <Label>דרישות מהנכס:</Label>
  <PropertyRequirementsDropdown
    values={{
      parking_required, parking_flexible,
      balcony_required, balcony_flexible,
      elevator_required, elevator_flexible,
      yard_required, yard_flexible,
      roof_required, roof_flexible,
      outdoor_space_any,
      mamad_required, mamad_flexible,
      furnished_required, furnished_flexible,
    }}
    onChange={...}
  />
</div>
```

- לא נדרשים שינויי DB -- כל השדות כבר קיימים בטבלת `contact_leads`
- הלוגיקה של `handleSaveForm` כבר שומרת את השדות האלה (שורות 243-253 ב-ExpandableCustomerRow) ללא תלות בסוג העסקה
- ה-`PropertyRequirementsDropdown` כבר מיובא בכל הקבצים הרלוונטיים

## סיכום

- 4 קבצים לעדכון
- ללא שינויי DB
- הוספת רכיב קיים (PropertyRequirementsDropdown) לתוך סקשן "פרטי רכישה" שכבר קיים



# תיקון: שמירת שדה ריהוט (furnished) ללקוחות

## הבעיה
שדות `furnished_required`, `furnished_flexible`, `mamad_required`, ו-`mamad_flexible` לא נשמרים כמו שצריך בשלוש נקודות שמירה:

1. **CustomerEditModal.tsx** (שורות 145-157) -- שדות דרישות פיזיות (חניה, מרפסת, מעלית, חצר, ממ"ד, ריהוט) נשמרים רק כש-`isRental` = true. אם סוג העסקה הוא "מכירה", הם נמחקים.
2. **CustomerMobileTable.tsx** (שורות 182-189) -- אותה בעיה בדיוק, ובנוסף חסרים לגמרי שדות `mamad`, `furnished`, `roof`, ו-`outdoor_space_any`.
3. **ExpandableCustomerRow.tsx** (שורות 244-254) -- השדות הפיזיים כבר תוקנו (לא תלויים ב-isRental), אבל חסרים `mamad_required`, `mamad_flexible`, `furnished_required`, `furnished_flexible`.

## הפתרון
בכל שלושת הקבצים, שדות הדרישות הפיזיות מהנכס (חניה, מרפסת, מעלית, חצר, גג, ממ"ד, ריהוט, שטח חיצוני) יישמרו תמיד -- לא משנה סוג העסקה.

## פירוט טכני

### קובץ 1: `src/components/CustomerEditModal.tsx`
- שורות 145-157: להסיר את התנאי `isRental ?` מכל שדות הדרישות הפיזיות
- להוסיף שדות חסרים: `roof_required`, `roof_flexible`, `outdoor_space_any`
- `furnished_required` ו-`furnished_flexible` יישמרו תמיד

### קובץ 2: `src/components/CustomerMobileTable.tsx`
- שורות 182-189: להסיר את התנאי `isRental ?` מכל שדות הדרישות הפיזיות
- להוסיף שדות חסרים: `mamad_required`, `mamad_flexible`, `furnished_required`, `furnished_flexible`, `roof_required`, `roof_flexible`, `outdoor_space_any`, `pets_flexible`

### קובץ 3: `src/components/ExpandableCustomerRow.tsx`
- להוסיף בשורה 254 את השדות החסרים: `mamad_required`, `mamad_flexible`, `furnished_required`, `furnished_flexible`


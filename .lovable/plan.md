

## הוספת שדות תרגום לאנגלית באנשי מקצוע

### מה ישתנה

הוספת שני שדות חדשים במסד הנתונים ובטופס הניהול - שם באנגלית ואזור באנגלית - כדי שהדף האנגלי יציג את הנתונים בשפה הנכונה.

### 1. מסד נתונים - שני עמודות חדשות
- `name_en` (text, nullable) - שם איש המקצוע באנגלית
- `area_en` (text, nullable) - אזור באנגלית

### 2. טופס ניהול אנשי מקצוע (Admin)
בדיאלוג הוספה/עריכה יתווספו שני שדות:
- **שם באנגלית** - שדה Input ליד שדה השם הקיים
- **אזור באנגלית** - שדה Input ליד שדה האזור הקיים

### 3. דף אנגלי - הצגת השדות המתורגמים
הדף האנגלי (`ProfessionalsPublicPageEN.tsx`) ישתמש ב-`name_en` במקום `name` וב-`area_en` במקום `area` (עם fallback לעברית אם אין תרגום).

### פרטים טכניים

**שינוי במסד נתונים:**
- הוספת עמודות `name_en` ו-`area_en` לטבלת `professionals_list`

**קבצים שישתנו:**

1. **`src/hooks/useProfessionals.ts`**
   - הוספת `name_en` ו-`area_en` לממשק `Professional` ול-`NewProfessional`

2. **`src/components/ProfessionalsList.tsx`**
   - הוספת שדות `name_en` ו-`area_en` ב-`emptyPro`
   - הוספת שני שדות Input בדיאלוג (dir="ltr") - "Name (English)" ו-"Area (English)"
   - הוספת השדות ב-`startEdit`

3. **`src/pages/ProfessionalsPublicPageEN.tsx`**
   - הוספת `name_en` ו-`area_en` ל-interface ולשאילתת ה-select
   - הצגת `pro.name_en || pro.name` במקום `pro.name`
   - הצגת `pro.area_en || pro.area` במקום `pro.area`

4. **`src/pages/ProfessionalsPublicPage.tsx`** (שינוי קטן)
   - הוספת השדות החדשים ל-interface כדי שהטיפוסים יהיו עקביים


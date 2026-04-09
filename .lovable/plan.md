

## תוכנית — שיפור חלון הוספת נכס חדש

### שני תיקונים נדרשים

---

### 1. בחירת בעלים/מתווך קיים בסקשן "פרטי הבעלים"

**מצב נוכחי:** שדות טקסט חופשי בלבד (שם, טלפון, אימייל).

**שינוי:** הוספת שדה בחירה מעל שדות הבעלים עם 3 אפשרויות:
- **הכנסה ידנית** (ברירת מחדל — כמו היום)
- **בחירת בעלים קיים** — שליפה מטבלת `properties` (שדות `owner_name`, `owner_phone` ייחודיים)
- **בחירת מתווך קיים** — שליפה מטבלת `brokers` (שם + טלפון + משרד)

כשנבחר בעלים/מתווך מהרשימה, השדות (שם, טלפון, אימייל) מתמלאים אוטומטית. המשתמש יכול לערוך אותם אחרי המילוי.

**טכני:**
- שאילתת `properties` עם `select distinct owner_name, owner_phone, owner_email` + filter ריקים
- שאילתת `brokers` עם `select name, phone, office_name`
- Combobox/Select עם חיפוש פנימי

---

### 2. תיקון העלאת תמונות מחלון הפופ-אפ

**הבעיה:** אחרי `onPropertyAdded()` (שורה 259), הקוד מנסה למצוא את ה-property ID על ידי שאילתת DB לפי כתובת ועיר (שורות 263-269). זה כושל כי:
- `addProperty` מייצר `propertyId` עם `crypto.randomUUID()` ומחזיר אותו
- אבל `onPropertyAdded` לא מחזיר את ה-ID חזרה ל-Modal
- התחרות (race condition) בין insert לשאילתה

**פתרון:** שינוי ה-flow כך ש-`onPropertyAdded` יחזיר את ה-property ID:
- שינוי ה-interface: `onPropertyAdded: (property) => Promise<string>` (מחזיר ID)
- בהורים (`Properties.tsx`, `AdminDashboard.tsx`): `addProperty` כבר מחזיר `Property` עם `id` — פשוט להחזיר אותו
- ב-`AddPropertyModal`: שימוש ב-ID המוחזר ישירות לשמירת תמונות, במקום שאילתת חיפוש

---

### קבצים שמשתנים
1. **`src/components/AddPropertyModal.tsx`** — הוספת בחירת בעלים/מתווך + תיקון שמירת תמונות
2. **`src/pages/Properties.tsx`** — החזרת property ID מ-`onPropertyAdded`
3. **`src/pages/AdminDashboard.tsx`** — החזרת property ID מ-`onPropertyAdded`

### מה לא משתנה
- `ImageUpload.tsx` — הקומפוננטה עצמה עובדת תקין
- טבלאות DB
- `useSupabasePropertyData.ts`


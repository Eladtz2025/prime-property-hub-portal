
## הוספת תמיכה באנגלית לדף אנשי מקצוע הציבורי

### מה ייעשה

1. **יצירת דף אנגלי חדש** - `src/pages/ProfessionalsPublicPageEN.tsx`
   - אותו עיצוב בדיוק כמו הדף העברי, אבל ב-LTR ובאנגלית
   - כותרת: "Recommended Professionals"
   - כפתורים: "Call", "WhatsApp", "Website"
   - קופון: "Discount code:"
   - כפתור מעבר לעברית בראש הדף

2. **הוספת כפתור מעבר שפה לדף העברי** - `src/pages/ProfessionalsPublicPage.tsx`
   - כפתור "English" בראש הדף שמנווט ל-`/professionals/shared/en`
   - אותו עיצוב כמו כפתור השפה בטפסי הקליטה

3. **הוספת Route חדש** - `src/App.tsx`
   - הוספת `/professionals/shared/en` עם הדף האנגלי

4. **עדכון לינק באדמין** - `src/pages/AdminForms.tsx`
   - הוספת אפשרות להעתיק גם את הלינק האנגלי (או שהלינק יישאר עברי והלקוח יעבור שפה בעצמו)

### פרטים טכניים

**קובץ חדש: `src/pages/ProfessionalsPublicPageEN.tsx`**
- העתקה של הדף העברי עם תרגום לאנגלית
- `dir="ltr"` במקום `dir="rtl"`
- מיפוי מקצועות לאנגלית (Plumber, Electrician, Painter, וכו')
- כפתור מעבר שפה בראש: "עברית" שמנווט ל-`/professionals/shared`
- טקסטים: "Call", "WhatsApp", "Website", "Discount code:", "Copy"

**עדכון: `src/pages/ProfessionalsPublicPage.tsx`**
- הוספת `useNavigate` מ-react-router-dom
- הוספת כפתור "English" בראש הדף (אותו סגנון כמו בטפסי הקליטה)

**עדכון: `src/App.tsx`**
- הוספת route: `/professionals/shared/en` -> `ProfessionalsPublicPageEN`

**עדכון: `src/pages/AdminForms.tsx`**
- הוספת כפתור העתקת לינק אנגלי לאנשי מקצוע (ליד הכפתור העברי)

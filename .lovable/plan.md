
## עדכון WhatsApp עם הודעה מוכנה + הסרת כפתור העתקת טלפון

### מה ישתנה

**1. הודעת WhatsApp מוכנה מראש**
בכל 3 הקבצים, פונקציית ה-WhatsApp תשלח הודעה מוכנה עם שם איש המקצוע:
- עברית: "שלום {שם}, קיבלנו את הטלפון שלך מחברת הנדל״ן סיטי מרקט. מה נשמע?"
- אנגלית (בדף EN): "Hi {name}, we got your number from City Market Real Estate. How are you?"

**2. הסרת כפתור "העתק טלפון"**
הכפתור יוסר מהרשימה באדמין (`ProfessionalsList.tsx`). כפתורי חיוג ו-WhatsApp נשארים.

### פרטים טכניים

**3 קבצים לעדכון:**

**`src/pages/ProfessionalsPublicPage.tsx`** (שורות 67-71):
- שינוי `whatsApp(phone)` ל-`whatsApp(phone, name)`
- הוספת `text` parameter עם ההודעה בעברית ל-URL של WhatsApp

**`src/pages/ProfessionalsPublicPageEN.tsx`** (שורות 85-89):
- אותו שינוי, עם הודעה באנגלית

**`src/components/ProfessionalsList.tsx`**:
- עדכון פונקציית WhatsApp להוסיף הודעה מוכנה
- הסרת state של `copiedPhone` וכפתור "העתק טלפון"

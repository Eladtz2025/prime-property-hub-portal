

## התאמת הטופס העברי לרמת הטופס האנגלי

### מה לא עובד טוב

1. **גובה לא אחיד** - הכפתורים של ערים/שכונות בגובה h-8 בזמן שכל שאר השדות בגובה h-11 (44px). זה נראה לא מיושר.

2. **RTL גלובלי** - ה-hook `useMobileOptimization` מגדיר `document.dir = 'rtl'` ברמה הגלובלית, מה שעלול לפגוע בטופס האנגלי. כל טופס צריך לנהל את ה-direction שלו בעצמו.

3. **`pets_flexible` עדיין בסכמה** - הסרנו את הצ'קבוקס מה-UI אבל השדה עדיין קיים ב-schema וב-state. ניקוי.

### מה ישתנה

**קובץ `src/pages/ClientIntakePage.tsx`:**
- הגדלת גובה כפתורי ערים/שכונות מ-h-8 ל-h-11 (כמו שאר השדות)
- הסרת `pets_flexible` מהסכמה, מה-state, ומה-commonData
- וידוא שכל האלמנטים מיושרים ונראים אחיד

**קובץ `src/hooks/useMobileOptimization.ts`:**
- הסרת השורות שמגדירות `document.dir = 'rtl'` ו-`document.documentElement.classList.add('rtl')` ברמה הגלובלית
- כל דף מנהל את ה-direction שלו (הטופס העברי כבר מגדיר `dir="rtl"`, האנגלי `dir="ltr"`)

### פרטים טכניים

**`ClientIntakePage.tsx`:**
- שורות של `CitySelectorDropdown` ו-`NeighborhoodSelectorDropdown` - להעביר prop של `className="h-11"` או לשנות את ה-component שהם משתמשים בו
- הסרת `pets_flexible` משורה 46 (schema), שורה 101 (state), שורה 221 (commonData)

**`useMobileOptimization.ts`:**
- הסרת שורות 17-18 (`document.documentElement.classList.add('rtl')` ו-`document.dir = 'rtl'`)

**`city-selector.tsx`:**
- שינוי ברכיב `CitySelectorDropdown` - גובה הכפתור מ-`h-8` ל-`h-11` כדי שיתאים לשאר השדות בטופס

**`neighborhood-selector.tsx`:**
- אותו שינוי - גובה הכפתור מ-`h-8` ל-`h-11`

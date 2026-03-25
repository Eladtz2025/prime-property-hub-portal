

## תיקון הפס הזהב בכרטיסי השכונות

### הבעיה
ה-div שמכיל את הכותרת והפס משתמש ב-`flex items-end justify-center` — זה flexbox בכיוון שורה (row), כך שהכותרת והפס מוצגים זה לצד זה במקום אחד מתחת לשני. הפס נדחק הצידה ולא נראה.

### התיקון

**`src/pages/Index.tsx` שורה 188:**
הוספת `flex-col` ל-div כדי שהכותרת והפס יהיו בעמודה:
```
flex items-end justify-center → flex flex-col items-center justify-end
```

**`src/pages/en/Index.tsx`:**
אותו תיקון בדיוק בכרטיסי השכונות.

**2 קבצים, שורה אחת בכל אחד.**


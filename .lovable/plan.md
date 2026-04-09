

## תיקון שגיאות בילד — 6 קבצים עם import שבור

### הבעיה
ב-6 קבצים, שורת `import { logger }` עדיין נמצאת בתוך בלוק import קיים — גורם לשגיאות TypeScript.

### הקבצים
1. `src/components/AdminPriceOffersContent.tsx` (שורה 12)
2. `src/components/BrokerageFormsMobileList.tsx` (שורה 41)
3. `src/lib/owner-portal.ts` (שורה 3)
4. `src/pages/AdminCustomers.tsx` (שורה 20)
5. `src/pages/DynamicPitchDeckView.tsx` (שורה 9)
6. `src/pages/PresentationExclusivityForm.tsx` (שורה 28)

### הפתרון
בכל קובץ:
1. למצוא את `import { logger }` שנמצא בתוך בלוק import אחר
2. להוציא אותו החוצה — לפני או אחרי בלוק ה-import שהוא תקוע בו
3. לוודא שה-import המקורי שלם ותקין

### סיכון
**אפסי** — תיקון syntax בלבד, אין שינוי לוגי.


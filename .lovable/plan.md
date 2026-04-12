

## תוכנית: תיקון כיוון שדה תמונה ל-RTL

### שינוי

**קובץ: `src/components/social/AutoPublishManager.tsx` שורות 782-792**

הבעיה: ה-`dir="ltr"` על ה-Input גורם לטקסט להיות בשמאל, וכפתור התמונה נמצא בצד שמאל (סוף ה-flex ב-RTL).

תיקון:
1. הסרת `dir="ltr"` מה-Input (או שינוי ל-`dir="rtl"`)
2. הוספת `text-right` ל-Input
3. שינוי סדר ה-flex — הכפתור לפני ה-Input (ב-RTL הכפתור יופיע בימין) באמצעות `flex-row-reverse` או שינוי סדר האלמנטים

### סיכון: אפסי


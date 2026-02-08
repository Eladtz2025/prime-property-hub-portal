

# תיקון ניווט "צפה בדירות שהותאמו ללקוחות" במובייל

## הבעיה

ב-`MobileMatchesSheet.tsx` (שורה 83), כשלוחצים "צפה" על דירה נסרקת שהותאמה ללקוח, הניווט מפנה ל:

```text
/admin/property-scout?property=...
```

אבל ה-route הנכון באפליקציה הוא:

```text
/admin-dashboard/property-scout
```

ה-URL השגוי לא מתאים לשום route ב-App.tsx, ולכן נופל ל-NotFound שמציג "דף בבנייה".

## שינוי נדרש

### קובץ: `src/components/MobileMatchesSheet.tsx`

**שורה 83** -- תיקון ה-URL:

```text
לפני:  /admin/property-scout?property=${propertyId}
אחרי:  /admin-dashboard/property-scout?property=${propertyId}
```

זה תיקון של שורה אחת בלבד. שאר הקובץ נשאר ללא שינוי.

## הערה נוספת

גם הקישור ל-"נכסים שלנו" (שורה 81) מפנה ל-`/properties/${propertyId}` שגם הוא לא route קיים באפליקציה. אם תרצה, אפשר לתקן גם אותו בהמשך.



# תיקון: העתקת שיפורי הפרסרים לתיקייה הנכונה

## הבעיה
תיקנתי את הפרסרים ב-`_experimental/` אבל ה-`personal-scout-worker` מייבא מ-`_personal-scout/`.
לכן התיקונים לא השפיעו על הריצה של רוני.

## הפתרון
להעתיק את התיקונים מ-`_experimental/` אל `_personal-scout/`:

### קובץ 1: `_personal-scout/parser-homeless.ts`
העתקת הלוגיקה החדשה:
- חילוץ מחיר/חדרים/גודל מהטקסט הכללי (לא מעמודות קבועות)
- זיהוי סוג נכס ועיר מהטקסט
- טיפול בפורמטים שונים של טבלאות

### קובץ 2: `_personal-scout/parser-madlan.ts`
העתקת הלוגיקה החדשה:
- חיפוש שכונות בכל הבלוק עם `KNOWN_NEIGHBORHOODS`
- סינון פרויקטים חדשים (URLs עם `/projects/`)
- שיפור זיהוי תיווך

## שינויים טכניים

```text
_personal-scout/parser-homeless.ts:
├── הוספת extractFromRowText() - חילוץ מטקסט במקום עמודות
├── שימוש ב-extractPrice(), extractRooms(), extractSize() על כל הטקסט
└── fallback לעמודות אם החילוץ מטקסט נכשל

_personal-scout/parser-madlan.ts:
├── הוספת KNOWN_NEIGHBORHOODS mapping
├── הוספת extractNeighborhoodFromBlock() - חיפוש בכל הבלוק
├── הוספת isProject filter - סינון פרויקטים
└── שיפור זיהוי תיווך עם "בבלעדיות"
```

## לאחר התיקון
ריצה חוזרת של Personal Scout על רוני כדי לוודא:
- ✅ Homeless מחזיר price/rooms/size
- ✅ Madlan מחזיר שכונות
- ✅ פרויקטים מסוננים החוצה

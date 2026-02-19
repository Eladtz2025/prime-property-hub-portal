

## תיקון באג ההערות - הטופס שומר ל-`message`, האדמין מציג `notes`

### הבעיה

שני שדות שונים ב-DB:
- `message` -- הטופס הציבורי (`ClientIntakePage`) שומר לשדה הזה
- `notes` -- האדמין (`ExpandableCustomerRow`) קורא ומציג רק את השדה הזה

כלומר הערות מהטופס נשמרות ב-`message` אבל האדמין לא מציג אותן כי הוא מסתכל רק על `notes`.

### הפתרון

בטופס הציבורי (`ClientIntakePage.tsx` ו-`ClientIntakePageEN.tsx`), לשנות את השמירה כך שהערות יישמרו ב-`notes` במקום ב-`message`:

1. בכל מקום שמגדיר `message: finalMessage` ב-`commonData`, לשנות ל-`notes: finalMessage`
2. בלוגיקת ה-append, לשלוף `notes` מהלקוח הקיים (במקום `message`)
3. השדה `message` ישאר עם ערך ברירת מחדל כמו "לקוח מחפש שכירות" (לתאימות אחורית)

### קבצים שישתנו

- `src/pages/ClientIntakePage.tsx` -- שינוי שמירת ההערה מ-`message` ל-`notes`
- `src/pages/ClientIntakePageEN.tsx` -- אותו שינוי בגרסה האנגלית

### פרטים טכניים

בשני הקבצים:
- שורה 172: שליפת `notes` במקום `message` מהלקוח הקיים
- שורות 180-195: לוגיקת append תעבוד על `notes` במקום `message`
- שורה 224: ב-`commonData`, השדה `notes: finalMessage` במקום `message: finalMessage`
- שדה `message` יקבל תמיד את ברירת המחדל: "לקוח מחפש שכירות/רכישה"


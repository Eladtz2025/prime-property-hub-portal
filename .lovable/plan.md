

## תוכנית: הסרת Hero מעמודי השכרה ומכירה

### מה נעשה
הסרת רכיב `FullScreenHero` מ-4 קבצים — עמודי השכרה ומכירה בעברית ובאנגלית. המשתמש יראה ישר את הדירות אחרי ה-Header.

### קבצים שישתנו

| קובץ | שינוי |
|---|---|
| `src/pages/Rentals.tsx` | הסרת שורות 174-179 (FullScreenHero) + הסרת import בשורה 5 |
| `src/pages/Sales.tsx` | הסרת שורות 148-153 (FullScreenHero) + הסרת import בשורה 5 |
| `src/pages/en/Rentals.tsx` | הסרת שורות 83-87 (FullScreenHero) + הסרת import בשורה 5 |
| `src/pages/en/Sales.tsx` | הסרת שורות 83-87 (FullScreenHero) + הסרת import בשורה 5 |

### סיכון: **אפסי** — רק הסרת רכיב ויזואלי, ללא שינוי לוגיקה.


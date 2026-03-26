

## תיקון עמוד Insights — תמונת Hero חסרה

### הבעיה
קובץ `/images/tel-aviv-aerial.jpg` לא קיים בתיקיית `public/images/`. לכן ה-Hero מציג רקע אפור ריק.

### פתרון
החלף את תמונת הרקע בתמונה קיימת שכבר נמצאת בפרויקט. האפשרויות:
- `hero-building.jpg` — בניין יוקרתי (מתאים לנדל"ן)
- `hero-neighborhoods.jpg` — שכונות
- `hero-about.jpg` — רקע דף אודות

### שינויים

| קובץ | שינוי |
|-------|--------|
| `src/pages/he/Insights.tsx` | שנה `backgroundImage` מ-`tel-aviv-aerial.jpg` לתמונה קיימת |
| `src/pages/en/Insights.tsx` | אותו שינוי |

**2 קבצים, שורה אחת בכל קובץ.**


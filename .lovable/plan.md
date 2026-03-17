

## תיקון: העיגול הלבן נעלם מה-Switch

**הבעיה:** הוספת `overflow-hidden` ל-Switch הגלובלי גורמת לעיגול הלבן להיחתך ולהיעלם.

**הפתרון:** להסיר את `overflow-hidden` מרכיב ה-Switch הגלובלי, ובמקום זאת לתקן את הבעיה המקורית (עיגול חורג) רק ב-ProcessCard — על ידי החלפת `scale-75` ב-wrapper עם `overflow-hidden` מקומי.

### שינויים:

1. **`src/components/ui/switch.tsx`** — הסרת `overflow-hidden` מ-className של Root (שורה 12), חזרה למצב המקורי.

2. **`src/components/scout/checks/ProcessCard.tsx`** — עטיפת ה-Switch ב-`<div className="overflow-hidden rounded-full">` כדי לחתוך את החריגה רק בכרטיסים האלו, במקום להשתמש ב-`scale-75`.


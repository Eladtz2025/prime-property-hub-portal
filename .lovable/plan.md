
# שיפור תצוגת המוניטור החי — 3 שינויים

## 1. גודל קבוע עם גלילה
הפיד יקבל גובה קבוע שמתאים ל-5 שורות (כ-300px) ולא ישתנה בגודלו. שורות חדשות ירדו למטה עם auto-scroll והמשתמש יוכל לגלול למעלה. המסך לא "יימתח ויחזור".

- שינוי: `max-h-[400px]` ל-`h-[300px]` (גובה קבוע, לא max)

## 2. הגדלת הטקסט והפריסה
כרגע הכל בגדלים זעירים (`text-[10px]`, `text-[11px]`) למרות שיש הרבה מקום ריק. השינוי:

- **שם הנכס (primary)**: מ-`text-[11px]` ל-`text-sm` (14px), bold
- **שורת פרטים (details)**: מ-`text-[10px]` ל-`text-xs` (12px)
- **Timestamp**: מ-`text-[10px]` ל-`text-xs`
- **Source badge**: מ-`text-[10px]` ל-`text-xs`
- **אייקונים**: מ-`h-3 w-3` ל-`h-4 w-4`
- **Padding**: מ-`px-3 pt-1.5 pb-0.5` ל-`px-4 py-2`
- **שורת פרטים**: מ-`pb-1.5` ל-`pb-2`, padding-right מתאים
- **Active processes bar**: הגדלת טקסט בהתאם

## 3. שם הנכס כלינק קליקבילי
כשיש `source_url`, שם הנכס (primary) יהיה לינק שפותח את דף הנכס בטאב חדש. כרגע הלינק הוא רק אייקון ExternalLink קטן בשורת הפרטים — נעביר את הקליקביליות לשם עצמו (עם underline on hover) ונשאיר גם את האייקון.

---

## פרטים טכניים

### קובץ: `src/components/scout/checks/LiveMonitor.tsx`

**שינוי 1 — גובה קבוע:**
- שורה 381: `max-h-[400px]` -> `h-[300px]`

**שינוי 2 — הגדלת טקסט ומרווחים:**
- שורה 404: padding ראשי `px-3 pt-1.5 pb-0.5` -> `px-4 py-2 pb-1`
- שורה 406: timestamp `text-[10px]` -> `text-xs`, width `w-[50px]` -> `w-[55px]`
- שורה 413: type icon `h-3 w-3` -> `h-4 w-4`
- שורות 84-88: status icons `h-3.5 w-3.5` -> `h-4 w-4`
- שורה 419: primary text `text-[11px]` -> `text-sm font-semibold`
- שורה 116: source badge `text-[10px]` -> `text-xs`
- שורות 428-441: extra info `text-[10px]` -> `text-xs`
- שורה 445: detail line padding `px-3 pb-1.5 pr-[74px]` -> `px-4 pb-2 pr-[80px]`
- שורה 446: details text `text-[10px]` -> `text-xs`
- שורה 457: external link icon `h-2.5 w-2.5` -> `h-3.5 w-3.5`
- Active processes bar: `text-[11px]` -> `text-sm`, `text-[10px]` -> `text-xs`

**שינוי 3 — שם קליקבילי:**
- שורות 418-421: עטיפת ה-primary text ב-`<a>` כשיש `item.url`, עם `hover:underline hover:text-gray-100`



## תוכנית: הצמדת הפריוויו + העברת היסטוריית פרסום

### שינוי 1: הצמדת הפריוויו לפינת הסקשן (מספר 1 בתמונה)
הפריוויו כרגע נמצא בתוך grid של שתי עמודות עם `gap-4`, אבל הוא "מרחף" כי ה-`max-w-[500px] mx-auto` מרכז אותו. הפתרון: להסיר את ה-`mx-auto` מ-`FacebookPostPreview` ולהוסיף `mx-0` או פשוט ליישר אותו לקצה השמאלי של העמודה (כי ב-RTL הפריוויו בצד שמאל).

**קובץ:** `src/components/social/FacebookPostPreview.tsx`
- שינוי `max-w-[500px] mx-auto` ל-`max-w-[500px]` (הסרת `mx-auto`)

**קובץ:** `src/components/social/AutoPublishManager.tsx`
- בעמודת הפריוויו (שורה 862): הוספת `flex justify-start` כדי להצמיד לקצה

### שינוי 2: העברת היסטוריית פרסום לתוך הסקשן הראשי (מספר 2 בתמונה)
כרגע היסטוריית הפרסום (`AutoPublishLog`) היא `Collapsible` נפרד בתחתית הקומפוננטה (שורות 1096-1104). צריך להעביר אותה לתוך ה-Card הראשי של הטופס, מתחת ל-grid של שתי העמודות, כטבלה קומפקטית.

**קובץ:** `src/components/social/AutoPublishManager.tsx`
- הסרת ה-`Collapsible` העצמאי של ה-Log (שורות 1096-1104)
- הוספת `AutoPublishLog` בתוך ה-`CardContent` של הטופס הראשי (שורה 958, לפני סגירת ה-`CardContent`), עם separator דק ו-`max-h-[200px] overflow-y-auto` כדי שלא יתפוס יותר מדי מקום
- הוספת כותרת קטנה "היסטוריית פרסום" עם אפשרות collapse

### סיכון: **אפסי** — שינויי layout בלבד


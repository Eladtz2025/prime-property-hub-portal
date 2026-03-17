

## תיקון: עיגול ה-Toggle חורג מגבולות ה-Switch

**הבעיה:** ב-`ProcessCard.tsx` ה-Switch מוקטן עם `scale-75`, אבל חסר `overflow-hidden` ברכיב ה-Switch עצמו, מה שגורם לעיגול (Thumb) להיראות כאילו הוא יוצא מהמסלול.

**הפתרון:** הוספת `overflow-hidden` ל-Switch Root ב-`src/components/ui/switch.tsx` (שורה 12), כך שהעיגול תמיד יישאר בגבולות המסלול.

**קובץ לעריכה:** `src/components/ui/switch.tsx` — הוספת `overflow-hidden` ל-className של SwitchPrimitives.Root.


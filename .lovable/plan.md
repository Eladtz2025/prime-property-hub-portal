

## תיקון: גלילה לא רצויה בהחלפת טאבים

### בעיה
ב-`ChecksSubTabs.tsx`, שורה 20 — כשלוחצים על טאב, `scrollIntoView({ block: 'start' })` גולל את כל הקונטיינר לתחילתו, אבל כיוון שהתוכן נטען אחרי הגלילה, התוצאה היא גלילה למטה.

### פתרון
להחליף את ה-`scrollIntoView` על ה-Tabs container ב-`scrollIntoView` על ה-**TabsList** בלבד — כך שהגלילה תמיד מביאה את שורת הטאבים לראש המסך, לא את כל הקומפוננטה.

### שינוי — `ChecksSubTabs.tsx`
- ה-`ref` יצביע על ה-`TabsList` (שורת הכפתורים) במקום על ה-`Tabs` container
- `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` — ישתמש ב-`nearest` כדי לגלול רק אם הטאבים לא נראים, ולא לגלול מיותר כשהם כבר על המסך

שינוי של ~3 שורות בקובץ אחד.




## תיקון: הסרת הגלילה לחלוטין בהחלפת טאבים

### בעיה
אין סיבה אמיתית לגלול בכלל כשמחליפים טאב — המשתמש כבר רואה את שורת הטאבים, אז למה להזיז משהו?

### פתרון
מחיקת כל לוגיקת ה-`scrollIntoView` וה-`useRef` מ-`ChecksSubTabs.tsx`. החלפת טאב פשוט מחליפה תוכן במקום, בלי גלילה.

### שינוי — `ChecksSubTabs.tsx`
- מחיקת `useRef` import ו-`tabsListRef`
- מחיקת פונקציית `handleTabChange` (שמכילה את ה-scrollIntoView)
- החלפת `onValueChange={handleTabChange}` ב-`onValueChange={setActiveTab}`
- הסרת `ref={tabsListRef}` מה-TabsList

~5 שורות פחות בקובץ.


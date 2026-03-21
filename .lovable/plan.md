

## הסרת auto-scroll מהמוניטור

### בעיה
כשמחליפים טאב במוניטור, ה-`LiveFeedTab` גולל אוטומטית לתחתית הרשימה בגלל `autoScroll` שמופעל כברירת מחדל ו-`useEffect` שמזיז את `scrollTop` ל-`scrollHeight` בכל פעם שנוספים פריטים.

### פתרון
הסרת כל לוגיקת ה-auto-scroll מ-`LiveFeedTab.tsx`:

- מחיקת `useState(autoScroll)` ו-`useState(prevLength)`
- מחיקת ה-`useEffect` שמבצע `scrollTop = scrollHeight`
- מחיקת `handleScroll` שמזהה גלילה ידנית
- מחיקת `onScroll={handleScroll}` מה-div
- מחיקת כפתור "חזור למטה" (`ArrowDown`)
- הסרת imports מיותרים (`useEffect`, `useState`, `ArrowDown`)

### קובץ: `src/components/scout/checks/monitor/LiveFeedTab.tsx`
~30 שורות פחות. הרשימה תמיד תתחיל מלמעלה ולא תזוז אוטומטית.


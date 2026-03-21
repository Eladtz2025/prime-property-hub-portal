

## תיקון יישור שדה "חיות"

### בעיה
ה-Label של "חיות" משתמש ב-`flex items-center gap-1` עם אייקון `Dog` — זה גורם לגובה label שונה משאר ה-labels הרגילים, מה שמזיז את ה-Select למיקום שונה.

### פתרון (`ExpandableCustomerRow.tsx`, שורה 651)
הסרת אייקון ה-`Dog` מה-label של "חיות" ושינוי ל-label רגיל כמו שאר השדות:
```
<Label className="text-xs">חיות</Label>
```
במקום:
```
<Label className="text-xs flex items-center gap-1"><Dog className="h-3 w-3" />חיות</Label>
```

שינוי של שורה אחת בלבד.


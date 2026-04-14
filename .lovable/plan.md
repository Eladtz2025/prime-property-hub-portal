

## תיקון: "דירה 2/5" במקום "דירה 1/5"

### הבעיה
`current_index` ב-DB מצביע על הנכס **הבא** לפרסום. אחרי שפורסמה דירה 1 (אינדקס 0), ה-`current_index` עולה ל-1. השורה מציגה `currentIdx || totalProps` = 1, ואז כותבת "הבאה: דירה 2/5" (כי 1+1=2 במונחי תצוגה).

אבל הדירה הזו עדיין לא פורסמה — היא רק **הבאה בתור**. הטקסט "הבאה" נכון, אבל המספר צריך להיות 1/5 (דירה אחת פורסמה) ולא 2/5.

### תיקון
קובץ: `src/components/social/AutoPublishManager.tsx`

**שורה 1090** — שינוי מ:
```
סבב {cycleInfo.cycle} · הבאה: דירה {cycleInfo.currentIdx || cycleInfo.totalProps}/{cycleInfo.totalProps}
```
ל:
```
סבב {cycleInfo.cycle} · פורסמו: {cycleInfo.currentIdx}/{cycleInfo.totalProps}
```

כך שהמספר ישקף כמה דירות **כבר פורסמו** בסבב הנוכחי (currentIdx = מספר הדירות שפורסמו, כי ה-index מתקדם אחרי כל פרסום). גם ה-progress bar כבר מחושב נכון על בסיס `currentIdx`.

### קובץ לשינוי
- `src/components/social/AutoPublishManager.tsx` — שורה 1090 בלבד




## הקטנת וצמצום כרטיסי התהליכים — Stat Tiles נקיים

### קובץ: `ProcessCard.tsx`

**שינויים:**

1. **הקטנת גובה ~25%**: `p-5` → `p-3.5`, `py-4` באזור המרכזי → `py-2`, הסרת `gap-1` מיותר
2. **Footer דק**: הסרת כפתור "הפעל" גדול + אייקוני History/Settings נפרדים. במקום: שורה דקה אחת (`pt-2 border-t`) עם "פתח" קטן מימין, ואייקוני history+settings מוקטנים (`h-3 w-3`, `h-6 w-6` buttons) משמאל. כשרץ — "עצור" קטן במקום "פתח".
3. **Header ללא שינוי** — כבר מכיל toggle+status+title באותה שורה (תקין)
4. **מרכז מצומצם**: הקטנת מספר גדול מ-`text-4xl` → `text-3xl`, הקטנת `mt` בין אלמנטים, הסרת רווחים מיותרים
5. **הסרת hover translate** — רק `hover:shadow-sm` בלי `-translate-y`

### קובץ: `ChecksDashboard.tsx`

**שינויים:**

1. **גריד אחיד**: שינוי מ-`lg:grid-cols-3` ל-`lg:grid-cols-5` כך שכל 5 הכרטיסים באותה שורה בדסקטופ (או `xl:grid-cols-5 lg:grid-cols-3` לרספונסיביות)
2. **התאמות** — `primaryValue={0}`, העברת `leadCounts.eligible` ל-`secondaryLine`: `"43 לידים eligible"` במקום שיהיה המספר הראשי
3. **gap**: `gap-3` → `gap-2.5`

### סיכום ויזואלי

כל כרטיס יהיה: header קומפקטי → מספר `text-3xl` → label → secondary line → insight → divider דק → "פתח" + 2 אייקונים קטנים. בלי כפתור כבד, בלי רווחים מיותרים.


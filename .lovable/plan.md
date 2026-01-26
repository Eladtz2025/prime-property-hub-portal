
# תיקון: קריאת הטוקן מהנתיב

## הבעיה
הקוד מחפש `?token=xxx` (query parameter) אבל הלינק שנוצר הוא `/memorandum-form/xxx` (path parameter).

## מה כבר קיים ועובד
- ✅ עמוד תודה (FormThankYouScreen)
- ✅ שמירת הטופס (legal_forms table)
- ✅ הורדת PDF (downloadMemorandumPDF)
- ✅ שליחת WhatsApp
- ✅ החתימה נשמרת בטוקן (agent_signature)

## התיקון הנדרש
שינוי קטן ב-3 קבצים - להחליף את אופן קריאת הטוקן:

**1. MemorandumFormPage.tsx**
```typescript
// שורה 2 - להוסיף useParams:
import { useParams, useSearchParams } from 'react-router-dom';

// שורות 23-24 - להחליף:
const { token } = useParams<{ token?: string }>();
const [searchParams] = useSearchParams();
```

**2. SaleMemorandumFormPage.tsx** - אותו שינוי

**3. ExclusivityFormPage.tsx** - אותו שינוי

## למה זה יעבוד
1. לקוח נכנס ל-`/memorandum-form/abc123`
2. `useParams()` קורא את `abc123` מהנתיב
3. `loadTokenData()` מופעלת ומביאה את כל הנתונים + החתימה
4. הטופס מוצג עם כל מה שהסוכן מילא
5. לקוח חותם ושומר → עמוד תודה + PDF

## סיכום
זה לא עבודה מחדש - רק תיקון של 2 שורות בכל קובץ!

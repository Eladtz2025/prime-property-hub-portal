

# תיקון טופס חתימת לקוח לדירה -- שתי בעיות

## בעיה 1: חתימת המתווך לא מופיעה ב-PDF

### שורש הבעיה

כשלקוח חותם מרחוק (remote-sign mode), חתימת המתווך נשמרת ב-`tokenAgentSignature` (נטענת מה-token שנוצר מראש). אבל ה-PDF משתמש רק ב-`agentSignatureData` -- שזה המשתנה שמאוכלס רק כשהמתווך חותם ישירות בדף (mode = new).

בקוד ה-PDF (שורה 719):
```text
${agentSignatureData ? `...agent signature img...` : ''}
```

במצב remote-sign, ה-`agentSignatureData` הוא `null`, כי החתימה נשמרה ב-`tokenAgentSignature` ולא הועברה. לכן חתימת המתווך פשוט לא מוצגת.

### הפתרון

בתוך `generatePDF`, להשתמש ב-`tokenAgentSignature` כ-fallback כשאין `agentSignatureData`:

```text
// Determine which agent signature to use
const effectiveAgentSignature = agentSignatureData || tokenAgentSignature;
```

ואז בתבנית ה-HTML:

```text
${effectiveAgentSignature ? `
  <div style="flex: 1; text-align: center;">
    <img src="${effectiveAgentSignature}" ... />
  </div>
` : ''}
```

גם צריך להוסיף `tokenAgentSignature` לרשימת ה-dependencies של `useCallback`.

**קובץ: `src/pages/BrokerageFormPage.tsx`**

---

## בעיה 2: כפתור "סיום" מפנה לאפליקציית הניהול במקום לאתר

### שורש הבעיה

בשורה 878-882, כפתור "סיום" עושה:
```text
onClick={() => {
  window.close();
  navigate('/');
}}
```

זה שולח את הלקוח ל-`/` שזה עמוד הבית של אפליקציית הניהול (הדשבורד). במקום זה, הלקוח צריך לעבור לאתר הציבורי.

### הפתרון

לשנות ל:
```text
onClick={() => {
  window.close();
  window.location.href = 'https://primepropertyai.lovable.app';
}}
```

**קובץ: `src/pages/BrokerageFormPage.tsx`**

---

## סיכום השינויים

שינויים בקובץ אחד בלבד: `src/pages/BrokerageFormPage.tsx`

1. **חתימת מתווך ב-PDF**: הוספת `effectiveAgentSignature = agentSignatureData || tokenAgentSignature` בתוך `generatePDF` והחלפת `agentSignatureData` ב-`effectiveAgentSignature` בתבנית ה-HTML + הוספת `tokenAgentSignature` ל-dependencies
2. **כפתור סיום**: שינוי `navigate('/')` ל-`window.location.href = 'https://primepropertyai.lovable.app'` כך שהלקוח מופנה לאתר הציבורי


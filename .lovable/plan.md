

# תיקון Selectors — חיפוש בתוך `[role="dialog"]`

## הבעיה
התוסף פותח את ה-dialog בהצלחה, אבל ה-`waitForElement` מחפש textbox בכל הדף (`document.querySelector`) במקום בתוך ה-dialog הפתוח. אותו דבר עם כפתור Post.

## שינויים

### 1. `extension/content-script.js` — עדכון Step 2 (textbox)
שורה 32-34: שינוי ה-selector ל:
```
'[role="dialog"] [role="textbox"][contenteditable="true"]'
```

### 2. `clickPostButton()` — חיפוש בתוך dialog קודם
העדפת חיפוש בתוך `[role="dialog"]` לפני חיפוש גלובלי. כבר יש Strategy 2 שעושה את זה, אבל צריך להעלות אותה לעדיפות ראשונה.

### 3. `addImages()` — עדכון selector לכפתור תמונה
הוספת `aria-label` patterns: `"Photo"`, `"photo"`, `"תמונה"` בתוך dialog.

### 4. אריזה מחדש ל-ZIP

## היקף
שינוי קטן — רק עדכון selectors בשלושה מקומות + ZIP מחדש.


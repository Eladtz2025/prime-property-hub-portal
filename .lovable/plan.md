

## שילוב סטודיו תמונות בכל מקום עם העלאת תמונות

### קומפוננטה חדשה: `src/components/photo-studio/PhotoStudioDialog.tsx`
- דיאלוג שמקבל URL של תמונה + callback להחלפה
- 3 טאבים: שיפור אוטומטי, ריהוט וירטואלי, הסרת אלמנטים
- התמונה נכנסת כ-input (בלי העלאה מחדש)
- כפתור "החלף תמונה" מחזיר תוצאה ל-callback

### שילוב ב-4 מקומות
1. **`ImageUpload.tsx`** — כפתור עריכה (Wand2) על כל תמונה שהועלתה
2. **`PropertyGallery.tsx`** — כפתור עריכה בתפריט hover של כל תמונה
3. **`ImageUploader.tsx`** (הצעות מחיר) — כפתור עריכה על כל תמונה
4. **`BackgroundImagePicker.tsx`** (מצגת) — כפתור עריכה על תמונת הרקע הנבחרת

### הסרות
- הסרת route `/photo-studio` מ-`App.tsx`
- הסרת לינק מהניווט (אם קיים)
- מחיקת `src/pages/PhotoStudio.tsx`
- קבצי הטאבים ב-`photo-studio/` נשארים (משמשים את הדיאלוג)

### סיכום קבצים
- **חדש:** `PhotoStudioDialog.tsx`
- **עריכה:** `ImageUpload.tsx`, `PropertyGallery.tsx`, `ImageUploader.tsx`, `BackgroundImagePicker.tsx`, `App.tsx`, ניווט
- **מחיקה:** `PhotoStudio.tsx`


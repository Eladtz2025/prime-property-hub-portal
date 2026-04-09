

## יישור פרטי הנכס לימין

### הבעיה
שורות הפרטים (מחיר, חדרי רחצה, חדרים, קומה, מ"ר) מיושרות למרכז/שמאל במקום לימין. הסיבה: `justify-start` ב-`flex-row-reverse` ללא `dir="rtl"` מיישר שמאלה.

### הפתרון
בקובץ `src/pages/PropertyDetailPage.tsx`, שורות 342-367 — להחליף `justify-start` ב-`justify-end` בכל 5 שורות הפרטים (מחיר, חדרי רחצה, חדרים, קומה, מ"ר).

לחלופין, פשוט להוסיף `dir="rtl"` על ה-`div` של הפרטים (שורה 340) ולהסיר את `flex-row-reverse` ו-`justify-start` מכל השורות — אבל הגישה המינימלית היא פשוט `justify-end`.

### קובץ שמשתנה
- `src/pages/PropertyDetailPage.tsx` — 5 שינויים של `justify-start` → `justify-end` בשורות 342, 346, 353, 358, 364


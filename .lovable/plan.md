

## יישור גובה הכותרת — עברית ואנגלית

### הבעיה
שני ה-VideoHero לא תואמים:
- עברית: `-translate-y-[5%]`, `mb-10`, `font-bold`
- אנגלית: `-translate-y-[12.5%]`, `mb-6`, ללא `font-bold`

### התיקון

לאחד את שניהם לאותם ערכים. נבחר ערך ביניים:

**`src/components/en/VideoHero.tsx` שורה 52:**
- שינוי `-translate-y-[12.5%]` ל-`-translate-y-[5%]`

**`src/components/en/VideoHero.tsx` שורה 53:**
- שינוי `mb-6` ל-`mb-10`

**`src/components/en/VideoHero.tsx` שורה 54:**
- הוספת `font-bold` ל-h1

**2 קבצים (רק אנגלית משתנה), 3 שורות.**


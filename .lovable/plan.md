

# הוספת "Since 2016" וסטייל לכפתורים בהירו

## שינוי 1: הוספת "Since 2016" מתחת לכותרת
בשני קבצי ה-VideoHero (עברית ואנגלית), יתווסף טקסט "Since 2016" מתחת לשורת "Properties" בגודל קטן, tracking רחב, וצבע לבן שקוף קצת - בסגנון דומה לשורת "Properties".

## שינוי 2: רקע שקוף לכפתורי קנייה/השכרה
לכפתורים יתווסף רקע חצי-שקוף (כמו לכפתור השפה) עם backdrop-blur.

---

## פירוט טכני

### `src/components/he/VideoHero.tsx` (שורות 57-59):
- הוספת שורת "Since 2016" אחרי "Properties"
- שינוי className של הכפתורים (שורות 69, 75): הוספת `bg-white/10 backdrop-blur-sm`

### `src/components/en/VideoHero.tsx` (שורות 57-59):
- אותם שינויים בדיוק

### קבצים לעריכה:
- `src/components/he/VideoHero.tsx`
- `src/components/en/VideoHero.tsx`

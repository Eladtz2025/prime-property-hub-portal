

## שני תיקונים לטופס העברי

### 1. כפתור מעבר שפה בטופס עצמו

הוספת כפתור קומפקטי בראש כל טופס (עברית ואנגלית) שמאפשר למשתמש לעבור לשפה השנייה:
- בטופס העברי: כפתור קטן "EN" או עם דגל שמנווט ל-`/client-intake/en`
- בטופס האנגלי: כפתור קטן "עב" או עם דגל שמנווט ל-`/client-intake`
- הכפתור יופיע בפינה העליונה של הדף, מעל הכותרת

### 2. תיקון סדר כפתורי שכירות/רכישה

בצילום המסך נראה ש"שכירות" ו"רכישה" מופיעים בסדר LTR (שכירות בשמאל, רכישה בימין). ב-RTL, האופציה הראשונה (שכירות) צריכה להיות בצד ימין.

הבעיה: ה-`RadioGroup` משתמש ב-`flex gap-4` אבל ייתכן שה-flex לא מגיב נכון ל-`dir="rtl"` בגלל הגדרות CSS. הפתרון: להוסיף `flex-row-reverse` לטופס העברי כדי לוודא שהסדר נכון.

### פרטים טכניים

**קבצים שישתנו:**

**`src/pages/ClientIntakePage.tsx`:**
- הוספת `useNavigate` מ-react-router-dom
- הוספת כפתור מעבר שפה בראש הדף: `<button onClick={() => navigate('/client-intake/en')}>🇺🇸 English</button>` - עם עיצוב קומפקטי (pill shape, שקוף עם border)
- שורה 362-363: שינוי ה-RadioGroup className מ-`"flex gap-4"` ל-`"flex flex-row-reverse gap-4 justify-end"` כדי שהסדר יהיה נכון ב-RTL

**`src/pages/ClientIntakePageEN.tsx`:**
- הוספת כפתור מעבר שפה מקביל: `<button onClick={() => navigate('/client-intake')}>🇮🇱 עברית</button>` - באותו עיצוב


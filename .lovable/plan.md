
# שדרוג גלריית התמונות לרמה מקצועית

## סקירה כללית
הגלריה הנוכחית עובדת אבל מרגישה בסיסית - חסרות אנימציות, אין swipe במובייל, ה-thumbnails קטנים, ויש באגים קטנים. המטרה: להביא את החוויה לרמה של אתרי נדל"ן מקצועיים.

## שיפור 1: אנימציית Slide חלקה בין תמונות
במקום שהתמונה פשוט "קופצת", תהיה אנימציית slide-in/slide-out חלקה כשמחליפים תמונה. אפקט fade + slide קצר שנותן תחושה מלוטשת.

## שיפור 2: תמיכה ב-Swipe במובייל (Touch Gestures)
הוספת תמיכה בהחלקה ימינה/שמאלה עם האצבע במובייל. זה הבסיס לכל גלריה מודרנית - המשתמש פשוט מחליק והתמונה עוברת.

## שיפור 3: שדרוג ה-Thumbnails
- הגדלה מ-64px ל-80px (דסקטופ) / 72px (מובייל)
- הוספת אפקט hover (scale + brightness)
- הוספת active indicator ברור יותר (לא רק border)
- תיקון thumbnail שבור שמציג אייקון ריק

## שיפור 4: גובה אחיד לגלריה
במקום הקפיצה בין "unknown" -> "landscape"/"portrait", להגדיר aspect ratio קבוע (16:9 או 4:3) עם object-fit שמתאים את עצמו. התמונה תמיד נטענת בתוך מסגרת יציבה בלי layout shift.

## שיפור 5: שדרוג ה-Fullscreen
- רקע כהה מלא (overlay)
- thumbnails גם במצב fullscreen
- תמיכה ב-swipe גם בפולסקרין
- תיקון באג המונה (מציג "9/4" במקום "4/9")
- ניווט עם מקשי חצים (keyboard)
- אנימציית כניסה/יציאה חלקה

## שיפור 6: Keyboard Navigation
הוספת event listeners למקשי חצים ימינה/שמאלה + Escape לסגירת fullscreen. משפר נגישות ונוחות.

## שיפור 7: Preloading חכם
טעינה מראש של התמונה הבאה והקודמת ברקע, כדי שהמעבר יהיה מיידי בלי loading.

---

## פירוט טכני

### קובץ: `src/components/ImageCarousel.tsx`

**Swipe support:** שימוש ב-touch events (touchstart/touchmove/touchend) ישירות, בלי ספרייה נוספת. מעקב אחרי deltaX ו-threshold של 50px להפעלת מעבר.

**Slide animation:** שימוש ב-CSS transitions עם transform: translateX. State חדש `slideDirection` שקובע את כיוון האנימציה.

**גובה אחיד:** החלפת הלוגיקה של 3 layouts שונים (unknown/landscape/portrait) ב-container אחד עם aspect-ratio: 4/3 ו-object-fit: contain. רקע blur תמיד מוצג לתמונות שלא ממלאות את כל השטח.

**Thumbnails:** הגדלה ל-w-20 h-20, הוספת hover:scale-105 hover:brightness-110, ring indicator לפריט פעיל.

**Fullscreen:** הוספת useEffect עם keydown listener, תיקון סדר המונה, הוספת thumbnails strip, רקע bg-black/95.

**Preloading:** useEffect שטוען את image[currentIndex+1] ו-image[currentIndex-1] עם `new Image()`.

### קבצים לעריכה:
- `src/components/ImageCarousel.tsx` (שכתוב משמעותי)



# שיפור חילוץ נתונים מיד2 — פרטים נוספים + כתובת מדויקת

## מה חסר כרגע

מהצילום מסך רואים שביד2 יש **שני סקשנים חשובים**:

### 1. פרטים נוספים (כרגע חילוץ חלקי מאוד)
כרגע מחלצים רק size, floor, rooms, price מ-regex על כל הטקסט. חסר:
- **מצב הנכס** (חדש/משופץ/שמור/ישן) → `propertyCondition`
- **קומות בבניין** → `totalFloors`  
- **מחיר למ"ר** → `pricePerSqm`
- **חניות** (מספר) → `parkingSpots`
- **כניסה גמישה / תאריך כניסה** → `entryDate`
- **סוג העסקה** → כבר ידוע מ-property_type

### 2. מה יש בנכס (חילוץ Cheerio — ייתכן שיש באגים)
צריך לוודא שה-CSS class detection עובד נכון. אם כל הנכסים שבדקת הראו שגיאות — ייתכן ש-`disabled` לא ה-class הנכון או שה-selector שגוי.

### 3. כתובת מדויקת
הכתובת ביד2 מופיעה בכותרת הדף (למשל "נחלת יצחק, תל אביב יפו") — אבל לעיתים יש גם מספר בית שלא נשמר.

## תוכנית

### שלב 1: Debug — בדיקת ה-HTML האמיתי
הרצת fetch על נכס אחד (yobn16fz) ושמירת ה-HTML כדי לראות:
- מה ה-CSS class האמיתי של פיצ'ר כבוי (האם זה `disabled` או משהו אחר?)
- מה המבנה של "פרטים נוספים" ב-HTML (data-testid, table, grid?)
- איפה הכתובת המדויקת

### שלב 2: תיקון parser
בהתאם לממצאי שלב 1:
- תיקון זיהוי active/disabled אם ה-class שונה
- הוספת חילוץ structured מ"פרטים נוספים" via Cheerio (לא regex)
- חילוץ כתובת מדויקת מ-header/breadcrumb

### שלב 3: הרחבת ה-interface
הוספת שדות ל-`Yad2DetailResult`:
- `totalFloors`, `pricePerSqm`, `parkingSpots`, `propertyCondition`, `entryDate`

### שלב 4: שמירה ב-DB
- שדות שיש להם עמודה (floor, size, rooms, price) → ישירות
- שדות נוספים (totalFloors, pricePerSqm, propertyCondition) → בתוך `features` jsonb

## קבצים שישתנו

| קובץ | שינוי |
|------|-------|
| `_shared/yad2-detail-parser.ts` | תיקון CSS selector + חילוץ "פרטים נוספים" structured + כתובת |
| `backfill-property-data-jina/index.ts` | שמירת השדות החדשים ב-DB |

## סיכון
**נמוך** — שלב 1 הוא debug בלבד. תיקונים רק אחרי שרואים את ה-HTML האמיתי.


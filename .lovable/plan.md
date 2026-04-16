

# תיקון חילוץ פיצ'רים מיד2 — שימוש ב-HTML במקום Markdown

## הבעיה

Jina במצב Markdown מרנדר את כל הפיצ'רים בסקשן "מה יש בנכס" כטקסט רגיל — בלי הבדל בין פיצ'ר פעיל (כתום) לפיצ'ר כבוי (אפור). לכן ה-parser מסמן הכל כ-`true`.

## הפתרון

**בדיוק כמו הומלס** — ביד2 הפיצ'רים מסומנים ב-HTML לפי CSS classes. צריך:
1. לבקש מ-Jina **HTML** (לא markdown) עבור דפי יד2
2. לפרסר את ה-HTML עם Cheerio ולזהות פיצ'רים לפי class (active vs inactive)

## שלבי ביצוע

### שלב 1: בדיקת מבנה ה-HTML של יד2 (debug)

הרצת Jina עם `X-Return-Format: html` על דף יד2 אחד, ולוג של ה-HTML סביב "מה יש בנכס" כדי לראות את ה-CSS classes בפועל.

קובץ: `backfill-property-data-jina/index.ts`
- בבלוק של יד2, הוספת fetch נוסף ב-HTML mode (רק לצורך debug ראשוני)
- לוג של 2000 תווים סביב "מה יש בנכס"

### שלב 2: יצירת `yad2-detail-parser.ts` עם Cheerio

קובץ: `_shared/yad2-detail-parser.ts`
- שכתוב הפונקציה לפרסר HTML במקום markdown
- שימוש ב-Cheerio (כמו ב-`homeless-detail-parser.ts`)
- זיהוי פיצ'רים לפי CSS class — active (כתום) = `true`, inactive (אפור) = `false`
- מיפוי שמות עבריים לפיצ'רים:
  - מעלית → elevator
  - ממ"ד → mamad  
  - מרפסת → balcony
  - מחסן → storage
  - מיזוג → airConditioner
  - סורגים → bars
  - דוד שמש → sunHeater
  - וכו'

### שלב 3: עדכון scraping-jina.ts עבור יד2

קובץ: `_shared/scraping-jina.ts`
- ליד2 בבקפיל: לבקש HTML (כמו הומלס) ולא markdown
- או: להוסיף fetch שני ב-HTML mode רק עבור הפיצ'רים

### שלב 4: עדכון לוגיקת המיזוג

קובץ: `backfill-property-data-jina/index.ts`
- שילוב הפיצ'רים מ-HTML parser עם הנתונים מ"פרטים נוספים" (שנשאר ב-markdown)

## סדר עבודה

1. **קודם debug** — הרצת fetch HTML על נכס אחד כדי לראות את ה-CSS classes של יד2
2. **לפי התוצאה** — בניית parser מתאים
3. **בדיקה על 5 נכסים** — אימות שהפיצ'רים תואמים למה שרואים במודעה

## קבצים שישתנו

| קובץ | שינוי |
|------|-------|
| `backfill-property-data-jina/index.ts` | debug fetch HTML + שילוב parser חדש |
| `_shared/yad2-detail-parser.ts` | שכתוב ל-Cheerio/HTML parser |
| `_shared/scraping-jina.ts` | אפשרות HTML mode ליד2 |

## סיכון
**נמוך-בינוני** — תלוי באם Jina מרנדר את ה-CSS classes של יד2. אם לא → נצטרך גישה ישירה ל-HTML (כמו הומלס). שלב 1 יבדוק את זה.


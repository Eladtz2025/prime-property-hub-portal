

## הסרת בדיקות מיותרות מ-checkMadlanDirect

### ממצאים
- Direct Fetch של מדל"ן עובד מצוין ומחזיר HTML ישיר של הדף הספציפי
- **0 מקרים** של redirect לדף הבית או תוצאות חיפוש ב-1,274 בדיקות
- הבדיקות `isMadlanHomepage` ו-`isMadlanSearchResultsPage` רלוונטיות רק ל-Jina (markdown), לא ל-Direct Fetch (HTML)
- הדירות הבעייתיות נסרקו לפני ה-15 כשהפארסר לא עבד טוב

### תיקון
הסרת Strategy 5 ו-Strategy 6 (שורות 111-120) מ-`checkMadlanDirect` ב-`check-property-availability-jina/index.ts`. הבדיקות הקיימות (title, og:description, og:title, body text, CAPTCHA) מספיקות לחלוטין.

### קבצים
1. `supabase/functions/check-property-availability-jina/index.ts` — הסרת שני הבלוקים המיותרים


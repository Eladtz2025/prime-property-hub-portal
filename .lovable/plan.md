

# הפרדת בדיקת 409 בין סריקות 1 לסריקות 2

## הבעיה
שתי מערכות הסריקה (Firecrawl ו-Jina) בודקות ריצות running לפי `config_id` בלבד, בלי לסנן לפי עמודת `scanner`. ריצה ישנה של Firecrawl חוסמת ריצת Jina חדשה (ולהפך).

## הפתרון
הוספת פילטר `scanner` לבדיקת 409 בכל טריגר, כך שכל מערכת בודקת רק את הריצות שלה:

### קובץ: `supabase/functions/trigger-scout-pages-jina/index.ts`
בשאילתת בדיקת הריצה הקיימת (שורות 60-66), הוספת:
```
.eq('scanner', 'jina')
```
כך ש-Jina בודק רק ריצות Jina פעילות, ולא נחסם על ידי ריצות Firecrawl.

### קובץ: `supabase/functions/trigger-scout-pages/index.ts`
בשאילתת בדיקת הריצה הקיימת (שורות 83-88), הוספת:
```
.neq('scanner', 'jina')
```
כך ש-Firecrawl בודק רק ריצות שאינן Jina (ריצות ישנות ללא scanner או ריצות Firecrawl).

## מה לא ישתנה
- סריקות 2 (Jina) ימשיכו לעבוד בדיוק כמו היום
- סריקות 1 (Firecrawl) ימשיכו לעבוד כרגיל
- הלוגיקה של stale run detection ב-Jina נשארת כמו שהיא
- שום דבר לא נשבר - רק מוסיפים פילטר אחד בכל קובץ

## תוצאה
אפשר יהיה להריץ סריקת Firecrawl וסריקת Jina על אותו config במקביל, בלי 409.




## תוכנית: 4 תיקוני UI

### שינויים

| # | תיקון | קובץ | פרטים |
|---|---|---|---|
| 1 | העלאת הפריוויו | `AutoPublishManager.tsx` שורה 875 | שינוי `lg:top-4` ל-`lg:top-0` + הוספת `mt-0` |
| 2 | שמות מלאים לכפתורי פלטפורמה + IG "לחוץ" | `AutoPublishManager.tsx` שורות 580-596 | שינוי "FB" ל-"Facebook" ו-"IG" ל-"Instagram". הוספת `platforms.instagram` כ-default `true` בסטייט ההתחלתי |
| 3 | העלאת שדה הוספת האשטג לשורת הקבוצות | `HashtagGroupSelector.tsx` שורות 128-141 | העברת ה-Input+Button של "הוסף האשטג" לתוך ה-flex של ה-group chips (שורה 89), הקטנת ה-Input ל-`w-28` והסרת ה-div הנפרד |
| 4 | העלאת כפתורי פעולה לשורת התאריך | `AutoPublishManager.tsx` שורות 814-858 | מיזוג ה-div של התאריך+שעה (שורות 816-829) עם ה-div של הכפתורים (שורות 833-858) לשורה אחת עם `flex flex-wrap items-center gap-2` |

### סיכון: אפסי — שינויי layout בלבד


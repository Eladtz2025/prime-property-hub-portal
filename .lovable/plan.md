

# תיקון נתונים קיימים - שכונות יפו שגויות

## סקירת הבעיה

מצאתי **עשרות נכסים** בדאטאבייס שמסומנים כ"יפו" אבל הם בכלל לא ביפו:

| רחוב | שכונה שגויה | שכונה נכונה |
|------|-------------|-------------|
| ארלוזורוב | יפו | לב העיר |
| אבן גבירול | יפו | מרכז העיר |
| דיזנגוף | יפו | צפון ישן |
| זבוטינסקי | יפו | כיכר המדינה |
| פנקס | יפו | כיכר המדינה |
| דרך מנחם בגין | יפו | שרונה |
| יגאל אלון (ביצרון) | יפו | ביצרון |

## פתרון

ליצור סקריפט SQL שמתקן את הנתונים על פי הכתובת:

```sql
-- תיקון שכונות לפי רחובות ידועים
UPDATE scouted_properties SET 
  neighborhood = 'צפון ישן',
  title = REPLACE(title, 'יפו', 'צפון ישן')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%דיזנגוף%'
  AND address NOT ILIKE '%יפו ג%'
  AND address NOT ILIKE '%יפו ד%';

UPDATE scouted_properties SET 
  neighborhood = 'לב העיר',
  title = REPLACE(title, 'יפו', 'לב העיר')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%ארלוזורוב%';

UPDATE scouted_properties SET 
  neighborhood = 'מרכז העיר',
  title = REPLACE(title, 'יפו', 'מרכז העיר')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%אבן גבירול%';

UPDATE scouted_properties SET 
  neighborhood = 'כיכר המדינה',
  title = REPLACE(title, 'יפו', 'כיכר המדינה')
WHERE neighborhood = 'יפו' 
  AND (address ILIKE '%ככר המדינה%' 
       OR address ILIKE '%זבוטינסקי%' 
       OR address ILIKE '%פנקס%');

UPDATE scouted_properties SET 
  neighborhood = 'ביצרון',
  title = REPLACE(title, 'יפו', 'ביצרון')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%ביצרון%';

UPDATE scouted_properties SET 
  neighborhood = 'שרונה',
  title = REPLACE(title, 'יפו', 'שרונה')
WHERE neighborhood = 'יפו' 
  AND address ILIKE '%מנחם בגין%';
```

## שלבי ביצוע

1. **בדיקה ראשונית** - ספירת הנכסים לתיקון בכל קטגוריה
2. **הרצת UPDATE** - תיקון השכונות לפי מיפוי רחובות
3. **אימות** - בדיקה שנכסים אמיתיים ביפו נשארו עם "יפו"

## פרטים טכניים

### לוגיקת זיהוי יפו אמיתי

נכס הוא באמת ביפו אם הכתובת מכילה:
- `יפו א/ב/ג/ד` (תת-שכונות)
- `עג'מי` / `עג׳מי`
- `גבעת התמרים`
- `יפו העתיקה`
- `נמל יפו`
- `פלורנטין` (גבול יפו)

נכס **לא** ביפו אם הכתובת מכילה רק "תל אביב יפו" בסוף.

### קבצים - אין שינויים לקוד

זה תיקון נתונים בלבד דרך SQL migration.


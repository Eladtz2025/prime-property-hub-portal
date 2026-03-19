

## תיקון מערכת זיהוי כפילויות

### הבעיות שזוהו

בדיקת הנתונים חשפה 3 בעיות מרכזיות:

**א. כתובת בלי מספר בית = קבוצות זבל**
~2,200 מתוך 4,451 נכסים אקטיביים יש להם כתובת ללא מספר בית (למשל "הירקון", "פנקס", "נווה אביבים"). המערכת מקבצת את כולם כ"כפילות" רק כי הם באותו רחוב + קומה + חדרים דומים — למרות שהם דירות שונות לחלוטין.

**ב. השוואת כתובת גולמית**
הפונקציה `detect_duplicates_batch` משווה `sp.address = v_prop.address` — השוואה גולמית ללא נירמול. הפונקציה השנייה (`find_property_duplicate`) כן משתמשת ב-`normalize_address_for_matching` אבל ה-batch לא.

**ג. נכסים לא אקטיביים מוצגים בקבוצות**
השאילתה ב-`DeduplicationStatus.tsx` שולפת את כל הנכסים בקבוצה ללא סינון `is_active`.

### התיקון

**1. עדכון `detect_duplicates_batch` (SQL migration)**
- להשתמש ב-`normalize_address_for_matching` במקום השוואה גולמית
- **לדרוש שהכתובת תכיל מספר** (regex `\d`) — כתובת ללא מספר בית (כמו "הירקון") לא תשתתף בהתאמה
- לוודא שגם ה-match target מכיל מספר בכתובת

**2. עדכון `find_property_duplicate` (SQL migration)**
- אותו תנאי: לדרוש מספר בכתובת גם בפונקציה הזו

**3. סינון תצוגה (`DeduplicationStatus.tsx`)**
- להוסיף `.eq('is_active', true)` לשאילתת קבוצות הכפילויות

**4. איפוס מלא + סריקה מחדש**
- Migration שמאפס את כל ה-duplicate data (`duplicate_group_id`, `is_primary_listing`, `dedup_checked_at`)
- הריצה הבאה של dedup תקבץ מחדש עם הלוגיקה המתוקנת

### SQL מרכזי (detect_duplicates_batch — חלק ה-match)

```sql
-- Skip properties without a number in address
AND v_prop.address ~ '\d'

-- Match using normalized address (includes street number)
AND normalize_address_for_matching(sp.address) = normalize_address_for_matching(v_prop.address)

-- Also require match target has a number
AND sp.address ~ '\d'
```

### סיכום שינויים

| קובץ | שינוי |
|---|---|
| SQL migration | `detect_duplicates_batch` — נירמול כתובת + דרישת מספר בית |
| SQL migration | `find_property_duplicate` — אותו תנאי |
| SQL migration | איפוס כל ה-duplicate data |
| `DeduplicationStatus.tsx` | סינון `is_active = true` בתצוגה |

### תוצאה צפויה
- ~2,200 נכסים ללא מספר בית לא ישתתפו בזיהוי כפילויות
- קבוצות כמו "הירקון" יפורקו — רק דירות עם כתובת מדויקת (כולל מספר) יקובצו
- נכסים שהוסרו לא יוצגו בקבוצות
- מספר הקבוצות ירד משמעותית (מ-659 למשהו הרבה יותר מדויק)


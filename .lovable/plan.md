
# תיקון: חזרה לארכיטקטורה המקורית עם שיפור קטן

## מה עבד בהרצה המקורית

ההרצה הראשונה **עבדה** והצליחה לבדוק ~1,040 נכסים עם batch_size=50. הבעיה הייתה רק שהייתה **עומס יתר** כי שלחנו 5 batches במקביל.

## מה שבר את זה

השינויים שעשיתי:
1. הורדתי batch_size מ-50 ל-20 ❌
2. הוספתי `await sleep(55000)` - **חוסם את ה-Edge Function!** ❌
3. זה גרם ל-504 timeouts בגלל שה-trigger חיכה יותר מ-60 שניות

## הפתרון הפשוט

להחזיר את הלוגיקה המקורית עם שינוי אחד קטן:

| הגדרה | לפני (עבד) | עכשיו (שבור) | תיקון |
|-------|------------|--------------|-------|
| batch_size | 50 | 20 | **50** |
| MAX_BATCHES_PER_RUN | 5 | 2 | **1** |
| DELAY_BETWEEN_BATCHES | 200ms | 500ms | **0** (לא רלוונטי) |
| sleep before self-trigger | 0 | 55 שניות! | **0** |

### למה 1 batch בכל פעם?

- `trigger-availability-check` שולח batch אחד ל-`check-property-availability`
- **Fire and forget** - לא מחכה לתשובה
- מיד עושה self-trigger עם שאר הנכסים
- כל batch רץ **באופן עצמאי** - אם אחד נתקע, השאר ממשיכים
- אין עומס על Firecrawl כי יש 150ms delay בין כל בקשה ב-check

### תהליך:

```text
Trigger #1: שולח batch של 50 נכסים → self-trigger מיידי
     ↓
Trigger #2: שולח batch של 50 נכסים → self-trigger מיידי
     ↓
Trigger #3: שולח batch של 50 נכסים → self-trigger מיידי
     ↓
... (118 פעמים סה"כ ל-5,900 נכסים)
     ↓
כל ה-batches רצים במקביל, כל אחד לוקח ~60 שניות
```

---

## שינויים נדרשים

### 1. החזרת batch_size ל-50 (SQL)

```sql
UPDATE scout_settings 
SET setting_value = '50' 
WHERE category = 'availability' AND setting_key = 'batch_size';
```

### 2. שינוי trigger-availability-check

```typescript
// Maximum batches per run - שולחים 1 בכל פעם
const MAX_BATCHES_PER_RUN = 1;

// בלי delay - fire and forget מיידי
// מוחקים את ה-await sleep(55000)!
```

שורות לשנות:
- שורה 13: `MAX_BATCHES_PER_RUN = 2` → `MAX_BATCHES_PER_RUN = 1`
- שורות 142-145: למחוק את ה-`await sleep(55000)` וההודעה לפניו

---

## יתרונות

1. **פשוט** - חזרה ללוגיקה שעבדה
2. **מהיר** - כל ה-batches נשלחים מהר
3. **עמיד** - אם batch נכשל, השאר ממשיכים
4. **לא חוסם** - trigger-availability-check מסיים תוך שנייה

## זמן ריצה צפוי

- 5,900 נכסים ÷ 50 = 118 batches
- כל batch = ~50-60 שניות (50 נכסים × 1 שנייה לFirecrawl)
- כולם רצים **במקביל** אז סך הכל ~60 שניות!
- (בפועל קצת יותר בגלל עומס על Firecrawl, אבל עדיין מהיר)

## מעקב אוטומטי

אחרי ההרצה, אוכל לבדוק כל כמה דקות:
```sql
SELECT COUNT(*) FILTER (WHERE is_active = false AND status = 'inactive') FROM scouted_properties
```

ולהריץ שוב אם צריך.

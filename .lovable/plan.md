## איפוס Backfill ל-2,096 נכסי יד2 חסרי תיאור

### מה זה עושה
מאפס את `data_completed_at = NULL` ו-`backfill_status = 'pending'` עבור נכסי יד2 פעילים שחסר להם `description` (או ריק), כך שה-cron הקיים של חצות יקלוט אותם מחדש עם הקוד החדש שכבר פרוס (חילוץ description + images דרך CF Worker + __NEXT_DATA__).

### תנאי הסינון (מחמיר ובטוח)
- `source = 'yad2'`
- `is_active = true`
- `(description IS NULL OR trim(description) = '')`
- **לא** לגעת בנכסי מדל"ן/הומלס
- **לא** לאפס נכסים שיש להם תיאור תקין כבר עכשיו

### ביצוע
1. **ספירה מקדימה** (SELECT) - לוודא שמספר הנכסים סביר (~2,096), לא יותר.
2. **UPDATE יחיד** דרך migration:
   ```sql
   UPDATE scouted_properties
   SET data_completed_at = NULL,
       backfill_status = 'pending'
   WHERE source = 'yad2'
     AND is_active = true
     AND (description IS NULL OR trim(description) = '');
   ```
3. **אימות** - SELECT count לאחר הריצה לוודא שזה תאם לציפייה.

### מה זה לא עושה
- לא מוחק שום נתון קיים
- לא משנה features/price/rooms/images שכבר מולאו
- לא נוגע ב-Madlan / Homeless
- לא מריץ backfill ידני - רק מסמן לקליטה ע"י ה-cron הבא

### לאחר האיפוס
ה-cron הקיים של ה-backfill (`backfill-property-data-jina`) ירוץ בחצות הקרוב ויעבד את הנכסים בקצב הרגיל שלו (small batches עם CF Worker). אעקוב אחרי הריצה הראשונה ואדווח על הצלחה/בעיות.

### סיכון
נמוך מאוד - פעולה הפיכה (אם משהו ישתבש פשוט נחכה למחזור הבא; הנכסים נשארים פעילים וגלויים). הקוד החדש כבר נבדק ידנית על 5 נכסים בהצלחה בריצה הקודמת.
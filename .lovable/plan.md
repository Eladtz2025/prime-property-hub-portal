

## תיקון עקביות casing ב-scout-madlan-jina

### שינויים בקובץ `supabase/functions/scout-madlan-jina/index.ts`

1. **שינוי שם המשתנה**: `Madlan_CONFIG` → `MADLAN_CONFIG` (להתאים ל-`YAD2_CONFIG`)
2. **תיקון כל הלוגים** לפורמט עקבי `Madlan-Jina` (כמו `Yad2-Jina` ביד2)
3. **עדכון כל ההפניות** ל-`MADLAN_CONFIG.MAX_RETRIES`, `MADLAN_CONFIG.PAGE_DELAY_MS` וכו׳

### מקומות לשנות
- שורה 59: `Madlan_CONFIG` → `MADLAN_CONFIG`
- שורה 133: `Madlan_CONFIG.MAX_RETRIES` → `MADLAN_CONFIG.MAX_RETRIES`
- שורה 228: `Madlan_CONFIG.RETRY_DELAY_MS` → `MADLAN_CONFIG.RETRY_DELAY_MS`
- שורה 230: `Madlan_CONFIG.PAGE_DELAY_MS` → `MADLAN_CONFIG.PAGE_DELAY_MS`
- שורה 279: `Madlan_CONFIG.MAX_BLOCK_RETRIES` → `MADLAN_CONFIG.MAX_BLOCK_RETRIES`
- כל הודעות console.log/warn/error: להחליף `madlan-Jina` ל-`Madlan-Jina` לעקביות

### הערה חשובה
זהו שינוי קוסמטי בלבד — לא ישפיע על בעיית ה-0 תוצאות שנובעת מחסימה חיצונית של מדל"ן. אבל יהפוך את הקוד לנקי ועקבי.


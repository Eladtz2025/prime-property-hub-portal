
# הסרת מגבלת ה-Daily Limit מבדיקות זמינות

## הבעיה
בדיקת הזמינות נעצרת כשמגיעים ל-2,500 נכסים ביום בגלל מנגנון `daily_limit` מובנה. אין צורך במגבלה כי Firecrawl לא עולה כסף.

## השינוי
הסרת כל הלוגיקה של daily limit מהקובץ `supabase/functions/trigger-availability-check/index.ts`:

1. **הסרת הבדיקה היומית** (שורות 103-138) - כל הקוד שבודק כמה נכסים כבר נבדקו היום ועוצר אם הגענו למגבלה
2. **הסרת חישוב ה-quota** - המשתנים `remainingQuota` ו-`remainingDailyQuota` שהגבילו את מספר הנכסים לשליפה
3. **עדכון לוגיקת Self-chain** - החלטת ההמשך תהיה רק לפי האם יש עוד batches ולפי `schedule_end_time`, בלי בדיקת quota
4. **ניקוי ה-response** - הסרת שדות `daily_limit` ו-`processed_today` מהתשובה

### קובץ לעריכה:
- `supabase/functions/trigger-availability-check/index.ts`

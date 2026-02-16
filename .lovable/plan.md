
## תיקון שריפת קרדיטים של Firecrawl + אופטימיזציות

### ✅ בוצע

#### תיקון 1: עדכון `availability_checked_at` גם לתוצאות retryable
**קובץ:** `supabase/functions/check-property-availability/index.ts`
- עכשיו גם תוצאות retryable מעדכנות `availability_checked_at` ו-`availability_check_count`
- נכסים שנכשלים יוצאים מהתור המיידי וחוזרים רק אחרי 2 ימים

#### תיקון 2: סינון duplicate losers מהתור
**קובץ:** Migration - עדכון RPC `get_properties_needing_availability_check`
- נוסף תנאי: `AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)`
- חוסך ~216 קרדיטים מיותרים לכל מחזור

#### תיקון 3: סימון `backfill_status = 'not_needed'` מוקדם
**קובץ:** `supabase/functions/_shared/property-helpers.ts`
- אם כל השדות הקריטיים מלאים (rooms, price, size, floor, neighborhood, features) - מסמן `not_needed` מיד
- חוסך קריאות Firecrawl של backfill על נכסים שכבר מלאים

#### תיקון מערכת סיבוב מפתחות (בוצע קודם)
- מניעת לולאה אינסופית כשמפתח ה-env נחסם
- עצירת self-chaining כשכל המפתחות מותשים
- שיפור auto-reset למפתחות מותשים מעל 24 שעות



# תיקון: false-positive deactivation + timeout retry

## בעיות שתוקנו

### 1. False-positive deactivation (קריטי)
**הבעיה:** הנכס `awc9nzvc` סומן כ-inactive למרות שהוא אקטיבי. הסיבה: Firecrawl קיבל דף שגיאה זמני מ-Yad2 (חסימת proxy), והמערכת זיהתה אינדיקטור הסרה ("חיפשנו בכל מקום") וסימנה מיד כ-inactive בלי לבדוק אם יש תוכן נכס אמיתי.

**הפתרון:** שינוי סדר הבדיקה ב-`checkWithFirecrawl`:
- **לפני:** Removal indicators → Property indicators (indicator-first)
- **אחרי:** HTTP status → Redirects → Property indicators → Removal indicators (property-first)
- אם נמצאים גם removal indicators וגם property indicators, **property indicators מנצחים**
- תוכן קצר מאוד (< 200 תווים) עם removal indicator → חשוד כשגיאה זמנית, לא מסמנים inactive

### 2. Timeout properties נשארים בתור
**הבעיה:** 484 נכסים שעשו timeout סומנו כ"נבדקו" (עודכן `availability_checked_at`) למרות שלא באמת נבדקו. הם לא נכנסו לתור שוב עד שעבר `recheck_interval_days`.

**הפתרון:** תוצאות retryable (timeout, firecrawl failure, short suspicious pages) **לא מעדכנות** את `availability_checked_at`, כך שהנכס נשאר בתור לבדיקה חוזרת בריצה הבאה.

### 3. שחרור נעילה כשאין נכסים (תוקן קודם)
הוספת `status: 'completed'` לפני return מוקדם.

### 4. תעדוף נכסים לא-נבדקים
שינוי ב-`trigger-availability-check`: סדר לפי `availability_checked_at` עם `nullsFirst: true` כדי שנכסים שמעולם לא נבדקו (או שאופסו) ייבדקו ראשונים.

## שינויים בקבצים
1. `supabase/functions/check-property-availability/index.ts` - Property-first logic, retryable reasons don't update timestamp
2. `supabase/functions/trigger-availability-check/index.ts` - nullsFirst ordering
3. `supabase/functions/_shared/availability-indicators.ts` - ללא שינוי (האינדיקטורים עצמם נכונים)

## איפוס DB
- 484 נכסי timeout אופסו (`availability_checked_at = NULL`)
- `awc9nzvc` הוחזר ל-active
- סה"כ 485 נכסים בתור לבדיקה

## סטטוס
- ✅ קוד נפרס
- ✅ DB אופס
- 485 נכסים ממתינים לבדיקה (ייבדקו תוך ~13 שעות עם batch_size=6)



# סידור הדשבורד — הסרת כפילויות והעברת לוח זמנים

## מה משתנה

### 1. הסרת "פעולות מהירות"
הקומפוננטה `AvailabilityActions` תוסר מתחתית הדשבורד. הפעולות שבה (הפעלת בדיקת זמינות, איפוס Timeouts, בדיקת URL) כבר קיימות במקומות אחרים:
- הפעלת בדיקת זמינות — כפתור ה-Play בכרטיסיית "בדיקת זמינות"
- איפוס Timeouts ובדיקת URL — פחות בשימוש, לא נדרשים

### 2. העברת לוח הזמנים
הקומפוננטה `ScheduleSummaryCard` תועבר מתוך הגדרות הסריקה (בתוך ה-Dialog של UnifiedScoutSettings) למקום של "פעולות מהירות" — כלומר מתחת ל-Process Cards בדשבורד הראשי.

### 3. הסרת כפילויות מהגדרות הסריקות
בתוך `UnifiedScoutSettings` יש כרטיסיות הגדרות (כפילויות, התאמות, זמינות, כשירות לקוח, תיקון סיווג) שהן בעצם כפולות — הן מופיעות גם כ-ProcessCards בדשבורד. ההגדרות עצמן (Dialogs) ישארו, אבל הכרטיסיות שמפנות אליהן יוסרו מתוך UnifiedScoutSettings כדי שלא יהיו כפולות.

---

## פרטים טכניים

### קובץ: `src/components/scout/ChecksDashboard.tsx`
- שורה 315: החלפת `<AvailabilityActions />` ב-`<ScheduleSummaryCard />`
- הוספת import ל-`ScheduleSummaryCard`
- הסרת import ל-`AvailabilityActions`

### קובץ: `src/components/scout/UnifiedScoutSettings.tsx`
- הסרת ה-`ScheduleSummaryCard` מסוף ה-AccordionContent (שורה 1331)
- הסרת import ל-`ScheduleSummaryCard` (שורה 68)
- הסרת ה-grid עם 5 כרטיסיות ההגדרות (שורות 1163-1328): כפילויות, התאמות, זמינות, כשירות לקוח, תיקון סיווג — כולן כבר נגישות דרך ה-ProcessCards בדשבורד
- ה-Dialogs עצמם (שורות 1338-1778) יישארו כי הם משמשים את הכרטיסיות בדשבורד

**הערה**: ה-Dialogs של כפילויות, התאמות, זמינות, כשירות ותיקון סיווג נשארים ב-UnifiedScoutSettings כי הם נפתחים מתוכו. אם הם צריכים להיות נגישים מה-ProcessCards בדשבורד, נצטרך להעביר אותם — אבל כרגע הם לא כפולים עם ה-ProcessCards (ה-ProcessCards פותחים Dialogs אחרים: היסטוריה/הגדרות ייחודיות).

### קובץ: `src/components/scout/availability/AvailabilityActions.tsx`
- הקובץ יישאר (לא נמחק) למקרה שיידרש בעתיד, אבל לא ייובא יותר.



# הוספת פירוט כפילויות עם לינקים לדשבורד

## מה יתווסף

סקציה חדשה בתוך `DeduplicationStatus.tsx` שמציגה את **קבוצות הכפילויות** בצורה מפורטת:

### 1. טבלת קבוצות כפילויות (Expandable)

מתחת להיסטוריית הריצות, תתווסף טבלה של כל 244 הקבוצות (עם pagination של 20 לדף):

| כתובת | קומה | חדרים | מחיר | נכסים בקבוצה | Winner |
|--------|------|--------|------|-------------|--------|
| פנקס | 9 | 4.5 | 25,000 | 7 | yad2.co.il/... |

- לחיצה על שורה תפתח (Collapsible) את כל הנכסים בקבוצה
- כל נכס יציג: כתובת, מחיר, חדרים, קומה, מקור (yad2/madlan/homeless), ולינק ישיר (פותח בטאב חדש)
- ה-Winner מסומן בירוק, ה-Losers באפור
- הפרש מחיר מוצג כאחוז מול ה-Winner

### 2. Query חדש

שאילתה שמביאה את כל הנכסים עם `duplicate_group_id IS NOT NULL`, מקובצים לפי הקבוצה, ממוינים לפי גודל הקבוצה (הגדולות קודם).

### 3. פירוט טכני

**קובץ שישתנה:** `src/components/scout/checks/DeduplicationStatus.tsx`

**שינויים:**
- הוספת query חדש `dedup-groups-detail` שמביא נכסים עם `duplicate_group_id IS NOT NULL` כולל שדות: `id, address, city, price, rooms, floor, source_url, is_primary_listing, duplicate_group_id, source`
- קיבוץ בצד הקליינט לפי `duplicate_group_id`
- הצגה ב-Collapsible/Accordion: כל קבוצה כשורה מסכמת, לחיצה פותחת את הפירוט
- Pagination (20 קבוצות לדף) עם כפתורי הבא/קודם
- לינקים ל-source_url נפתחים בטאב חדש עם אייקון ExternalLink
- Badge צבעוני למקור (yad2 = כחול, madlan = ירוק, homeless = סגול)

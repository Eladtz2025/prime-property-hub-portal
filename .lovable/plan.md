

# שדרוג המוניטור החי - פיד מפורט ועשיר

## הבעיה הנוכחית
המוניטור החי מציג מידע בסיסי מדי:
- עבור **בדיקת זמינות**: רק כתובת + תוצאה (אקטיבי/לא אקטיבי) - חסרים פרטים כמו URL מקור, סיבת כשלון מפורטת
- עבור **סריקות**: רק שורה כללית "X נמצאו, Y חדשים" - אין פירוט לפי דף, אין שגיאות ספציפיות
- עבור **Backfill**: רק progress bar כללי - אין פירוט לפי שדות שעודכנו, אין פרטי נכס ספציפי
- אין הבחנה ויזואלית חזקה בין סוגי תהליכים

## הפתרון - מוניטור חי מפורט

### מבנה חדש של כל שורה בפיד

כל שורה תהיה **רב-שורתית** (2 שורות) במקום שורה אחת צפופה:

**שורה עליונה**: timestamp | אייקון סוג | כתובת/שם | תוצאה
**שורה תחתונה**: פרטים מפורטים - משתנה לפי סוג התהליך:

#### בדיקת זמינות:
```
15:32:45  [shield]  V  הרצל 15, תל אביב  |  YAD2  |  ₪8.5K  3ח׳
         URL: yad2.co.il/item/abc123  |  בדיקת HEAD: 200  |  תוכן: מחיר+חדרים נמצאו  |  אקטיבי
```

```
15:32:52  [shield]  X  דיזנגוף 120  |  MDLN  |  ₪12K  4ח׳
         URL: madlan.co.il/item/xyz  |  HEAD: 301 redirect  |  הפניה לעמוד ראשי  |  הוסר
```

```
15:33:01  [shield]  !  אלנבי 50  |  YAD2
         URL: yad2.co.il/item/def  |  Timeout אחרי 50s  |  חוזר לתור
```

#### סריקות (page-by-page):
```
15:40:12  [search]  V  עמ׳ 2 - yad2.co.il  |  YAD2
         URL: yad2.co.il/rent?page=2  |  20 נמצאו, 16 חדשים  |  16.0s
```

```
15:40:30  [search]  X  עמ׳ 4 - yad2.co.il  |  YAD2
         URL: yad2.co.il/rent?page=4  |  BLOCKED: all_urls_failed_or_blocked  |  11.8s  |  ניסיון 1/2
```

#### Backfill (השלמת נתונים):
```
15:45:10  [database]  V  בן יהודה 30, תל אביב  |  YAD2
         עודכנו: קומה(3), גודל(85מ״ר), מרפסת, ממ"ד  |  סיווג: פרטי  |  12.3s
```

```
15:45:22  [database]  X  רוטשילד 5  |  MDLN
         Scrape failed: Firecrawl timeout  |  ניסיון 1/3
```

### שינויים טכניים

#### 1. שדרוג `LiveMonitor.tsx`
- **סריקות**: שליפת `page_stats` מ-`scout_runs` (כבר קיים ב-DB) - מציג כל דף בנפרד עם URL, כמות נמצאו, שגיאות, ו-duration
- **Backfill**: שליפת `summary_data` מ-`backfill_progress` - מציג סיכום שדות שעודכנו (floor, size, rooms וכו׳), כשלונות scrape, סיווגי broker
- **זמינות**: מציג את ה-`source_url` המלא, סוג הבדיקה (HEAD/content), קוד HTTP, סיבת כשלון מפורטת
- **כל סוג**: שורה ראשית + שורת פרטים מתחתיה, עם צבע רקע שונה לפי סוג (כחול לזמינות, כתום לסריקה, ירוק ל-backfill)
- **אנימציה**: השורה האחרונה מקבלת highlight עם fade-out כדי להראות "עכשיו נבדק"
- **גובה מוגדל**: max-height ל-400px (במקום 300px) כדי לראות יותר פרטים

#### 2. פירוט הנתונים שכבר קיימים ב-DB

**availability_check_runs.run_details** (כבר מכיל):
- `property_id`, `address`, `source_url`, `source`, `reason`, `is_inactive`, `checked_at`
- `price`, `rooms`, `neighborhood`, `floor`
- חסר: סוג הבדיקה (HEAD/content) - נציג על סמך ה-reason

**scout_runs.page_stats** (כבר מכיל):
- `page`, `url`, `found`, `new`, `duration_ms`, `status`, `error`, `retry_count`

**backfill_progress.summary_data** (כבר מכיל):
- `fields_updated` (city, size, floor, price, rooms, neighborhood)
- `scrape_failed`, `no_new_data`, `features_updated`, `broker_classified`
- חסר: פרטי נכס ספציפי - נציג סיכום מצטבר של מה עודכן

### קבצים שישתנו

1. **`src/components/scout/checks/LiveMonitor.tsx`** - שכתוב מלא
   - שליפת `page_stats` מ-scout_runs
   - שליפת `summary_data` מ-backfill_progress
   - תצוגת שורות דו-שורתיות עם פרטים מלאים
   - צביעת רקע לפי סוג תהליך
   - אנימציית highlight לשורה אחרונה
   - הצגת שגיאות מפורטות (CAPTCHA, timeout, blocked, redirect)
   - הצגת URL מקור לכל נכס
   - סיכום מצטבר בראש כל תהליך (כמה OK, כמה failed, כמה timeout)

### ללא שינויי DB
כל הנתונים כבר קיימים בטבלאות - רק שינוי בצורת ההצגה.


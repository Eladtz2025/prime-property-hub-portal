## שלב 1: חילוץ טלפונים מ-Homeless

### מטרה
לחלץ אוטומטית מספרי טלפון של בעלי נכסים פרטיים מ-Homeless ולשמור אותם ב-`scouted_properties.owner_phone`. עבודה איטית, עקבית, ללא חסימות, חינם לחלוטין.

### היקף ראשוני
- **רק Homeless** בשלב הזה (Yad2/Madlan ייבדקו בשלב 2 אחרי probe).
- כ-2,297 נכסים פרטיים אקטיביים ללא טלפון (יורדים בהדרגה ככל ש-Homeless יחזיר תוצאות).

### 1. מיגרציית DB (דורש אישור)

הוספת עמודות ל-`scouted_properties`:
- `phone_extraction_status TEXT` — `pending` / `success` / `failed` / `not_found` / `skipped`
- `phone_extraction_attempts INT DEFAULT 0`
- `phone_extracted_at TIMESTAMPTZ`
- `phone_extraction_last_error TEXT`

טבלה חדשה `phone_extraction_runs`:
- `id, started_at, ended_at, status, properties_attempted, phones_found, errors_count, source, triggered_by, notes`
- RLS: read לאדמינים בלבד, write ל-service role.

אינדקס חלקי לזירוז ה-worker:
```sql
CREATE INDEX idx_sp_phone_extraction_queue 
ON scouted_properties(phone_extraction_status, phone_extraction_attempts) 
WHERE is_active = true 
  AND is_private = true 
  AND (owner_phone IS NULL OR owner_phone = '')
  AND source = 'homeless';
```

**אפס שינוי על עמודות קיימות. אפס טריגרים חדשים.**

### 2. Edge Functions

**`extract-phone`** (stateless)
- Input: `{ property_id, source_url, source }`
- Logic ל-Homeless: `fetch(source_url)` → regex על `var phone = "0\d{8,9}"` או `tel:` ב-HTML → ניקוי/ולידציה (10 ספרות, מתחיל ב-0, פורמט ישראלי) → מחזיר phone או null.
- כותב ל-DB: `owner_phone`, `phone_extraction_status`, `phone_extracted_at`, `phone_extraction_attempts++`.
- שומר על `data-integrity-preservation` — לא נוגע בשום עמודה אחרת.

**`phone-extraction-worker`** (cron)
- בדיקת kill switch ב-`feature_flags` (`phone_extraction_enabled`).
- בדיקת חלון זמן: 09:00–22:00 שעון ישראל (אם מחוץ — exit שקט).
- שולף נכס אחד מהתור (Homeless, פרטי, אקטיבי, ללא טלפון, attempts<3, status≠success).
- קורא ל-`extract-phone`.
- delay אקראי 15–45s לפני exit (כדי לא להיראות כמו בוט גם אם cron יקפיץ מהר).
- מתעד ב-`phone_extraction_runs`.

### 3. Cron
- כל דקה (`* * * * *`) ב-pg_cron → `phone-extraction-worker`.
- בקצב הזה: ~60 ניסיונות/שעה × 13 שעות = ~780/יום. כל ה-Homeless הפרטי יסיים תוך 3–4 ימים.

### 4. UI
כרטיסיה חדשה ב-`/admin-dashboard/scout` (או דשבורד הסקאוט הקיים):
- סך נכסים בתור / הצליחו / נכשלו / לא נמצא
- הריצה האחרונה (זמן, תוצאות)
- Toggle kill switch
- כפתור "הרץ ידנית עכשיו" (bypass חלון זמן)
- טבלה של 20 ניסיונות אחרונים

### 5. Feature Flag
הוספת רשומה ל-`feature_flags`: `phone_extraction_enabled = false` (יופעל ידנית אחרי בדיקה).

### פרטים טכניים

**Regex ל-Homeless** (אומת בניסויים קודמים):
```
/(?:var\s+phone\s*=\s*["']|tel:|טלפון[^0-9]{0,5})(0(?:5\d|[2-9])-?\d{7})/
```
ולידציה: 10 ספרות אחרי הסרת מקפים, מתחיל ב-`05` (סלולרי) או `0[2-4,8-9]` (קווי).

**בטיחות מערכות קיימות:**
- אפס שינוי ב-scout, matching, availability check.
- העמודות החדשות מתווספות עם default ולא NOT NULL.
- ה-worker עצמאי לחלוטין, לא חולק משאבים עם תהליכים אחרים.
- Kill switch זמין מהרגע הראשון.

### מה לא בשלב 1
- Yad2 (דורש probe נוסף לוודא תוכן ה-JSON של gw.yad2.co.il)
- Madlan (אותו דבר)
- אינטגרציה אוטומטית עם WhatsApp templates (הטלפון פשוט יישמר ב-DB, ה-UI הקיים יציג אותו)

### הזמנה לאישור
מאשר את שלב 1 כפי שמתואר? אם כן — אעבור ל-build mode ואבנה הכל בסשן אחד: מיגרציה → 2 Edge Functions → cron → kill switch → UI tile.

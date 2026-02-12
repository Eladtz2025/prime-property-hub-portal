

# שדרוג מעקב Backfill לייב - פרטי נכס בזמן אמת

## הבעיה
כרגע ה-backfill שומר ב-DB רק **מונים מצטברים** (`summary_data`) — למשל "rooms(3), price(2), scrape_failed(1)".
אין שום מידע **per-property**: איזו דירה נסרקת עכשיו, מאיזה מקור, מה נמצא, מה נכשל.

## הפתרון — שני שינויים

### 1. Edge Function: שמירת `recent_items` ב-`summary_data`
בכל פעם שנכס מעובד (הצלחה או כשלון), נוסיף אותו למערך `recent_items` בתוך `summary_data` (JSONB שכבר קיים).
נשמור רק את **10 האחרונים** (כדי לא לנפח את ה-JSONB).

כל item יכיל:
- `address` — כתובת הנכס
- `source` — yad2/madlan/homeless
- `source_url` — לינק מלא
- `status` — "ok" / "scrape_failed" / "no_content" / "no_new_data" / "blacklisted" / "update_error"
- `fields_found` — מה נמצא בסריקה (למשל `["rooms", "price", "floor", "balcony"]`)
- `fields_updated` — מה באמת עודכן (רק שדות שהיו חסרים)
- `broker_result` — "private" / "broker" / null
- `address_action` — "upgraded" / "set_new" / "mismatch" / null
- `timestamp` — מתי עובד

שמירה תתבצע **אחרי כל נכס** (לא רק בסוף הבאצ'), כי כבר יש update ל-`last_processed_id` אחרי כל item (שורה 724).

### 2. LiveMonitor: הצגת `recent_items` כשורות נפרדות
במקום שורה אחת מצטברת עבור backfill, נציג כל item מ-`recent_items` כשורה נפרדת בפיד:

```
15:45:10  [DB]  V  בן יהודה 30  |  YAD2  |  ₪8.5K  3ח׳
         נמצאו: קומה, גודל, מרפסת, ממ"ד  |  עודכנו: קומה(3), גודל(85מ״ר)  |  סיווג: פרטי

15:45:22  [DB]  X  רוטשילד 5  |  MDLN
         Scrape failed: Firecrawl timeout

15:45:35  [DB]  -  אלנבי 100  |  YAD2  |  ₪6K  2.5ח׳
         נמצאו: מחיר, חדרים  |  ללא נתונים חדשים (כבר קיימים)

15:45:48  [DB]  V  דיזנגוף 50  |  YAD2
         כתובת שודרגה: "דיזנגוף" → "דיזנגוף 50"  |  תכונות: חניה, מעלית
```

---

## פרטים טכניים

### קבצים שישתנו:

#### 1. `supabase/functions/backfill-property-data/index.ts`
**בתוך הלולאה (אחרי שורה 720)** — לפני ה-delay של 1500ms, נוסיף:
- בניית אובייקט `recentItem` עם כל הפרטים של הנכס שעובד
- שליפת `recent_items` הנוכחי מ-DB
- הוספת ה-item החדש, חיתוך ל-10 אחרונים
- שמירה חזרה ב-`summary_data.recent_items`

גם נוסיף `recentItem` עבור מקרי כשלון (scrape_failed, no_content, blacklisted) כדי שגם כשלונות יופיעו בפיד.

**אין שינויי DB** — משתמשים ב-JSONB שכבר קיים (`summary_data`).

#### 2. `src/components/scout/checks/LiveMonitor.tsx`
- הוספת interface `BackfillRecentItem` עם כל השדות
- שליפת `recent_items` מ-`backfillRun.summary_data`
- יצירת שורת FeedItem נפרדת לכל item עם:
  - שורה ראשית: כתובת, מקור, מחיר, חדרים
  - שורת פרטים: שדות שנמצאו, שדות שעודכנו, סיווג broker, שגיאות
- הסרת השורה המצטברת הנוכחית (שורות 222-248) והחלפתה בלולאה על `recent_items`

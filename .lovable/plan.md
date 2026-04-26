## בניית `scout-madlan-direct` — סורק מדלן ישיר ללא Jina

### מטרה
החלפת `scout-madlan-jina` בסורק עצמאי שמושך מודעות ישירות ממדלן באמצעות שיטת ה-iPhone UA + חילוץ HTML שהוכחה ב-PoC.

### ארכיטקטורה

```text
trigger-scout-pages-jina (קיים)
        │
        ▼
scout-madlan-direct  ◄── חדש
        │
        ├─ Stage 1: GET search page (iPhone UA) → חילוץ listing IDs
        ├─ Stage 2: לכל ID → GET /listings/<id> → חילוץ Apollo/__NEXT_DATA__
        │           → price, rooms, address, size, floor, neighborhood, type, images, description, contact
        ├─ Stage 3: סיווג private/broker (לפי contact info ב-Apollo state)
        └─ Stage 4: saveProperty() → scouted_properties (משתמש בלוגיקה הקיימת)
```

### קבצים

**חדש:** `supabase/functions/scout-madlan-direct/index.ts`
- מבוסס על המבנה של `scout-madlan-jina/index.ts` (אותו interface: scout_run_id, config, page params)
- מחליף את שכבת ה-fetch של Jina ב-fetch ישיר עם iPhone UA
- שומר את אותה לוגיקת `saveProperty`, dedup, matching trigger

**עדכון:** `supabase/config.toml` — הוספת `[functions.scout-madlan-direct]` עם `verify_jwt = false`

**עדכון:** `supabase/functions/trigger-scout-pages-jina/index.ts` — החלפת קריאה ל-`scout-madlan-jina` ב-`scout-madlan-direct` (madlan בלבד; yad2/homeless נשארים על Jina בינתיים)

### פרטים טכניים

**Headers (iPhone Safari):**
```
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) ...
Accept-Language: he-IL,he;q=0.9
Accept: text/html,...
```

**חילוץ נתונים מדף מודעה:**
- מקור ראשי: `__APOLLO_STATE__` (JSON מובנה — price, rooms, addressTitle, area, floor, neighborhood, type, mediaItems, description, contact info)
- fallback: `__NEXT_DATA__`
- fallback אחרון: regex על HTML

**Rate limiting:**
- delay של 800-1500ms בין בקשות (ג'יטר רנדומלי) למניעת חסימה
- batch size: 10 מודעות בכל יחידת זמן
- retry פעם אחת עם backoff על 403/429/503

**איתור private vs broker:**
- בדיקת `contactInfo.agencyName` / `contactInfo.type` ב-Apollo state
- אם broker → דילוג (לפי business policy הקיימת)

**שמירה:**
- שימוש מחדש בפונקציות העזר מ-`_shared/saveProperty` (אם קיים) או הקוד מ-`scout-madlan-jina`
- שמירת `source = 'madlan'`, `source_url = listing URL`
- triger קיים של dedup/matching יפעל אוטומטית

### בדיקה לאחר deploy
1. הרצה ידנית עם config של עיר בודדת + 1 עמוד
2. אימות שמודעות נשמרות עם price/rooms/address מלאים
3. השוואה לסריקת Jina מקבילה (כיסוי + שדות)

### מה לא משתנה
- yad2 + homeless נשארים על Jina (לא נגענו)
- כל לוגיקת ה-matching, dedup, availability check
- ה-cron schedule וה-trigger functions

### סיכון
נמוך — אם הסורק החדש נכשל, ניתן להחזיר את `trigger-scout-pages-jina` לקרוא ל-`scout-madlan-jina` (קיים ופועל).

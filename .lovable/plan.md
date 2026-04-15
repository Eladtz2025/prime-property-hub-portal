

# Yad2 Direct API Parser — בקפיל בלבד

## תגלית

יד2 חושפת API פנימי ציבורי בכתובת:
```
GET https://gw.yad2.co.il/realestate-item/{token}
```

ה-API מחזיר JSON מובנה עם **כל הנתונים** — כולל פיצ'רים boolean מדויקים, מחיר, חדרים, קומה, שטח, שכונה, עיר, רחוב, קואורדינטות, סוג מפרסם (פרטי/תיווך), תאריך כניסה, ועוד.

### שדות שהוכחו בבדיקה חיה (2 נכסים שונים):

| שדה API | מיפוי | סוג |
|---------|-------|-----|
| `adType` | `"private"` / `"agency"` → is_private | string |
| `price` | מחיר | number |
| `roomsCount` | חדרים | number |
| `squareMeter` | שטח | number |
| `floor` / `buildingTopFloor` | קומה / סה"כ קומות | number |
| `inProperty.includeAirconditioner` | aircon | boolean |
| `inProperty.includeBalcony` | balcony | boolean |
| `inProperty.includeElevator` | elevator | boolean |
| `inProperty.includeParking` | parking | boolean |
| `inProperty.includeSecurityRoom` | mamad | boolean |
| `inProperty.includeWarehouse` | storage | boolean |
| `inProperty.includeFurniture` | furnished | boolean |
| `inProperty.includeBoiler` | boiler | boolean |
| `inProperty.isHandicapped` | accessible | boolean |
| `balconiesCount` | מספר מרפסות | number |
| `parkingSpacesCount` | מספר חניות | number |
| `entranceDate` | תאריך כניסה | date |
| `isImmediateEntrance` / `isEnterDateFlexible` | כניסה מיידית/גמישה | boolean |
| `propertyCondition.text` | מצב הנכס | string |
| `neighborhood.text` | שכונה | string |
| `city.text` | עיר | string |
| `street.text` + `house.number` | כתובת | string |
| `description` | תיאור | string |

## מה לא ישתנה
- **סורקים** (`scout-yad2-jina`, `scout-madlan-jina`, `scout-homeless-jina`) — אפס שינויים
- **שאר לוגיקת הבקפיל** (Homeless, Madlan, Jina path) — ללא שינוי
- **שום מיגרציה** — אין שינוי ב-DB

## מה ישתנה

### קובץ חדש: `supabase/functions/_shared/yad2-detail-parser.ts`
- שולף token מה-source_url (`/item/{token}`)
- קורא ל-`gw.yad2.co.il/realestate-item/{token}` עם headers מינימליים (Accept: application/json, Referer: yad2.co.il)
- מחלץ את כל הפיצ'רים מ-`inProperty` (boolean מובנים — 100% מדויק)
- מחלץ size, floor, rooms, price, neighborhood, address
- מסווג `adType` ← `is_private`
- מחלץ `entranceDate` / `isImmediateEntrance`
- ניסיון חוזר פעם אחת אם נכשל

### עדכון: `supabase/functions/backfill-property-data-jina/index.ts`
- הוספת import ל-`yad2-detail-parser.ts`
- הוספת בלוק `if (prop.source === 'yad2')` **לפני** נתיב ה-Jina (אחרי בלוק מדל"ן, לפני שורה 601)
- לוגיקת מיזוג זהה למדל"ן: features דורסים (כי הם boolean מדויקים), שדות מספריים רק אם חסרים
- אם API מחזיר שגיאה → `backfill_status = 'failed'`

### בדיקה חיה
- אריץ את ה-API על 3-5 נכסי יד2 מה-DB לוודא שעובד מ-Edge Function (ללא CORS)

## יתרון מרכזי
- **דיוק 100%** — boolean מובנים מה-API, לא regex על טקסט
- **לא צריך Jina** — חוסך קריאת Jina לכל נכס יד2
- **מהיר** — קריאת API אחת במקום scrape + parse
- **פיצ'רים נוספים** — aircon, furnished, boiler, accessible, pets (מה-description) שלא נחלצו קודם
- **תיקון הבאג** — לא יהיו יותר features עם מפתחות מספריים (`0: ממ"ד`, `1: חניה`)

## סיכון
**נמוך מאוד** — אותו דפוס כמו מדל"ן והומלס. `if (source === 'yad2') { ... continue; }` לפני Jina. אם ה-API נכשל, הנכס מסומן `failed`.

## קבצים

| קובץ | פעולה |
|---|---|
| `supabase/functions/_shared/yad2-detail-parser.ts` | **חדש** |
| `supabase/functions/backfill-property-data-jina/index.ts` | import + בלוק yad2 |


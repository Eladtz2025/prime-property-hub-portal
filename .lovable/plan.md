## אתה צודק לגמרי

בדקתי חי עכשיו את אותו URL מ-Supabase, ב-5 אסטרטגיות שונות. התוצאות חד משמעיות:

| אסטרטגיה | סטטוס | תוצאה |
|---|---|---|
| A. Headers של בדיקת הזמינות (`Accept` + `Accept-Language` בלבד) | **403** | Captcha |
| B. אותה אסטרטגיה ללא UA | **403** | Captcha |
| **C. iPhone UA + Sec-Fetch (מה ש-backfill משתמש בו)** | **200** | ✅ 47KB SSR |
| D. Desktop Chrome UA | **403** | Captcha |
| E. iPhone UA בלי Sec-Fetch | **200** | ✅ |

## מה קורה

ה-backfill כבר עובד מצוין כי הוא קורא ל-`madlan-detail-parser.ts` ב-`_shared/`, ושם **כבר מוגדר ה-iPhone UA הנכון** (תוקן לפני כמה ימים).

בדיקת הזמינות (`check-property-availability-jina/index.ts`) כתבה לעצמה פונקציה נפרדת `checkMadlanDirect` עם הערה ישנה:
```
// CRITICAL: Madlan WAF... Only minimal headers pass through.
```
ההערה הזו **כבר לא נכונה** — מדלן שינו את ה-WAF, וה-headers ה"מינימליים" עכשיו מקבלים 403 קבוע. זאת הסיבה שאתה רואה שכל ה-Madlan נכשלים.

## התיקון המוצע

**קובץ אחד, ~6 שורות:** `supabase/functions/check-property-availability-jina/index.ts`, שורות 48-55

החלפת ה-headers הנוכחיים:
```typescript
headers: {
  'Accept': 'text/html',
  'Accept-Language': 'he-IL,he;q=0.9',
}
```

ב-headers הזהים לאלה שב-`_shared/madlan-detail-parser.ts` (אסטרטגיה C שהחזירה 200):
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'he-IL,he;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
}
```

ועדכון ההערה למעלה כך שתשקף את המציאות הנוכחית.

## מה אני **לא** נוגע

- ❌ ה-backfill (עובד מושלם, אין סיבה לגעת)
- ❌ Yad2 / Homeless (לוגיקת Jina נפרדת באותו קובץ — לא משתנה)
- ❌ לוגיקת תור / self-chain
- ❌ Database / RLS / migrations
- ❌ פרונט-אנד

## סיכון

**אפסי.** זאת בדיוק אותה שיטה שכבר רצה היום בהצלחה ב-backfill על אותם URLs. אם משהו ישתבש (לא צפוי), הנכס פשוט נשאר בתור — אין סיכוי לסמן בטעות נכס פעיל כ"לא זמין".

## אישור

מאשר שאעשה את השינוי הנקודתי הזה?
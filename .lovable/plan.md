

# תיקון Headers בבדיקת זמינות מדלן - התאמה ל-Backfill שעובד

## מה מצאנו

ה-backfill (`backfill-property-data-jina`) מצליח לסרוק נכסי מדלן בודדים (136 נכסים הושלמו היום!), אבל בדיקת הזמינות נכשלת על אותם URLs בדיוק.

### ההבדלים בין שתי המערכות

```text
Backfill (עובד על מדלן):              Availability (נכשל על מדלן):
-----------------------------------    -----------------------------------
'Accept': 'text/markdown'              'Accept': 'text/markdown'
'X-No-Cache': 'true'          <--      (מוסר למדלן!)
'X-Wait-For-Selector': 'body'          'X-Wait-For-Selector': 'body'
'X-Timeout': '35'             <--      'X-Timeout': '30'
                                        'X-Locale': 'he-IL'    <-- לא קיים ב-backfill!
```

שלושה הבדלים:
1. **X-No-Cache** - ב-backfill נשלח `true` לכולם (כולל מדלן). בזמינות הוסר למדלן
2. **X-Locale** - לא קיים כלל ב-backfill. בזמינות נשלח `he-IL`
3. **X-Timeout** - ב-backfill `35`, בזמינות `30`

## מה ישתנה

### קובץ: `supabase/functions/check-property-availability-jina/index.ts`

שינוי אחד בלבד - החלפת ה-headers (שורות 47-57) כך שיהיו **זהים בדיוק** ל-backfill:

```text
לפני (שורות 47-57):
  // FINAL: Headers that work on Jina free tier
  const headers = {
    'Accept': 'text/markdown',
    'X-Locale': 'he-IL',
    'X-Timeout': '30',
    'X-Wait-For-Selector': 'body',
  };
  if (!isMadlan) {
    headers['X-No-Cache'] = 'true';
  }

אחרי:
  // Headers identical to backfill-property-data-jina (proven to work on Madlan)
  const headers = {
    'Accept': 'text/markdown',
    'X-No-Cache': 'true',
    'X-Wait-For-Selector': 'body',
    'X-Timeout': '35',
  };
```

- הסרת `X-Locale: he-IL` (לא קיים ב-backfill)
- `X-No-Cache: true` לכולם (כולל מדלן)
- `X-Timeout: 35` (כמו ב-backfill)
- בלי if/else לפי source - אותם headers בדיוק לכולם

### Deploy ובדיקה
Deploy של `check-property-availability-jina`, ואז בדיקה על נכס מדלן בודד לוודא שזה עובד.

## למה זה אמור לעבוד
ה-backfill השתמש בדיוק ב-headers האלה והצליח על 136 נכסי מדלן **היום**. אנחנו פשוט מעתיקים מה שכבר מוכח.

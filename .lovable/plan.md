

# QA: השלמת נתונים 2 (Jina) - בעיות ותיקונים

## בעיות שנמצאו

### 1. מדלן עדיין עם לוגיקה מיוחדת (חוסם 100% מהנכסים)
**חומרה: קריטי**

בניגוד למה שנעשה בבדיקת זמינות 2, ב-backfill עדיין יש לוגיקה מיוחדת למדלן:
- שורה 437: `const isMadlanProp = prop.source === 'madlan'` 
- שורות 444-448: מדלן לא מקבל `X-No-Cache` (cached-first), ואז התוכן שחוזר הוא עמוד בית / CAPTCHA
- שורות 511-531: `classifyMadlanContent` חוסם כל תוצאה שהיא לא `ok`

**תוצאה בפועל**: כל 87 נכסי מדלן שממתינים להשלמה נכשלים ב-100% - הלוגים מראים רק `captcha` ו-`homepage_redirect`.

**תיקון**: להסיר את כל הלוגיקה המיוחדת למדלן, בדיוק כמו שנעשה בבדיקת זמינות 2. כל המקורות יקבלו `X-No-Cache: true` + `X-Proxy-Country: IL`.

### 2. Self-chain כפול (6 טריגרים במקביל)
**חומרה: בינוני**

בלוגים רואים "Next batch triggered successfully (Jina)" חוזר 6 פעמים באותה שנייה. זה קורה כי כשמספר batches רצים במקביל (מה-chain הכפול), כולם מסיימים ומפעילים chain חדש.

**תיקון**: לא נדרש תיקון קוד - הסרת הלוגיקה המיוחדת למדלן תגרום לנכסים להצליח במקום להיכשל תוך שניות, מה שיאט את ה-batches באופן טבעי.

### 3. תיאור שגוי בדשבורד
**חומרה: נמוך**

שורה 703 ב-ChecksDashboard.tsx אומרת:
> "משתמש ב-JINA_API_KEY עם פרוקסי premium לעקיפת חסימות"

אבל כל ה-API keys הוסרו מהמערכת והכל עובד על free tier.

**תיקון**: עדכון הטקסט לתיאור מדויק.

### 4. סטטוסים חסרים בהיסטוריה
**חומרה: נמוך**

ב-BackfillJinaHistory.tsx, ה-`statusConfig` לא כולל סטטוסים ספציפיים למדלן כמו `madlan_captcha`, `madlan_homepage_redirect`, `madlan_blocked`, `no_content`. הם מוצגים כטקסט גולמי.

**תיקון**: להוסיף את הסטטוסים החסרים ל-statusConfig. (אחרי תיקון 1, רוב הסטטוסים האלה ייעלמו, אבל `no_content` עדיין רלוונטי).

## שינויים נדרשים

### קובץ 1: `supabase/functions/backfill-property-data-jina/index.ts`

**שינוי A** (שורות 436-448) - הסרת לוגיקה מיוחדת למדלן ב-headers:
```typescript
// לפני:
const isMadlanProp = prop.source === 'madlan';
const jinaHeaders = { ... };
if (isMadlanProp) {
  jinaHeaders['X-Proxy-Country'] = 'IL';
} else {
  jinaHeaders['X-No-Cache'] = 'true';
}

// אחרי:
const jinaHeaders: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
  'X-Locale': 'he-IL',
  'X-No-Cache': 'true',
  'X-Proxy-Country': 'IL',
};
```

**שינוי B** (שורות 510-531) - הסרת classifyMadlanContent block:
```typescript
// להסיר את כל הבלוק:
if (isMadlanProp && markdown) {
  const { classifyMadlanContent, logMadlanScrapeResult } = await import(...);
  ...
  if (classification !== 'ok') { ... continue; }
}
```

### קובץ 2: `src/components/scout/ChecksDashboard.tsx`

**שינוי** (שורה 703) - תיקון תיאור:
```typescript
// לפני:
'משתמש ב-JINA_API_KEY עם פרוקסי premium לעקיפת חסימות.'

// אחרי:
'עובד על Jina Free Tier עם פרוקסי ישראלי (X-Proxy-Country: IL).'
```

### קובץ 3: `src/components/scout/checks/BackfillJinaHistory.tsx`

**שינוי** (שורות 38-46) - הוספת סטטוסים חסרים:
```typescript
// להוסיף:
no_content: { label: 'אין תוכן', variant: 'destructive' },
madlan_captcha: { label: 'CAPTCHA מדלן', variant: 'destructive' },
madlan_homepage_redirect: { label: 'הפניה לדף בית', variant: 'destructive' },
madlan_blocked: { label: 'חסימת מדלן', variant: 'destructive' },
update_error: { label: 'שגיאת עדכון', variant: 'destructive' },
```

## פריסה

- `backfill-property-data-jina`

## תוצאה צפויה

- נכסי מדלן יעברו השלמת נתונים בהצלחה במקום להיכשל ב-100%
- כל המקורות (yad2, madlan, homeless) יטופלו באותה לוגיקה פשוטה
- התיאור בדשבורד יהיה מדויק
- ההיסטוריה תציג סטטוסים קריאים


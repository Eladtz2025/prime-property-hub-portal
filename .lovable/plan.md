

# ניסוי שיטתי - תיקון Headers של מדלן בבדיקת זמינות

## הרעיון
יש 5 הבדלים בין ה-headers של הסקאוט (שעובד) לבדיקת הזמינות (שנכשלת). נבדוק כל אחד בנפרד כדי למצוא מה בדיוק חוסם.

## שלב 1: החזרה ל-Headers של הסקאוט (כולם ביחד)
קודם כל, נעתיק בדיוק את ה-headers מהסקאוט העובד לבדיקת הזמינות - כדי לוודא שזה בכלל עובד על דפי נכס בודדים:

```text
headers = {
  'Accept': 'text/markdown',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '30',
  'X-Locale': 'he-IL',
  'X-With-Generated-Alt': 'false',
};
// ללא X-Proxy-Country
```

Deploy + בדיקה על 1-2 נכסי מדלן.

## שלב 2: אם שלב 1 עובד - ניסויים בודדים
נחזיר כל header "בעייתי" אחד-אחד כדי למצוא מה חוסם:

**ניסוי A**: הוספת `X-Proxy-Country: IL` בלבד
**ניסוי B**: שינוי `X-Wait-For-Selector` ל-`[class*="listing"]`
**ניסוי C**: הסרת `X-No-Cache`
**ניסוי D**: הסרת `X-With-Generated-Alt`
**ניסוי E**: שינוי `X-Timeout` ל-45

כל ניסוי = deploy + בדיקה על נכס מדלן אחד.

## שלב 2 (חלופי): אם שלב 1 לא עובד
זה אומר שמדלן חוסם דפי נכס בודדים ללא קשר ל-headers, ואז צריך לחשוב על גישה אחרת (למשל בדיקה דרך דף חיפוש).

## פרטים טכניים

### קובץ שישתנה
`supabase/functions/check-property-availability-jina/index.ts` - פונקציית `checkWithJina`, שורות 47-61

### שלב 1 - קוד
```typescript
const headers: Record<string, string> = {
  'Accept': 'text/markdown',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '30',
  'X-Locale': 'he-IL',
  'X-With-Generated-Alt': 'false',
};
// ללא בלוקים של if (isMadlan) - אותם headers בדיוק לכל המקורות
```

### Deploy + בדיקה
אחרי כל שינוי: deploy של `check-property-availability-jina`, ואז קריאת curl לבדיקת נכס מדלן אחד ובדיקת הלוגים.




# תיקון: הסרת X-Proxy-Country: IL מ-scout-madlan-jina

## מה קרה
הוספתי בטעות את `X-Proxy-Country: IL` למרות שביקשת במפורש לא לכלול אותו.

## השינוי
קובץ: `supabase/functions/scout-madlan-jina/index.ts`

הסרת שורה 34 (`'X-Proxy-Country': 'IL',`) כך שה-headers יישארו:
```text
Accept: text/markdown
X-No-Cache: true
X-Wait-For-Selector: body
X-Timeout: 30
X-Locale: he-IL
```

## פריסה
deploy מחדש של scout-madlan-jina בלבד.


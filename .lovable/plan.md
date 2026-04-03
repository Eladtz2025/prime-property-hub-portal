

## תיקון Domain בפייסבוק Link Card — ללא שבירת דברים

### מצב נוכחי
- קיים כבר `api/og-redirect.js` — Vercel Edge Function שמזהה בוטים של פייסבוק ומפנה אותם ל-`og-property` של Supabase
- הבעיה: ב-`AutoPublishManager.tsx` ה-`linkUrl` שנשלח לפייסבוק הוא ישירות ל-Supabase (`jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=...`)
- לכן פייסבוק מציג את הדומיין של Supabase במקום `ctmarketproperties.com`

### הפתרון
במקום לשלוח את ה-Supabase URL, לשלוח את ה-URL של הדומיין הראשי:
```
https://www.ctmarketproperties.com/property/{id}?img_index=0&v=123...
```

כשפייסבוק יגרד את ה-URL הזה, `og-redirect.js` יזהה שזה בוט ויפנה ל-Supabase function — אבל הדומיין שיוצג יהיה `CTMARKETPROPERTIES.COM`.

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `api/og-redirect.js` | להעביר query params (img_index, custom_title, custom_desc, v) ל-Supabase function |
| 2 | `AutoPublishManager.tsx` | להחליף linkUrl מ-Supabase URL ל-`www.ctmarketproperties.com/property/{id}?...` |

### פירוט טכני

**`api/og-redirect.js` — העברת query params:**
```javascript
// לפני
const ogUrl = `...og-property?id=${propertyId}&lang=${lang}`;

// אחרי — מעביר את כל הפרמטרים
const ogUrl = `...og-property?id=${propertyId}&lang=${lang}&${url.searchParams.toString()}`;
```

**`AutoPublishManager.tsx` — linkUrl דרך הדומיין הראשי:**
```typescript
// לפני
linkUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=${selectedPropertyId}&lang=he&img_index=...`;

// אחרי
linkUrl = `https://www.ctmarketproperties.com/property/${selectedPropertyId}?img_index=${selectedPrimaryImageIndex}&v=${Date.now()}` 
  + (customLinkTitle ? `&custom_title=${encodeURIComponent(customLinkTitle)}` : '')
  + (customLinkDesc ? `&custom_desc=${encodeURIComponent(customLinkDesc)}` : '');
```

### למה זה בטוח
- `og-redirect.js` כבר עובד ומוכח — רק מוסיפים העברת פרמטרים
- משתמשים רגילים ימשיכו לקבל את ה-SPA כרגיל
- בוטים של פייסבוק יקבלו את אותו OG HTML בדיוק, רק מדומיין אחר
- ה-preview ב-UI לא משתנה

**2 קבצים, שינוי מינימלי.**


# Cloudflare Worker — Madlan & Yad2 Proxy

קובץ ה-Worker הזה לא נפרס אוטומטית. זה הקוד שאתה מעלה ידנית ל-Cloudflare פעם אחת.

## למה צריך את זה
Cloudflare חוסם את כתובות ה-IP של Supabase על מדל"ן ויד2. ה-Worker רץ ברשת של Cloudflare עצמה, ולכן יוצא מ-IP אחר שלא חסום.

## איך מעלים (פעם אחת, ~דקה)
1. כנס ל-https://dash.cloudflare.com
2. **Workers & Pages** → בחר את ה-Worker הקיים `yad2-proxy` (או צור חדש)
3. **Quick Edit** — מחק את כל הקוד הקיים והדבק את התוכן של `worker.js`
4. **Save and Deploy**
5. ודא ש-Variable `YAD2_PROXY_KEY` קיים תחת **Settings → Variables and Secrets** עם אותו ערך כמו ב-Supabase secret.

## מה השתנה מהגרסה הקודמת
- תמיכה ב-`target: "madlan"` בנוסף ל-`yad2`
- Headers נכונים אוטומטית לפי הדומיין (Next.js bypass למדל"ן, iPhone UA ליד2)
- Allowlist דומיינים (yad2.co.il + madlan.co.il בלבד)
- אפשרות לדרוס headers דרך body
- תאימות אחורה מלאה: בקשות יד2 קיימות ימשיכו לעבוד בלי שינוי

## בדיקה אחרי העלאה
מהאפליקציה, הפעל סריקת מדל"ן ידנית — הלוגים יראו `🌐 Madlan-NextJS attempt 1/2 — fetching via CF Worker`.
אם רואה `upstream=200, html=N chars` עם N > 50000 — עובד.

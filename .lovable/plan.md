# תוכנית: עקיפת חסימת Cloudflare של מדל"ן דרך Cloudflare Worker שלך

## הרעיון בקצרה
כבר יש לך Cloudflare Worker פעיל (`yad2-proxy.taylor-kelly88.workers.dev`) שמשמש כפרוקסי ליד2. נרחיב אותו לתמוך גם במדל"ן. בקשות יוצאות מ-IP של Cloudflare ולא מ-IP של Supabase, ולכן עוקפות את החסימה הנוכחית.

זה לא צד שלישי בתשלום — זה Worker שלך, על החשבון החינמי שלך (100K בקשות/יום בחינם, יותר מספיק).

## מה נבנה

### 1. עדכון ה-Worker שלך (קוד שאתה תעלה ל-Cloudflare
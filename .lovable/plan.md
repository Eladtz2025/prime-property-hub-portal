

## תיקון Domain ויישור RTL ב-Link Card של פייסבוק

### 2 הבעיות מהצילום

| # | בעיה | סיבה |
|---|-------|------|
| 1 | **Domain מופיע כ-`jswumsdymlooeobrxict.supabase.co`** | ה-URL שנשלח לפייסבוק הוא של Supabase function, ופייסבוק מציג את ה-domain של ה-URL שהוא גרד |
| 2 | **כותרת/תיאור Link Card מיושרים לשמאל** | פייסבוק מפשיט תווי RTL מ-OG tags. צריך לוודא שהתו הראשון של `og:title` ו-`og:description` הוא עברי (לא אימוג'י ולא Unicode control character) |

### פתרון

**בעיה 1 — Domain:**
ב-`AutoPublishManager.tsx`, ה-`linkUrl` נבנה עם URL של Supabase:
```
https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=...
```
צריך להחליף ל-URL דרך הדומיין הראשי. ה-edge function כבר מוגדרת גם דרך:
```
https://www.ctmarketproperties.com/functions/v1/og-property?id=...
```
אם Supabase custom domain לא מוגדר, האלטרנטיבה היא לשלוח את ה-`propertyUrl` הרגיל (`www.ctmarketproperties.com/property/{id}`) ולהבטיח שדף הנכס יכלול OG tags. 

**הפתרון הפרקטי:** להחליף את ה-domain ב-`linkUrl` מ-Supabase URL ל-URL עם הדומיין הראשי. Edge functions ב-Supabase נגישות גם דרך custom domain אם הוא מוגדר. אם לא — נשלח את `propertyUrl` ישירות ונוסיף OG tags ל-`index.html` כ-fallback.

**בעיה 2 — RTL:**
ב-`og-property/index.ts`, הכותרת מתחילה ב-`\u200F` (RTL mark) ואחריו `\u202B` (RTL embedding). פייסבוק מתעלם מתווים אלה ומסתכל על התו הראשון "האמיתי". אם זה אימוג'י — הוא מניח LTR.

**פתרון:** בכותרת, להעביר את הטקסט העברי לפני כל אימוג'י. בתיאור, להתחיל עם תו עברי ולא עם אימוג'י:
```
// לפני
og:title = "‏‫למכירה: דירת 3 חדרים..."
og:description = "‏‫🛏️ 3 חד' | 📐 68 מ"ר..."

// אחרי — ללא RTL control chars, מתחיל בעברית
og:title = "למכירה: דירת 3 חדרים..."
og:description = "3 חד' | 68 מ"ר | קומה 2 | מרפסת | חניה | תל אביב"
```

### קבצים

| # | קובץ | שינוי |
|---|-------|-------|
| 1 | `AutoPublishManager.tsx` | החלפת domain ב-`linkUrl` מ-Supabase ל-`www.ctmarketproperties.com` |
| 2 | `og-property/index.ts` | הסרת `\u200F`/`\u202B` מ-OG title ו-description; הסרת אימוג'ים מ-OG description כדי שהתו הראשון יהיה עברי; שמירת אימוג'ים ב-HTML body בלבד |
| 3 | `FacebookPostPreview.tsx` | סנכרון ה-preview: הצגת domain כ-`ctmarketproperties.com` ותיאור בלי אימוג'ים |

**3 קבצים + deploy של edge function.**


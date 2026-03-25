

## ביקורת QA סיבוב 4 — ממצאים חדשים

### 1. Hardcoded URL ישן — `primepropertyai.lovable.app`

**חומרה: בינונית (UX/מיתוג)**

`src/pages/BrokerageFormPage.tsx` שורה 881:
```tsx
window.location.href = 'https://primepropertyai.lovable.app';
```
אחרי חתימה על טופס תיווך, המשתמש מנותב ל-URL הישן של Lovable במקום לדומיין הייצור `https://www.ctmarketproperties.com/he`. זה גם חושף את הדומיין הפנימי של Lovable ללקוחות.

---

### 2. Hardcoded UUIDs + PII — סקריפטי one-time שנשארו

**חומרה: בינונית (אבטחה/ניקיון)**

**2.1 `src/utils/assignPropertiesToAgents.ts`** — Hardcoded UUIDs:
- `30300ca7-...` (טלי)
- `bfd1625c-...` (אלעד)

הקובץ **לא מיובא מאף מקום** — קוד מת לחלוטין.

**2.2 `src/utils/updateManagementProperties.ts`** — Hardcoded PII:
```ts
owner_name: 'אלעד צברי'
owner_phone: '0545503055'
```
הקובץ **מיובא ומופעל אוטומטית** בכל טעינה של `Properties.tsx` שורה 124. כלומר בכל כניסה לדף נכסים, מתבצע update ל-Supabase שמוסיף שם וטלפון אישי לכל נכסי הניהול ללא owner.

---

### 3. `migrateBenYehuda110.ts` — סקריפט חד-פעמי בקוד

**חומרה: נמוכה (ניקיון)**

298 שורות של נתוני migration hardcoded. מיובא ב-`PitchDeckBuilder.tsx` בלבד, ככפתור "Migrate Ben Yehuda 110". לאחר שהמיגרציה בוצעה — זה קוד מת.

---

### 4. `console.log` בקוד production

**חומרה: נמוכה (ביצועים/ניקיון)**

268 מופעים ב-19 קבצים. רובם debug logs שנשארו:
- `PropertyGallery.tsx` — 8 console.logs (upload debugging)
- `SlideEditor.tsx` — slide loading debug
- `DynamicPitchDeckView.tsx` — rendering debug
- `useUnifiedPropertyData.ts` — placeholder logs

לא בהכרח צריך לטפל בכולם, אבל הקריטיים הם אלה שמדפיסים מידע רגיש או נתוני DB.

---

### 5. Properties.tsx — Edge Function call בכל טעינה

**חומרה: בינונית (ביצועים)**

`src/pages/Properties.tsx` שורות 120-151: בכל טעינה של דף הנכסים, מתבצעים:
1. `updateManagementPropertiesToElad()` — DB update
2. `fetch(...assign-management-properties)` — Edge Function call

שניהם צריכים לרוץ רק פעם אחת, לא בכל כניסה לדף. זה יוצר עומס מיותר וגם ה-update עם PII בעייתי.

---

### 6. `window.close()` — לא עובד בדפדפנים מודרניים

**חומרה: נמוכה (UX)**

`BrokerageFormPage.tsx` שורה 880: `window.close()` לא עובד אלא אם הטאב נפתח ע"י `window.open()`. ברוב המקרים הלחיצה לא תסגור את הטאב, והמשתמש יישאר בדף ההפנייה.

---

### תוכנית תיקון

| # | תיקון | קבצים | חומרה |
|---|--------|--------|--------|
| 1 | שנה `primepropertyai.lovable.app` → `ctmarketproperties.com/he` | `BrokerageFormPage.tsx` | מיתוג |
| 2 | מחק `assignPropertiesToAgents.ts` (קוד מת) | `assignPropertiesToAgents.ts` | ניקיון |
| 3 | מחק `updateManagementProperties.ts` + הסר קריאה מ-Properties.tsx | `updateManagementProperties.ts`, `Properties.tsx` | אבטחה/ביצועים |
| 4 | הסר auto-call ל-`assign-management-properties` מ-Properties.tsx | `Properties.tsx` | ביצועים |
| 5 | תקן `window.close()` fallback → navigate ל-homepage | `BrokerageFormPage.tsx` | UX |
| 6 | נקה console.logs קריטיים (PropertyGallery, SlideEditor, useUnifiedPropertyData) | 3 קבצים | ניקיון |
| 7 | מחק `migrateBenYehuda110.ts` + הסר ייבוא מ-PitchDeckBuilder | `migrateBenYehuda110.ts`, `PitchDeckBuilder.tsx` | ניקיון |

**7 תיקונים, ~8 קבצים**


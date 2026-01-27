# Scout Architecture - הקוד שפיצח את הסריקות

> תיעוד הלוגיקה המותאמת לכל אתר - **הקוד**, לא ההגדרות.

---

## 1. מדלן (scout-madlan) - הפיצוח המרכזי

### ארכיטקטורה: סדרתית

```text
דף 1 → הצלחה → המתנה 5s → דף 2 → הצלחה → המתנה 5s → דף 3...
דף 1 → חסימה → המתנה 15s (recovery) → דף 2 (ממשיכים!)
```

### למה זה עובד:
- **כל דף מפעיל את הבא** - לא מקבילי, מונע חסימות מרובות requests
- **Recovery מחסימה** - אם יש CAPTCHA, ממתינים 15 שניות ומנסים את הדף הבא
- **לא עוצרים ריצה** - חסימה בודדת לא הורגת את כל הריצה

### הפרסר (parser-madlan.ts):

**מטפל ב-2 פורמטים שונים באותו אתר:**

**Format A - מתווכים (בלוקים מפוצלים):**
```markdown
- [![](image.jpg)](url)
תיווך שם הסוכנות
₪ 8,500
3 חדרים • 75 מ"ר • קומה 2
```

**Format B - פרטיים (בלוק אחד עם מפרידים):**
```markdown
- [![](image.jpg)\\₪ 7,000\\3 חדרים • 65 מ"ר • קומה 1](url)
```

**זיהוי מתווכים:**
- מילת מפתח `תיווך` או `בבלעדיות`
- תמונת סוכן (agent image pattern)
- לינק ל-`/agents/`

**ניקוי חכם:**
- מסיר ניווט בהתחלה
- מסיר blogs שמופיעים באמצע הדף (`יעניין אותך לדעת`)
- מסיר footer

---

## 2. יד2 (scout-yad2) - הפיצוח

### ארכיטקטורה: מקבילית

```text
trigger-scout-pages מתזמן:
  דף 1 → יוצא מיד
  דף 2 → יוצא אחרי 3 שניות
  דף 3 → יוצא אחרי 6 שניות
  ...
```

### הפרסר (parser-yad2.ts):

**Pattern ספציפי לזיהוי מודעות:**
```markdown
- [![Address](IMG)\\...\\₪ Price\\**Details**](url)
```

**Regex למציאת בלוקים:**
```javascript
/- \[!\[[^\]]*\]\([^\)]+\)\\[\s\S]*?\]\(https:\/\/www\.yad2\.co\.il\/realestate\/item\/[^\)]+\)/g
```

**זיהוי מתווכים:**
- כפילות שם סוכנות: `Agency Name\\Agency Name₪`
- מילות מפתח: `תיווך`, `סוכנות`, `משרד`, `נדל"ן`

**חילוץ נתונים מתוך bold text:**
```markdown
**כתובת, שכונה, עיר X חדרים • קומה Y • Z מ״ר**
```

**ניקוי:**
- מדלג על פרויקטים חדשים (`/yad1/`, `/project/`)
- מסיר headers וניווט
- מסיר footer (`כתבות שיעניינו`, `שאלות נפוצות`)

---

## 3. הומלס (scout-homeless) - הכי יציב

### ארכיטקטורה: מקבילית

```text
trigger-scout-pages מתזמן:
  דף 1 → יוצא מיד
  דף 2 → יוצא אחרי 2 שניות
  דף 3 → יוצא אחרי 4 שניות
  ...
```

### הפרסר (parser-homeless.ts):

**משתמש ב-cheerio לקריאת HTML:**
```javascript
const $ = cheerio.load(html);
$('tr[type="ad"]').each((_, row) => { ... });
```

**עמודות בטבלה לפי סדר קבוע:**
| עמודה | תוכן |
|-------|------|
| 3 | עיר |
| 4 | שכונה |
| 5 | רחוב |
| 6 | חדרים |
| 7 | קומה |
| 8 | מחיר |

**תמיד מסומן כפרטי** - הומלס זה בעיקר מודעות פרטיות

**ניקוי:**
- מתחיל מ-`כרגע בלוח`
- עוצר לפני pagination

### שדרוגים אחרונים (ינואר 2026):

**1. Async Parser עם DB Lookup:**
- הפרסר הפך ל-async לתמיכה בקריאות לדאטאבייס
- חיפוש רחוב בטבלת `street_neighborhoods` (1,245 רחובות בתל אביב)
- סדר עדיפות לזיהוי שכונות:
  1. עמודה 4 (שכונה) - regex
  2. עמודה 5 (רחוב) - regex  
  3. טקסט מלא - regex
  4. **חדש:** חיפוש רחוב בדאטאבייס

**2. מגבלת גודל:**
- גודל (מ"ר) **לא זמין** בתוצאות החיפוש
- קיים רק בדפי פרטים בודדים
- extraction rate: 0% (מתוכנן)

**3. שיעורי חילוץ מאומתים:**
| שדה | שיעור |
|-----|-------|
| עיר | 100% |
| שכונה | 89% (עם DB lookup) |
| מחיר | 92% |
| חדרים | 100% |
| קומה | 62% (תלוי במקור) |
| גודל | 0% (לא זמין) |

---

## URL Building - לוגיקה שונה לכל אתר

### מדלן:
```
https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?page=2
```
- Slug בעברית עם מקפים
- Pagination ב-query string

### יד2:
```
https://www.yad2.co.il/realestate/rent?topArea=2&area=1&city=5000&page=2
```
- קודים מספריים לאזורים וערים
- מיפוי ב-`url-builders.ts`

### הומלס:
```
https://www.homeless.co.il/rent/?inumber1=17,1,150&page=2
```
- קוד עיר בפורמט `region,area,city`
- Pagination עם `&page=`

---

## Proxy Logic

| אתר | Proxy | Credits | סיבה |
|-----|-------|---------|------|
| יד2 | stealth | 5 | IP רזידנציאלי מונע חסימות |
| מדלן | auto | 1 | פשוט עובד יותר טוב |
| הומלס | auto | 1 | אין חסימות |

---

## Edge Function Timeouts

### מגבלת Supabase:
- **60 שניות** - תכנית חינמית
- **400 שניות** - תכניות בתשלום

### למה קורים Timeouts:
- סריקת דף: 5-10 שניות
- CAPTCHA/המתנה: 15-30 שניות
- 4 דפים ברצף: 60+ שניות

### הפתרון - Single Page Mode:
כל פונקציה מטפלת בדף אחד בלבד:

```text
trigger-scout-pages:
  ├─ scout-homeless(page=1) → 10s ✓
  ├─ scout-homeless(page=2) → 12s ✓ (יוצא אחרי 2s)
  ├─ scout-homeless(page=3) → 8s ✓ (יוצא אחרי 4s)
  └─ scout-homeless(page=4) → 15s ✓ (יוצא אחרי 6s)
```

### Recovery מ-Timeout:
- `checkAndFinalizeRun` בודק אחרי כל דף
- דפים שנכשלו מסומנים `failed` 
- הריצה ממשיכה לדפים הבאים
- סטטוס סופי: `partial` אם יש כשלונות

---

## קבצים רלוונטיים

| קובץ | תפקיד |
|------|-------|
| `supabase/functions/scout-madlan/index.ts` | סורק מדלן (סדרתי) |
| `supabase/functions/scout-yad2/index.ts` | סורק יד2 (מקבילי) |
| `supabase/functions/scout-homeless/index.ts` | סורק הומלס (מקבילי) |
| `supabase/functions/_experimental/parser-madlan.ts` | פרסר מדלן |
| `supabase/functions/_experimental/parser-yad2.ts` | פרסר יד2 |
| `supabase/functions/_experimental/parser-homeless.ts` | פרסר הומלס |
| `supabase/functions/_experimental/street-lookup.ts` | חיפוש רחוב בדאטאבייס |
| `supabase/functions/_shared/url-builders.ts` | בניית URLs |
| `supabase/functions/_shared/run-helpers.ts` | ניהול ריצות ו-page_stats |
| `supabase/functions/trigger-scout-pages/index.ts` | מתזמן הריצות |

---

## מסקנות מהניסיון

1. **מדלן** - סדרתי עם recovery = יציבות מקסימלית
2. **יד2** - מקבילי עובד, יש בעיית orphan pages בדפים מאוחרים
3. **הומלס** - הכי יציב, DB lookup משפר שכונות ב-10%+
4. **פרסרים** - regex/cheerio מותאם לכל אתר, לא AI
5. **ניקוי** - קריטי להסיר noise לפני פרסינג
6. **Timeouts** - Single Page Mode מונע חסימות

> עדכון אחרון: 27/01/2026

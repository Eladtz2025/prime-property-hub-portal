

## תיקון כפילויות בהתאמות Personal Scout

### הבעיה
בכל סריקה, ה-worker מוסיף את **כל ההתאמות שנמצאו** בלי לבדוק אם הן כבר קיימות במערכת. התוצאה:
- **940 רשומות** בטבלה, מתוכן רק **366 ייחודיות**
- **574 כפילויות מיותרות** (60% מהנתונים!)
- נכסים מסוימים מופיעים עד **197 פעמים** לאותו לקוח

---

### הפתרון

#### 1. מניעת כפילויות בזמן הכנסה
לפני שמירת ההתאמות, לבדוק מה כבר קיים עבור הלקוח:

```
// לפני הכנסה - לשלוף URLs קיימים
const existingUrls = await getExistingUrlsForLead(lead_id);

// לסנן רק התאמות חדשות
const newMatches = allMatches.filter(m => !existingUrls.has(m.source_url));

// להכניס רק את החדשות
await supabase.from('personal_scout_matches').insert(newMatches);
```

#### 2. ניקוי הכפילויות הקיימות
להריץ שאילתא חד-פעמית שמוחקת את הכפילויות ומשאירה רק רשומה אחת לכל שילוב של lead_id + source_url

---

### שינויים טכניים

#### קובץ: `personal-scout-worker/index.ts`
1. לפני לולאת הסריקה - לשלוף את כל ה-source_urls הקיימים עבור הלקוח
2. בזמן הסינון - לדלג על נכסים שכבר קיימים
3. לעדכן את הלוגים להראות כמה דילגנו

#### שאילתת ניקוי (חד-פעמית):
```sql
DELETE FROM personal_scout_matches 
WHERE id NOT IN (
  SELECT DISTINCT ON (lead_id, source_url) id 
  FROM personal_scout_matches 
  ORDER BY lead_id, source_url, created_at DESC
);
```

---

### תוצאה צפויה
- מ-940 רשומות ירד ל-366 (הייחודיות)
- סריקות עתידיות יוסיפו רק נכסים **חדשים באמת**
- ביצועים משופרים (פחות נתונים)
- UI נקי יותר ללקוח


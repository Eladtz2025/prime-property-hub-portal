

## בעיה שנמצאה — הקליינט מבטל את המיון של ה-DB

### הממצאים

**הבדיקה הראתה תמונה חיובית ברובה:**
- שירי: כל 44 ההתאמות שלה הן **עם חניה** (parking=true) — אין שום נכס בלי חניה
- אין לידים עם תאריך שעבר ב-matched_leads (התיקון עובד)
- אין התאמות מתחת ל-score 60
- 81 מתוך 103 נכסים מותאמים אומתו (content_ok), רק 5 עם בעיות (503/rate_limited)
- סדר ה-priority ב-DB תקין: חניה מאומתת + מרפסת מאומתת (priority 59) → חניה בלי מרפסת (53) → נמוך (20)

**בעיה אחת קריטית:**
הקוד בקליינט (`useCustomerMatches.ts` שורות 103-108) **ממיין מחדש לפי matchScore בלבד**. כשכל ההתאמות הן 100, המיון הזה לא עושה כלום — והסדר נקבע לפי סדר הכנסה ל-Map, לא לפי priority. **זה מבטל את כל המיון שתיקנו ב-DB.**

### הפתרון — שינוי בקובץ אחד

**`src/hooks/useCustomerMatches.ts`:**

1. להוסיף שדה `matchPriority` ל-interface ולמיפוי מה-DB (צריך גם לעדכן את ה-DB function להחזיר priority כעמודה)
2. **או** (גישה פשוטה יותר): לשמור על הסדר שמגיע מה-DB — להפסיק למיין מחדש בקליינט

**הגישה המומלצת — לשמור את סדר ה-DB:**
- שורות 103-108: במקום למיין groups לפי score בלבד, לשמור על הסדר המקורי שהגיע מה-DB function
- הדרך: לתת לכל match אינדקס לפי הסדר שהגיע, ולמיין groups לפי האינדקס הנמוך ביותר שלהם

```typescript
// Map each match to its original DB order
matches.forEach((match, index) => {
  match._dbOrder = index;
});

// Sort groups by the best (lowest) DB order index
grouped.sort((a, b) => {
  const aOrder = Math.min(...a.matches.map(m => m._dbOrder));
  const bOrder = Math.min(...b.matches.map(m => m._dbOrder));
  return aOrder - bOrder;
});
```

### למה זה בטוח
- לא משנה אילו נכסים מוחזרים, רק את הסדר
- ה-DB function כבר ממיינת נכון (score → priority → created_at)
- הקליינט פשוט מפסיק לדרוס את המיון הנכון

### קובץ אחד בלבד
`src/hooks/useCustomerMatches.ts` — שינוי לוגיקת המיון בשורות 97-108


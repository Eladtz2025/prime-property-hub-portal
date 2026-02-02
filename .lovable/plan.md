
## תוכנית - ניקוי התאמות אוטומטי והצגת דרישות לא-גמישות

### ✅ הושלם!

---

### חלק 1: Trigger לניקוי matched_leads ✅

נוצר trigger שמנקה את matched_leads כש:
- נכס מסומן כ-`is_active = false`
- נכס נמחק מהטבלה

**Migration הושלמה** - הפונקציה `clean_matched_leads_on_inactive()` פעילה.

---

### חלק 2: הוספת תצוגת דרישות לא-גמישות ✅

**א. עדכון matching.ts:**
- כל פיצ'ר שהוא חובה (required && !flexible) מקבל "(חובה)" בסוף ה-reason
- לדוגמה: `יש מרפסת (חובה) ✓` במקום `יש מרפסת ✓`

**ב. עדכון CustomerMatchesCell.tsx:**
- זיהוי של reasons עם "(חובה)"
- עיצוב מיוחד: רקע כחול + אייקון כוכב ⭐

---

### סיכום שינויים שבוצעו

| קובץ | שינוי |
|------|-------|
| `migrations/clean_matches_trigger.sql` | יצירת trigger לניקוי matched_leads |
| `_shared/matching.ts` | הוספת "(חובה)" לפיצ'רים לא גמישים |
| `CustomerMatchesCell.tsx` | עיצוב מיוחד לדרישות חובה (⭐) |


## תוכנית - ניקוי התאמות אוטומטי והצגת דרישות לא-גמישות

### רקע
- כשנכס נמחק או מסומן כלא פעיל, ההתאמות שלו נשארות בבסיס הנתונים (נמצאו 43 התאמות לנכסים לא פעילים)
- בתצוגת ההתאמות לא מוצגים הפיצ'רים שהלקוח **חייב** (לא גמיש) לעומת הפיצ'רים הגמישים

---

### חלק 1: Trigger לניקוי matched_leads

ייווצר trigger שינקה את matched_leads כש:
- נכס נמחק מהטבלה
- נכס מסומן כ-`is_active = false`

```text
┌─────────────────────────────────────────────────────────┐
│                   scouted_properties                     │
├─────────────────────────────────────────────────────────┤
│  UPDATE is_active = false  ──► TRIGGER ──► Clear        │
│  DELETE row               ──►         ──► matched_leads │
└─────────────────────────────────────────────────────────┘
```

**קובץ חדש:** `supabase/migrations/xxx_clean_matches_on_property_inactive.sql`

הפונקציה תבצע:
- בעדכון: אם `is_active` משתנה מ-true ל-false, לנקות את `matched_leads`
- במחיקה: לפני שהנכס נמחק, לבטל את ההתאמות שלו

---

### חלק 2: הוספת תצוגת דרישות לא-גמישות

בדיאלוג ההתאמות, כשמציגים match reasons, נוסיף אינדיקציה ויזואלית לפיצ'רים שהלקוח **חייב** (לא גמיש).

**שינויים נדרשים:**

**א. עדכון הפונקציה `get_customer_matches`:**
- להוסיף מידע על required features שהתקיימו (לא רק את ה-reasons הכלליים)

**ב. עדכון CustomerMatchesCell.tsx:**
- להציג badge מיוחד לדרישות שהן חובה
- דוגמה: `⭐ יש מרפסת (חובה)` במקום `✓ יש מרפסת`

---

### פירוט טכני

**Migration file:**
```sql
-- Function to clean matched_leads when property becomes inactive
CREATE OR REPLACE FUNCTION clean_matched_leads_on_inactive()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      NEW.matched_leads = '[]'::jsonb;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on scouted_properties
CREATE TRIGGER clean_matches_on_inactive
BEFORE UPDATE OR DELETE ON scouted_properties
FOR EACH ROW
EXECUTE FUNCTION clean_matched_leads_on_inactive();
```

**עדכון CustomerMatchesCell.tsx (שורות 319-326):**
```tsx
{match.matchReasons && match.matchReasons.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-1">
    {match.matchReasons.slice(0, 3).map((reason, idx) => {
      const isRequired = reason.includes('(חובה)');
      return (
        <span 
          key={idx} 
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            isRequired 
              ? 'bg-primary/20 text-primary font-medium' 
              : 'bg-muted'
          }`}
        >
          {isRequired ? '⭐' : '✓'} {reason.replace(' (חובה)', '')}
        </span>
      );
    })}
  </div>
)}
```

---

### סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `migrations/xxx_clean_matches_trigger.sql` | יצירת trigger לניקוי matched_leads |
| `trigger-matching/matching.ts` | הוספת "(חובה)" ל-match_reasons של פיצ'רים לא גמישים |
| `CustomerMatchesCell.tsx` | עיצוב מיוחד לדרישות חובה |


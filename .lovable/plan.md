
# הוספת אפשרות להסתיר נכס מתוצאות ההתאמה של לקוח

## סקירה

כאשר מוחקים נכס מתוצאות הלקוח, הוא לא יופיע יותר - גם אם אלגוריתם ההתאמה ירוץ שוב.

## איך זה יעבוד

| פעולה | תוצאה |
|-------|-------|
| לחיצה על כפתור X ליד נכס | הנכס נעלם מהתוצאות מיידית |
| הרצת התאמה מחדש | הנכס **לא** חוזר |
| אפשרות לראות נכסים מוסתרים | לחיצה על "הצג מוסתרים" בדיאלוג |

---

## שינויים טכניים

### 1. יצירת טבלה חדשה: `dismissed_matches`

```sql
CREATE TABLE dismissed_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES contact_leads(id) ON DELETE CASCADE,
  property_id UUID, -- לנכסים שלנו (properties)
  scouted_property_id UUID, -- לנכסים נסרקים (scouted_properties)
  dismissed_by UUID REFERENCES auth.users(id),
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT, -- אופציונלי: סיבת ההסתרה
  
  -- constraint: חייב להיות אחד מהם
  CONSTRAINT at_least_one_property CHECK (
    property_id IS NOT NULL OR scouted_property_id IS NOT NULL
  ),
  -- unique per lead + property combination
  UNIQUE(lead_id, property_id),
  UNIQUE(lead_id, scouted_property_id)
);
```

RLS Policies:
- משתמשים מאומתים יכולים להוסיף/לראות/למחוק את ההסתרות

### 2. עדכון פונקציה: `get_customer_matches`

שינוי ב-WHERE clause:
```sql
WHERE match_data->>'lead_id' = customer_uuid::TEXT
  AND sp.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM dismissed_matches dm
    WHERE dm.lead_id = customer_uuid
      AND dm.scouted_property_id = sp.id
  )
```

### 3. עדכון קומפוננטה: CustomerMatchesCell.tsx

**הוספות:**
- כפתור X אדום בפינה של כל כרטיס נכס
- Dialog אישור לפני הסתרה
- פונקציה `handleDismissMatch` לשמירה ב-DB
- רענון אוטומטי של הרשימה אחרי הסתרה
- כפתור "הצג מוסתרים" (toggle) בראש הדיאלוג

### 4. עדכון hook: useOwnPropertyMatches.ts

הוספת NOT EXISTS על `dismissed_matches` גם לנכסים שלנו.

---

## UI שינויים

**לפני:**
```
┌────────────────────────┐
│ תיווך   פרטי     80%  │
│ להשכרה בהרצליה        │
│ תל אביב | 3 חד' | 80מ"ר │
│ ₪8,500                 │
│ ✓ מחיר   ✓ חדרים      │
│ [צפה] [💬]            │
└────────────────────────┘
```

**אחרי:**
```
┌────────────────────────┐
│ תיווך   פרטי     80% X│  ← כפתור מחיקה אדום
│ להשכרה בהרצליה        │
│ תל אביב | 3 חד' | 80מ"ר │
│ ₪8,500                 │
│ ✓ מחיר   ✓ חדרים      │
│ [צפה] [💬]            │
└────────────────────────┘
```

**כפתור הצג/הסתר מוסתרים:**
```
┌─────────────────────────────────┐
│ דירות שהותאמו לישראל           │
│ ☐ הצג מוסתרים (3)              │  ← toggle
├─────────────────────────────────┤
```

---

## קבצים לעריכה

| קובץ | שינוי |
|------|-------|
| `supabase/migrations/` | יצירת טבלה + עדכון פונקציה |
| `src/components/customers/CustomerMatchesCell.tsx` | כפתור X, logic הסתרה |
| `src/hooks/useCustomerMatches.ts` | invalidate cache אחרי הסתרה |
| `src/hooks/useOwnPropertyMatches.ts` | פילטור נכסים מוסתרים |
| `src/integrations/supabase/types.ts` | יתעדכן אוטומטית |

---

## זרימת העבודה

1. משתמש לוחץ על X
2. Dialog: "להסתיר את הנכס הזה מהתוצאות של ישראל?"
3. [ביטול] [אישור]
4. Insert ל-`dismissed_matches`
5. Invalidate query cache
6. הנכס נעלם מהרשימה

---

## יתרונות

- **פשוט**: כפתור אחד
- **הפיך**: אפשר לשחזר דרך "הצג מוסתרים"
- **עמיד**: לא מושפע מהרצות התאמה עתידיות
- **תומך בשניהם**: גם נכסים שלנו וגם נסרקים

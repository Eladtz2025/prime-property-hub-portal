

## תיקון: הכרטיס הראשי מציג 3,739 "ממתינים" במקום 0

### הבעיה
ה-matching engine שומר `status: 'new'` גם לנכסים שכבר עברו בדיקה אבל לא נמצאו להם התאמות (שורה 134 ב-`trigger-matching/index.ts`). לכן 3,739 נכסים שכבר נבדקו נספרים כ"ממתינים".

### פתרון — שני שינויים

**1. Edge Function (`trigger-matching/index.ts`, שורה 134)**
שינוי הסטטוס מ-`'new'` ל-`'checked'` כשאין התאמות:
```
status: result.hasMatches ? 'matched' : 'checked'
```
וגם ב-`match-batch/index.ts` (שורה 237) — שם כשנכס מאבד התאמות:
```
.update({ status: 'checked', matched_leads: [] })
```

**2. Dashboard (`ChecksDashboard.tsx`)**
ה-query כבר נכון — סופר `status = 'new'`. אחרי התיקון ב-edge function, נכסים חדשים שעוד לא עברו בדיקה יישארו `'new'`, ונכסים שנבדקו ולא נמצאה התאמה יהיו `'checked'`. אז המספר ירד ל-0 (או קרוב).

**3. DB migration — עדכון 3,739 נכסים קיימים**
```sql
UPDATE scouted_properties 
SET status = 'checked' 
WHERE is_active = true 
  AND status = 'new' 
  AND (matched_leads IS NULL OR matched_leads = '[]'::jsonb);
```

**4. פונקציות DB שמשתמשות ב-status**
- `get_properties_needing_availability_check` — כבר בודק `status IN ('matched', 'new')` → צריך להוסיף `'checked'`
- `prevent_content_ok_on_inactive` — לא מושפע
- `clean_matches_on_price_change` — מחזיר ל-`'new'` כשמחיר משתנה → נשאר כך (נכון, כי צריך לבדוק מחדש)

### סיכום שינויים
| קובץ | שינוי |
|---|---|
| `supabase/functions/trigger-matching/index.ts` | `'new'` → `'checked'` |
| `supabase/functions/match-batch/index.ts` | `'new'` → `'checked'` |
| Migration SQL | עדכון 3,739 נכסים קיימים |
| `get_properties_needing_availability_check` | הוספת `'checked'` ל-IN clause |


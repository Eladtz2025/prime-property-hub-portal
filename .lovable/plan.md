
# שיפוץ מערכת ההתאמות מא' עד ת'

## סטטוס נוכחי

### מה עובד (לשמור):
| רכיב | מצב | הערות |
|------|-----|-------|
| `matching.ts` (לוגיקה) | ✅ טוב | Binary matching עם priority scoring |
| `match-batch` (Edge Function) | ✅ טוב | מעבד בbatches עם sync לכפילויות |
| `trigger-matching` (Orchestrator) | ✅ טוב | ארכיטקטורה חדשה fire-and-forget |
| DB Trigger `update_lead_eligibility` | ✅ טוב | בדיקת eligibility דינמית |
| `get_customer_matches` (DB Function) | ✅ טוב | מחזיר נתונים מבוססי JSONB |

### מה דורש ניקוי/שיפור:
| רכיב | בעיה |
|------|------|
| `match-scouted-to-leads` | **ישן** - משמש רק לre-match של lead בודד, כפילות עם `trigger-matching` |
| `reset-all-matches` | **מיותר** - קורא ל-`trigger-matching` בלבד |
| `useOwnPropertyMatches` | **לוגיקה שונה** - לא משתמש ב-matching logic מהבקאנד |
| `CustomerPropertyMatches.tsx` | **מיושן** - קוד ישן שלא בשימוש |
| UI (ExpandableCustomerRow) | **מורכב** - 1,227 שורות, קשה לתחזק |

### סטטיסטיקות נוכחיות:
- **35** לקוחות פעילים (29 eligible, 6 incomplete)
- **5,940** נכסים פעילים
- **501** נכסים עם התאמות (8.4%)
- **5,439** נכסים ללא התאמות (91.6%)

---

## תוכנית השיפוץ - 5 שלבים

### שלב 1: ניקוי קוד ישן (מחיקות)

**קבצים למחיקה:**
1. `src/components/CustomerPropertyMatches.tsx` - לא בשימוש
2. `supabase/functions/reset-all-matches/` - wrapper מיותר

**קוד להעברה לארכיון:**
1. `supabase/functions/match-scouted-to-leads/index.ts` → שמור כ-backup אבל הלוגיקה תהיה ב-`trigger-matching`

**Edge Functions לבדיקה אם עדיין נדרשות:**
- `match-scouted-to-leads` - כרגע משמש לre-match של lead בודד מה-UI

---

### שלב 2: איחוד לוגיקת re-match

במקום שתי פונקציות נפרדות:
- `trigger-matching` (לכל הנכסים)
- `match-scouted-to-leads` (ללead בודד)

**פתרון:** הוספת פרמטר `lead_id` ל-`trigger-matching`:

```typescript
// trigger-matching/index.ts
const { send_whatsapp, force, lead_id } = body;

if (lead_id) {
  // Re-match single lead mode
  return await rematchSingleLead(lead_id, supabase);
}

// Normal mode - match all properties
// ... existing code
```

---

### שלב 3: שיפור Hook להתאמות לקוחות

**בעיה נוכחית:**
`useCustomerMatches` - קורא ל-DB function שמחפש בתוך `matched_leads` JSONB
`useOwnPropertyMatches` - עושה query ישיר ל-`properties` עם סינון פשוט

**פתרון:** איחוד ל-Hook אחד עם tabs:

```typescript
// src/hooks/useUnifiedMatches.ts
export const useUnifiedMatches = (customerId: string) => {
  // Scouted matches - from DB function
  const scoutedQuery = useQuery({
    queryKey: ['customer-matches', customerId],
    queryFn: () => supabase.rpc('get_customer_matches', { customer_uuid: customerId })
  });

  // Own properties - simple filter on properties table
  const ownQuery = useQuery({
    queryKey: ['own-matches', customerId],
    queryFn: async () => {
      // Use same matching logic as scouted
      // Call new DB function: get_own_property_matches
    }
  });

  return {
    scoutedMatches: scoutedQuery.data,
    ownMatches: ownQuery.data,
    isLoading: scoutedQuery.isLoading || ownQuery.isLoading,
    totalCount: (scoutedQuery.data?.length || 0) + (ownQuery.data?.length || 0)
  };
};
```

---

### שלב 4: רכיב UI חדש - CustomerMatchesDisplay

**מחליף:** את ה-`CustomerMatchesCell` הנוכחי (130 שורות בתוך ExpandableCustomerRow)

**עיצוב חדש:**

```text
┌─────────────────────────────────────────┐
│  🏠 4  │  🏢 2  │  [↻]                  │
│ סרוקים │ שלנו  │ רענן                   │
└─────────────────────────────────────────┘
         ↓ (לחיצה פותחת dialog)
┌─────────────────────────────────────────┐
│ ◉ נכסים סרוקים (4)  ○ נכסים שלנו (2)   │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📍 הצפון החדש, דיזנגוף 99         │ │
│ │ 🏠 3 חד' | 75 מ"ר | ₪8,500        │ │
│ │ [פרטי] [Yad2] [92%]               │ │
│ │                                    │ │
│ │ ✓ שכונה מועדפת                    │ │
│ │ ✓ מחיר בטווח התקציב               │ │
│ │ ✓ 3 חדרים                         │ │
│ │                                    │ │
│ │ [📎 צפה] [💬 WhatsApp]            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**מאפיינים:**
- Badge צבעוני לכל סוג (סגול לסרוקים, ירוק לשלנו)
- הצגת סיבות ההתאמה (`matchReasons`)
- Priority score מוצג כאחוז
- קיבוץ כפילויות עם badge כתום
- כפתור WhatsApp עם הודעה מוכנה

---

### שלב 5: פישוט דף הלקוחות

**בעיה:** `ExpandableCustomerRow.tsx` - 1,227 שורות קוד

**פתרון:** פירוק לקומפוננטות קטנות:

```text
src/components/customers/
├── CustomerRow.tsx              (שורת טבלה - ~100 שורות)
├── CustomerExpandedPanel.tsx    (פאנל מורחב - ~200 שורות)
├── CustomerEditForm.tsx         (טופס עריכה - ~300 שורות)
├── CustomerMatchesDisplay.tsx   (הצגת התאמות - ~200 שורות)
├── CustomerContactActions.tsx   (WhatsApp/Call - ~50 שורות)
└── hooks/
    ├── useCustomerForm.ts       (לוגיקת טופס)
    └── useCustomerMatching.ts   (לוגיקת התאמות)
```

---

## סיכום שינויים טכניים

### Edge Functions:

| פעולה | קובץ |
|-------|------|
| ✏️ עדכון | `trigger-matching/index.ts` - הוספת mode לlead בודד |
| 🗑️ מחיקה | `reset-all-matches/` |
| 📦 ארכיון | `match-scouted-to-leads/` |

### Frontend Components:

| פעולה | קובץ |
|-------|------|
| 🗑️ מחיקה | `CustomerPropertyMatches.tsx` |
| ✏️ רפקטור | `ExpandableCustomerRow.tsx` → פירוק ל-5 קומפוננטות |
| ➕ חדש | `src/components/customers/CustomerMatchesDisplay.tsx` |
| ➕ חדש | `src/hooks/useUnifiedMatches.ts` |

### Database:

| פעולה | תיאור |
|-------|-------|
| ➕ חדש | `get_own_property_matches(customer_uuid)` - DB function לנכסים שלנו |
| ✏️ עדכון | בדיקה שכל ה-indexes על `matched_leads` JSONB אופטימליים |

---

## סדר עבודה מומלץ

1. **ניקוי** - מחיקת קבצים ישנים שלא בשימוש
2. **איחוד Edge Functions** - trigger-matching + single lead mode
3. **DB Function חדשה** - get_own_property_matches
4. **Hook חדש** - useUnifiedMatches
5. **UI Component** - CustomerMatchesDisplay
6. **רפקטור** - פירוק ExpandableCustomerRow

---

## תוצאות צפויות

- **קוד נקי יותר**: הסרת ~500 שורות קוד מיותר
- **תחזוקה קלה**: קומפוננטות קטנות וממוקדות
- **ביצועים**: שימוש ב-DB functions במקום לוגיקה בclient
- **עקביות**: אותה לוגיקת matching לנכסים סרוקים ולנכסים שלנו
- **UX טוב יותר**: עיצוב ברור עם priority scoring וסיבות התאמה

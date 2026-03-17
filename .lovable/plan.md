

## שדרוג פעולות אחרונות + לוח זמנים — Compact Redesign

שכתוב JSX בלבד ב-`ScheduleSummaryCard.tsx`. הלוגיקה והנתונים נשארים זהים.

---

### שינויים כלליים

- גובה כרטיס: `h-[340px]` (ירד מ-400)
- padding: `p-4` (ירד מ-p-5)

### 1. פעולות אחרונות — Compact Activity Feed

**RunCard** — שכתוב מלא:
- גובה שורה: `min-h-[54px]` (ירד מ-72)
- `py-2 px-2` (ירד מ-py-3 px-3)
- **הסרת StatusPill** — במקומו: נקודה צבעונית קטנה (`w-1.5 h-1.5`) + טקסט סטטוס פשוט (`text-[10px]`)
- זמן יחסי מתחת לסטטוס

**LedgerFooter** — שורה אחת דקה:
- `pt-2` (ירד מ-pt-3)
- ימין: `{completed} הושלמו · {warnings} אזהרות` + "הצג הכל" — הכל בשורה אחת
- גובה מינימלי

### 2. לוח זמנים → Next Runs (רשימה קומפקטית)

**הסרת TimelineNode** לגמרי — אין קו אנכי, אין עיגולים.

**במקומו:**

**NextRunCard** — שורה ראשונה מיוחדת:
- `bg-primary/5 rounded-lg p-2.5 mb-2`
- שם פעולה + שעה + "הבאה בתור" טקסט קטן
- highlight עדין

**ScheduleRow** — שורות קומפקטיות (4-6):
- גובה `h-[40px]`, `py-1.5 px-2`
- שעה (`font-mono text-[11px]`) + נקודת צבע + שם משימה
- `border-b border-border/15 last:border-0`

**Footer** — שורה אחת:
- `pt-2 border-t border-border/20`
- "הצג הכל" בלבד

### קובץ

| קובץ | שינוי |
|-------|--------|
| `ScheduleSummaryCard.tsx` | שכתוב RunCard, LedgerFooter, החלפת TimelineNode ב-NextRunCard+ScheduleRow, עדכון container heights |


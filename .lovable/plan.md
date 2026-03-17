

## שדרוג עיצוב פעולות אחרונות + לוח זמנים

שכתוב ה-JSX וה-sub-components ב-`ScheduleSummaryCard.tsx`. הלוגיקה (queries, aggregation, schedule building) נשארת זהה לגמרי.

---

### שינויים מבניים כלליים

- Grid: `md:grid-cols-[58%_42%]` במקום `md:grid-cols-2`
- גובה קבוע לשני הכרטיסים: `h-[400px]`
- כל כרטיס: `rounded-[20px]`, `border border-slate-900/8`, `p-5`, רקע נקי
- הסרת `CardHeader`/`CardContent` של shadcn — מעבר ל-div ידני עם padding אחיד

### 1. פעולות אחרונות

**Header** — שורה אחת:
- ימין: אייקון Zap + "פעולות אחרונות" (`text-sm font-semibold`)
- שמאל: `{lastHourCount} בשעה האחרונה • עודכן עכשיו` (`text-[11px] text-muted-foreground`)

**Body** — רשימה scrollable (`flex-1 overflow-y-auto`):
- כל שורה `RunCard`: גובה `min-h-[72px]`, `py-3 px-3`, `border-b border-border/20 last:border-0`
  - **ימין**: נקודת צבע + שם פעולה bold (`text-sm font-medium`) + batch badge. מתחת: שורת metadata אחת (`text-[11px] text-muted-foreground`) — "נבדקו 251 • 14 זמינים • 12 שנ׳"
  - **שמאל**: Status pill למעלה + זמן יחסי מתחת
- הסרת `bg-muted/30 rounded-lg` מהשורות — עכשיו שורות שטוחות עם divider עדין
- Hover: `hover:bg-muted/20` בלבד

**Footer** — `border-t border-border/30 pt-2 mt-auto`:
- ימין: "הצג הכל" כלינק קטן
- שמאל: `{completed} הושלמו • {warnings} אזהרות` (`text-[10px]`)

### 2. לוח זמנים

**Header** — שורה אחת:
- ימין: אייקון Clock + "לוח זמנים" (`text-sm font-semibold`)
- שמאל: `{count} משימות מתוזמנות` (`text-[11px] text-muted-foreground`)

**Body** — Timeline scrollable (`flex-1 overflow-y-auto`):
- `TimelineNode` מעודכן: גובה `min-h-[64px]`
- קו אנכי: `border-r-2 border-border/30` (ימין, כי RTL)
- Node: עיגול `w-3 h-3` על הקו
  - רגיל: `border-border bg-background`
  - הבא בתור: `border-primary bg-primary/20 ring-4 ring-primary/10` + טקסט "הבאה בתור"
  - רץ עכשיו: `border-primary bg-primary ring-2 ring-primary/20` + "רץ עכשיו"
  - הושלם: `border-muted bg-muted opacity-60`
- שעה `font-mono text-xs font-semibold` + labels צבעוניים (capsules) ליד

**הסרת** ה-footer מהטיימליין — אין צורך.

### קובץ אחד

| קובץ | שינוי |
|-------|--------|
| `ScheduleSummaryCard.tsx` | שכתוב JSX של return + RunCard + TimelineNode + LedgerFooter. הלוגיקה נשארת |


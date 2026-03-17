

## שדרוג המוניטור ל-Situation Room — 3 מצבים

### מבנה חדש

קומפוננטת `LiveMonitor` תפורק ותבנה מחדש כמערכת מודולרית עם 3 tabs + control bar + intelligence rail.

### ארכיטקטורה

```text
┌─────────────────────────────────────────────────────────────┐
│  Control Bar                                                │
│  [ימין] מוניטור חי · ● · last event 17:42  · ✓ System OK   │
│  [מרכז] Live Feed | Pipeline | Alerts                      │
│  [שמאל] All | YAD2 | HMLS | MDLN | Avail | Errors         │
├────────────────────────────────────────────┬────────────────┤
│                                            │ Intelligence   │
│  Event Stream / Pipeline / Alerts          │ Rail           │
│  (תלוי ב-tab הפעיל)                       │                │
│                                            │ throughput/min │
│  כל שורה = badge + status + title +        │ avg latency    │
│  detail + timestamp                        │ timeout rate   │
│                                            │ active source  │
│                                            │ anomaly badge  │
│                                            │ mini sparkline │
├────────────────────────────────────────────┴────────────────┤
│  Footer: 142 events · ✓ 128 · ✗ 3 · ⚠ 11                  │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Live Feed (ברירת מחדל)

הפיד הקיים — משודרג:
- שורות מעוצבות יותר (badge source צבעוני, typography גדול יותר, רווחים)
- סוגי אירועים חדשים: `found`, `matched`, `timeout`, `pushed`, `skipped`
- אנימציית כניסה חלקה לכל שורה חדשה (fade-in + slide)
- auto-scroll עם כפתור "חזור למטה" כשגוללים למעלה

### Tab 2: Pipeline View

תצוגה ויזואלית של 4 שלבים:

```text
Scraping → Availability → Matching → Push
```

כל שלב מציג:
- כמה עברו (מתוך ריצות היום)
- כמה בתור / מחכים
- כמה נכשלו
- latency ממוצע (מחושב מ-duration_ms בנתונים הקיימים)
- progress bar צבעוני
- הנתונים מגיעים מאותם queries שכבר קיימים (scout_runs, availability_check_runs, backfill_progress) + ספירה של `scouted_properties` שנוצרו היום

### Tab 3: Attention / Alerts

זיהוי אוטומטי של חריגות על בסיס הנתונים הקיימים:
- **Timeout spike** — אם יותר מ-20% מבדיקות הזמינות בריצה הנוכחית = timeout
- **Source stalled** — אם source מסוים לא נסרק ב-2 שעות האחרונות (query על scout_runs)
- **0 new listings** — אם אין נכסים חדשים ב-2 שעות האחרונות
- **Match rate drop** — אם ריצת matching אחרונה הניבה 0 התאמות
- **Push failures** — מ-backfill_progress עם failed_items > 0

כל alert = כרטיס עם severity (error/warning/info), תיאור, ו-timestamp. כשיש alerts קריטיים — badge אדום על ה-tab.

### Intelligence Rail (עמודה ימנית)

עמודה צרה (~180px) שמופיעה תמיד ליד כל tab:
- **Throughput** — אירועים/דקה (מחושב מ-feedItems timestamps)
- **Avg Response** — ממוצע duration_ms מ-page_stats
- **Timeout Rate** — אחוז timeouts מתוך סה"כ בדיקות זמינות
- **Active Sources** — badges של מקורות פעילים כרגע
- **Anomaly** — badge אדום/ירוק לפי האם יש alerts פעילים
- **Mini sparkline** — throughput ב-10 דקות אחרונות

### עיצוב

- רקע: `bg-gray-950/95 backdrop-blur-sm`
- Control bar: `bg-gray-900/80` עם `border-b border-white/5`
- Tabs: pills style עם glow עדין על tab פעיל
- Pipeline: כרטיסים מחוברים בחצים SVG
- Alerts: border-r צבעוני לפי severity
- גובה דינמי: `min-h-[300px] max-h-[500px]`

### מבנה קבצים

| קובץ | תיאור |
|-------|--------|
| `src/components/scout/checks/LiveMonitor.tsx` | Shell ראשי — control bar, tabs, layout |
| `src/components/scout/checks/monitor/LiveFeedTab.tsx` | Event stream (הפיד הנוכחי משודרג) |
| `src/components/scout/checks/monitor/PipelineTab.tsx` | תצוגת pipeline 4 שלבים |
| `src/components/scout/checks/monitor/AlertsTab.tsx` | זיהוי חריגות ו-alerts |
| `src/components/scout/checks/monitor/IntelligenceRail.tsx` | עמודת מטריקות צד |
| `src/components/scout/checks/monitor/useMonitorData.ts` | Hook מאוחד — כל ה-queries + חישובי derived data |

ה-hook `useMonitorData` ירכז את כל ה-queries הקיימים (availability_check_runs, scout_runs, backfill_progress) + יחשב alerts, throughput, ו-pipeline stats. כל ה-tabs צורכים ממנו.


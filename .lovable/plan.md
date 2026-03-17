

## שדרוג המוניטור — מסך בקרה מינימליסטי

שכתוב `LiveMonitor.tsx` בלבד. ה-hook `useMonitorData` נשאר כמו שהוא.

---

### מה נמחק

- כל ה-tabs (Live Feed / Pipeline / Alerts)
- כל ה-source filters (YAD2 / HMLS / MDLN)
- ה-footer עם ספירת אירועים
- ה-active processes bar
- הייבואים של `LiveFeedTab`, `PipelineTab`, `AlertsTab`

### מבנה חדש

```text
┌─────────────────────────────────────────────────────────┐
│  מוניטור חי  ●  תקין                                   │  ← header פשוט
├─────────────────────────────────────┬───────────────────┤
│                                     │  Events/min    0  │
│                                     │                   │
│         ○  אין פעילות כרגע          │  Avg latency   —  │
│                                     │                   │
│    המערכת מאזינה ותציג כאן          │  Timeout rate  0% │
│      אירועים בזמן אמת              │                   │
│                                     │  תורים פעילים  0  │
│                                     │                   │
│                                     │  סטטוס      תקין  │
└─────────────────────────────────────┴───────────────────┘
```

### Header

שורה אחת בלבד:
- ימין: אייקון Monitor + "מוניטור חי" + נקודת סטטוס (ירוקה/אפורה) + טקסט "תקין" / "Idle" / "X חריגות"
- בלי שום דבר אחר

### מרכז (flex-1)

**כשאין פעילות** (`!hasActivity`):
- מרכוז מלא (flex items-center justify-center)
- אייקון `Activity` עדין (`h-8 w-8 text-gray-700`)
- "אין פעילות כרגע" (`text-sm text-gray-400`)
- "המערכת מאזינה ותציג כאן אירועים בזמן אמת" (`text-xs text-gray-600`)

**כשיש פעילות** (`hasActivity`):
- מציג את ה-`activeProcesses` במרכז בצורה נקייה — כל process בשורה עם spinner + label + elapsed + progress bar

### עמודת מדדים (ימין)

עמודה צרה (`w-[150px]`), `border-r border-white/[0.04]`, `p-3`:
- 5 מדדים אנכיים, כל אחד: label קטן (`text-[10px] text-gray-500`) + ערך (`text-lg font-bold text-white`)
  1. Events/min → `intelligence.throughput`
  2. Avg latency → `intelligence.avgLatency` (format as seconds or "—")
  3. Timeout rate → `intelligence.timeoutRate` (colored by threshold)
  4. תורים פעילים → `activeProcesses.length`
  5. סטטוס → תקין/חריגות (with colored dot)
- ללא sparkline, ללא source badges

### קובץ

| קובץ | שינוי |
|-------|--------|
| `LiveMonitor.tsx` | שכתוב מלא — הסרת tabs/filters/footer, מבנה header+center+rail חדש |


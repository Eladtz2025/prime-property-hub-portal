

## שדרוג ProcessCard — Mini Control Center

שכתוב מלא של `ProcessCard.tsx` + עדכון ה-props בכל 5 השימושים ב-`ChecksDashboard.tsx`.

---

### מבנה כרטיס חדש

```text
┌──────────────────────────────────────┐
│  🔍 סריקות        ●פעיל    [toggle] │  ← header: icon + title + badge + switch
│                                      │
│              240                     │  ← מספר ראשי גדול (text-3xl bold)
│          נמצאו היום                  │  ← תיאור קצר (text-sm muted)
│                                      │
│  6 configs פעילים • מקור: Homeless   │  ← שורת metadata (text-xs muted)
│  💡 קצב תקין                         │  ← mini insight (text-xs, icon + text)
│                                      │
│  ┌──────────┐                        │
│  │  ▶ הפעל  │   היסטוריה  הגדרות    │  ← כפתור ראשי + secondary actions
│  └──────────┘                        │
└──────────────────────────────────────┘
```

### שינויי Props

ב-`ProcessCardProps` — הוספת שדות חדשים:

| שדה | תיאור |
|-----|--------|
| `primaryValue` | מספר מרכזי (`number \| string`) |
| `primaryLabel` | תיאור מתחת למספר ("נמצאו היום") |
| `secondaryLine` | שורת metadata ("6 configs • מקור: Homeless") |
| `insight` | mini insight ("קצב תקין" / "עלייה ב-timeouts") |
| `insightType` | `'ok' \| 'warning' \| 'info'` — לצבע |

הסרת `metrics[]` ו-`statusText` — מוחלפים בשדות החדשים.

### עיצוב הכרטיס

- **Card**: `rounded-2xl`, padding נדיב (`p-5`), `shadow-sm`, `hover:-translate-y-0.5 hover:shadow-md transition-all`
- **גובה אחיד**: `min-h-[220px]` עם flex-col justify-between
- **Status badge**: pill צבעוני עדין ליד הכותרת — `פעיל` (ירוק), `בתהליך` (כחול), `אזהרה` (כתום), `מושבת` (אפור), `תקלה` (אדום)
- **פס צבעוני**: `border-t-2` עדין בצבע הסטטוס בראש הכרטיס
- **Toggle**: בצד שמאל של שורת ה-header, באותה שורה עם הכותרת
- **מספר מרכזי**: `text-3xl font-bold` ממורכז
- **כפתור ראשי**: `h-9 flex-1` עם רקע (`variant="default"` לרוץ, `variant="destructive"` לעצור), אייקון + טקסט
- **כפתורי משנה**: `variant="ghost" size="icon"` — רק אייקונים History/Settings

### שינויים ב-ChecksDashboard.tsx

כל 5 ה-ProcessCard יעודכנו עם ה-props החדשים. דוגמאות:

**סריקות**: `primaryValue={lastScanRunJina?.properties_found ?? 0}`, `primaryLabel="נמצאו"`, `secondaryLine="6 configs פעילים • מקור: ..."`, `insight` לפי האם יש חדשים

**בדיקת זמינות**: `primaryValue={stats?.checkedToday ?? 0}`, `primaryLabel="נבדקו היום"`, `secondaryLine="68 זמינים • 60 timeouts"`, `insight` — אזהרה אם timeouts > threshold

**כפילויות**: `primaryValue={dedupStats?.checked ?? 0}`, `primaryLabel="נבדקו"`, `secondaryLine="X נותרו לבדיקה"`

**התאמות**: `primaryValue={leadCounts?.eligible ?? 0}`, `primaryLabel="לידים eligible"`, `secondaryLine="X לא eligible"`

**השלמת נתונים**: `primaryValue={backfillRemaining ?? 0}`, `primaryLabel="נותרו"`, `secondaryLine="X הצלחות • Y כשלונות"`

---

### קבצים

| קובץ | שינוי |
|-------|--------|
| `ProcessCard.tsx` | שכתוב מלא — interface חדש + עיצוב premium |
| `ChecksDashboard.tsx` | עדכון props בכל 5 השימושים |


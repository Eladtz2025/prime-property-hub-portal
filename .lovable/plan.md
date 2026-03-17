

## שדרוג כרטיסי תהליכים — Queue Cards מינימליסטיים

### קובצים לשינוי

| קובץ | שינוי |
|-------|--------|
| `ProcessCard.tsx` | שכתוב מלא — עיצוב queue-first מינימליסטי |
| `ChecksDashboard.tsx` | עדכון props בכל 5 הכרטיסים — מספר ראשי = ממתינים בתור |

---

### ProcessCard — עיצוב חדש

**כרטיס**: `rounded-2xl`, `border border-border/40`, רקע נקי (ללא מסגרת צבעונית), ללא `border-t-2` צבעוני. Hover עדין בלבד.

**שורה עליונה** — אייקון קטן (ללא רקע צבעוני כבד, רק האייקון עצמו בצבע) + שם מודול + בצד שמאל: toggle קטן + טקסט סטטוס פשוט (`פעיל` / `מושבת` / `תקלה`) בגודל `text-[11px]` — ללא pill/badge שמנמן.

**מרכז** — מספר גדול (`text-4xl font-bold`), מתחתיו שורת הסבר (`ממתינים לבדיקה`), שורת מידע משנית אחת (`2,601 נבדקו היום`), שורת insight קטנה בירוק/אפור (`המערכת נקייה` / `קצב תקין`).

**שורה תחתונה** — divider עדין, מצד ימין: לינק "פתח" (ghost button / text link), מצד שמאל: אייקוני History + Settings בלבד. ללא כפתור כהה גדול. כפתור Run/Stop יהיה רק כשהתהליך רץ (עצור) — אחרת רק "פתח".

---

### ChecksDashboard — מיפוי Props חדש

כל כרטיס יציג **כמה ממתין בתור** כמספר הראשי:

- **סריקות**: `primaryValue=0` (אין queue כרגע), `primaryLabel="ממתינים לסריקה"`, `secondaryLine="${found} נמצאו היום"`, `insight="אין פריטים חדשים לטיפול"`
- **בדיקת זמינות**: `primaryValue={stats.pendingRecheck}`, `primaryLabel="ממתינים לבדיקה"`, `secondaryLine="${checkedToday} נבדקו היום"`, `insight` לפי timeouts
- **כפילויות**: `primaryValue={dedupStats.unchecked}`, `primaryLabel="ממתינים לבדיקה"`, `secondaryLine="${checked} נבדקו"`
- **התאמות**: `primaryValue={leadCounts.eligible}`, `primaryLabel="ממתינים להתאמה"`, `secondaryLine="${matchStats.total_matches} התאמות בריצה אחרונה"`
- **השלמת נתונים**: `primaryValue={backfillRemaining}`, `primaryLabel="ממתינים להשלמה"`, `secondaryLine="${successful} הושלמו"`




## שדרוג ריצות אחרונות + לוח זמנים

שכתוב מלא של `ScheduleSummaryCard.tsx` — אותו קובץ, אותו data fetching, עיצוב חדש לגמרי.

---

### 1. ריצות אחרונות → Activity Ledger

**Header:**
- כותרת "Activity Ledger" עם אייקון Activity
- Subtitle דינמי: `{count} אירועים בשעה האחרונה · עודכן לפני X שניות` (מחושב מ-`recentRuns`)

**כל שורה — כרטיסון:**
- רקע `bg-muted/30 rounded-lg px-3 py-2` עם hover עדין
- **צד ימין**: שם תהליך בולט (`text-sm font-medium`) + שורת metadata מתחת בטקסט קטן אפור (הסיכום — "467 נבדקו · 23 זמינים · 17 דק׳")
- **צד שמאל**: Status pill צבעוני (`הושלם` ירוק, `נכשל` אדום, `אזהרה` צהוב, `בתהליך` כחול עם spinner) + זמן יחסי ("לפני 3 דק׳") או שעה מוחלטת
- Badge קטן של type צבעוני (dot + source) ליד השם
- Batch count badge אם `batchCount > 1`

**Footer שורה:**
- ספירה: `✓ completed · ✗ failed · ⚠ warnings`

---

### 2. לוח זמנים → Vertical Timeline

**Header:**
- כותרת "Schedule Timeline" עם אייקון Clock
- Subtitle: `{count} משימות מתוזמנות היום`

**מבנה Timeline:**
- ציר אנכי — קו דק (`border-l-2 border-border/40`) בצד ימין
- לכל שעה: נקודה עגולה צבעונית על הקו + שעה בצד ימין של הנקודה
- Event capsules בצד שמאל — `rounded-lg bg-muted/30 px-3 py-1.5`
- כל capsule: שם + טווח שעות + dot צבעוני לפי type
- צבעים: זמינות=כחול, התאמות=ירוק, סריקה-השכרה=כתום, סריקה-מכירה=כתום כהה, backfill=צהוב, cleanup=אפור

**חיבור ויזואלי:**
- קו אנכי רציף שמחבר את כל הנקודות
- נקודה גדולה יותר + ring לשעה הנוכחית/הקרובה

---

### קובץ אחד

| קובץ | שינוי |
|-------|--------|
| `ScheduleSummaryCard.tsx` | שכתוב מלא — אותו data fetching, layout ו-UI חדשים לגמרי |

הלוגיקה (queries, aggregation, schedule building) נשארת זהה. רק ה-JSX של ה-return משתנה.


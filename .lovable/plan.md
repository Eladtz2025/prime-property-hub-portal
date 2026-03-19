

## תיקון טאב כפילויות + השלמות במוניטור

### בעיה 1: כפילויות — לא מוצגים נכסים בודדים
השאילתה מחפשת `duplicate_detected_at` בחלון הריצה, אבל הפונקציה `detect_duplicates_batch` (SQL) לא מעדכנת את השדה הזה — היא מעדכנת רק `dedup_checked_at`.

**תיקון** (`useMonitorData.ts`): להחליף את הפילטר מ-`duplicate_detected_at` ל-`dedup_checked_at`, ולהוסיף תנאי `duplicate_group_id IS NOT NULL` כדי להציג רק נכסים שזוהו בפועל ככפולים.

### בעיה 2: השלמות — אין נתונים בפיד
ב-edge function `backfill-property-data-jina`, שורה 866: כשמעדכנים את `summary_data` בסוף כל batch, ה-`mergedSummary` נבנה רק מהמפתחות הנומריים ולא שומר את `recent_items` שנשמרו קודם ע"י `saveRecentItem`. כל batch מוחק את ה-`recent_items`.

**תיקון** (`backfill-property-data-jina/index.ts`): להוסיף את `recent_items` מה-`existingSummary` ל-`mergedSummary` לפני העדכון:
```
mergedSummary.recent_items = existingSummary.recent_items || [];
```

### סיכום שינויים
| קובץ | שינוי |
|---|---|
| `useMonitorData.ts` | שאילתת dedup: `dedup_checked_at` במקום `duplicate_detected_at` + פילטר `duplicate_group_id` |
| `backfill-property-data-jina/index.ts` | שימור `recent_items` ב-`mergedSummary` |

### תוצאה
- טאב כפילויות יציג את 12 הנכסים שזוהו ככפולים בריצה האחרונה
- טאב השלמות יציג את הנכסים הבודדים שעובדו (מהריצה הבאה ואילך — הנתונים הקודמים נמחקו)


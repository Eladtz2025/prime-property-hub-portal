
# שדרוג דיאלוג "תיקון סיווג תיווך/פרטי"

## מצב נוכחי
הדיאלוג הקיים קורא ל-`reclassify-broker` (ה-Edge Function היחידה והעדכנית לסיווג). אבל הוא מוגבל:
- hardcoded ל-`source_filter: 'yad2'` בלבד
- תמיד `dry_run: false` (FIX, ללא אפשרות audit)
- ללא בחירת batch size
- ללא progress polling -- רק spinner עד שה-invoke הראשון חוזר
- ללא כפתור Stop
- ללא הצגת תוצאות

ה-Edge Function `reclassify-broker` כבר תומכת בכל הפרמטרים הנדרשים: `source_filter`, `dry_run`, `batch_size`, `action: stop/status`, ו-self-chaining אוטומטי. אין צורך בשינויים בצד השרת.

## עקביות באדג'ים (נקודה 3)
בדקתי את כל המקומות שמציגים את הבאדג' פרטי/תיווך -- כולם קוראים ישירות מ-`scouted_properties.is_private`:
- `ScoutedPropertiesTable.tsx` -- טבלה, כרטיס מובייל, דיאלוג כפילויות
- `PropertyMatchCard.tsx` -- כרטיס התאמה ללקוח
- `CustomerMatchesCell.tsx` -- תצוגת כפילויות בלקוח

**אין בעיה כאן** -- כל הרכיבים משתמשים באותו שדה DB ובאותו דפוס צבעים (ירוק=פרטי, כתום=תיווך).

## שינויים מתוכננים

### קובץ: `src/components/scout/UnifiedScoutSettings.tsx`

#### 1. Source Select
הוספת dropdown לבחירת מקור:
- **הומלס** | **מדלן** | **יד2** | **הכל**
- בחירת "הכל" תריץ 3 קריאות סדרתיות: homeless (הקטן) ← madlan ← yad2 (הגדול)
- ברירת מחדל: "הכל"

#### 2. Mode Toggle: AUDIT / FIX
- **AUDIT** (ברירת מחדל): שולח `dry_run: true` -- ללא כתיבה ל-DB, רק בדיקה
- **FIX**: שולח `dry_run: false` -- מתקן בפועל
- מצב AUDIT נבחר כברירת מחדל למניעת שינויי DB בלחיצה אחת

#### 3. Batch Size
- שדה `batchSize` עם ברירות מחדל חכמות:
  - AUDIT: 200
  - FIX: 100
- ניתן לשינוי ידני

#### 4. Stop / Cancel
- כפתור Stop שקורא ל-`reclassify-broker` עם `action: 'stop', task_id`
- ה-UI משקף מצב stopped/completed

#### 5. Progress / Status
polling כל 4 שניות ל-`backfill_progress` בטבלת Supabase:
- מסנן לפי `task_name` מתאים (`reclassify_broker` ל-FIX, `reclassify_broker_audit` ל-AUDIT)
- מציג: status, processed_items/total_items, successful_items, failed_items
- progress bar בסיסי
- מראה את ה-source הנוכחי וזמן התחלה

#### 6. תוצאות
אחרי שה-task מסתיים, שליפת `summary_data` מהרשומה ב-`backfill_progress` והצגת:
- confusion matrix (correct_broker, correct_private, misclassified counts)
- transitions (false_to_true, true_to_false, null_to_false, etc.)
- סה"כ processed, successful, failed

### Flow להרצת "הכל" (סדרתית)
כשבוחרים "הכל":
1. שולח `start` עם `source_filter: 'homeless'`
2. polling עד completed/stopped
3. אם הצליח: שולח `start` עם `source_filter: 'madlan'`
4. polling עד completed/stopped
5. אם הצליח: שולח `start` עם `source_filter: 'yad2'`
6. polling עד completed
7. מציג סיכום כולל

### State חדש בקומפוננטה

```text
brokerSource: 'all' | 'homeless' | 'madlan' | 'yad2'   (default: 'all')
brokerMode: 'audit' | 'fix'                             (default: 'audit')  
brokerBatchSize: number                                  (default: 200 for audit, 100 for fix)
brokerTaskId: string | null                              (active task tracking)
brokerRunningSource: string | null                       (current source being processed in "all" mode)
brokerResults: object | null                             (summary from completed run)
```

### שינויים ב-Edge Function
**אין** -- `reclassify-broker` כבר תומך בכל מה שצריך.

## קבצים מושפעים

| קובץ | שינוי |
|---|---|
| `src/components/scout/UnifiedScoutSettings.tsx` | שדרוג דיאלוג הסיווג: source select, mode toggle, batch size, progress polling, stop button, results display |

## הערות
- מצב AUDIT לא צורך יותר קרדיטים מ-FIX -- שניהם דורשים Firecrawl scrape לכל נכס. ההבדל היחיד הוא שב-AUDIT לא כותבים ל-DB.
- ה-Edge Function עצמה מבצעת self-chaining אוטומטי (batch אחרי batch), כך ש-ה-UI צריך רק לעקוב אחרי ההתקדמות ב-`backfill_progress`.

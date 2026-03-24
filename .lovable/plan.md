

## תיקון כרטיס בדיקת זמינות — מספרים נכונים

### הבעיות
1. **"99 נבדקו היום"** — נספר מהדאטאבייס (`availability_checked_at >= today`) במקום מהריצה האחרונה. המספר הנכון הוא **100** (מ-`lastAvailRun.properties_checked`).
2. **"3 ממתינים"** — מציג רק נכסים שה-RPC מחזיר (תור אוטומטי), אבל **לא כולל** נכסים עם `availability_retry_count >= 2` שממתינים לבדיקה ידנית.
3. חסר מידע על **15 שסומנו כלא פעילים** (`lastAvailRun.inactive_marked`).

### התיקון
**`src/components/scout/ChecksDashboard.tsx`**:

1. **secondaryLine** (שורה 544) — במקום לספור מהדאטאבייס, להציג `lastAvailRun.properties_checked`:
   - `${lastAvailRun?.properties_checked ?? 0} נבדקו` (בלי "היום" — כי הריצה לא בהכרח היום)

2. **insight** (שורה 545) — להציג את מספר הלא-פעילים מהריצה:
   - `${lastAvailRun?.inactive_marked ?? 0} סומנו לא פעילים`

3. **primaryValue** (שורה 542) — להוסיף query חדש לספירת נכסים עם `availability_retry_count >= 2` ולחבר אותו ל-`pendingRecheck`:
   - `pendingRecheck + manualReviewCount` = סה"כ ממתינים (אוטומטי + ידני)

4. **primaryLabel** — לעדכן ל-"ממתינים לבדיקה" (נשאר אותו דבר)

### שינויים טכניים
- הוספת query לספירת `availability_retry_count >= 2` ו-`is_active = true`
- שינוי 3 props ב-ProcessCard של זמינות
- קובץ אחד, ~10 שורות שינוי


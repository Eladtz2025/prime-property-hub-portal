
## תוכנית אופטימיזציית ביצועים — דשבורד אדמין

### ממצאים עיקריים

1. **שאילתת חלוקה (distribution)** — מושכת 4,039 שורות כל 30 שניות רק כדי לספור לפי מקור/פרטי/סוג. עיבוד בצד הלקוח במקום ספירה בדאטאבייס.
2. **שני הטאבים נטענים בו-זמנית** — `ChecksDashboard` ו-`ScoutedPropertiesTable` שניהם מורכבים (mounted) גם כשלא נראים, מה שמפעיל ~25 שאילתות מיותרות.
3. **3 שאילתות בתדירות 2 שניות** — ב-`useMonitorData.ts` רצות תמיד, גם כשאין תהליך פעיל.
4. **שאילתות כפולות** — `AdminPropertyScout` ו-`ChecksDashboard` שולחים שאילתות זהות (pendingRecheck, checkedToday, totalActive).

### שינויים מתוכננים

#### 1. החלפת שאילתת Distribution ב-COUNT בדאטאבייס
**קובץ:** `AdminPropertyScout.tsx` (שורות 53-84)

במקום `.select('source, is_private, property_type')` שמביא 4,000+ שורות, נשתמש ב-3 שאילתות count קלות:
```sql
-- לפי מקור
supabase.from('scouted_properties').select('id', {count:'exact', head:true}).eq('is_active',true).eq('source','yad2')
-- (ועוד 2 כאלה ל-madlan ו-homeless)
-- לפי פרטי/תיווך
supabase.from('scouted_properties').select('id', {count:'exact', head:true}).eq('is_active',true).eq('is_private',true)
-- לפי סוג
supabase.from('scouted_properties').select('id', {count:'exact', head:true}).eq('is_active',true).eq('property_type','sale')
```
6-8 שאילתות `head:true` (ספירה בלבד) במקום שאילתה אחת שמביאה 4,000 שורות. הרבה יותר קל על הרשת והדפדפן.

**סיכון:** אפס — אותה תוצאה בדיוק, רק שהספירה מתבצעת בדאטאבייס במקום בדפדפן.

#### 2. טעינה עצלה של טאבים
**קובץ:** `AdminPropertyScout.tsx` (שורות 276-283)

שינוי מ:
```tsx
<TabsContent value="properties"><ScoutedPropertiesTable /></TabsContent>
<TabsContent value="dashboard"><ChecksDashboard /></TabsContent>
```
ל:
```tsx
<TabsContent value="properties">
  {activeTab === 'properties' && <ScoutedPropertiesTable />}
</TabsContent>
<TabsContent value="dashboard">
  {activeTab === 'dashboard' && <ChecksDashboard />}
</TabsContent>
```

**סיכון:** אפס — הקומפוננט פשוט לא נטען עד שלוחצים על הטאב. כשעוברים חזרה הוא נטען מחדש (עם cache של react-query).

#### 3. Polling מותנה ב-useMonitorData
**קובץ:** `src/components/scout/checks/monitor/useMonitorData.ts`

3 שאילתות עם `refetchInterval: 2000` ירוצו רק כשיש תהליך פעיל:
```typescript
refetchInterval: hasActiveProcess ? 2000 : false
```
נזהה תהליך פעיל לפי שאילתה אחת קלה (בדיקה אם יש run עם `status='running'`). השאר ירוצו רק אם יש.

**סיכון:** אפס — כשאין תהליך פעיל אין מה לעקוב. כשתהליך מתחיל, ה-polling חוזר אוטומטית.

#### 4. הגדלת intervals לשאילתות לא-קריטיות
**קבצים:** `ChecksDashboard.tsx`, `useMonitorData.ts`, `MatchingStatus.tsx`, `DeduplicationStatus.tsx`

| שאילתה | עכשיו | אחרי |
|---------|--------|-------|
| process-flags | 30s | 60s |
| dashboard-availability-detail | 15s | 60s |
| backfill-remaining | 15s | 60s |
| matching-pending-count | 15s | 60s |
| dedup stats | 15s | 60s |
| scout run history | 10s | 30s |

**סיכון:** אפס — מידע סטטיסטי שמתעדכן לאט. ההפרש של כמה שניות לא משנה דבר.

### סיכום השפעה

- **לפני:** ~42 שאילתות פעילות, 4,000+ שורות נמשכות כל 30 שניות, שני טאבים כבדים טעונים תמיד
- **אחרי:** ~15-20 שאילתות פעילות (תלוי בטאב), רק ספירות קלות, polling מהיר רק כשצריך

### מה לא משתנה
- שום לוגיקה עסקית
- שום ממשק משתמש (UI)
- שום edge function
- שום טבלה בדאטאבייס



## הגבלת המוניטור החי ל-20 פריטים בכל טאב

### הבעיה
הפיד של כל טאב במוניטור טוען מאות פריטים (200 בזמינות, 250 בסריקה/כפילויות/התאמות) — מכביד על ה-DOM ומאט את העבודה.

### הפתרון
שינוי שורה אחת ב-`LiveMonitor.tsx` — חיתוך `filteredFeed` ל-20 פריטים לפני שליחה ל-`LiveFeedTab`:

```typescript
// שורה 48, שינוי:
return feedItems.filter(f => f.type === activeTab);
// ל:
return feedItems.filter(f => f.type === activeTab).slice(0, 20);
```

בנוסף, הקטנת ה-limits ב-`useMonitorData.ts` כדי לא לשלוף נתונים מיותרים מ-DB:
- שורה 333: `limit(250)` → `limit(50)` (scan properties)
- שורה 377: `limit(250)` → `limit(50)` (dedup properties)
- שורה 396: `limit(250)` → `limit(50)` (matching properties)
- שורה 454: `.slice(0, 200)` → `.slice(0, 50)` (availability details)

### קבצים שמשתנים
1. `src/components/scout/checks/LiveMonitor.tsx` — slice(0, 20) על filteredFeed
2. `src/components/scout/checks/monitor/useMonitorData.ts` — הקטנת limits מ-250/200 ל-50

### סיכון
**אפסי** — רק הצגה מצומצמת, אין שינוי בלוגיקה.


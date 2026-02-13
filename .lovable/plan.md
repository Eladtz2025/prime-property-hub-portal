
# שיפור תצוגת סריקות במוניטור החי

## בעיות נוכחיות
1. **מספר עמודים שגוי** - ההדר מציג "עמ' 3/3" במקום "עמ' 3/7" כי הוא סופר רק עמודים שהושלמו ולא את הסך הכולל מהקונפיגורציה
2. **אין שם קונפיגורציה** - השאילתה לא מביאה את שם הקונפיגורציה ואת max_pages
3. **כל דף = שורה נפרדת בפיד** - יוצר רעש ויזואלי עם החלפת אייקונים מהירה
4. **סטטוס לא מדויק** - דפים עם 0 תוצאות מקבלים אייקון אזהרה גם כשאין באמת שגיאה

## פתרון

### שינוי 1: שאילתת scan runs - הוספת join ל-scout_configs
```typescript
// שורה ~226-236
const { data: scanRuns } = useQuery({
  queryKey: ['monitor-scan-runs'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('scout_runs')
      .select('id, started_at, status, source, config_id, properties_found, new_properties, page_stats, scout_configs(name, max_pages)')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(3);
    if (error) throw error;
    return data;
  },
  refetchInterval: 2000,
});
```

### שינוי 2: תיקון ההדר של סריקות (active processes bar)
במקום `pages?.length` כסך עמודים, שימוש ב-`max_pages` מהקונפיגורציה:
```typescript
scanRuns?.forEach(run => {
  const config = (run as any).scout_configs;
  const maxPages = config?.max_pages || 8;
  const pages = run.page_stats as unknown as PageStat[] | null;
  const done = pages?.filter(p => ['completed','failed','blocked'].includes(p.status)).length || 0;
  const configName = config?.name || run.source;
  activeProcesses.push({
    type: 'scan',
    label: `סריקת ${configName} — עמ׳ ${done}/${maxPages} | ${run.properties_found ?? 0} נמצאו, ${run.new_properties ?? 0} חדשים`,
    elapsed: ...,
    progress: Math.round((done / maxPages) * 100),
  });
});
```

### שינוי 3: שורת סריקה מאוחדת בפיד (במקום שורה לכל דף)
במקום ליצור feed item לכל דף, ליצור **שורה אחת מסכמת** לכל ריצת סריקה + אופציונלית שורות רק לדפים עם שגיאות:

```typescript
scanRuns?.forEach(run => {
  const config = (run as any).scout_configs;
  const pages = run.page_stats as unknown as PageStat[] | null;
  if (!pages || pages.length === 0) return;
  
  const maxPages = config?.max_pages || 8;
  const completedPages = pages.filter(p => p.status === 'completed');
  const failedPages = pages.filter(p => p.status === 'failed' || p.status === 'blocked');
  const lastPage = pages[pages.length - 1];
  const totalFound = pages.reduce((s, p) => s + (p.found || 0), 0);
  const totalNew = pages.reduce((s, p) => s + (p.new || 0), 0);
  
  // שורה מסכמת אחת
  feedItems.push({
    type: 'scan',
    timestamp: lastPage.timestamp || run.started_at,
    primary: `סריקת ${config?.name || run.source} — עמ׳ ${pages.length}/${maxPages}`,
    details: `${totalFound} נמצאו | ${totalNew} חדשים | ${completedPages.length} תקינים${failedPages.length > 0 ? ` | ${failedPages.length} נכשלו` : ''}`,
    source: run.source,
    status: failedPages.length > 0 ? 'warning' : 'ok',
  });
  
  // שורות נפרדות רק לשגיאות
  failedPages.forEach(p => {
    feedItems.push({
      type: 'scan',
      timestamp: run.started_at,
      primary: `עמ׳ ${p.page} — ${p.error || 'שגיאה'}`,
      details: truncateUrl(p.url),
      source: run.source,
      status: 'error',
    });
  });
});
```

## סיכום

| קובץ | שינוי |
|---|---|
| `src/components/scout/checks/LiveMonitor.tsx` | 1. Join scout_configs בשאילתה 2. תיקון חישוב עמודים בהדר 3. מעבר לשורה מאוחדת לכל סריקה |

התוצאה: הסריקה תוצג כשורה אחת שמתעדכנת בזמן אמת ("סריקת הומלס שכירות — עמ' 4/7 | 160 נמצאו | 0 חדשים") במקום 7 שורות נפרדות עם אייקונים מתחלפים.



## שדרוג KPI Cards — Metric Tiles מתקדמים

### מה יש היום
6 כרטיסי `StatCard` פשוטים עם אייקון + מספר + label. אין השוואה, אין trend, אין hover, עיצוב בסיסי.

### מה ייבנה

**קומפוננטת `ScoutMetricTile`** חדשה שתחליף את `StatCard` הנוכחי, עם:

1. **מספר גדול** (text-2xl/3xl bold) + label קטן מתחת
2. **שינוי מול אתמול** — חישוב דלתא: שליפת נתוני אתמול מ-`availability_check_runs` (סה"כ נבדקו אתמול, inactive שסומנו אתמול) + ספירת נכסים שנוספו אתמול. מוצג כ- `+12.4%` או `↓ 23%` בירוק/אדום
3. **Sparkline** — SVG path קטן (inline, בלי ספריה) שמציג trend של 7 ימים אחרונים. הנתונים יגיעו מ-query שסוכם runs/counts לפי יום
4. **Hover tooltip** — `HoverCard` עם פירוט: מספר מדויק, תאריך עדכון אחרון, פירוט נוסף רלוונטי
5. **Indicator צבעוני** — פס glow עדין בתחתית הכרטיס לפי סטטוס (ירוק = תקין, צהוב = דורש תשומת לב, אדום = בעיה)

### עיצוב

- `bg-card/80 backdrop-blur-sm` — רקע שקוף מעט
- `border border-white/10` — border עדין
- `rounded-2xl` — פינות גדולות
- `shadow-[0_0_15px_rgba(color,0.08)]` — glow חלש לצבע הסטטוס
- אייקון קטן ועדין (h-4 w-4, opacity-60) בפינה, לא דומיננטי
- אנימציית hover עדינה (scale-[1.02], shadow מוגבר)

### מקור נתוני השוואה

Query חדש שמחשב:
- סה"כ נכסים אתמול (count של נכסים שנוצרו עד אתמול)
- נבדקו אתמול (sum של properties_checked מ-runs של אתמול)
- כפילויות אתמול (snapshot לא זמין — נשתמש בערך נוכחי בלבד, ללא delta)
- התאמות אחרונות (מ-personal_scout_runs הקודם)

לכרטיסים שאין להם היסטוריה טבעית (כפילויות, התאמות) — לא יוצג שינוי, רק הערך + sparkline ריק

### Sparkline

SVG inline פשוט — polyline על 7 נקודות, בלי ספריה חיצונית. גובה ~24px, רוחב ~60px. צבע תואם לצבע הסטטוס של הכרטיס.

### קבצים

| קובץ | שינוי |
|-------|-------|
| `src/components/scout/ScoutMetricTile.tsx` | קומפוננטה חדשה |
| `src/components/scout/MiniSparkline.tsx` | קומפוננטת SVG sparkline |
| `src/pages/AdminPropertyScout.tsx` | החלפת StatCard ב-ScoutMetricTile + query חדש לנתוני השוואה |


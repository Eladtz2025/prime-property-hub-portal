

## שליטה על Link Card + יישור RTL בפייסבוק

### הבעיות
1. **טקסט Link Card מיושר לשמאל** — הכותרת והתיאור מתחת לתמונה מופיעים בצד שמאל במקום ימין
2. **אין שליטה על התוכן** — מה שמופיע ב-Link Card נקבע אוטומטית מנתוני הנכס, בלי אפשרות לערוך

### הסבר טכני
פייסבוק גורד את `og:title` ו-`og:description` מה-URL שנשלח בפוסט. הפונקציה `og-property` כבר מוסיפה `\u200F` (RTL mark) אבל פייסבוק לפעמים מתעלם ממנו. הפתרון: להוסיף תו RTL embedding (`\u202B`) שכופה כיוון ימין-לשמאל ברמת הפסקה.

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `og-property/index.ts` | תמיכה ב-query params `custom_title` ו-`custom_desc` שעוקפים את הערכים האוטומטיים. חיזוק RTL עם `\u202B` (Right-to-Left Embedding) |
| 2 | `AutoPublishManager.tsx` | הוספת 2 שדות טקסט קטנים: "כותרת Link Card" ו-"תיאור Link Card" שמאפשרים עריכה. כשריקים — נשארים אוטומטיים. הערכים מועברים כ-query params ב-URL |
| 3 | `FacebookPostPreview.tsx` | יישור RTL ל-Link Card area: זיהוי אם הטקסט בעברית (תו ראשון עברי) → `text-right dir="rtl"`, אם באנגלית → `text-left dir="ltr"` |

### פירוט

**og-property — query params + RTL חזק:**
```typescript
// קריאת override מ-URL
const customTitle = url.searchParams.get('custom_title');
const customDesc = url.searchParams.get('custom_desc');

// שימוש ב-override אם קיים
const finalTitle = customTitle || fullTitle;
const finalDesc = customTitle || description; // custom = custom RTL handling

// RTL embedding חזק יותר
const rtlWrap = (text: string) => `\u202B${text}\u202C`;
const escapedTitle = escapeHtml(isEnglish ? finalTitle : rtlWrap(finalTitle));
```

**AutoPublishManager — שדות עריכה:**
```
[כותרת Link Card]  [תיאור Link Card]
```
שני inputs קטנים עם placeholder מהערך האוטומטי. כש-linkUrl נבנה, מוסיפים query params:
```typescript
const ogUrl = `https://...og-property?id=${prop.id}&lang=he` +
  (customLinkTitle ? `&custom_title=${encodeURIComponent(customLinkTitle)}` : '') +
  (customLinkDesc ? `&custom_desc=${encodeURIComponent(customLinkDesc)}` : '');
```

**FacebookPostPreview — כיוון אוטומטי:**
```typescript
const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text?.charAt(0) || '');
// בתוך ה-Link Card area:
<div dir={isHebrew(linkTitle) ? 'rtl' : 'ltr'} className={isHebrew(linkTitle) ? 'text-right' : 'text-left'}>
```

**3 קבצים + deploy של og-property.**


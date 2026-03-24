

## מיזוג 3 טאבים לתצוגה אחת רציפה

### שינוי
**`src/components/social/SocialDashboard.tsx`** — הסרת כל מנגנון ה-Tabs והצגת 3 הרכיבים אחד מתחת לשני:

1. הסרת imports של Tabs, TabsList, TabsTrigger, TabsContent, PenSquare, CalendarDays, Wrench
2. במקום ה-Tabs (שורות 89-114), הצגה רציפה:
   - `<SocialPostComposer />` — קומפוזר
   - `<SocialPostsList />` — היסטוריה
   - `<SocialToolsPanel />` — כלים

שורת הסטטוס הקומפקטית + אייקון הגדרות + Sheet נשארים כמו שהם.

**קובץ אחד, ~15 שורות פחות.**


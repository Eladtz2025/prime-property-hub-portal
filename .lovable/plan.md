

## יצירת טאב "שיווק" בניווט העליון והעברת תכני ווטסאפ אליו

### מה ישתנה

1. **ניווט עליון (`TopNavigation.tsx`)** — הוספת פריט "שיווק" אחרי "נכסים", עם נתיב `/admin-dashboard/marketing` ואייקון `Megaphone`

2. **עמוד חדש `MarketingHub.tsx`** — עמוד עם טאבים פנימיים:
   - **ווטסאפ** — יכיל 3 תתי-טאבים: שליחת הודעות (`PropertyWhatsAppTab`), היסטורית שיחות (`PropertyWhatsAppHistory`), אוטומציות (`WhatsAppAutomations`)
   - **פרסום** — placeholder ריק לעת עתה
   - **טאב שלישי** — placeholder ריק (אפשר לשנות אחר כך)

3. **עמוד נכסים (`Properties.tsx`)** — הסרת הטאבים לחלוטין, יישאר רק תוכן הטבלה (טאב "רשימה" הנוכחי) ישירות ללא מעטפת Tabs

4. **ראוטינג (`App.tsx`)** — הוספת route ל-`/admin-dashboard/marketing` שמפנה ל-`MarketingHub`

### קבצים
- **חדש**: `src/pages/MarketingHub.tsx`
- **עריכה**: `src/components/TopNavigation.tsx`, `src/pages/Properties.tsx`, `src/App.tsx`


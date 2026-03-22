

## הוספת "שיווק" לניווט המובייל התחתון

### בעיה
`MobileBottomNavigation.tsx` מכיל 4 פריטים בלבד: לוח בקרה, נכסים, לקוחות, סקאוט. חסר "שיווק".

### פתרון
הוספת פריט `{ title: "שיווק", url: "/admin-dashboard/marketing", icon: Megaphone }` למערך `mainNavItems` — אחרי "נכסים" (שורה 13), בדיוק כמו בדסקטופ.

### קובץ
- **עריכה**: `src/components/MobileBottomNavigation.tsx` — הוספת import ל-`Megaphone` ושורה אחת למערך


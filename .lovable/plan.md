

## הסרת טאבים מ-MarketingHub + שינוי שם בניווט

### שינויים

**1. `src/pages/MarketingHub.tsx`** — הסרת כל מבנה ה-Tabs, רינדור ישיר של `<SocialDashboard />`

**2. שינוי שם "שיווק" → "פרסום" ב-3 קבצי ניווט:**
- `src/components/TopNavigation.tsx` — שורה 14
- `src/components/EnhancedTopNavigation.tsx` — שורה 30
- `src/components/MobileBottomNavigation.tsx` — שורה 15

### קבצים
| פעולה | קובץ |
|-------|------|
| עריכה | `src/pages/MarketingHub.tsx` — הסרת Tabs, רינדור ישיר SocialDashboard |
| עריכה | `src/components/TopNavigation.tsx` — "שיווק" → "פרסום" |
| עריכה | `src/components/EnhancedTopNavigation.tsx` — "שיווק" → "פרסום" |
| עריכה | `src/components/MobileBottomNavigation.tsx` — "שיווק" → "פרסום" |


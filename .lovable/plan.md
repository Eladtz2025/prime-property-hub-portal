
## הוספת טאב "שיווק" לניווט העליון הנכון

### בעיה
הטאב "שיווק" נוסף ל-`TopNavigation.tsx`, אבל מסך האדמין דשבורד משתמש ב-`EnhancedTopNavigation.tsx` — שם הוא לא קיים.

### פתרון
הוספת פריט "שיווק" למערך `navigationItems` ב-`EnhancedTopNavigation.tsx`, אחרי "נכסים":

```tsx
{ title: "שיווק", url: "/admin-dashboard/marketing", icon: Megaphone },
```

והוספת `Megaphone` ל-import מ-lucide-react.

### קובץ: `src/components/EnhancedTopNavigation.tsx`
שינוי של 2 שורות בלבד.

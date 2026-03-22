
## החלפת מיקום הטקסט והחץ ב-Select

### שינוי ב-`src/components/ui/select.tsx` (שורות 25-29)
להחליף את סדר ה-`children` וה-`Icon` — כך שהטקסט ("בחר תבנית") יהיה בצד ימין והחץ (chevron) בצד שמאל:

```tsx
// לפני:
<SelectPrimitive.Icon asChild>
  <ChevronDown className="h-4 w-4 opacity-50" />
</SelectPrimitive.Icon>
{children}

// אחרי:
{children}
<SelectPrimitive.Icon asChild>
  <ChevronDown className="h-4 w-4 opacity-50" />
</SelectPrimitive.Icon>
```

### קובץ
- **עריכה**: `src/components/ui/select.tsx` — החלפת סדר בלבד

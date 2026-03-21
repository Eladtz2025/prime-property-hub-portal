

## איחוד כפתורי הוספה לתפריט דרופדאון אחד

### מה ישתנה
ב-`AdminCustomers.tsx`, שני הכפתורים "לקוח חדש" ו"מתווך חדש" יוחלפו בכפתור אחד **"+ הוספה"** עם DropdownMenu שמציע שתי אפשרויות: "לקוח" ו"מתווך".

### שינוי — `src/pages/AdminCustomers.tsx`
- הוספת imports: `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger`
- החלפת שני כפתורי ה-Plus בכפתור דרופדאון אחד:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm">
      הוספה
      <Plus className="h-4 w-4 sm:mr-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem onClick={() => setAddCustomerModalOpen(true)}>
      לקוח חדש
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => { setEditBroker(null); setAddBrokerModalOpen(true); }}>
      מתווך חדש
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

קובץ אחד, ~10 שורות שינוי.


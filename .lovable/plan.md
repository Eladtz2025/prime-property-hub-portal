

# הוספת כפתור מחיקה לנכסים סקאוטים

## סיכום

הוספת אייקון מחיקה (פח אשפה) לפעולות ליד כל נכס בטבלה - גם ב-Desktop וגם ב-Mobile.

---

## שינויים נדרשים

### 1. הוספת אייקון Trash2 ל-imports (שורה 15)

```typescript
// לפני
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye, Download, ... } from 'lucide-react';

// אחרי
import { ExternalLink, Users, MessageSquare, Archive, Search, Eye, Download, Trash2, ... } from 'lucide-react';
```

---

### 2. יצירת deleteMutation (אחרי archiveMutation, שורה ~714)

```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('scouted_properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
    queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
    toast.success('הנכס נמחק לצמיתות');
  },
  onError: () => {
    toast.error('שגיאה במחיקת הנכס');
  }
});
```

---

### 3. הוספת כפתור מחיקה ב-Desktop (אחרי כפתור ארכיון, שורה ~1709)

```typescript
{/* Delete button - always show */}
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הנכס לצמיתות?')) {
      deleteMutation.mutate(property.id);
    }
  }}
  disabled={deleteMutation.isPending}
  title="מחק לצמיתות"
  className="text-destructive hover:text-destructive hover:bg-destructive/10"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

---

### 4. הוספת כפתור מחיקה ב-Mobile (אחרי כפתור ארכיון, שורה ~1790)

```typescript
{/* Delete button */}
<Button
  variant="ghost"
  size="sm"
  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
  onClick={() => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הנכס לצמיתות?')) {
      deleteMutation.mutate(property.id);
    }
  }}
  disabled={deleteMutation.isPending}
>
  <Trash2 className="h-3.5 w-3.5" />
</Button>
```

---

## הרשאות

כבר קיימת policy ב-DB שמאפשרת למנהלים למחוק:

```sql
CREATE POLICY "Admins can delete scouted properties"
  ON public.scouted_properties FOR DELETE
  USING (public.get_current_user_role() IN ('super_admin', 'admin'));
```

---

## תוצאה צפויה

| פעולות נוכחיות | פעולות אחרי השינוי |
|----------------|-------------------|
| 👁️ צפה, 🔗 מקור, 📥 ייבא, 💬 התאם, 📦 ארכיון | 👁️ צפה, 🔗 מקור, 📥 ייבא, 💬 התאם, 📦 ארכיון, 🗑️ **מחק** |

הכפתור יופיע באדום כדי לסמן פעולה הרסנית, ויבקש אישור לפני מחיקה.

---

## קובץ לעדכון

| קובץ | שינויים |
|------|----------|
| `src/components/scout/ScoutedPropertiesTable.tsx` | 1. Import Trash2 2. deleteMutation 3. כפתור Desktop 4. כפתור Mobile |


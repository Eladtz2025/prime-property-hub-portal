
## תיקון: חשבון פייסבוק לא מופעל מחדש אחרי חידוש טוקן

### הבעיה
כשהטוקן פג, ה-edge function סימנה `is_active = false`. כשהמשתמש חידש את הטוקן דרך ה-setup, הקוד עדכן את הטוקן אבל **לא שינה את `is_active` חזרה ל-`true`**.

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | Migration | `UPDATE social_accounts SET is_active = true WHERE id = '6cb34d66-...'` — תיקון מיידי |
| 2 | `SocialAccountSetup.tsx` | בפונקציית `handleVerifyAndSave`, להוסיף `is_active: true` ל-upsert כדי שכל חידוש טוקן יפעיל מחדש את החשבון |

### פירוט

**Migration (תיקון מיידי):**
```sql
UPDATE social_accounts SET is_active = true WHERE id = '6cb34d66-6ed7-4fe9-b45a-5d575a7c5aa4';
```

**SocialAccountSetup.tsx — בכל upsert של חשבון:**
```typescript
// לפני
{ access_token, page_id, token_expires_at, ... }

// אחרי — הוסף is_active: true
{ access_token, page_id, token_expires_at, is_active: true, ... }
```

**2 שינויים: migration + שורה אחת בקוד.**

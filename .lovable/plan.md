

## תיקון: אימות טוקן אמיתי + עדכון סטטוס על כשלון

### הבעיה הכפולה

1. **סטטוס מטעה** — `token_expires_at` נקבע כ-`now()+60d` בלי לשאול את Facebook מתי הטוקן באמת פג
2. **אין עדכון על כשלון** — כשה-edge function מקבלת "token expired" מפייסבוק, היא לא מעדכנת את `is_active = false` בטבלת `social_accounts`

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `SocialAccountSetup.tsx` | אחרי אימות שם הדף, לקרוא ל-`/debug_token` API של פייסבוק כדי לקבל את `expires_at` האמיתי. אם הטוקן short-lived — להציג אזהרה ולא לשמור |
| 2 | `SocialAccountSetup.tsx` | להשתמש ב-`data_access_expires_at` מ-Facebook במקום חישוב מקומי |
| 3 | `social-publish/index.ts` | כשפייסבוק מחזיר שגיאת "expired token" — לעדכן `social_accounts.is_active = false` כדי שהסטטוס ישקף מציאות |

### פירוט טכני

**אימות טוקן אמיתי (SocialAccountSetup.tsx):**
```typescript
// אחרי בדיקת שם הדף, בדוק את הטוקן עצמו
const tokenRes = await fetch(
  `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
);
const tokenData = await tokenRes.json();

if (tokenData.data?.error) {
  toast({ title: 'טוקן לא תקין', description: tokenData.data.error.message });
  return;
}

// תאריך תפוגה אמיתי מפייסבוק
const realExpiry = tokenData.data?.data_access_expires_at 
  ? new Date(tokenData.data.data_access_expires_at * 1000).toISOString()
  : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

// אזהרה אם הטוקן short-lived (פג תוך פחות מיום)
const expiresAt = tokenData.data?.expires_at;
if (expiresAt && expiresAt > 0 && (expiresAt * 1000 - Date.now()) < 24 * 60 * 60 * 1000) {
  toast({ title: 'טוקן Short-Lived', description: 'יש ליצור Long-Lived Token', variant: 'destructive' });
  return;
}
```

**עדכון סטטוס בכשלון (social-publish/index.ts):**
```typescript
// כשפייסבוק מחזיר token expired
if (result.error?.includes('expired') || result.error?.includes('validating access token')) {
  await supabase.from('social_accounts')
    .update({ is_active: false })
    .eq('id', account.id);
}
```

### מה זה נותן

- **סטטוס אמיתי** — אם הטוקן פג, הסטטוס יראה X אדום
- **אי אפשר לשמור טוקן פג** — המערכת תזהה ותתריע
- **אי אפשר לשמור short-lived token** — המערכת תדרוש long-lived

**2 קבצים + deploy של edge function.**


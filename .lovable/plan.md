

## תיקון: מילוי אוטומטי של Page ID ו-IG User ID מהחשבון הקיים

### הבעיה
כשיש כבר חשבון מחובר, השדות Page ID ו-Instagram ID ריקים ומציגים את הערכים הקיימים רק כ-placeholder באפור. המשתמש צריך למלא רק טוקן חדש.

### פתרון

**קובץ: `SocialAccountSetup.tsx`**

1. **אתחול שדות מהנתונים הקיימים** — כש-`accounts` נטען, למלא את `pageId` ו-`igUserId` עם הערכים מ-DB באמצעות `useEffect`
2. **validation** — בפונקציית `handleVerifyAndSave`, להשתמש ב-`pageId || fbAccount?.page_id` כ-fallback כדי שגם בלי שינוי בשדה הערך ילקח מהחשבון הקיים

```typescript
// הוסף useEffect שממלא את השדות כשהנתונים נטענים
useEffect(() => {
  if (fbAccount?.page_id && !pageId) setPageId(fbAccount.page_id);
  if (igAccount?.ig_user_id && !igUserId) setIgUserId(igAccount.ig_user_id);
}, [fbAccount, igAccount]);
```

**קובץ אחד, שינוי קטן.**


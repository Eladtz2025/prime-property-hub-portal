

## הפוסט לא באמת פורסם — הטוקן של פייסבוק פג תוקף

### מה קרה

בדקתי את בסיס הנתונים והנה מה שמצאתי:

```
status: scheduled
retry_count: 1
error_message: "Error validating access token: Session has expired 
on Tuesday, 24-Mar-26 06:00:00 PDT"
```

**הטוקן של פייסבוק פג תוקף ב-24 במרץ.** הפוסט נכשל ולכן חזר לסטטוס `scheduled` לניסיון חוזר — אבל הניסיון החוזר גם ייכשל כי הטוקן עדיין לא תקף.

### למה ההודעה אמרה "פורסם בהצלחה"?

יש באג — הקוד מציג הודעת הצלחה **לפני** שבודק אם פייסבוק באמת קיבל את הפוסט. הוא מציג "פורסם!" ברגע שה-Edge Function מחזירה תשובה, בלי לבדוק אם `success: true` או `false`.

### מה שצריך לעשות

| # | שינוי | פרטים |
|---|-------|--------|
| 1 | **חידוש טוקן פייסבוק** | צריך להיכנס להגדרות חשבון סושיאל ולחדש את הטוקן מ-Meta |
| 2 | **תיקון הודעת הצלחה שגויה** | ב-`AutoPublishManager.tsx` — לבדוק את תוצאת `publishMutation.mutateAsync()` לפני הצגת הודעת הצלחה. אם `success: false`, להציג הודעת שגיאה עם הפירוט מפייסבוק |
| 3 | **הסרת כפילות הודעות** | ב-`usePublishPost` כבר יש toast על הצלחה/כשלון. ב-`AutoPublishManager` יש toast נוסף. צריך להשאיר רק אחד |

### איפה הפוסט?

הפוסט נמצא ברשימת הפוסטים **מתחת** לטופס הפרסום (קומפוננטת `SocialPostsList`). הוא מוצג עם סטטוס "מתוזמן" כי המערכת ניסתה שוב אוטומטית.

### שינויים טכניים

**`AutoPublishManager.tsx` — `executeSave`:**
```typescript
// לפני (באגי):
await publishMutation.mutateAsync({ postId: newPost.id, isPrivate });
toast({ title: '🚀 הפוסט פורסם בהצלחה!' }); // תמיד מוצג!

// אחרי (מתוקן):
const result = await publishMutation.mutateAsync({ postId: newPost.id, isPrivate });
// Toast מוצג כבר ב-usePublishPost.onSuccess על בסיס result.success
```

**`useSocialPosts.ts` — `usePublishPost`:**
- להוסיף `throw` כש-`success: false` כדי שה-caller ידע שנכשל

**קובץ אחד לתיקון קוד + חידוש טוקן ידני מצידך.**


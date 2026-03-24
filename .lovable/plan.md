
## הוספת אישור לפני שליחת הודעות WhatsApp

### הבעיה
כפתור "שלח הודעה" ב-WhatsAppSendDialog וכפתור "שלח ל-X נמענים" ב-WhatsAppBulkSendDialog שולחים ישר בלי שום אישור.

### התיקון

**`src/components/WhatsAppSendDialog.tsx`**:
- הוספת state `confirmOpen`
- כפתור "שלח" פותח ConfirmDialog במקום לשלוח ישר
- הודעת אישור: "האם לשלוח הודעת WhatsApp ל-{name}?"
- רק אחרי אישור → `handleSend` נקרא

**`src/components/WhatsAppBulkSendDialog.tsx`**:
- אותו דבר — כפתור "שלח ל-X נמענים" פותח ConfirmDialog
- הודעת אישור: "האם לשלוח הודעה ל-{X} נמענים?"
- רק אחרי אישור → `handleBulkSend` נקרא

שני הקבצים ישתמשו ב-`ConfirmDialog` שכבר קיים ב-`src/components/social/ConfirmDialog.tsx`.

**2 קבצים, ~15 שורות שינוי בכל אחד.**

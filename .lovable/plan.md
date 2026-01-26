
# תיקון: 3 בעיות בזיכרון דברים

## בעיה 1: כפתור WhatsApp מופיע ללקוח בעמוד התודה

### הסיבה
הקוד מעביר `onSendWhatsApp` ל-`FormThankYouScreen` תמיד, גם כשזה לקוח שחותם מרחוק.

### הפתרון
**קובץ:** `src/pages/MemorandumFormPage.tsx`

להוסיף תנאי - אם זה `isRemoteSigning` אז לא להעביר את כפתור WhatsApp:

```typescript
// שורות 311-315 - להחליף:
onSendWhatsApp={isRemoteSigning ? undefined : handleSendWhatsApp}
sendWhatsAppText={isRemoteSigning ? undefined : t.sendViaWhatsApp}
whatsAppSentText={isRemoteSigning ? undefined : t.whatsAppSent}
whatsAppErrorText={isRemoteSigning ? undefined : t.whatsAppError}
sendingWhatsAppText={isRemoteSigning ? undefined : t.sendingWhatsApp}
```

**אותו תיקון גם ב:**
- `SaleMemorandumFormPage.tsx`
- `ExclusivityFormPage.tsx`

---

## בעיה 2: הורדת PDF לא עובדת מדף האדמין

### הסיבה
הקוד קורא `generateMemorandumPDF(formData)` שמחזיר אובייקט `jsPDF`, אבל לא קורא `.save()`.

### הפתרון
**קובץ:** `src/components/forms/LegalFormsList.tsx`

שורות 110-111:
```typescript
// לפני:
await generateMemorandumPDF(formData);
toast.success('ה-PDF הורד בהצלחה');

// אחרי:
const pdf = await generateMemorandumPDF(formData);
const fileName = `memorandum-${form.client_name?.replace(/\s+/g, '-') || 'form'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
pdf.save(fileName);
toast.success('ה-PDF הורד בהצלחה');
```

אותו תיקון גם לסוג `exclusivity` (שורות 136-137).

---

## בעיה 3: כפתור "פתח" פותח קישור שגוי

### הסיבה
הכפתור משתמש ב-`form.id` (מזהה מהטבלה) במקום בטוקן. הטופס מנסה לטעון טוקן שלא קיים.

### הפתרון
שני אפשרויות:

**אפשרות א' (מומלצת):** פתיחת הטופס ב-read-only עם הנתונים מ-`form_data`:

צריך ליצור route חדש או להעביר נתונים דרך state. מורכב יותר.

**אפשרות ב' (פשוטה יותר):** להסתיר כפתור "פתח" לטפסים שכבר נחתמו, ולהשאיר רק כפתור PDF:

```typescript
// שורות 291-306 - להחליף:
{form.status !== 'signed' && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      const routes: Record<string, string> = {
        memorandum: `/memorandum-form/${form.id}`,
        exclusivity: `/exclusivity-form/${form.id}`,
        broker_sharing: `/broker-sharing-form/${form.id}`,
      };
      window.open(routes[form.form_type] || `/memorandum-form/${form.id}`, '_blank');
    }}
    className="gap-1.5"
  >
    <ExternalLink className="h-4 w-4" />
    פתח
  </Button>
)}
```

**אפשרות ג' (הכי שלמה):** ליצור עמוד צפייה חדש שמציג טופס חתום read-only לפי ID. זה דורש יותר עבודה אבל נותן את החוויה הכי טובה.

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| MemorandumFormPage.tsx | הסתרת WhatsApp ללקוח |
| SaleMemorandumFormPage.tsx | הסתרת WhatsApp ללקוח |
| ExclusivityFormPage.tsx | הסתרת WhatsApp ללקוח |
| LegalFormsList.tsx | תיקון שמירת PDF + הסתרת כפתור פתח לטפסים חתומים |

## תוצאה צפויה

1. ✅ לקוח לא יראה "שלח ללקוח בוואטסאפ" - רק "הורד PDF" ו"סיום"
2. ✅ כפתור PDF באדמין יוריד קובץ
3. ✅ כפתור "פתח" יעלם מטפסים חתומים (או לחילופין - ניצור עמוד צפייה)

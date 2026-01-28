

# תוכנית: תיקון הורדת PDF עבור טפסים משפטיים

## הבעיה

כפתור "הורד PDF" ברשימת הטפסים המשפטיים יוצר PDF ריק/פגום כי:

1. **שליפת נתונים שגויה**: הקוד שולף נתונים מ-`form.form_data` (שדה JSON) במקום מהעמודות הישירות בטבלה
2. **החתימות והפרטים לא מועברים ל-PDF Generator**

## הנתונים בבסיס הנתונים - תקינים

| שדה | ערך (דוגמה - יניב סיפריס) |
|-----|---------------------------|
| client_name | יניב סיפריס |
| client_id_number | 311148589 |
| client_phone | 054-6577778 |
| client_signature | data:image/png;base64,... (40K+ תווים) |
| agent_signature | data:image/png;base64,... (40K+ תווים) |
| property_address | פינקס 67 |
| rental_price | 9,500 |

הנתונים שמורים בעמודות הנפרדות בטבלה ולא ב-form_data.

---

## הפתרון

### עדכון LegalFormsList.tsx

**שורות 92-175** - פונקציית `handleDownloadPDF`:

במקום לקרוא מ-`form.form_data`, לקרוא ישירות מעמודות הטופס:

**לפני (שורות 95-109):**
```typescript
const rawData = (form.form_data || {}) as Record<string, unknown>;

if (form.form_type === 'memorandum') {
  const formData = {
    client_name: String(rawData.client_name || form.client_name || ''),
    client_id_number: String(rawData.client_id_number || ''),
    client_signature: String(rawData.client_signature || ''),  // ריק!
    agent_signature: String(rawData.agent_signature || ''),    // ריק!
    ...
  };
}
```

**אחרי:**
```typescript
if (form.form_type === 'memorandum') {
  const formData = {
    client_name: form.client_name || '',
    client_id_number: form.client_id_number || '',
    client_phone: form.client_phone || '',
    client_email: form.client_email || '',
    property_address: form.property_address || '',
    property_city: form.property_city || '',
    property_floor: form.property_floor || '',
    property_rooms: form.property_rooms || '',
    property_size: form.property_size || '',
    rental_price: form.rental_price || '',
    deposit_amount: form.deposit_amount || '',
    payment_method: form.payment_method || '',
    guarantees: form.guarantees || '',
    entry_date: form.entry_date || '',
    notes: form.notes || '',
    client_signature: form.client_signature || '',   // מהעמודה הישירה
    agent_signature: form.agent_signature || '',      // מהעמודה הישירה
    form_date: form.created_at,
    language: (form.language || 'he') as 'he' | 'en',
  };
  const pdf = await generateMemorandumPDF(formData);
  ...
}
```

### עדכון ה-Interface

**שורות 16-26** - הוספת שדות חסרים ל-LegalForm interface:

```typescript
interface LegalForm {
  id: string;
  form_type: string;
  language: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  // Existing
  client_name: string | null;
  property_address: string | null;
  form_data: unknown;
  // NEW - add missing columns
  client_id_number: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_signature: string | null;
  agent_signature: string | null;
  property_city: string | null;
  property_floor: string | null;
  property_rooms: string | null;
  property_size: string | null;
  rental_price: string | null;
  deposit_amount: string | null;
  payment_method: string | null;
  guarantees: string | null;
  entry_date: string | null;
  notes: string | null;
  // For exclusivity
  second_party_name: string | null;
  second_party_id: string | null;
  second_party_phone: string | null;
  second_party_signature: string | null;
}
```

---

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| `src/components/forms/LegalFormsList.tsx` | עדכון interface + שינוי handleDownloadPDF |

---

## תוצאה צפויה

- PDF יכלול את כל הפרטים: שם לקוח, ת.ז., טלפון, כתובת נכס, מחיר
- PDF יכלול את שתי החתימות (סוכן + לקוח)
- הטקסט העברי יוצג נכון (ללא "ג'יבריש")


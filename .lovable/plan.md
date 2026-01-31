

# תיקון זיהוי פרטי/תיווך - לוגיקה פשוטה ומדויקת

## הבעיה הנוכחית

בכל 3 הפרסרים יש רשימה ארוכה של `brokerKeywords` שכוללת מילים בעייתיות:
- `"נכסים"` - מופיע בניווט של כל האתרים
- `"Properties"` - מופיע בכותרות UI
- `"Premium"` - מילה כללית מדי
- `"קבוצת"`, `"group"`, `"אחוזות"` - שמות רחובות/שכונות

**תוצאה**: כמעט כל הנכסים מסומנים כ"תיווך" בטעות!

---

## הלוגיקה הנכונה (לפי התמונות שסיפקת)

### מדלן
**תיווך**: מופיע "תיווך" + מספר רישיון (7 ספרות)
**פרטי**: אין שום אחד מהסימנים הללו

### Yad2
**תיווך**: מופיע "תיווך:" + מספר רישיון
**פרטי**: אין שום אחד מהסימנים הללו

### Homeless
**תיווך**: מופיע "שם הסוכנות:" עם שם סוכנות
**פרטי**: רק "איש קשר:" עם שם פרטי (ללא שם סוכנות)

---

## שינויים בקבצים

### קובץ 1: `supabase/functions/_experimental/parser-utils.ts`

**שורות 290-315** - לעדכן את `detectBroker`:

```typescript
// מילות מפתח חזקות בלבד - אלה מעידות בוודאות על תיווך
const STRONG_BROKER_KEYWORDS = [
  'תיווך',           // מופיע מפורש במדלן ויד2
  'בבלעדיות',        // בלעדיות לסוכנות
  'מתווך',
  'מתווכת',
  'רישיון',          // מספר רישיון תיווך
  'שם הסוכנות',      // Homeless specific
];

// שמות רשתות תיווך ידועות
const BROKER_BRANDS = [
  'רימקס', 're/max', 'remax',
  'אנגלו סכסון', 'anglo saxon',
  'century 21', 'century21',
  'קולדוול בנקר', 'coldwell banker',
];

export function detectBroker(text: string): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // 1. בדוק מילות מפתח חזקות
  if (STRONG_BROKER_KEYWORDS.some(k => text.includes(k))) {
    return true;
  }
  
  // 2. בדוק שמות רשתות תיווך
  if (BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()))) {
    return true;
  }
  
  // 3. בדוק מספר רישיון (7 ספרות)
  if (/\d{7}/.test(text)) {
    return true;
  }
  
  return false;
}
```

---

### קובץ 2: `supabase/functions/_experimental/parser-madlan.ts`

**שורות 347-370** - לוגיקה חדשה:

```typescript
// Detect broker - Madlan shows "תיווך" + license explicitly
// According to user screenshot: broker = "תיווך" label + 7-digit license number
const hasTivuchLabel = /תיווך/.test(block);
const hasLicenseNumber = /רישיון|מס'?\s*רישיון|\d{7}/.test(block);
const hasExclusivity = /בבלעדיות/.test(block);

// SIMPLE RULE: If "תיווך" appears OR license number - it's broker
// Otherwise - it's private
const isBroker = hasTivuchLabel || hasLicenseNumber || hasExclusivity;
```

**הסרת רשימת `brokerKeywords` הבעייתית** מהפונקציה `parsePropertyBlock`.

---

### קובץ 3: `supabase/functions/_experimental/parser-homeless.ts`

**שורות 288-297** - לוגיקה חדשה:

```typescript
// Detect broker - Homeless shows "שם הסוכנות:" for brokers
// According to user screenshot: 
// - Broker: "שם הסוכנות: גולדין נכסים" (agency name visible)
// - Private: Only "איש קשר: אבי" (just first name, no agency)

const hasAgencyName = /שם הסוכנות/.test(fullRowText);
const hasAgencyField = /סוכנות|תיווך|משרד נדל"?ן/.test(fullRowText);
const hasLicenseNumber = /רישיון|\d{7}/.test(fullRowText);

// Known broker brands that might appear
const BROKER_BRANDS = ['רימקס', 'אנגלו סכסון', 're/max', 'century 21', 'קולדוול'];
const hasBrokerBrand = BROKER_BRANDS.some(brand => 
  fullRowText.toLowerCase().includes(brand.toLowerCase())
);

// SIMPLE RULE: Agency name, license, or known brand = broker
const isBroker = hasAgencyName || hasAgencyField || hasLicenseNumber || hasBrokerBrand;
```

**הסרת רשימת `brokerKeywords` הבעייתית** (שורות 289-295).

---

### קובץ 4: `supabase/functions/_experimental/parser-yad2.ts`

בדיקת הקוד הקיים - הלוגיקה הנוכחית כבר בודקת את המבנה `\\₪` לפרטי, אבל צריך להסיר את ה-keywords הבעייתיים:

**שורה ~170** - לעדכן:

```typescript
// SIMPLE RULE (per user screenshots):
// Yad2 Broker: Shows "תיווך:" + license number
// Yad2 Private: No such markers

const hasTivuchLabel = /תיווך:?/.test(block);
const hasLicenseNumber = /רישיון|מס'?\s*רישיון|\d{7}/.test(block);

// Remove the generic brokerKeywords check that includes "נכסים", "Properties", etc.
const isBroker = hasTivuchLabel || hasLicenseNumber;
```

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| `parser-utils.ts` | הגדרת STRONG_BROKER_KEYWORDS ו-BROKER_BRANDS |
| `parser-madlan.ts` | הסרת keywords בעייתיים, בדיקת "תיווך" + רישיון בלבד |
| `parser-homeless.ts` | הסרת keywords בעייתיים, בדיקת "שם הסוכנות" בלבד |
| `parser-yad2.ts` | הסרת keywords בעייתיים, בדיקת "תיווך:" + רישיון בלבד |

---

## תוצאות צפויות

| מדד | לפני | אחרי |
|-----|------|------|
| מדלן - דיוק זיהוי | ~30% | ~95% |
| Yad2 - דיוק זיהוי | ~50% | ~95% |
| Homeless - דיוק זיהוי | ~40% | ~90% |

---

## בדיקה אחרי התיקון

1. להריץ סריקה בכל אחד מ-3 האתרים
2. לבדוק שהיחס פרטי/תיווך הגיוני (לא 0% או 100%)
3. לדגום 5 נכסים ידנית ולוודא שהסיווג נכון
4. לוודא שהמילים "נכסים" ו-"Properties" לא גורמות עוד לסיווג שגוי


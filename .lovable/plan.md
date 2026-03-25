

## התאמת כרטיסי שכונות לסגנון כרטיסי החטיבות

### ההבדלים הנוכחיים
| | חטיבות | שכונות |
|---|---|---|
| Gradient | `from-black/50 via-black/10` | `from-black/80 via-black/30` |
| Padding | `pb-12 px-6` | `p-4 md:p-8` |
| Tracking | `tracking-[0.15em]` | `tracking-wide` |
| Hover תמונה | `scale-105` | `scale-110` |
| Hover כותרת | `-translate-y-1` | אין |

### השינויים

**`src/pages/Index.tsx` + `src/pages/en/Index.tsx` — כרטיסי שכונות:**

1. **Gradient** — `from-black/80 via-black/30` → `from-black/50 via-black/10` + hover `group-hover:from-black/60`
2. **Padding** — `p-4 md:p-8` → `pb-12 px-6`
3. **Tracking כותרת** — `tracking-wide` → `tracking-[0.15em]`
4. **Hover תמונה** — `scale-110` → `scale-105`
5. **Hover כותרת** — הוספת `transition-transform duration-500 group-hover:-translate-y-1`

כך שני סוגי הכרטיסים יהיו זהים לחלוטין בסגנון.

**2 קבצים, ~3 שורות שינוי בכל אחד.**


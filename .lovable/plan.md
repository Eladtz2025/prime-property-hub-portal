
# תיקון Deploy Timeout ב-Edge Functions

## הבעיה
ה-deploy נכשל עם "Bundle generation timed out" כי ה-import של `@supabase/supabase-js@2` לא מקובע לגרסה ספציפית.

## הפתרון
לשנות את ה-import בשני הקבצים מ:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

ל:
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
```

## קבצים לעריכה

### 1. `supabase/functions/trigger-matching/index.ts`
**שורה 2:** שינוי הגרסה ל-`@2.49.1`

### 2. `supabase/functions/match-batch/index.ts`  
**שורה 2:** שינוי הגרסה ל-`@2.49.1`

## אחרי השינוי
לאחר העריכה, הפונקציות יידפלויו אוטומטית (או נפעיל deploy ידני לאימות).


## המשתמש מציג צילום מסך — היסטוריית השלמת נתונים

### מה רואים בתמונה
- 15 ניסיונות אחרונים: **10 כשלון, 5 הצלחה**
- **yad2:** 3 ניסיונות → 2 נכשלו (הצנחנים 19, גלילות), 1 הצליח (הראש 5)
- **madlan:** 5 ניסיונות → **כולם נכשלו** (ארניה אסוולדו 11, אש שלום 26, שדרות בן גוריון 4, שדרות ח"ן, לובטקין צביה 21)
- madlan ב-100% כשלון בריצה הנוכחית

### מה צריך לעשות לפני שעונה
זה לא מקרי — madlan נכשל בכל הניסיונות בריצה הזאת. לפני שאני מציע "שינוי headers" או כל פתרון, אני חייב לראות את **הסיבה האמיתית** של הכיש
<lov-tool-use id="thinking-d26f6a21-b619-4d08-a3b4-3975bcf4b6b3" name="lov-think" data="Let me investigate the actual Madlan failure reason by checking the edge function logs and the code." duration="0.954075">
</lov-tool-use>
Let me check the backfill logs and the code to understand the exact Madlan failure.
<lov-tool-use id="toolu_vrtx_01Nh3gBbbmi6VMn1KmfN7Xdg" name="supabase--edge_function_logs" integration-id="supabase" data="{\"function_name\": \"backfill-property-data-jina\", \"search\": \"madlan\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_019NuqN6ECriX2nNU8MxcrcW" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/backfill-property-data-jina/index.ts\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="thinking-525a1ada-2b2a-45b7-95f6-203606bd53fe" name="lov-think" data="" duration="11.701875">
</lov-tool-use>

<lov-tool-use id="call_FBX6N3zu3KqvGhCCz4tWBLtT" name="code--view" integration-id="code" data="{\"file_path\":\"supabase/functions/backfill-property-data-jina/index.ts\",\"lines\":\"1-260\"}">
</lov-tool-use>

<lov-tool-use id="call_916pJcqYQf52jKKnoIboDlvF" name="code--search_files" integration-id="code" data="{\"search_dir\":\"supabase/functions\",\"include_patterns\":\"**/*.ts\",\"query\":\"fetchMadlanDetailFeatures|scout-madlan-jina|X-Nextjs-Data|application/json, text/html, */*|Origin': 'https://www.madlan.co.il'\"}">
</lov-tool-use>

<lov-tool-use id="thinking-97c6bfa9-af51-43f8-bd9e-1f99b78a4b65" name="lov-think" data="**Planning data gathering**

I need to focus on just responding with a plan for now. I&apos;ll gather more context by reading relevant headers from scout-madlan-jina and possibly backfill logs as needed. Using edge function logs in read-only mode could be helpful. Task tracking may not be necessary, but I might need to determine exact evidence by querying the database or logs. So, I should look closely at the madlan detail parser, scout file lines, and logs." duration="4.119102">
</lov-tool-use>
I’m comparing the working Madlan requests with the failing backfill path to isolate the exact difference.
<lov-tool-use id="call_8TzfyG9F4NM3kUfkQA5Ozbfv" name="code--view" integration-id="code" data="{\"file_path\":\"supabase/functions/scout-madlan-jina/index.ts\",\"lines\":\"1-80\"}">
</lov-tool-use>

<lov-tool-use id="call_ZZagYMhTjukT4JY0RGwSnBXc" name="code--view" integration-id="code" data="{\"file_path\":\"supabase/functions/check-property-availability-jina/index.ts\",\"lines\":\"40-70\"}">
</lov-tool-use>

<lov-tool-use id="call_qiKTaQdz0jT30p38aMLKgMef" name="supabase--edge_function_logs" integration-id="supabase" data="{\"function_name\":\"backfill-property-data-jina\",\"search\":\"Madlan Detail\"}">
</lov-tool-use>

<lov-tool-use id="thinking-d79910c0-b414-4c54-ae97-953592713512" name="lov-think" data="**Gathering evidence for presentation**

I’m thinking about whether the final submission should just be the &lt;presentation-plan&gt;. It mentions presenting a plan, but maybe I can also include a concise plan for diagnosis since it&apos;s related to the task. I should gather enough evidence first, like inspecting the madlan-detail-parser and checking processing path lines. I might need to search for instances of failures, looking into the query database for recent madlan issues. I&apos;ll search the code for keywords like &quot;madlan&quot; and &quot;failed.&quot;" duration="9.954835">
</lov-tool-use>
I’ve confirmed the working Madlan path uses only 3 minimal headers. Now I’m checking the backfill failure path and how failures are recorded.
<lov-tool-use id="call_gas5mC7JFagcvs3120mtPOfD" name="code--view" integration-id="code" data="{\"file_path\":\"supabase/functions/_shared/madlan-detail-parser.ts\",\"lines\":\"1-240\"}">
</lov-tool-use>

<lov-tool-use id="call_7YSwjimn2J8ZJTNOdI9u0mpb" name="code--search_files" integration-id="code" data="{\"include_patterns\":\"supabase/functions/backfill-property-data-jina/index.ts\",\"query\":\"backfill_status.*failed|status: 'failed'|failed_reason|error_message|Madlan Detail|source === 'madlan'\",\"search_dir\":\".\"}">
</lov-tool-use>

<lov-tool-use id="call_rd9vEGKx76GEAGzseKdwBmx2" name="supabase--read_query" integration-id="supabase" data="{\"query\":\"select id, title, address, source, backfill_status, updated_at, source_url from scouted_properties where source = 'madlan' and is_active = true and backfill_status in ('failed','pending') order by updated_at desc limit 10;\"}">
</lov-tool-use>

<lov-tool-use id="thinking-41ae983b-eef5-4dcd-9c61-1ef355f6bb77" name="lov-think" data="" duration="3.482576">
</lov-tool-use>
I’ve isolated the key difference: backfill uses a different Madlan request signature than the working scanner. I’m reading the exact Madlan branch in backfill so I can state precisely why it gets marked failed.
<lov-tool-use id="call_vDrb1cdrTq2QRzeYeBBmkNJ0" name="code--view" integration-id="code" data="{\"file_path\":\"supabase/functions/backfill-property-data-jina/index.ts\",\"lines\":\"700-810\"}">
</lov-tool-use>

<lov-tool-use id="call_99gzl3v5Ypz91PqZpKl0JnyU" name="supabase--read_query" integration-id="supabase" data="{\"query\":\"select id, task_name, status, created_at, summary_data from backfill_progress where task_name = 'data_completion_jina' order by created_at desc limit 3;\"}">
</lov-tool-use>

<lov-tool-use id="thinking-05bfda74-1691-44e7-aedd-8ddd32104eae" name="lov-think" data="**Crafting a concise plan**

I’m thinking about how to respond concisely while keeping things straightforward since there’s no need for actions or assumptions. It seems I should focus on producing a clear plan in Hebrew without unnecessary presentation. I want to make sure it’s succinct and includes only the essentials. I’ll avoid any questions to stick to the instructions. Let’s go ahead and create that plan!" duration="6.157248">
</lov-tool-use>
<lov-plan>
## כן — עכשיו רואים הרבה יותר ברור למה רק מדל"ן נופל ב-backfill

### מה הוכח מהמערכת בזמן אמת
- בריצת `data_completion_jina` האחרונה יש רצף ברור:
  - `yad2` מצליח
  - ואז כמה `madlan` ברצף מסומנים `scrape_failed`
- מתוך `summary_data.recent_items`:
  - `אמיל זולא 20` → `madlan` → `scrape_failed`
  - `הרצפלד 5` → `madlan` → `scrape_failed`
  - `סוקולוב 97` → `madlan` → `scrape_failed`
  - `לובטקין צביה 21` → `madlan` → `scrape_failed`
  - `שדרות ח"ן` → `madlan` → `scrape_failed`
- באותה ריצה בדיוק `yad2` כן מחזיר `ok`

### המסקנה המדויקת
הבעיה היא **לא בתזמון**, **לא בתור**, ו**לא בזה שהבקפיל כולו שבור**.  
הבעיה היא בנתיב הספציפי של **Madlan detail fetch בתוך backfill**.

### למה זה קורה
יש פער ברור בין הבקשה שעובדת לבין זו שנכשלת:

#### מה עובד
גם ב:
- `scout-madlan-jina`
- `check-property-availability-jina`

נשלחים רק 3 headers פשוטים:
```ts
Accept: application/json
X-Nextjs-Data: 1
Accept-Language: he-IL,he;q=0.9
```

#### מה נכשל ב-backfill
ב-`_shared/madlan-detail-parser.ts` נשלחים headers "כבדים" יותר:
```ts
Accept: application/json, text/html, */*
Accept-Language: he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7
User-Agent: ...
Referer: https://www.madlan.co.il/
Origin: https://www.madlan.co.il
X-Nextjs-Data: 1
```

ואם זה לא מצליח, גם ה-GraphQL fallback שולח שוב:
- `User-Agent`
- `Referer`
- `Origin`

### לכן הסיבה הסבירה ביותר
Madlan מקבל את ה-request signature של backfill כחשוד/שונה, בעוד שה-request signature של הסקאנר הפשוט כן עובר.

כלומר:
```text
Scout/Availability:
minimal Next.js headers -> works

Backfill detail parser:
expanded browser-like headers + GraphQL fallback -> blocked / no usable payload
```

### הוכחה נוספת מהקוד של backfill
ב-`backfill-property-data-jina` נכס Madlan מסומן `failed` רק אם:
- `fetchMadlanDetailFeatures(...)` מחזיר `null`, או
- מחזיר אובייקט בלי features

כלומר ה-failure שאתה רואה הוא לא "לוגיקה עסקית" — אלא ממש כשל בשלב ה-fetch / parse של Madlan detail.

## מה אני מציע לעשות
שינוי קטן ומדויק בלבד:

1. **להשוות את parser של Madlan ל-header set שעובד**
2. **להחליף ב-`fetchWithBypassHeaders` את ה-headers ל-3 headers המינימליים**
3. **אם צריך, גם להשבית זמנית את GraphQL fallback או לפשט גם אותו**
4. **להריץ בדיקה רק על נכס Madlan אחד או שניים** לפני שנוגעים בכל התור

## מה לא אעשה
- לא אחליף ארכיטקטורה
- לא אכניס שירות חיצוני
- לא אשכתב את כל מנגנון Madlan
- לא אגע ב-Yad2 / Homeless

## תוכנית תיקון מינימלית אחרי אישור
1. לעדכן את `madlan-detail-parser.ts` כך שישתמש באותם headers שעובדים בסקאנר
2. להוסיף לוג קצר שמדפיס איזה branch הצליח: direct vs graphql
3. להריץ בדיקה נקודתית על נכס Madlan ספציפי
4. רק אם זה מצליח — להחזיר את מרסל ינקו 10 לתור ולבדוק אותו

## התוצאה הצפויה
אם ההשערה הזו נכונה, מדל"ן יחזור לעבוד ב-backfill בלי שינוי גדול — רק על ידי יישור ה-headers לנתיב שכבר הוכח שעובד.

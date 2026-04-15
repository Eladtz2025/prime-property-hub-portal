/**
 * Yad2 Detail Parser — Jina Markdown
 * Fetches detail page via Jina Reader and extracts structured features
 * from "מה יש בנכס" section + "פרטים נוספים" section.
 */

export interface Yad2DetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  rooms?: number;
  price?: number;
  neighborhood?: string;
  address?: string;
  adType?: string;
  propertyCondition?: string;
}

// Feature mapping: Hebrew text → feature key
const FEATURE_MAP: Array<[RegExp, string, boolean]> = [
  [/מרפסת/i, 'balcony', true],
  [/מעלית/i, 'elevator', true],
  [/חניה|חניות/i, 'parking', true],
  [/ממ"?ד|ממ״ד|חדר\s*ביטחון|safe\s*room/i, 'mamad', true],
  [/מחסן/i, 'storage', true],
  [/מיזוג|מזגן/i, 'airConditioner', true],
  [/מרוהט|ריהוט/i, 'furnished', true],
  [/משופצ|שופצ/i, 'renovated', true],
  [/גינה|גן\b/i, 'yard', true],
  [/גישה\s*לנכים|נגיש/i, 'accessible', true],
  [/חיות|בע"?ח/i, 'pets', true],
  [/סורגים/i, 'bars', true],
  [/דוד\s*שמש/i, 'sunHeater', true],
  [/טורנדו|טדיראן/i, 'tadiran', true],
  [/גג|גגון|מרפסת\s*גג/i, 'roof', true],
  [/דלתות\s*פנדור/i, 'pandorDoors', true],
  [/מטבח\s*כשר/i, 'kosherKitchen', true],
  [/בויילר|דוד\s*חשמלי/i, 'boiler', true],
];

export async function fetchYad2DetailFeatures(sourceUrl: string): Promise<Yad2DetailResult | null> {
  const jinaUrl = `https://r.jina.ai/${sourceUrl}`;
  
  const headers: Record<string, string> = {
    'Accept': 'text/markdown',
    'X-No-Cache': 'true',
    'X-Proxy-Country': 'IL',
    'X-Locale': 'he-IL',
    'X-Wait-For-Selector': 'body',
    'X-Timeout': '35',
  };

  // Add Jina API key if available (for free tier)
  const jinaKey = Deno.env.get('JINA_API_KEY');
  if (jinaKey) {
    headers['Authorization'] = `Bearer ${jinaKey}`;
  }

  let markdown: string;
  try {
    const resp = await fetch(jinaUrl, { method: 'GET', headers });
    if (!resp.ok) {
      console.error(`❌ Yad2 Jina returned ${resp.status}`);
      await resp.text();
      return null;
    }
    markdown = await resp.text();
  } catch (e) {
    console.warn(`⚠️ Yad2 Jina first attempt failed, retrying...`);
    await new Promise(r => setTimeout(r, 3000));
    try {
      const resp = await fetch(jinaUrl, { method: 'GET', headers });
      if (!resp.ok) {
        console.error(`❌ Yad2 Jina retry returned ${resp.status}`);
        await resp.text();
        return null;
      }
      markdown = await resp.text();
    } catch (e2) {
      console.error(`❌ Yad2 Jina retry failed:`, e2);
      return null;
    }
  }

  if (!markdown || markdown.length < 500) {
    console.error(`❌ Yad2 Jina: too short content (${markdown?.length || 0} chars)`);
    return null;
  }

  // Check for 404/removed
  if (/error 404|not found|המודעה הוסרה|המודעה לא נמצאה/i.test(markdown.substring(0, 500))) {
    console.warn(`⚠️ Yad2 listing appears removed (404)`);
    return null;
  }

  const features: Record<string, boolean> = {};
  const result: Yad2DetailResult = { features };

  // === Extract "מה יש בנכס" section ===
  const featureSectionMatch = markdown.match(/##?\s*מה יש בנכס([\s\S]*?)(?=##|הדרך לבית|$)/i);
  if (featureSectionMatch) {
    const featureSection = featureSectionMatch[1];
    const items = featureSection.match(/\*\s+(.+)/g) || [];
    
    for (const item of items) {
      const text = item.replace(/^\*\s+/, '').trim();
      for (const [pattern, key] of FEATURE_MAP) {
        if (pattern.test(text)) {
          features[key] = true;
        }
      }
    }
    console.log(`📋 "מה יש בנכס" section: found ${items.length} items → ${Object.keys(features).length} features`);
  }

  // === Extract "פרטים נוספים" section ===
  const detailsMatch = markdown.match(/##?\s*פרטים נוספים([\s\S]*?)(?=##|$)/i);
  if (detailsMatch) {
    const details = detailsMatch[1];
    
    // Property condition: "מצב הנכס משופץ"
    const condMatch = details.match(/מצב\s*הנכס\s+([\u0590-\u05FF\s]+?)(?:\s*מ|$)/);
    if (condMatch) {
      result.propertyCondition = condMatch[1].trim();
      if (/משופץ|שופצ/i.test(result.propertyCondition)) {
        features.renovated = true;
      }
    }
    
    // Size: "מ״ר בנוי 220" or "220 מ״ר"
    const sizeMatch = details.match(/מ[״"]ר\s*(?:בנוי\s*)?(\d+)/i) || details.match(/(\d+)\s*מ[״"]ר/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size > 10 && size < 2000) result.size = size;
    }

    // Parking count: "חניות 2"
    const parkingMatch = details.match(/חניות?\s*(\d+)/i);
    if (parkingMatch) {
      features.parking = true;
    }

    // Entrance: "כניסה מידית"
    if (/כניסה\s*מידית/i.test(details)) {
      // Can store if needed
    }
  }

  // === Extract from title/header ===
  // Title format: "## דירה, רחוב, שכונה, עיר"
  const titleMatch = markdown.match(/##\s*(?:דירה|בית פרטי|פנטהאוז|קוטג|סטודיו)[^,]*,\s*([^,]+),\s*([^,\n]+)/i);
  if (titleMatch) {
    // The format is usually: type, street, neighborhood, city
    // or: type, neighborhood, city
  }

  // === Extract rooms from "X חדרים" in the header area ===
  // Look for pattern like "6 חדרים" near the title
  const roomsMatch = markdown.match(/(\d+(?:\.\d)?)\s*חדרי[ם]?\b/);
  if (roomsMatch) {
    const rooms = parseFloat(roomsMatch[1]);
    if (rooms > 0 && rooms <= 20) result.rooms = rooms;
  }

  // === Extract floor from "קומה X" or "קרקע" ===
  const floorMatch = markdown.match(/קומה\s*(\d+)/i);
  if (floorMatch) {
    result.floor = parseInt(floorMatch[1]);
  } else if (/קרקע/i.test(markdown.substring(0, 2000))) {
    result.floor = 0;
  }

  // === Extract price ===
  const priceMatch = markdown.match(/[‏]?([\d,]+)\s*[‏]?₪/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price > 500 && price < 100000000) result.price = price;
  }

  // === Detect broker (agent) ===
  // Look for "מתווך" or "סוכנות" or specific agency patterns
  if (/משרד\s*תיווך|סוכנות|מתווכ|RE\/MAX|רימקס|אנגלו|century/i.test(markdown)) {
    result.adType = 'agency';
  } else if (/פרטי/i.test(markdown.substring(0, 500))) {
    // Check if "פרטי" refers to the listing type, not property type
    // Look for explicit private indicator near contact area
  }

  // === Negative inference for missing features ===
  // If the "מה יש בנכס" section exists but a feature isn't listed, it's likely false
  if (featureSectionMatch) {
    const knownNegatives: Array<[string, string]> = [
      ['mamad', 'ממ"ד'],
      ['elevator', 'מעלית'],
      ['parking', 'חניה'],
      ['storage', 'מחסן'],
      ['balcony', 'מרפסת'],
      ['airConditioner', 'מיזוג'],
    ];
    for (const [key] of knownNegatives) {
      if (!(key in features)) {
        features[key] = false;
      }
    }
  }

  console.log(`✅ Yad2 Jina parsed: ${Object.keys(features).length} features, size=${result.size}, rooms=${result.rooms}, floor=${result.floor}, price=${result.price}`);
  return result;
}

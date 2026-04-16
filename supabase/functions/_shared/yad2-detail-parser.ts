/**
 * Yad2 Detail Parser — Markdown Parser (no fetching)
 * Parses Jina Reader markdown output to extract features from
 * "מה יש בנכס" section + "פרטים נוספים" section.
 * The fetching is done by the backfill's existing Jina path.
 */

export interface Yad2DetailResult {
  features: Record<string, boolean>;
  size?: number;
  floor?: number;
  rooms?: number;
  price?: number;
  propertyCondition?: string;
  adType?: string;
}

const FEATURE_MAP: Array<[RegExp, string]> = [
  [/מרפסת/i, 'balcony'],
  [/מעלית/i, 'elevator'],
  [/חניה|חניות/i, 'parking'],
  [/ממ"?ד|ממ״ד|חדר\s*ביטחון/i, 'mamad'],
  [/מחסן/i, 'storage'],
  [/מיזוג|מזגן/i, 'airConditioner'],
  [/מרוהט|ריהוט/i, 'furnished'],
  [/משופצ|שופצ/i, 'renovated'],
  [/גינה|גן\b/i, 'yard'],
  [/גישה\s*לנכים|נגיש/i, 'accessible'],
  [/חיות|בע"?ח/i, 'pets'],
  [/סורגים/i, 'bars'],
  [/דוד\s*שמש/i, 'sunHeater'],
  [/טורנדו|טדיראן/i, 'tadiran'],
  [/גג|גגון|מרפסת\s*גג/i, 'roof'],
  [/דלתות\s*פנדור/i, 'pandorDoors'],
  [/מטבח\s*כשר/i, 'kosherKitchen'],
  [/בויילר|דוד\s*חשמלי/i, 'boiler'],
];

/**
 * Parse Yad2 detail page markdown (from Jina Reader) and extract features.
 */
export function parseYad2DetailMarkdown(markdown: string): Yad2DetailResult | null {
  if (!markdown || markdown.length < 300) return null;

  // Check for 404/removed
  if (/error 404|not found|המודעה הוסרה|המודעה לא נמצאה/i.test(markdown.substring(0, 500))) {
    return null;
  }

  const features: Record<string, boolean> = {};
  const result: Yad2DetailResult = { features };

  // === SKIP "מה יש בנכס" section ===
  // Jina renders ALL features (active + inactive) as identical bullet items.
  // We CANNOT distinguish present from absent features, so skip entirely.
  // Only use "פרטים נוספים" below for reliable data.

  // === Extract "פרטים נוספים" section ===
  const detailsMatch = markdown.match(/##?\s*פרטים נוספים([\s\S]*?)(?=##|$)/i);
  if (detailsMatch) {
    const details = detailsMatch[1];
    
    // Property condition
    const condMatch = details.match(/מצב\s*הנכס\s+([\u0590-\u05FF\s]+?)(?:\s*מ|$)/);
    if (condMatch) {
      result.propertyCondition = condMatch[1].trim();
      if (/משופץ|שופצ/i.test(result.propertyCondition)) {
        features.renovated = true;
      }
    }
    
    // Size
    const sizeMatch = details.match(/מ[״"]ר\s*(?:בנוי\s*)?(\d+)/) || details.match(/(\d+)\s*מ[״"]ר/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size > 10 && size < 2000) result.size = size;
    }

    // Parking — also match "חניה" without digits
    if (/חניי?ה|חניות?\s*\d*/i.test(details)) {
      features.parking = true;
    }
  }

  // === Rooms ===
  const roomsMatch = markdown.match(/(\d+(?:\.\d)?)\s*חדרי[ם]?\b/);
  if (roomsMatch) {
    const rooms = parseFloat(roomsMatch[1]);
    if (rooms > 0 && rooms <= 20) result.rooms = rooms;
  }

  // === Floor ===
  const floorMatch = markdown.match(/קומה\s*(\d+)/i);
  if (floorMatch) {
    result.floor = parseInt(floorMatch[1]);
  } else if (/\bקרקע\b/i.test(markdown.substring(0, 2000))) {
    result.floor = 0;
  }

  // === Price ===
  const priceMatch = markdown.match(/[‏]?([\d,]+)\s*[‏]?₪/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price > 500 && price < 100000000) result.price = price;
  }

  // === Broker detection ===
  if (/משרד\s*תיווך|סוכנות|מתווכ|RE\/MAX|רימקס|אנגלו|century/i.test(markdown)) {
    result.adType = 'agency';
  }

  console.log(`✅ Yad2 markdown parsed: ${Object.keys(features).length} features, size=${result.size}, rooms=${result.rooms}, floor=${result.floor}`);
  return result;
}

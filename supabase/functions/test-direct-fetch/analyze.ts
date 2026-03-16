// Helper to analyze Madlan HTML structure

export function analyzeMadlanHtml(html: string): any {
  // Extract first listing card fully
  const bulletinStart = html.indexOf('data-auto-bulletin-id=');
  if (bulletinStart < 0) return { error: 'No bulletins found' };

  // Find the div that contains this bulletin
  let divStart = html.lastIndexOf('<div', bulletinStart);
  
  // Find the next bulletin or end
  const nextBulletin = html.indexOf('data-auto-bulletin-id=', bulletinStart + 30);
  const cardEnd = nextBulletin > 0 ? html.lastIndexOf('</div>', nextBulletin) : bulletinStart + 5000;
  
  const firstCard = html.substring(divStart, Math.min(cardEnd, divStart + 8000));

  // Extract ALL bulletin IDs
  const bulletinIds = [...html.matchAll(/data-auto-bulletin-id="([^"]+)"/g)].map(m => m[1]);

  // Look for JSON-LD
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const jsonLdSamples = jsonLdMatches.slice(0, 2).map(m => {
    try { return JSON.parse(m[1]); } catch { return m[1].substring(0, 500); }
  });

  // Look for price patterns - try different formats
  const hebrewPrices = html.match(/[\d,]+\s*₪/g) || [];
  const priceInContent = html.match(/price['":\s]*[\d,]+/gi)?.slice(0, 5) || [];
  
  // Extract text content from first card (strip HTML tags)
  const cardText = firstCard.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    total_length: html.length,
    bulletin_count: bulletinIds.length,
    bulletin_ids_sample: bulletinIds.slice(0, 5),
    first_card_html: firstCard.substring(0, 4000),
    first_card_text: cardText.substring(0, 1000),
    json_ld_samples: jsonLdSamples,
    hebrew_prices: hebrewPrices.slice(0, 5),
    price_in_content: priceInContent,
  };
}

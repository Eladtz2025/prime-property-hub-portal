export function analyzeMadlanHtml(html: string): any {
  // Find where "price":8300 appears
  const priceIdx = html.indexOf('"price":');
  let priceContext = '';
  if (priceIdx > 0) {
    const start = Math.max(0, priceIdx - 200);
    const end = Math.min(html.length, priceIdx + 300);
    priceContext = html.substring(start, end);
  }

  // Extract a full listing card's text content
  const bulletinRegex = /data-auto="listed-bulletin"\s+data-auto-bulletin-id="([^"]+)"[\s\S]*?(?=data-auto="listed-bulletin"|$)/g;
  const firstMatch = bulletinRegex.exec(html);
  let firstCardText = '';
  let firstCardInnerHtml = '';
  if (firstMatch) {
    const cardHtml = firstMatch[0].substring(0, 6000);
    firstCardInnerHtml = cardHtml;
    // Strip tags and CSS
    firstCardText = cardHtml
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, '|')
      .replace(/\|+/g, '|')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Search for all data-auto attributes inside a card
  const dataAutoInCard = firstCardInnerHtml ? 
    [...firstCardInnerHtml.matchAll(/data-auto="([^"]+)"/g)].map(m => m[1]) : [];

  // Find all text nodes that look like property data (rooms, floor, size)
  const roomsPattern = html.match(/\d+\.?\d*\s*חד[׳'ר]/g)?.slice(0, 5) || [];
  const floorPattern = html.match(/קומה\s*\d+/g)?.slice(0, 5) || [];
  const sizePattern = html.match(/\d+\s*מ"ר/g)?.slice(0, 5) || [];
  const brokerPattern = html.match(/תיווך/g)?.length || 0;

  return {
    price_context: priceContext,
    first_card_text: firstCardText.substring(0, 2000),
    data_auto_in_card: dataAutoInCard,
    rooms_samples: roomsPattern,
    floor_samples: floorPattern,
    size_samples: sizePattern,
    broker_mentions: brokerPattern,
  };
}

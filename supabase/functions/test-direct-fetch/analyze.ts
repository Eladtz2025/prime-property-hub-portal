/**
 * Madlan HTML Analyzer - Broker Detection Diagnostic
 * Extracts ALL broker/private signals from each listing card
 */

interface CardSignals {
  card_index: number;
  bulletin_id: string | null;
  listing_url: string | null;
  // Price/address for identification
  price_text: string | null;
  address_text: string | null;
  // Broker signals
  has_tivuch: boolean;        // תיווך
  has_bilvadiyut: boolean;    // בבלעדיות
  has_agents_office: boolean; // agentsOffice or /agents/
  has_agent_image: boolean;   // realEstateAgent/realEstateOffice schema
  has_known_agency: string | null; // Known agency name found
  has_agent_name_tag: boolean; // data-auto with agent info
  has_phone_agent: boolean;   // Agent phone patterns
  // Private signals
  has_private_text: boolean;  // פרטי / בעל הדירה
  // Raw evidence
  broker_evidence: string[];
  // Classification result
  classified_as: 'private' | 'broker' | 'unknown';
}

const KNOWN_AGENCIES = [
  'רימקס', 'RE/MAX', 'REMAX',
  'קלר', 'keller',
  'אנגלו סכסון', 'anglo saxon',
  'סנצ\'ורי', 'century',
  'הומלס', 
  'לביא נכסים',
  'משרד תיווך',
  'סוכנות',
  'נדל"ן',
  'פרופרטי',
  'property',
  'real estate',
  'רילטי',
  'realty',
];

function extractDataAutoText(cardHtml: string, autoName: string): string | null {
  const marker = `data-auto="${autoName}"`;
  const markerIdx = cardHtml.indexOf(marker);
  if (markerIdx < 0) return null;
  const afterMarker = cardHtml.substring(markerIdx);
  const tagClose = afterMarker.indexOf('>');
  if (tagClose < 0) return null;
  const afterTag = afterMarker.substring(tagClose + 1);
  const contentChunk = afterTag.substring(0, 500);
  const text = contentChunk
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.split(/\s{3,}/)[0]?.trim() || null;
}

function splitIntoCards(html: string): string[] {
  const cards: string[] = [];
  const marker = 'data-auto="listed-bulletin"';
  let startIdx = html.indexOf(marker);
  while (startIdx >= 0) {
    const nextIdx = html.indexOf(marker, startIdx + marker.length);
    const cardHtml = nextIdx >= 0 
      ? html.substring(startIdx, nextIdx) 
      : html.substring(startIdx, Math.min(startIdx + 10000, html.length));
    cards.push(cardHtml);
    startIdx = nextIdx;
  }
  return cards;
}

function analyzeCard(cardHtml: string, index: number): CardSignals {
  const idMatch = cardHtml.match(/data-auto-bulletin-id="([^"]+)"/);
  const urlMatch = cardHtml.match(/href="\/listings\/([^"]+)"/);
  
  const priceText = extractDataAutoText(cardHtml, 'property-price');
  const addressText = extractDataAutoText(cardHtml, 'property-address');
  
  // Strip tags for text analysis
  const cardText = cardHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  
  const broker_evidence: string[] = [];
  
  // Signal 1: תיווך text
  const has_tivuch = /תיווך/.test(cardText);
  if (has_tivuch) broker_evidence.push('תיווך_in_text');
  
  // Signal 2: בבלעדיות
  const has_bilvadiyut = /בבלעדיות/.test(cardText);
  if (has_bilvadiyut) broker_evidence.push('בבלעדיות_in_text');
  
  // Signal 3: agentsOffice / /agents/ links
  const has_agents_office = /agentsOffice|\/agents\//.test(cardHtml);
  if (has_agents_office) broker_evidence.push('agents_link_found');
  
  // Signal 4: Schema.org agent markers
  const has_agent_image = /realEstateAgent|realEstateOffice|RealEstateAgent/.test(cardHtml);
  if (has_agent_image) broker_evidence.push('schema_agent_marker');
  
  // Signal 5: Known agency names
  let has_known_agency: string | null = null;
  for (const agency of KNOWN_AGENCIES) {
    if (cardText.toLowerCase().includes(agency.toLowerCase())) {
      has_known_agency = agency;
      broker_evidence.push(`known_agency: ${agency}`);
      break;
    }
  }
  
  // Signal 6: data-auto attributes related to agents
  const has_agent_name_tag = /data-auto="agent-name"|data-auto="office-name"|data-auto="broker-name"/.test(cardHtml);
  if (has_agent_name_tag) broker_evidence.push('agent_data_auto_tag');
  
  // Signal 7: Agent phone patterns
  const has_phone_agent = /data-auto="agent-phone"|data-auto="broker-phone"/.test(cardHtml);
  if (has_phone_agent) broker_evidence.push('agent_phone_tag');
  
  // Signal 8: Private indicators
  const has_private_text = /בעל\s*הדירה|פרטי|ללא\s*תיווך/.test(cardText);
  if (has_private_text) broker_evidence.push('private_text_indicator');
  
  // Signal 9: Check for agent/office image containers
  const hasAgentAvatar = /agent-avatar|agent-image|agent-logo|office-logo/.test(cardHtml);
  if (hasAgentAvatar) broker_evidence.push('agent_avatar_element');
  
  // Signal 10: Check for "promoted" / "מקודם" / "ממומן" which often indicates broker
  const hasPromoted = /מקודם|ממומן|promoted|sponsored/.test(cardText);
  if (hasPromoted) broker_evidence.push('promoted_listing');
  
  // Classification
  const isBroker = has_tivuch || has_bilvadiyut || has_agents_office || has_agent_image || has_agent_name_tag || has_phone_agent || hasAgentAvatar;
  const classified_as = isBroker ? 'broker' : 'private';
  
  return {
    card_index: index,
    bulletin_id: idMatch?.[1] || null,
    listing_url: urlMatch ? `https://www.madlan.co.il/listings/${urlMatch[1]}` : null,
    price_text: priceText,
    address_text: addressText,
    has_tivuch,
    has_bilvadiyut,
    has_agents_office,
    has_agent_image,
    has_known_agency,
    has_agent_name_tag,
    has_phone_agent,
    has_private_text,
    broker_evidence,
    classified_as,
  };
}

export function analyzeMadlanBrokerDetection(html: string): any {
  const cards = splitIntoCards(html);
  
  const cardAnalyses = cards.map((card, i) => analyzeCard(card, i));
  
  const brokerCards = cardAnalyses.filter(c => c.classified_as === 'broker');
  const privateCards = cardAnalyses.filter(c => c.classified_as === 'private');
  
  // Also dump first 3 cards' raw HTML snippets for manual review
  const rawSamples = cards.slice(0, 3).map((card, i) => ({
    card_index: i,
    // Show broker-relevant HTML sections only
    html_snippet: card.substring(0, 3000),
    all_data_auto_attrs: [...card.matchAll(/data-auto="([^"]+)"/g)].map(m => m[1]),
  }));
  
  return {
    total_cards: cards.length,
    broker_count: brokerCards.length,
    private_count: privateCards.length,
    summary: {
      signals_found: {
        tivuch: cardAnalyses.filter(c => c.has_tivuch).length,
        bilvadiyut: cardAnalyses.filter(c => c.has_bilvadiyut).length,
        agents_office: cardAnalyses.filter(c => c.has_agents_office).length,
        agent_image_schema: cardAnalyses.filter(c => c.has_agent_image).length,
        known_agency: cardAnalyses.filter(c => c.has_known_agency).length,
        agent_name_tag: cardAnalyses.filter(c => c.has_agent_name_tag).length,
        agent_phone_tag: cardAnalyses.filter(c => c.has_phone_agent).length,
        private_text: cardAnalyses.filter(c => c.has_private_text).length,
      }
    },
    cards: cardAnalyses,
    raw_samples: rawSamples,
  };
}

// Keep old function for backward compat
export function analyzeMadlanHtml(html: string): any {
  return analyzeMadlanBrokerDetection(html);
}

export function analyzeMadlanHtml(html: string): any {
  // Find script tags containing price data
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  
  let dataScript = '';
  let dataScriptInfo = '';
  
  for (const match of scriptMatches) {
    const content = match[1];
    if (content.includes('"price":') && content.includes('"rooms":') && content.length > 1000) {
      dataScript = content;
      dataScriptInfo = `Found script with price+rooms data, length: ${content.length}`;
      break;
    }
  }

  // Extract a sample of the data script
  let sampleData = '';
  if (dataScript) {
    // Find first occurrence of a listing-like object
    const listingIdx = dataScript.indexOf('"price":');
    if (listingIdx > 0) {
      const start = Math.max(0, listingIdx - 500);
      const end = Math.min(dataScript.length, listingIdx + 1500);
      sampleData = dataScript.substring(start, end);
    }
  }

  // Also check for window.__INITIAL or similar
  const initialStatePatterns = [
    /window\.__INITIAL[^=]*=\s*/,
    /window\.__PRELOADED[^=]*=\s*/,
    /window\.__DATA[^=]*=\s*/,
    /window\.INITIAL_PROPS\s*=\s*/,
    /"props"\s*:\s*\{/,
  ];
  
  const foundPatterns: string[] = [];
  for (const p of initialStatePatterns) {
    if (p.test(html)) foundPatterns.push(p.source);
  }

  // Count bulletin IDs
  const bulletinIds = [...html.matchAll(/data-auto-bulletin-id="([^"]+)"/g)].map(m => m[1]);

  // JSON-LD analysis
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  
  // Check if JSON-LD has all listings
  let jsonLdListingCount = 0;
  const jsonLdSample: any[] = [];
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed['@type'] === 'ImageObject' && parsed.caption) {
        jsonLdListingCount++;
        if (jsonLdSample.length < 3) jsonLdSample.push(parsed);
      }
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item['@type'] === 'ImageObject') jsonLdListingCount++;
        }
      }
    } catch {}
  }

  return {
    bulletin_count: bulletinIds.length,
    data_script_info: dataScriptInfo,
    data_sample: sampleData.substring(0, 3000),
    found_patterns: foundPatterns,
    json_ld_listing_count: jsonLdListingCount,
    json_ld_sample: jsonLdSample.slice(0, 2),
  };
}

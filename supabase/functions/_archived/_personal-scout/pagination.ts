/**
 * Pagination extraction for Personal Scout
 * 
 * Extracts total results count from scraped content to determine
 * how many pages to scan dynamically.
 */

export interface PaginationInfo {
  total_results: number;
  total_pages: number;
  pages_to_scan: number;
}

const MAX_PAGES = 10; // Cap at 10 pages to avoid timeout (60s limit)
const RESULTS_PER_PAGE: Record<string, number> = {
  yad2: 20,
  madlan: 20,
  homeless: 25,
};

/**
 * Extract pagination info from scraped content
 * Returns null if unable to determine pagination
 */
export function extractPaginationInfo(
  content: string,
  source: string
): PaginationInfo | null {
  const resultsPerPage = RESULTS_PER_PAGE[source] || 20;
  
  let totalResults = 0;
  
  if (source === 'yad2') {
    // Yad2 patterns: "מתוך 157 תוצאות" or "157 תוצאות" or "נמצאו 157 נכסים"
    const patterns = [
      /מתוך\s+(\d{1,3}(?:,\d{3})*|\d+)\s+תוצאות/,
      /(\d{1,3}(?:,\d{3})*|\d+)\s+תוצאות/,
      /נמצאו\s+(\d{1,3}(?:,\d{3})*|\d+)\s+נכסים/,
      /(\d{1,3}(?:,\d{3})*|\d+)\s+נכסים\s+נמצאו/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        totalResults = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }
  } else if (source === 'madlan') {
    // Madlan patterns: "278 דירות" or "נמצאו 278 נכסים"
    const patterns = [
      /(\d{1,3}(?:,\d{3})*|\d+)\s+דירות/,
      /(\d{1,3}(?:,\d{3})*|\d+)\s+נכסים/,
      /נמצאו\s+(\d{1,3}(?:,\d{3})*|\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        totalResults = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }
  } else if (source === 'homeless') {
    // Homeless patterns: "נמצאו 85 תוצאות" or "85 מודעות"
    const patterns = [
      /נמצאו\s+(\d{1,3}(?:,\d{3})*|\d+)\s+תוצאות/,
      /(\d{1,3}(?:,\d{3})*|\d+)\s+מודעות/,
      /(\d{1,3}(?:,\d{3})*|\d+)\s+תוצאות/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        totalResults = parseInt(match[1].replace(/,/g, ''), 10);
        break;
      }
    }
  }
  
  if (totalResults === 0) {
    return null;
  }
  
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const pagesToScan = Math.min(totalPages, MAX_PAGES);
  
  return {
    total_results: totalResults,
    total_pages: totalPages,
    pages_to_scan: pagesToScan,
  };
}

/**
 * Get default pages to scan when pagination info unavailable
 */
export function getDefaultPagesToScan(): number {
  return 2;
}

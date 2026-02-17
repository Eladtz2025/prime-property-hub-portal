// Shared URL building utilities for Edge Functions
// Extracted from scout-properties for better maintainability

import { 
  getYad2NeighborhoodCodes, 
  getMadlanNeighborhoodSlug,
  getMadlanMultiNeighborhoodPath,
  getHomelessAreaCodes 
} from './neighborhood-codes.ts';

export interface ScoutConfig {
  id: string;
  name: string;
  source: 'yad2' | 'yad2_private' | 'madlan' | 'homeless' | 'both' | 'all';
  property_type: 'rent' | 'sale' | 'both';
  cities: string[];
  neighborhoods: string[];
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  max_rooms?: number;
  search_url?: string;
  // Config-specific overrides (take priority over global settings)
  max_pages?: number;
  page_delay_seconds?: number;
  wait_for_ms?: number;
}

// City mappings for each source
export const yad2CityMap: Record<string, { topArea: string; area: string; city: string }> = {
  'תל אביב': { topArea: '2', area: '1', city: '5000' },
  'תל אביב יפו': { topArea: '2', area: '1', city: '5000' },
  'ירושלים': { topArea: '1', area: '1', city: '3000' },
  'חיפה': { topArea: '3', area: '1', city: '4000' },
  'ראשון לציון': { topArea: '2', area: '2', city: '8300' },
  'פתח תקווה': { topArea: '2', area: '3', city: '7900' },
  'אשדוד': { topArea: '2', area: '12', city: '70' },
  'נתניה': { topArea: '4', area: '1', city: '7400' },
  'באר שבע': { topArea: '5', area: '1', city: '9000' },
  'חולון': { topArea: '2', area: '1', city: '6600' },
  'בת ים': { topArea: '2', area: '1', city: '6200' },
  'רמת גן': { topArea: '2', area: '1', city: '8600' },
  'הרצליה': { topArea: '2', area: '4', city: '6400' },
  'רעננה': { topArea: '4', area: '2', city: '8700' },
  'גבעתיים': { topArea: '2', area: '1', city: '2650' },
  'כפר סבא': { topArea: '4', area: '2', city: '6900' },
  'הוד השרון': { topArea: '4', area: '2', city: '6500' },
  'רמת השרון': { topArea: '2', area: '4', city: '8800' },
};

export const madlanCityMap: Record<string, string> = {
  'תל אביב': 'תל-אביב-יפו-ישראל',
  'תל אביב יפו': 'תל-אביב-יפו-ישראל',
  'ירושלים': 'ירושלים-ישראל',
  'חיפה': 'חיפה-ישראל',
  'ראשון לציון': 'ראשון-לציון-ישראל',
  'פתח תקווה': 'פתח-תקווה-ישראל',
  'אשדוד': 'אשדוד-ישראל',
  'נתניה': 'נתניה-ישראל',
  'באר שבע': 'באר-שבע-ישראל',
  'חולון': 'חולון-ישראל',
  'בת ים': 'בת-ים-ישראל',
  'רמת גן': 'רמת-גן-ישראל',
  'הרצליה': 'הרצליה-ישראל',
  'רעננה': 'רעננה-ישראל',
  'גבעתיים': 'גבעתיים-ישראל',
  'כפר סבא': 'כפר-סבא-ישראל',
  'הוד השרון': 'הוד-השרון-ישראל',
  'רמת השרון': 'רמת-השרון-ישראל',
};

export const homelessCityMap: Record<string, { code: string }> = {
  'תל אביב': { code: '17,1,150' },
  'תל אביב יפו': { code: '17,1,150' },
  'ירושלים': { code: '1,1,3000' },
  'חיפה': { code: '4,1,4000' },
  'ראשון לציון': { code: '17,2,8300' },
  'פתח תקווה': { code: '17,3,7900' },
  'אשדוד': { code: '17,12,70' },
  'נתניה': { code: '11,1,7400' },
  'באר שבע': { code: '6,1,9000' },
  'חולון': { code: '17,1,6600' },
  'בת ים': { code: '17,1,6200' },
  'רמת גן': { code: '17,1,8600' },
  'הרצליה': { code: '17,4,6400' },
  'רעננה': { code: '11,2,8700' },
};

export interface ScrapingSettings {
  yad2_pages: number;
  madlan_pages: number;
  homeless_pages: number;
  max_properties_per_config: number;
}

export const defaultScrapingSettings: ScrapingSettings = {
  yad2_pages: 7,
  madlan_pages: 4,
  homeless_pages: 0,
  max_properties_per_config: 500,
};

/**
 * Build URL for a single specific page (used in distributed scanning)
 */
export function buildSinglePageUrl(config: ScoutConfig, page: number): string[] {
  const urls: string[] = [];
  
  const source = config.source === 'yad2_private' ? 'yad2' : config.source;
  const types = config.property_type === 'both' ? ['rent', 'sale'] : [config.property_type];
  
  for (const type of types) {
    if (source === 'yad2' || source === 'yad2_private') {
      const baseUrl = `https://www.yad2.co.il/realestate/${type === 'rent' ? 'rent' : 'forsale'}`;
      
      // Get neighborhood codes if any
      const neighborhoodCodes = config.neighborhoods?.length 
        ? getYad2NeighborhoodCodes(config.neighborhoods) 
        : [];
      
      // Yad2 doesn't support multiple neighborhoods in one URL - need separate URLs for each
      // If no neighborhoods, create one URL for the whole city
      const codesToProcess = neighborhoodCodes.length > 0 ? neighborhoodCodes : [null];
      
      for (const neighborhoodCode of codesToProcess) {
        const params = new URLSearchParams();
        
        // Always set city location params for Yad2
        if (config.cities?.length) {
          const cityData = yad2CityMap[config.cities[0]];
          if (cityData) {
            params.set('topArea', cityData.topArea);
            params.set('area', cityData.area);
            params.set('city', cityData.city);
          }
        }
        
        // Add single neighborhood filter if specified
        if (neighborhoodCode) {
          params.set('neighborhood', neighborhoodCode);
          console.log(`Yad2: Building URL for neighborhood code ${neighborhoodCode}`);
        }
        
        params.set('propertyGroup', 'apartments');
        
        if (config.min_price) params.set('price', `${config.min_price}-${config.max_price || ''}`);
        if (config.min_rooms) params.set('rooms', `${config.min_rooms}-${config.max_rooms || ''}`);
        
        // Always include page param (page 1 without it may return different/truncated content)
        params.set('page', page.toString());
        
        const pageUrl = baseUrl + '?' + params.toString();
        console.log(`Built Yad2 single page URL (page ${page}, neighborhood: ${neighborhoodCode || 'all'}): ${pageUrl}`);
        urls.push(pageUrl);
      }
      
      } else if (source === 'madlan' || source === 'madlan_projects') {
        let pathType: string;
        if (source === 'madlan_projects') {
          pathType = 'projects-for-sale';
        } else {
          pathType = type === 'rent' ? 'for-rent' : 'for-sale';
        }
        
        let baseUrl = `https://www.madlan.co.il/${pathType}`;
        
        // For Madlan, support multiple neighborhoods with comma-separated slugs
        if (config.neighborhoods?.length > 0 && config.cities?.length) {
          const hebrewCity = config.cities[0];
          const multiPath = getMadlanMultiNeighborhoodPath(config.neighborhoods, hebrewCity);
          
          if (multiPath) {
            baseUrl += `/${multiPath}`;
            console.log(`Madlan multi-neighborhood URL (${config.neighborhoods.length} neighborhoods): ${baseUrl}`);
          } else {
            // Fallback to city if no valid slugs found
            const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
            baseUrl += `/${citySlug}`;
            console.log(`Madlan: No valid slugs for neighborhoods, using city URL: ${baseUrl}`);
          }
        } else if (config.cities?.length) {
          // No neighborhoods - use city-level URL
          const hebrewCity = config.cities[0];
          const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
          baseUrl += `/${citySlug}`;
        }
        
        // Always include ?page= param for Madlan (page 1 without it returns truncated SSR content)
        const pageUrl = `${baseUrl}?page=${page}`;
        console.log(`Built Madlan single page URL (page ${page}): ${pageUrl}`);
        urls.push(pageUrl);
      
    } else if (source === 'homeless') {
      let baseUrl: string;
      
      // Priority: neighborhoods > cities > fallback
      // Use query string format: /rent/?inumber1=X&page=N
      if (config.neighborhoods?.length) {
        const areaCodes = getHomelessAreaCodes(config.neighborhoods);
        if (areaCodes.length >= 1) {
          const pathType = type === 'rent' ? 'rent' : 'sale';
          baseUrl = `https://www.homeless.co.il/${pathType}/?inumber1=${areaCodes[0]}`;
          console.log(`Homeless: using area code ${areaCodes[0]} for neighborhoods: ${config.neighborhoods.join(', ')}`);
        } else {
          baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
        }
      } else if (config.cities?.length) {
        const cityData = homelessCityMap[config.cities[0]];
        if (cityData) {
          const pathType = type === 'rent' ? 'rent' : 'sale';
          baseUrl = `https://www.homeless.co.il/${pathType}/?inumber1=${cityData.code}`;
        } else {
          baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
        }
      } else {
        baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
      }
      
      // Query string pagination uses & separator
      const pageUrl = page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
      console.log(`Built Homeless single page URL (page ${page}): ${pageUrl}`);
      urls.push(pageUrl);
    }
  }
  
  return urls;
}

/**
 * Build all search URLs for a config with pagination
 */
export function buildSearchUrls(config: ScoutConfig, settings?: ScrapingSettings): string[] {
  const urls: string[] = [];
  const s = settings || defaultScrapingSettings;

  // If custom URL provided, use it (no pagination for manual URLs)
  if (config.search_url) {
    return [config.search_url];
  }

  // Determine which sources to scan
  let sources: string[] = [];
  if (config.source === 'yad2' || config.source === 'yad2_private') {
    sources = ['yad2'];
  } else if (config.source === 'both') {
    sources = ['madlan', 'yad2'];
  } else if (config.source === 'all') {
    sources = ['madlan', 'yad2', 'homeless'];
  } else if (config.source === 'homeless') {
    sources = ['homeless'];
  } else {
    sources = [config.source];
  }

  const types = config.property_type === 'both' ? ['rent', 'sale'] : [config.property_type];

  for (const source of sources) {
    for (const type of types) {
      if (source === 'yad2' || source === 'yad2_private') {
        const baseUrl = `https://www.yad2.co.il/realestate/${type === 'rent' ? 'rent' : 'forsale'}`;
        
        // Get neighborhood codes if any
        const neighborhoodCodes = config.neighborhoods?.length 
          ? getYad2NeighborhoodCodes(config.neighborhoods) 
          : [];
        
        // Yad2 doesn't support multiple neighborhoods in one URL - need separate URLs for each
        // If no neighborhoods, create one URL for the whole city
        const codesToProcess = neighborhoodCodes.length > 0 ? neighborhoodCodes : [null];
        
        // Use config-specific max_pages if set, otherwise use global setting
        const pagesToScrape = config.max_pages ?? s.yad2_pages;
        console.log(`Yad2 pages to scrape: ${pagesToScrape} (config override: ${config.max_pages ? 'yes' : 'no'})`);
        console.log(`Yad2 neighborhood codes to process: ${codesToProcess.length > 0 && codesToProcess[0] ? codesToProcess.join(',') : 'none (city-wide)'}`);
        
        for (const neighborhoodCode of codesToProcess) {
          const params = new URLSearchParams();
          
          // Always set city location params for Yad2
          if (config.cities?.length) {
            const cityData = yad2CityMap[config.cities[0]];
            if (cityData) {
              params.set('topArea', cityData.topArea);
              params.set('area', cityData.area);
              params.set('city', cityData.city);
            }
          }
          
          // Add single neighborhood filter if specified
          if (neighborhoodCode) {
            params.set('neighborhood', neighborhoodCode);
          }
          
          params.set('propertyGroup', 'apartments');
          
          if (config.min_price) params.set('price', `${config.min_price}-${config.max_price || ''}`);
          if (config.min_rooms) params.set('rooms', `${config.min_rooms}-${config.max_rooms || ''}`);
          
          for (let page = 1; page <= pagesToScrape; page++) {
            const pageParams = new URLSearchParams(params);
            if (page > 1) {
              pageParams.set('page', page.toString());
            }
            const pageUrl = baseUrl + '?' + pageParams.toString();
            console.log(`Built Yad2 URL (page ${page}/${pagesToScrape}, neighborhood: ${neighborhoodCode || 'all'}): ${pageUrl}`);
            urls.push(pageUrl);
          }
        }
        
      } else if (source === 'madlan' || source === 'madlan_projects') {
        let pathType: string;
        if (source === 'madlan_projects') {
          pathType = 'projects-for-sale';
        } else {
          pathType = type === 'rent' ? 'for-rent' : 'for-sale';
        }
        
        let baseUrl = `https://www.madlan.co.il/${pathType}`;
        
        // For Madlan, support multiple neighborhoods with comma-separated slugs
        if (config.neighborhoods?.length > 0 && config.cities?.length) {
          const hebrewCity = config.cities[0];
          const multiPath = getMadlanMultiNeighborhoodPath(config.neighborhoods, hebrewCity);
          
          if (multiPath) {
            baseUrl += `/${multiPath}`;
            console.log(`Madlan multi-neighborhood URL (${config.neighborhoods.length} neighborhoods): ${baseUrl}`);
          } else {
            // Fallback to city if no valid slugs found
            const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
            baseUrl += `/${citySlug}`;
            console.log(`Madlan: No valid slugs for neighborhoods, using city URL: ${baseUrl}`);
          }
        } else if (config.cities?.length) {
          // No neighborhoods - use city-level URL
          const hebrewCity = config.cities[0];
          const citySlug = madlanCityMap[hebrewCity] || hebrewCity.replace(/\s+/g, '-') + '-ישראל';
          baseUrl += `/${citySlug}`;
        }
        
        // Use config-specific max_pages if set, otherwise use global setting
        const madlanPagesToScrape = config.max_pages ?? s.madlan_pages;
        console.log(`Madlan pages to scrape: ${madlanPagesToScrape} (config override: ${config.max_pages ? 'yes' : 'no'})`);
        
        for (let page = 1; page <= madlanPagesToScrape; page++) {
          // Always include ?page= param for Madlan (page 1 without it returns truncated SSR content)
          const url = `${baseUrl}?page=${page}`;
          console.log(`Built Madlan URL (page ${page}/${madlanPagesToScrape}): ${url}`);
          urls.push(url);
        }
        
      } else if (source === 'homeless' && s.homeless_pages > 0) {
        let baseUrl: string;
        
        // Priority: neighborhoods > cities > fallback
        // Use query string format: /rent/?inumber1=X&page=N
        if (config.neighborhoods?.length) {
          const areaCodes = getHomelessAreaCodes(config.neighborhoods);
          if (areaCodes.length >= 1) {
            const pathType = type === 'rent' ? 'rent' : 'sale';
            baseUrl = `https://www.homeless.co.il/${pathType}/?inumber1=${areaCodes[0]}`;
            console.log(`Homeless: using area code ${areaCodes[0]} for neighborhoods: ${config.neighborhoods.join(', ')}`);
          } else {
            baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
          }
        } else if (config.cities?.length) {
          const cityData = homelessCityMap[config.cities[0]];
          if (cityData) {
            const pathType = type === 'rent' ? 'rent' : 'sale';
            baseUrl = `https://www.homeless.co.il/${pathType}/?inumber1=${cityData.code}`;
          } else {
            baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
          }
        } else {
          baseUrl = `https://www.homeless.co.il/${type === 'rent' ? 'rent' : 'sale'}/`;
        }
        
        // Use config-specific max_pages if set, otherwise use global setting
        const homelessPagesToScrape = config.max_pages ?? s.homeless_pages;
        console.log(`Homeless pages to scrape: ${homelessPagesToScrape} (config override: ${config.max_pages ? 'yes' : 'no'})`);
        
        for (let page = 1; page <= homelessPagesToScrape; page++) {
          // Query string pagination uses & separator
          const url = page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
          console.log(`Built Homeless URL (page ${page}/${homelessPagesToScrape}): ${url}`);
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredPage {
  name: string;
  path: string;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl } = await req.json();

    if (!baseUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Base URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Discovering pages for: ${baseUrl}`);

    const pages: DiscoveredPage[] = [];
    const visitedUrls = new Set<string>();

    // Try to fetch sitemap first
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap-0.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        });

        if (response.ok) {
          const xml = await response.text();
          
          // Extract URLs from sitemap
          const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/gi);
          if (urlMatches) {
            for (const match of urlMatches) {
              const url = match.replace(/<\/?loc>/gi, '').trim();
              
              // Only include URLs from the same domain
              if (url.startsWith(baseUrl) && !visitedUrls.has(url)) {
                visitedUrls.add(url);
                const path = url.replace(baseUrl, '') || '/';
                const name = generatePageName(path);
                pages.push({ name, path, url });
              }
            }
          }
          
          console.log(`Found ${pages.length} pages in sitemap`);
          break; // Stop after finding a valid sitemap
        }
      } catch (error) {
        console.log(`Sitemap not found at ${sitemapUrl}`);
      }
    }

    // If no sitemap found, crawl the homepage
    if (pages.length === 0) {
      console.log('No sitemap found, crawling homepage for links...');
      
      try {
        const response = await fetch(baseUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        });

        if (response.ok) {
          const html = await response.text();
          
          // Add homepage
          pages.push({ name: 'דף הבית', path: '/', url: baseUrl });
          visitedUrls.add(baseUrl);
          visitedUrls.add(`${baseUrl}/`);

          // Extract internal links
          const linkMatches = html.match(/<a[^>]*href=["']([^"'#]+)["']/gi) || [];
          
          for (const match of linkMatches) {
            const hrefMatch = match.match(/href=["']([^"'#]+)["']/i);
            if (!hrefMatch) continue;
            
            let href = hrefMatch[1];
            
            // Handle relative URLs
            if (href.startsWith('/')) {
              href = `${baseUrl}${href}`;
            }
            
            // Only include URLs from the same domain
            if (href.startsWith(baseUrl) && !visitedUrls.has(href)) {
              // Exclude static assets, anchors, and query strings
              if (
                !href.match(/\.(jpg|jpeg|png|gif|svg|css|js|pdf|ico|woff|woff2|ttf|eot)(\?|$)/i) &&
                !href.includes('?') &&
                !href.includes('#')
              ) {
                visitedUrls.add(href);
                const path = href.replace(baseUrl, '') || '/';
                const name = generatePageName(path);
                pages.push({ name, path, url: href });
              }
            }
          }
          
          console.log(`Found ${pages.length} pages by crawling`);
        }
      } catch (error) {
        console.error('Error crawling homepage:', error);
      }
    }

    // Sort pages: Hebrew first, then English, then by path length
    pages.sort((a, b) => {
      const aHe = a.path.includes('/he');
      const bHe = b.path.includes('/he');
      if (aHe !== bHe) return aHe ? -1 : 1;
      return a.path.length - b.path.length;
    });

    // Limit to first 50 pages
    const limitedPages = pages.slice(0, 50);

    return new Response(
      JSON.stringify({ success: true, pages: limitedPages, total: pages.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Page discovery error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePageName(path: string): string {
  // Common path translations
  const translations: Record<string, string> = {
    '/': 'דף הבית',
    '/he': 'דף הבית (עברית)',
    '/en': 'Home (English)',
    '/he/rentals': 'השכרות',
    '/en/rentals': 'Rentals',
    '/he/sales': 'מכירות',
    '/en/sales': 'Sales',
    '/he/management': 'ניהול נכסים',
    '/en/management': 'Property Management',
    '/he/about': 'אודות',
    '/en/about': 'About',
    '/he/contact': 'צור קשר',
    '/en/contact': 'Contact',
    '/he/properties': 'נכסים',
    '/en/properties': 'Properties',
    '/he/blog': 'בלוג',
    '/en/blog': 'Blog',
    '/he/faq': 'שאלות נפוצות',
    '/en/faq': 'FAQ',
  };

  if (translations[path]) {
    return translations[path];
  }

  // Generate name from path
  const cleanPath = path.replace(/^\/|\/$/g, '');
  const parts = cleanPath.split('/');
  const lastPart = parts[parts.length - 1] || 'דף';
  
  // Capitalize and format
  return lastPart
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

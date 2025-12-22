const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeoCheckResult {
  url: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h1Contents: string[];
  imagesWithoutAlt: number;
  totalImages: number;
  hasOpenGraph: boolean;
  ogTags: Record<string, string>;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  hasRobotsMeta: boolean;
  robotsContent: string | null;
  hasViewport: boolean;
  hasHtmlLang: boolean;
  htmlLang: string | null;
  hasStructuredData: boolean;
  headingStructure: Record<string, number>;
  score: number;
  issues: string[];
  recommendations: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking SEO for: ${url}`);

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract SEO elements using regex
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
    const h1Contents = h1Matches.map(h => h.replace(/<[^>]*>/g, '').trim());

    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt=')).length;

    // Open Graph tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    const ogType = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']*)["']/i);

    const ogTags: Record<string, string> = {};
    if (ogTitle) ogTags['og:title'] = ogTitle[1];
    if (ogDesc) ogTags['og:description'] = ogDesc[1];
    if (ogImage) ogTags['og:image'] = ogImage[1];
    if (ogType) ogTags['og:type'] = ogType[1];

    // Canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

    // Robots meta
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const robotsContent = robotsMatch ? robotsMatch[1] : null;

    // Viewport
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

    // HTML lang
    const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
    const htmlLang = langMatch ? langMatch[1] : null;

    // Structured data (JSON-LD)
    const hasStructuredData = /<script[^>]*type=["']application\/ld\+json["']/i.test(html);

    // Heading structure
    const headingStructure: Record<string, number> = {};
    for (let i = 2; i <= 6; i++) {
      const hMatches = html.match(new RegExp(`<h${i}[^>]*>`, 'gi')) || [];
      headingStructure[`h${i}`] = hMatches.length;
    }

    // Calculate score and generate issues/recommendations
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Title checks
    if (!title) {
      score -= 15;
      issues.push('חסרה תגית כותרת (title)');
      recommendations.push('הוסף תגית <title> עם כותרת תיאורית');
    } else if (title.length < 30) {
      score -= 5;
      issues.push('הכותרת קצרה מדי');
      recommendations.push('הארך את הכותרת ל-30-60 תווים');
    } else if (title.length > 60) {
      score -= 5;
      issues.push('הכותרת ארוכה מדי');
      recommendations.push('קצר את הכותרת ל-60 תווים או פחות');
    }

    // Description checks
    if (!description) {
      score -= 10;
      issues.push('חסר תיאור מטא (meta description)');
      recommendations.push('הוסף תגית meta description עם תיאור של 150-160 תווים');
    } else if (description.length < 100) {
      score -= 5;
      issues.push('התיאור קצר מדי');
      recommendations.push('הארך את התיאור ל-100-160 תווים');
    } else if (description.length > 160) {
      score -= 3;
      issues.push('התיאור ארוך מדי');
      recommendations.push('קצר את התיאור ל-160 תווים או פחות');
    }

    // H1 checks
    if (h1Contents.length === 0) {
      score -= 10;
      issues.push('חסרה כותרת H1');
      recommendations.push('הוסף כותרת H1 אחת שמתארת את תוכן העמוד');
    } else if (h1Contents.length > 1) {
      score -= 5;
      issues.push(`יש ${h1Contents.length} כותרות H1 (צריך רק אחת)`);
      recommendations.push('השאר רק כותרת H1 אחת בעמוד');
    }

    // Images checks
    if (imagesWithoutAlt > 0) {
      score -= Math.min(imagesWithoutAlt * 2, 10);
      issues.push(`${imagesWithoutAlt} תמונות ללא תגית alt`);
      recommendations.push('הוסף תגית alt לכל התמונות עם תיאור רלוונטי');
    }

    // Open Graph checks
    if (Object.keys(ogTags).length === 0) {
      score -= 5;
      issues.push('חסרות תגיות Open Graph');
      recommendations.push('הוסף תגיות og:title, og:description, og:image לשיתוף ברשתות חברתיות');
    }

    // Canonical check
    if (!canonicalUrl) {
      score -= 3;
      issues.push('חסרה תגית canonical');
      recommendations.push('הוסף תגית canonical למניעת תוכן כפול');
    }

    // Viewport check
    if (!hasViewport) {
      score -= 5;
      issues.push('חסרה תגית viewport');
      recommendations.push('הוסף תגית viewport לתמיכה במובייל');
    }

    // HTML lang check
    if (!htmlLang) {
      score -= 3;
      issues.push('חסרה תגית lang ב-HTML');
      recommendations.push('הוסף lang="he" לתגית <html> (או השפה המתאימה)');
    }

    // Structured data check
    if (!hasStructuredData) {
      score -= 5;
      issues.push('חסר מידע מובנה (Structured Data)');
      recommendations.push('הוסף JSON-LD לשיפור הופעה בתוצאות חיפוש');
    }

    const result: SeoCheckResult = {
      url,
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      h1Count: h1Contents.length,
      h1Contents,
      imagesWithoutAlt,
      totalImages: imgMatches.length,
      hasOpenGraph: Object.keys(ogTags).length > 0,
      ogTags,
      hasCanonical: !!canonicalUrl,
      canonicalUrl,
      hasRobotsMeta: !!robotsContent,
      robotsContent,
      hasViewport,
      hasHtmlLang: !!htmlLang,
      htmlLang,
      hasStructuredData,
      headingStructure,
      score: Math.max(0, score),
      issues,
      recommendations,
    };

    console.log(`SEO check completed: score=${result.score}, issues=${issues.length}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SEO check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, History, RefreshCw, Bot, Key, FileCode, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SeoHistoryChart } from "./SeoHistoryChart";

interface SeoIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface AiCrawler {
  name: string;
  userAgent: string;
  allowed: boolean;
  foundInRobots: boolean;
}

interface KeywordData {
  word: string;
  count: number;
  density: number;
}

interface SchemaData {
  type: string;
  valid: boolean;
}

interface SeoResult {
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
  issues: SeoIssue[];
  recommendations: string[];
  // New fields
  aiCrawlers?: AiCrawler[];
  keywordAnalysis?: {
    keywords: KeywordData[];
    inTitle: string[];
    inH1: string[];
    inDescription: string[];
    inFirstParagraph: string[];
    missing: string[];
  };
  schemaAnalysis?: {
    hasJsonLd: boolean;
    schemas: SchemaData[];
    hasOrganization: boolean;
    hasWebSite: boolean;
    hasBreadcrumb: boolean;
    hasLocalBusiness: boolean;
    rawSchemas: any[];
  };
  hasNoAiMeta?: boolean;
  hasNoImageAiMeta?: boolean;
}

interface AiAnalysis {
  overallScore: number;
  scoreExplanation: string;
  criticalIssues: { issue: string; fix: string }[];
  warnings: { issue: string; fix: string }[];
  recommendations: string[];
  fixPrompt: string;
}

interface PageToCheck {
  name: string;
  path: string;
  url?: string;
}

interface HistoryEntry {
  id: string;
  page_url: string;
  page_name: string | null;
  score: number;
  results: any;
  ai_analysis: any;
  fix_prompt: string | null;
  checked_at: string;
}

interface FullResult {
  page: PageToCheck;
  seoResult: SeoResult;
  aiAnalysis?: AiAnalysis;
}

export const SeoTab: React.FC = () => {
  const [results, setResults] = useState<FullResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<PageToCheck[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const getBaseUrl = () => {
    return window.location.origin;
  };

  // Discover pages on mount
  useEffect(() => {
    discoverPages();
    loadHistory();
  }, []);

  const discoverPages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('discover-pages', {
        body: { baseUrl: getBaseUrl() }
      });

      if (error) throw error;
      
      if (data?.pages) {
        setDiscoveredPages(data.pages);
        toast.success(`נמצאו ${data.pages.length} דפים לבדיקה`);
      }
    } catch (error) {
      console.error('Error discovering pages:', error);
      // Fallback to default pages
      setDiscoveredPages([
        { name: 'דף הבית (עברית)', path: '/he' },
        { name: 'השכרות', path: '/he/rentals' },
        { name: 'מכירות', path: '/he/sales' },
        { name: 'ניהול נכסים', path: '/he/management' },
        { name: 'אודות', path: '/he/about' },
        { name: 'צור קשר', path: '/he/contact' },
        { name: 'Home (English)', path: '/en' },
        { name: 'Rentals (English)', path: '/en/rentals' },
      ]);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('seo_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const checkSinglePage = async (page: PageToCheck): Promise<SeoResult | null> => {
    try {
      const url = page.url || `${getBaseUrl()}${page.path}`;
      const { data, error } = await supabase.functions.invoke('check-seo', {
        body: { url }
      });

      if (error) throw error;
      return data?.result || null;
    } catch (error) {
      console.error(`Error checking ${page.path}:`, error);
      return null;
    }
  };

  const analyzeWithAi = async (seoData: SeoResult, pageName: string): Promise<AiAnalysis | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-seo-ai', {
        body: { seoData, pageName }
      });

      if (error) throw error;
      return data?.analysis || null;
    } catch (error) {
      console.error(`Error analyzing with AI for ${pageName}:`, error);
      return null;
    }
  };

  const saveToHistory = async (page: PageToCheck, seoResult: SeoResult, aiAnalysis?: AiAnalysis) => {
    try {
      const { error } = await supabase.from('seo_checks').insert([{
        page_url: seoResult.url,
        page_name: page.name,
        score: aiAnalysis?.overallScore || seoResult.score,
        results: seoResult as any,
        ai_analysis: aiAnalysis as any || null,
        fix_prompt: aiAnalysis?.fixPrompt || null,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const checkAllPages = async () => {
    if (discoveredPages.length === 0) {
      toast.error('לא נמצאו דפים לבדיקה');
      return;
    }

    setChecking(true);
    setResults([]);
    
    for (const page of discoveredPages) {
      setCurrentPage(page.name);
      
      // Check SEO
      const seoResult = await checkSinglePage(page);
      if (!seoResult) continue;

      // Analyze with AI
      const aiAnalysis = await analyzeWithAi(seoResult, page.name);
      
      // Save to history
      await saveToHistory(page, seoResult, aiAnalysis || undefined);
      
      // Update results
      setResults(prev => [...prev, { page, seoResult, aiAnalysis: aiAnalysis || undefined }]);
    }
    
    setCurrentPage(null);
    setChecking(false);
    loadHistory();
    toast.success('בדיקת SEO הושלמה');
  };

  const copyFixPrompt = (result: FullResult) => {
    const prompt = result.aiAnalysis?.fixPrompt || generateFallbackPrompt(result);
    navigator.clipboard.writeText(prompt);
    toast.success('הפרומפט הועתק ללוח');
  };

  const generateFallbackPrompt = (result: FullResult): string => {
    const { seoResult, page } = result;
    const criticalIssues = seoResult.issues.filter(i => i.severity === 'critical');
    const warnings = seoResult.issues.filter(i => i.severity === 'warning');
    
    let prompt = `תקן את בעיות ה-SEO בדף "${page.name}" (${seoResult.url}):\n\n`;
    
    if (criticalIssues.length > 0) {
      prompt += `🔴 בעיות קריטיות:\n`;
      criticalIssues.forEach((issue, i) => {
        prompt += `${i + 1}. ${issue.message}\n`;
      });
      prompt += '\n';
    }
    
    if (warnings.length > 0) {
      prompt += `🟡 אזהרות:\n`;
      warnings.forEach((issue, i) => {
        prompt += `${i + 1}. ${issue.message}\n`;
      });
      prompt += '\n';
    }
    
    if (seoResult.recommendations.length > 0) {
      prompt += `📝 פעולות נדרשות:\n`;
      seoResult.recommendations.forEach(rec => {
        prompt += `- ${rec}\n`;
      });
    }
    
    return prompt;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      default:
        return <CheckCircle className="h-3 w-3 text-blue-400" />;
    }
  };

  const CheckIcon = ({ checked }: { checked: boolean }) => {
    return checked 
      ? <CheckCircle className="h-4 w-4 text-green-400" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  };

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.aiAnalysis?.overallScore || r.seoResult.score), 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">בדיקת SEO מתקדמת</h2>
          <p className="text-muted-foreground">סריקה אוטומטית עם ניתוח AI ויצירת פרומפט לתיקון</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)} disabled={loadingHistory}>
            <History className="h-4 w-4 ml-2" />
            היסטוריה
          </Button>
          <Button variant="outline" onClick={discoverPages} disabled={checking}>
            <RefreshCw className="h-4 w-4 ml-2" />
            סרוק דפים
          </Button>
          <Button onClick={checkAllPages} disabled={checking}>
            <Search className={`h-4 w-4 ml-2 ${checking ? 'animate-pulse' : ''}`} />
            {checking ? `בודק: ${currentPage}...` : `בדוק ${discoveredPages.length} דפים`}
          </Button>
        </div>
      </div>

      {/* History Chart */}
      {showHistory && history.length > 0 && (
        <SeoHistoryChart history={history} />
      )}

      {/* Average Score */}
      {results.length > 0 && (
        <Card className={`${getScoreBg(averageScore)} border`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ציון ממוצע</p>
                <p className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}/100</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">דפים נבדקו</p>
                <p className="text-2xl font-bold">{results.length}/{discoveredPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results with Tabs */}
      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              בסיסי
            </TabsTrigger>
            <TabsTrigger value="ai-crawlers" className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI Crawlers
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              מילות מפתח
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-1">
              <FileCode className="h-3 w-3" />
              Schema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <Card key={index} className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {result.page.name}
                        <a href={result.seoResult.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </CardTitle>
                      <Badge className={getScoreBg(result.aiAnalysis?.overallScore || result.seoResult.score)}>
                        <span className={getScoreColor(result.aiAnalysis?.overallScore || result.seoResult.score)}>
                          {result.aiAnalysis?.overallScore || result.seoResult.score}/100
                        </span>
                      </Badge>
                    </div>
                    <CardDescription className="truncate">{result.seoResult.url}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Checks */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={!!result.seoResult.title} />
                        <span>Title ({result.seoResult.titleLength})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={!!result.seoResult.description} />
                        <span>Description ({result.seoResult.descriptionLength})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.seoResult.h1Count === 1} />
                        <span>H1 ({result.seoResult.h1Count})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.seoResult.hasCanonical} />
                        <span>Canonical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.seoResult.hasOpenGraph} />
                        <span>Open Graph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.seoResult.imagesWithoutAlt === 0} />
                        <span>Images Alt</span>
                      </div>
                    </div>

                    {/* Issues */}
                    {result.seoResult.issues.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-400 mb-1">בעיות ({result.seoResult.issues.length})</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {result.seoResult.issues.slice(0, 3).map((issue, i) => (
                            <li key={i} className="flex items-start gap-2">
                              {getSeverityIcon(issue.severity)}
                              <span>{issue.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {result.aiAnalysis && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">ניתוח AI</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{result.aiAnalysis.scoreExplanation}</p>
                      </div>
                    )}

                    {/* Copy Prompt Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => copyFixPrompt(result)}
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      העתק פרומפט לתיקון
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai-crawlers" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <Card key={index} className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{result.page.name}</CardTitle>
                    <CardDescription>גישת AI Crawlers ב-robots.txt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.seoResult.aiCrawlers ? (
                      <div className="space-y-2">
                        {result.seoResult.aiCrawlers.map((crawler, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{crawler.name}</span>
                            <div className="flex items-center gap-2">
                              {crawler.foundInRobots && (
                                <Badge variant="outline" className="text-xs">ב-robots.txt</Badge>
                              )}
                              <Badge className={crawler.allowed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {crawler.allowed ? 'מותר' : 'חסום'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-border/50 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={!result.seoResult.hasNoAiMeta} />
                            <span>noai meta tag: {result.seoResult.hasNoAiMeta ? 'קיים' : 'לא קיים'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={!result.seoResult.hasNoImageAiMeta} />
                            <span>noimageai meta tag: {result.seoResult.hasNoImageAiMeta ? 'קיים' : 'לא קיים'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <Card key={index} className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{result.page.name}</CardTitle>
                    <CardDescription>ניתוח מילות מפתח</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.seoResult.keywordAnalysis ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">מילות מפתח מובילות</p>
                          <div className="flex flex-wrap gap-1">
                            {result.seoResult.keywordAnalysis.keywords.slice(0, 8).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw.word} ({kw.density}%)
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">ב-Title:</p>
                            <p className="text-green-400">{result.seoResult.keywordAnalysis.inTitle.length} מילים</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">ב-H1:</p>
                            <p className="text-green-400">{result.seoResult.keywordAnalysis.inH1.length} מילים</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">ב-Description:</p>
                            <p className="text-green-400">{result.seoResult.keywordAnalysis.inDescription.length} מילים</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">חסרות:</p>
                            <p className="text-yellow-400">{result.seoResult.keywordAnalysis.missing.length} מילים</p>
                          </div>
                        </div>

                        {result.seoResult.keywordAnalysis.missing.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-yellow-400 mb-1">מילות מפתח חסרות</p>
                            <div className="flex flex-wrap gap-1">
                              {result.seoResult.keywordAnalysis.missing.slice(0, 5).map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schema" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <Card key={index} className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{result.page.name}</CardTitle>
                    <CardDescription>ניתוח Schema.org</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.seoResult.schemaAnalysis ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckIcon checked={result.seoResult.schemaAnalysis.hasJsonLd} />
                          <span className="text-sm">JSON-LD</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={result.seoResult.schemaAnalysis.hasOrganization} />
                            <span>Organization</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={result.seoResult.schemaAnalysis.hasWebSite} />
                            <span>WebSite</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={result.seoResult.schemaAnalysis.hasBreadcrumb} />
                            <span>Breadcrumb</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckIcon checked={result.seoResult.schemaAnalysis.hasLocalBusiness} />
                            <span>LocalBusiness</span>
                          </div>
                        </div>

                        {result.seoResult.schemaAnalysis.schemas.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">סוגי Schema שנמצאו</p>
                            <div className="flex flex-wrap gap-1">
                              {result.seoResult.schemaAnalysis.schemas.map((schema, i) => (
                                <Badge 
                                  key={i} 
                                  variant={schema.valid ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {schema.type}
                                  {!schema.valid && ' ❌'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {results.length === 0 && !checking && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא בוצעה בדיקת SEO עדיין</h3>
            <p className="text-muted-foreground mb-4">
              נמצאו {discoveredPages.length} דפים לבדיקה. לחץ על הכפתור למעלה כדי להתחיל.
            </p>
            {discoveredPages.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {discoveredPages.slice(0, 8).map((page, i) => (
                  <Badge key={i} variant="outline">{page.name}</Badge>
                ))}
                {discoveredPages.length > 8 && (
                  <Badge variant="outline">+{discoveredPages.length - 8} נוספים</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

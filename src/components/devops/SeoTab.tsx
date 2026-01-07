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

interface TopicPrompt {
  title: string;
  icon: string;
  issueCount: number;
  affectedPages: string[];
  prompt: string;
}

interface ConsolidatedPrompts {
  basicSeo: TopicPrompt;
  schema: TopicPrompt;
  aiCrawlers: TopicPrompt;
  keywords: TopicPrompt;
}

interface ConsolidatedAnalysis {
  overallScore: number;
  scoreExplanation: string;
  totalIssues: { critical: number; warning: number; info: number };
  pagesAnalyzed: number;
  consolidatedPrompts: ConsolidatedPrompts;
  priorityOrder: string[];
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
}

export const SeoTab: React.FC = () => {
  const [results, setResults] = useState<FullResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<PageToCheck[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');
  const [consolidatedAnalysis, setConsolidatedAnalysis] = useState<ConsolidatedAnalysis | null>(null);
  const [analyzingWithAi, setAnalyzingWithAi] = useState(false);

  const PRODUCTION_DOMAIN = 'https://www.ctmarketproperties.com';

  const getBaseUrl = () => {
    return PRODUCTION_DOMAIN;
  };

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

  const analyzeAllWithAi = async (allResults: FullResult[]) => {
    setAnalyzingWithAi(true);
    try {
      const allPagesData = allResults.map(r => ({
        pageName: r.page.name,
        seoData: r.seoResult
      }));

      const { data, error } = await supabase.functions.invoke('analyze-seo-ai', {
        body: { allPagesData }
      });

      if (error) throw error;
      
      if (data?.analysis) {
        setConsolidatedAnalysis(data.analysis);
        toast.success('ניתוח AI הושלם - הפרומפטים המאוחדים מוכנים');
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast.error('שגיאה בניתוח AI');
    } finally {
      setAnalyzingWithAi(false);
    }
  };

  const saveToHistory = async (page: PageToCheck, seoResult: SeoResult) => {
    try {
      const { error } = await supabase.from('seo_checks').insert([{
        page_url: seoResult.url,
        page_name: page.name,
        score: seoResult.score,
        results: seoResult as any,
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
    setConsolidatedAnalysis(null);
    
    const allResults: FullResult[] = [];
    
    for (const page of discoveredPages) {
      setCurrentPage(page.name);
      
      const seoResult = await checkSinglePage(page);
      if (!seoResult) continue;

      await saveToHistory(page, seoResult);
      
      const result = { page, seoResult };
      allResults.push(result);
      setResults(prev => [...prev, result]);
    }
    
    setCurrentPage(null);
    setChecking(false);
    
    // Now analyze all pages together with AI
    if (allResults.length > 0) {
      await analyzeAllWithAi(allResults);
    }
    
    loadHistory();
    toast.success('בדיקת SEO הושלמה');
  };

  const copyPrompt = (prompt: string, title: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success(`פרומפט "${title}" הועתק ללוח`);
  };

  const copyAllPrompts = () => {
    if (!consolidatedAnalysis) return;
    
    const prompts = consolidatedAnalysis.consolidatedPrompts;
    const allPrompts = Object.values(prompts)
      .filter(p => p.issueCount > 0)
      .map(p => `${p.icon} ${p.title}\n${'='.repeat(40)}\n\n${p.prompt}`)
      .join('\n\n\n');
    
    navigator.clipboard.writeText(allPrompts);
    toast.success('כל הפרומפטים הועתקו ללוח');
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
    ? Math.round(results.reduce((acc, r) => acc + r.seoResult.score, 0) / results.length)
    : 0;

  const topicIcons: Record<string, React.ReactNode> = {
    basicSeo: <CheckCircle className="h-5 w-5" />,
    schema: <FileCode className="h-5 w-5" />,
    aiCrawlers: <Bot className="h-5 w-5" />,
    keywords: <Key className="h-5 w-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">בדיקת SEO מתקדמת</h2>
          <p className="text-muted-foreground">סריקה אוטומטית עם פרומפטים מאוחדים לפי נושא</p>
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
          <Button onClick={checkAllPages} disabled={checking || analyzingWithAi}>
            <Search className={`h-4 w-4 ml-2 ${checking ? 'animate-pulse' : ''}`} />
            {checking ? `בודק: ${currentPage}...` : analyzingWithAi ? 'מנתח עם AI...' : `בדוק ${discoveredPages.length} דפים`}
          </Button>
        </div>
      </div>

      {/* History Chart */}
      {showHistory && history.length > 0 && (
        <SeoHistoryChart history={history} />
      )}

      {/* Consolidated Prompts Section */}
      {consolidatedAnalysis && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <CardTitle>פרומפטים מאוחדים לתיקון</CardTitle>
              </div>
              <Button onClick={copyAllPrompts} variant="outline" size="sm">
                <Copy className="h-4 w-4 ml-2" />
                העתק הכל
              </Button>
            </div>
            <CardDescription>
              {consolidatedAnalysis.scoreExplanation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(consolidatedAnalysis.consolidatedPrompts).map(([key, topic]) => (
                <Card 
                  key={key} 
                  className={`bg-card/50 border-border/50 ${topic.issueCount === 0 ? 'opacity-50' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {topicIcons[key]}
                        <CardTitle className="text-lg">{topic.icon} {topic.title}</CardTitle>
                      </div>
                      {topic.issueCount > 0 ? (
                        <Badge variant="destructive">{topic.issueCount} בעיות</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">✓ תקין</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {topic.affectedPages.length > 0 
                        ? `${topic.affectedPages.length} דפים מושפעים`
                        : 'אין דפים מושפעים'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topic.affectedPages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {topic.affectedPages.slice(0, 4).map((page, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{page}</Badge>
                        ))}
                        {topic.affectedPages.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{topic.affectedPages.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => copyPrompt(topic.prompt, topic.title)}
                      disabled={topic.issueCount === 0}
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      העתק פרומפט
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Average Score & Stats */}
      {results.length > 0 && (
        <Card className={`${getScoreBg(consolidatedAnalysis?.overallScore || averageScore)} border`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ציון ממוצע</p>
                <p className={`text-4xl font-bold ${getScoreColor(consolidatedAnalysis?.overallScore || averageScore)}`}>
                  {consolidatedAnalysis?.overallScore || averageScore}/100
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">דפים נבדקו</p>
                <p className="text-2xl font-bold">{results.length}/{discoveredPages.length}</p>
              </div>
              {consolidatedAnalysis && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{consolidatedAnalysis.totalIssues.critical}</p>
                    <p className="text-xs text-muted-foreground">קריטי</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{consolidatedAnalysis.totalIssues.warning}</p>
                    <p className="text-xs text-muted-foreground">אזהרות</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{consolidatedAnalysis.totalIssues.info}</p>
                    <p className="text-xs text-muted-foreground">מידע</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results with Tabs */}
      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="prompts" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              פרומפטים
            </TabsTrigger>
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

          <TabsContent value="prompts" className="mt-4">
            {consolidatedAnalysis ? (
              <div className="space-y-4">
                {consolidatedAnalysis.priorityOrder.map((key) => {
                  const topic = consolidatedAnalysis.consolidatedPrompts[key as keyof ConsolidatedPrompts];
                  if (topic.issueCount === 0) return null;
                  
                  return (
                    <Card key={key} className="bg-card/50 border-border/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {topicIcons[key]}
                            <CardTitle>{topic.icon} {topic.title}</CardTitle>
                            <Badge variant="destructive">{topic.issueCount} בעיות</Badge>
                          </div>
                          <Button onClick={() => copyPrompt(topic.prompt, topic.title)} size="sm">
                            <Copy className="h-4 w-4 ml-2" />
                            העתק פרומפט
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto" dir="rtl">
                          {topic.prompt}
                        </pre>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">הפרומפטים המאוחדים יופיעו כאן</h3>
                  <p className="text-muted-foreground">
                    {analyzingWithAi ? 'מנתח את התוצאות עם AI...' : 'הרץ בדיקת SEO כדי ליצור פרומפטים מאוחדים לפי נושא'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
                      <Badge className={getScoreBg(result.seoResult.score)}>
                        <span className={getScoreColor(result.seoResult.score)}>
                          {result.seoResult.score}/100
                        </span>
                      </Badge>
                    </div>
                    <CardDescription className="truncate">{result.seoResult.url}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

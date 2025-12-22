import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileText,
  Image,
  Globe,
  Code,
  Layout,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  issues: string[];
  recommendations: string[];
}

interface PageToCheck {
  name: string;
  path: string;
}

const PAGES_TO_CHECK: PageToCheck[] = [
  { name: 'דף הבית', path: '/' },
  { name: 'דף הבית (אנגלית)', path: '/en' },
  { name: 'אודות', path: '/en/about' },
  { name: 'צור קשר', path: '/en/contact' },
  { name: 'השכרות', path: '/en/rentals' },
  { name: 'מכירות', path: '/en/sales' },
  { name: 'ניהול נכסים', path: '/en/management' },
  { name: 'שכונות', path: '/en/neighborhoods' },
];

export default function AdminSeo() {
  const [results, setResults] = useState<Record<string, SeoResult>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkingPage, setCheckingPage] = useState<string | null>(null);

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const checkSinglePage = async (page: PageToCheck) => {
    const url = `${getBaseUrl()}${page.path}`;
    try {
      const { data, error } = await supabase.functions.invoke('check-seo', {
        body: { url },
      });

      if (error) throw error;
      if (data.success && data.result) {
        return data.result;
      }
      throw new Error(data.error || 'Unknown error');
    } catch (error) {
      console.error(`Error checking ${page.name}:`, error);
      return null;
    }
  };

  const checkAllPages = async () => {
    setIsChecking(true);
    setResults({});

    for (const page of PAGES_TO_CHECK) {
      setCheckingPage(page.name);
      const result = await checkSinglePage(page);
      if (result) {
        setResults((prev) => ({ ...prev, [page.path]: result }));
      }
    }

    setCheckingPage(null);
    setIsChecking(false);
    toast.success('בדיקת SEO הושלמה');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const CheckIcon = ({ checked }: { checked: boolean }) => (
    checked ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  );

  const averageScore = Object.values(results).length > 0
    ? Math.round(Object.values(results).reduce((acc, r) => acc + r.score, 0) / Object.values(results).length)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">בדיקת SEO</h1>
          <p className="text-muted-foreground">ניתוח אופטימיזציה למנועי חיפוש</p>
        </div>
        <Button onClick={checkAllPages} disabled={isChecking} size="lg">
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              בודק {checkingPage}...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 ml-2" />
              בדוק את כל העמודים
            </>
          )}
        </Button>
      </div>

      {/* Average Score */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${getScoreBg(averageScore)} border-opacity-20`}>
                  <span className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">ציון ממוצע</h3>
                <p className="text-muted-foreground">
                  {averageScore >= 80 ? 'מצוין! האתר מותאם היטב' : 
                   averageScore >= 60 ? 'טוב, יש מקום לשיפור' : 
                   'דורש שיפור משמעותי'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PAGES_TO_CHECK.map((page) => {
          const result = results[page.path];
          const isCurrentlyChecking = checkingPage === page.name;

          return (
            <Card key={page.path} className={isCurrentlyChecking ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{page.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{page.path}</CardDescription>
                  </div>
                  {result && (
                    <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                    </div>
                  )}
                  {isCurrentlyChecking && (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  )}
                </div>
              </CardHeader>
              {result && (
                <CardContent className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>כותרת: {result.titleLength} תווים</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>תיאור: {result.descriptionLength} תווים</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-muted-foreground" />
                      <span>H1: {result.h1Count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span>תמונות ללא alt: {result.imagesWithoutAlt}/{result.totalImages}</span>
                    </div>
                  </div>

                  {/* Advanced Checks */}
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">בדיקות מתקדמות</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasOpenGraph} />
                        <span>Open Graph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasCanonical} />
                        <span>Canonical URL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasRobotsMeta} />
                        <span>Robots Meta</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasViewport} />
                        <span>Viewport</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasHtmlLang} />
                        <span>HTML Lang</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckIcon checked={result.hasStructuredData} />
                        <span>Structured Data</span>
                      </div>
                    </div>
                  </div>

                  {/* Heading Structure */}
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">מבנה כותרות</h4>
                    <div className="flex gap-3 text-sm">
                      {Object.entries(result.headingStructure).map(([tag, count]) => (
                        <Badge key={tag} variant="outline" className="font-mono">
                          {tag.toUpperCase()}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Issues */}
                  {result.issues.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        בעיות שנמצאו ({result.issues.length})
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {result.issues.slice(0, 3).map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        המלצות לשיפור
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {result.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {Object.keys(results).length === 0 && !isChecking && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">לא נבדקו עמודים עדיין</h3>
            <p className="text-muted-foreground">לחץ על "בדוק את כל העמודים" כדי להתחיל</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeoResult {
  url: string;
  title: string;
  score: number;
  checks: {
    hasTitle: boolean;
    hasDescription: boolean;
    hasH1: boolean;
    hasCanonical: boolean;
    hasViewport: boolean;
    hasOgTags: boolean;
    hasTwitterTags: boolean;
    imagesHaveAlt: boolean;
  };
  issues: string[];
  recommendations: string[];
  headings: { level: string; text: string }[];
}

interface PageToCheck {
  name: string;
  path: string;
}

const PAGES_TO_CHECK: PageToCheck[] = [
  { name: 'דף הבית (עברית)', path: '/he' },
  { name: 'השכרות', path: '/he/rentals' },
  { name: 'מכירות', path: '/he/sales' },
  { name: 'ניהול נכסים', path: '/he/management' },
  { name: 'אודות', path: '/he/about' },
  { name: 'צור קשר', path: '/he/contact' },
  { name: 'Home (English)', path: '/en' },
  { name: 'Rentals (English)', path: '/en/rentals' },
];

export const SeoTab: React.FC = () => {
  const [results, setResults] = useState<SeoResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const checkSinglePage = async (page: PageToCheck): Promise<SeoResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-seo', {
        body: { url: `${getBaseUrl()}${page.path}` }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error checking ${page.path}:`, error);
      return null;
    }
  };

  const checkAllPages = async () => {
    setChecking(true);
    setResults([]);
    
    for (const page of PAGES_TO_CHECK) {
      setCurrentPage(page.name);
      const result = await checkSinglePage(page);
      if (result) {
        setResults(prev => [...prev, result]);
      }
    }
    
    setCurrentPage(null);
    setChecking(false);
    toast.success('בדיקת SEO הושלמה');
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

  const CheckIcon = ({ checked }: { checked: boolean }) => {
    return checked 
      ? <CheckCircle className="h-4 w-4 text-green-400" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  };

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">בדיקת SEO</h2>
          <p className="text-muted-foreground">סריקת דפי האתר לאופטימיזציה למנועי חיפוש</p>
        </div>
        <Button onClick={checkAllPages} disabled={checking}>
          <Search className={`h-4 w-4 ml-2 ${checking ? 'animate-pulse' : ''}`} />
          {checking ? `בודק: ${currentPage}...` : 'הרץ בדיקת SEO'}
        </Button>
      </div>

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
                <p className="text-2xl font-bold">{results.length}/{PAGES_TO_CHECK.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {PAGES_TO_CHECK[index]?.name || result.title}
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                </CardTitle>
                <Badge className={getScoreBg(result.score)}>
                  <span className={getScoreColor(result.score)}>{result.score}/100</span>
                </Badge>
              </div>
              <CardDescription className="truncate">{result.url}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Checks */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.hasTitle} />
                  <span>Title</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.hasDescription} />
                  <span>Meta Description</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.hasH1} />
                  <span>H1</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.hasCanonical} />
                  <span>Canonical</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.hasOgTags} />
                  <span>Open Graph</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon checked={result.checks.imagesHaveAlt} />
                  <span>Image Alt</span>
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">בעיות ({result.issues.length})</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.issues.slice(0, 3).map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-red-400 mt-1 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-400 mb-1">המלצות</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {results.length === 0 && !checking && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא בוצעה בדיקת SEO עדיין</h3>
            <p className="text-muted-foreground mb-4">לחץ על הכפתור למעלה כדי לסרוק את דפי האתר</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

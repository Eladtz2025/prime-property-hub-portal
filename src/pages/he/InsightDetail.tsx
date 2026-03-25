import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface InsightFull {
  id: string;
  type: string;
  title_he: string | null;
  summary_he: string | null;
  content_he: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

const HebrewInsightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<InsightFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("insights" as any)
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      setInsight(data as unknown as InsightFull);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <HebrewHeader />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">הכתבה לא נמצאה</h1>
          <button onClick={() => navigate("/he/insights")} className="text-secondary hover:underline">
            חזרה ל-Insights
          </button>
        </div>
        <HebrewFooter />
      </div>
    );
  }

  const formattedDate = insight.published_at
    ? new Date(insight.published_at).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>{insight.title_he || "Insights"} | City Market Properties</title>
        <meta name="description" content={insight.summary_he || ""} />
        <meta property="og:title" content={insight.title_he || "Insights"} />
        {insight.image_url && <meta property="og:image" content={insight.image_url} />}
      </Helmet>
      <HreflangMeta currentLang="he" currentPath={`/he/insights/${id}`} />

      <HebrewHeader />

      {/* Hero image */}
      {insight.image_url && (
        <div className="w-full h-[40vh] md:h-[50vh] relative">
          <img src={insight.image_url} alt={insight.title_he || ""} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <button
          onClick={() => navigate("/he/insights")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors mb-8"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה ל-Insights
        </button>

        {insight.category && (
          <span className="text-xs font-semibold text-secondary tracking-wide uppercase">{insight.category}</span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-playfair mt-2 mb-4">{insight.title_he}</h1>

        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        )}

        {insight.summary_he && (
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-r-4 border-secondary pr-4">
            {insight.summary_he}
          </p>
        )}

        <div className="prose prose-lg max-w-none text-foreground">
          <ReactMarkdown>{insight.content_he || ""}</ReactMarkdown>
        </div>
      </article>

      <HebrewFooter />
    </div>
  );
};

export default HebrewInsightDetail;

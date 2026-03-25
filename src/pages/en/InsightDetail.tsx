import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface InsightFull {
  id: string;
  type: string;
  title_en: string | null;
  summary_en: string | null;
  content_en: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

const EnglishInsightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<InsightFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("insights")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      setInsight(data);
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
      <div className="min-h-screen bg-background">
        <EnglishHeader />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article not found</h1>
          <button onClick={() => navigate("/en/insights")} className="text-secondary hover:underline">
            Back to Insights
          </button>
        </div>
        <EnglishFooter />
      </div>
    );
  }

  const formattedDate = insight.published_at
    ? new Date(insight.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{insight.title_en || "Insights"} | City Market Properties</title>
        <meta name="description" content={insight.summary_en || ""} />
        <meta property="og:title" content={insight.title_en || "Insights"} />
        {insight.image_url && <meta property="og:image" content={insight.image_url} />}
      </Helmet>
      <HreflangMeta currentLang="en" currentPath={`/en/insights/${id}`} />

      <EnglishHeader />

      {/* Hero image */}
      {insight.image_url && (
        <div className="w-full h-[40vh] md:h-[50vh] relative">
          <img src={insight.image_url} alt={insight.title_en || ""} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <button
          onClick={() => navigate("/en/insights")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Insights
        </button>

        {insight.category && (
          <span className="text-xs font-semibold text-secondary tracking-wide uppercase font-montserrat">{insight.category}</span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-playfair mt-2 mb-4">{insight.title_en}</h1>

        {formattedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        )}

        {insight.summary_en && (
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-secondary pl-4 font-montserrat">
            {insight.summary_en}
          </p>
        )}

        <div className="prose prose-lg max-w-none text-foreground">
          <ReactMarkdown>{insight.content_en || ""}</ReactMarkdown>
        </div>
      </article>

      <EnglishFooter />
    </div>
  );
};

export default EnglishInsightDetail;

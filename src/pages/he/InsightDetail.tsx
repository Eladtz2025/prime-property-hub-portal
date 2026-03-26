import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar } from "lucide-react";
import LuxuryArticleRenderer from "@/components/insights/LuxuryArticleRenderer";

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
      <div className="min-h-screen hebrew-luxury flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen hebrew-luxury" dir="rtl">
        <HebrewHeader />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-2xl font-playfair text-foreground mb-4">הכתבה לא נמצאה</h1>
          <button onClick={() => navigate("/he/insights")} className="text-secondary hover:underline font-montserrat">
            חזרה לתובנות
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
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>{insight.title_he || "תובנות"} | City Market Properties</title>
        <meta name="description" content={insight.summary_he || ""} />
        <meta property="og:title" content={insight.title_he || "תובנות"} />
        {insight.image_url && <meta property="og:image" content={insight.image_url} />}
      </Helmet>
      <HreflangMeta currentLang="he" currentPath={`/he/insights/${id}`} />

      <HebrewHeader />

      {/* Hero */}
      {insight.image_url && (
        <div className="w-full h-[50vh] md:h-[60vh] relative flex items-end">
          <img src={insight.image_url} alt={insight.title_he || ""} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 pb-10 md:pb-14 max-w-3xl">
            {insight.category && (
              <span className="inline-block text-xs font-semibold text-secondary tracking-widest uppercase font-montserrat mb-3">
                {insight.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-white font-playfair tracking-wide leading-tight">
              {insight.title_he}
            </h1>
            {insight.summary_he && (
              <p className="text-white/80 font-montserrat mt-4 text-base md:text-lg leading-relaxed max-w-2xl">
                {insight.summary_he}
              </p>
            )}
          </div>
        </div>
      )}

      <article className="container mx-auto px-4 py-12 md:py-16 max-w-2xl">
        {/* Back + date */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate("/he/insights")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors font-montserrat"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לתובנות
          </button>
          {formattedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-montserrat">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* No hero fallback: show title inline */}
        {!insight.image_url && (
          <>
            {insight.category && (
              <span className="text-xs font-semibold text-secondary tracking-widest uppercase font-montserrat">{insight.category}</span>
            )}
            <h1 className="text-3xl md:text-4xl font-normal text-foreground font-playfair mt-2 mb-4 tracking-wide">{insight.title_he}</h1>
            {insight.summary_he && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-r-4 border-secondary pr-4 font-montserrat">
                {insight.summary_he}
              </p>
            )}
          </>
        )}

        <LuxuryArticleRenderer content={insight.content_he || ""} lang="he" />
      </article>

      <HebrewFooter />
    </div>
  );
};

export default HebrewInsightDetail;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, FileText, Wrench } from "lucide-react";

interface Insight {
  id: string;
  type: string;
  title_he: string | null;
  summary_he: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

const InsightCard = ({ item, onClick }: { item: Insight; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-right w-full bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border/50"
  >
    {item.image_url && (
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={item.image_url}
          alt={item.title_he || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
    )}
    <div className="p-5">
      {item.category && (
        <span className="text-xs font-semibold text-secondary tracking-wide uppercase">
          {item.category}
        </span>
      )}
      <h3 className="text-lg font-bold text-foreground mt-1 mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
        {item.title_he}
      </h3>
      {item.summary_he && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {item.summary_he}
        </p>
      )}
      <div className="flex items-center gap-1 mt-4 text-secondary text-sm font-medium">
        <span>קרא עוד</span>
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

const HebrewInsights = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Insight[]>([]);
  const [guides, setGuides] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const { data } = await supabase
        .from("insights")
        .select("id, type, title_he, summary_he, image_url, category, published_at")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false });

      if (data) {
        setArticles(data.filter((i) => i.type === "article"));
        setGuides(data.filter((i) => i.type === "guide"));
      }
      setLoading(false);
    };
    fetchInsights();
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>Insights | תובנות נדל"ן - City Market Properties</title>
        <meta name="description" content='כתבות, מדריכים וטיפים מעולם הנדל"ן בתל אביב. תובנות מקצועיות מצוות City Market Properties.' />
        <meta property="og:title" content="Insights | תובנות נדל״ן - City Market Properties" />
        <meta property="og:image" content="/images/city-market-icon.png" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/insights" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/insights" />
      <OrganizationSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "Insights", url: "https://www.ctmarketproperties.com/he/insights" },
      ]} />

      <HebrewHeader />

      <FullScreenHero
        title="Insights"
        subtitle="כתבות, מדריכים ותובנות מעולם הנדל״ן"
        backgroundImage="/images/tel-aviv-aerial.jpg"
        backgroundAlt="תובנות נדל״ן תל אביב"
        minHeight="50vh"
      />

      <div className="container mx-auto px-4 py-16 space-y-20">
        {/* Articles Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-playfair">כתבות אחרונות</h2>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-72" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {articles.map((item) => (
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">כתבות חדשות יפורסמו בקרוב...</p>
          )}
        </section>

        {/* Guides Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-playfair">מדריכים</h2>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-72" />
              ))}
            </div>
          ) : guides.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {guides.map((item) => (
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">מדריכים חדשים יפורסמו בקרוב...</p>
          )}
        </section>

        {/* Professionals CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-primary text-primary-foreground p-10 md:p-16">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <Wrench className="w-10 h-10 mx-auto mb-4 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-4">בעלי מקצוע מומלצים</h2>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed">
              רשימת בעלי המקצוע המומלצים שלנו — שיפוצניקים, חשמלאים, אינסטלטורים ועוד. כל מי שצריך כשמתנהלים עם נכס.
            </p>
            <button
              onClick={() => navigate("/professionals/shared")}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              לרשימת בעלי המקצוע
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />
          </div>
        </section>
      </div>

      <HebrewFooter />
    </div>
  );
};

export default HebrewInsights;

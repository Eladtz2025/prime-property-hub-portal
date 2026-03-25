import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen, FileText, Wrench } from "lucide-react";

interface Insight {
  id: string;
  type: string;
  title_en: string | null;
  summary_en: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

const InsightCard = ({ item, onClick }: { item: Insight; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-left w-full bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border/50"
  >
    {item.image_url && (
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={item.image_url}
          alt={item.title_en || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
    )}
    <div className="p-5">
      {item.category && (
        <span className="text-xs font-semibold text-secondary tracking-wide uppercase font-montserrat">
          {item.category}
        </span>
      )}
      <h3 className="text-lg font-bold text-foreground mt-1 mb-2 line-clamp-2 group-hover:text-secondary transition-colors font-playfair">
        {item.title_en}
      </h3>
      {item.summary_en && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-montserrat">
          {item.summary_en}
        </p>
      )}
      <div className="flex items-center gap-1 mt-4 text-secondary text-sm font-medium font-montserrat">
        <span>Read more</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

const EnglishInsights = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Insight[]>([]);
  const [guides, setGuides] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const { data } = await supabase
        .from("insights")
        .select("id, type, title_en, summary_en, image_url, category, published_at")
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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Insights | Real Estate Tips & Guides - City Market Properties</title>
        <meta name="description" content="Articles, guides and professional insights about Tel Aviv real estate from City Market Properties." />
        <meta property="og:title" content="Insights | Real Estate Tips & Guides - City Market Properties" />
        <meta property="og:image" content="/images/city-market-icon.png" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/insights" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/insights" />
      <OrganizationSchema language="en" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "Insights", url: "https://www.ctmarketproperties.com/en/insights" },
      ]} />

      <EnglishHeader />

      <FullScreenHero
        title="Insights"
        subtitle="Articles, guides & real estate expertise"
        backgroundImage="/images/tel-aviv-aerial.jpg"
        backgroundAlt="Tel Aviv real estate insights"
        minHeight="50vh"
      />

      <div className="container mx-auto px-4 py-16 space-y-20">
        {/* Articles Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-playfair">Latest Articles</h2>
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
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/en/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 font-montserrat">New articles coming soon...</p>
          )}
        </section>

        {/* Guides Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-playfair">Guides</h2>
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
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/en/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12 font-montserrat">New guides coming soon...</p>
          )}
        </section>

        {/* Professionals CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-primary text-primary-foreground p-10 md:p-16">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <Wrench className="w-10 h-10 mx-auto mb-4 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-4">Recommended Professionals</h2>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed font-montserrat">
              Our curated list of trusted professionals — renovators, electricians, plumbers and more. Everyone you need when managing a property.
            </p>
            <button
              onClick={() => navigate("/professionals/shared/en")}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors font-montserrat"
            >
              View Professionals
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />
          </div>
        </section>
      </div>

      <EnglishFooter />
    </div>
  );
};

export default EnglishInsights;

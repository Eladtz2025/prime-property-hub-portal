import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { ScrollAnimated } from "@/components/about/ScrollAnimated";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

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
    className="group text-left w-full bg-card overflow-hidden shadow-md hover:shadow-2xl transition-all duration-700"
  >
    {item.image_url && (
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          src={item.image_url}
          alt={item.title_en || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    )}
    <div className="p-8">
      {item.category && (
        <span className="text-xs font-semibold text-secondary tracking-widest uppercase font-montserrat">
          {item.category}
        </span>
      )}
      <h3 className="text-xl font-normal text-foreground mt-3 mb-4 line-clamp-2 group-hover:text-secondary transition-colors duration-500 font-playfair tracking-wide">
        {item.title_en}
      </h3>
      {item.summary_en && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-montserrat">
          {item.summary_en}
        </p>
      )}
      <div className="w-8 h-px bg-secondary/40 mt-6 transition-all duration-500 group-hover:w-16 group-hover:bg-secondary" />
      <div className="flex items-center gap-1 mt-5 text-secondary text-sm font-medium font-montserrat tracking-wide">
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
        .from("insights" as any)
        .select("id, type, title_en, summary_en, image_url, category, published_at")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false });

      if (data) {
        const items = data as unknown as Insight[];
        setArticles(items.filter((i) => i.type === "article"));
        setGuides(items.filter((i) => i.type === "guide"));
      }
      setLoading(false);
    };
    fetchInsights();
  }, []);

  const getGridClass = (count: number) => {
    if (count === 1) return "grid md:grid-cols-2 gap-8";
    if (count === 2) return "grid md:grid-cols-2 gap-8";
    return "grid md:grid-cols-3 gap-8";
  };

  return (
    <div className="min-h-screen english-luxury">
      <Helmet>
        <html lang="en" />
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
        backgroundImage="https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920&q=80"
        backgroundAlt="Tel Aviv real estate insights"
        minHeight="50vh"
      />

      {/* Articles Section */}
      <section className="py-12 md:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-14">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">Articles & Updates</p>
              <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">Latest Articles</h2>
              <div className="w-16 h-px bg-secondary mx-auto mt-5" />
            </div>
          </ScrollAnimated>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-96" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className={getGridClass(articles.length)}>
              {articles.map((item, index) => (
                <ScrollAnimated key={item.id} delay={index * 150}>
                  <InsightCard item={item} onClick={() => navigate(`/en/insights/${item.id}`)} />
                </ScrollAnimated>
              ))}
            </div>
          ) : (
            <ScrollAnimated>
              <div className="text-center py-20">
                <div className="w-16 h-px bg-secondary/30 mx-auto mb-8" />
                <p className="font-playfair text-2xl text-muted-foreground/70 italic tracking-wide">New articles coming soon</p>
                <p className="font-montserrat text-sm text-muted-foreground/50 mt-3">We're preparing professional content for you</p>
                <div className="w-16 h-px bg-secondary/30 mx-auto mt-8" />
              </div>
            </ScrollAnimated>
          )}
        </div>
      </section>

      {/* Guides Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-14">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">Practical Knowledge</p>
              <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">Guides</h2>
              <div className="w-16 h-px bg-secondary mx-auto mt-5" />
            </div>
          </ScrollAnimated>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-96" />
              ))}
            </div>
          ) : guides.length > 0 ? (
            <div className={getGridClass(guides.length)}>
              {guides.map((item, index) => (
                <ScrollAnimated key={item.id} delay={index * 150}>
                  <InsightCard item={item} onClick={() => navigate(`/en/insights/${item.id}`)} />
                </ScrollAnimated>
              ))}
            </div>
          ) : (
            <ScrollAnimated>
              <div className="text-center py-20">
                <div className="w-16 h-px bg-secondary/30 mx-auto mb-8" />
                <p className="font-playfair text-2xl text-muted-foreground/70 italic tracking-wide">New guides coming soon</p>
                <p className="font-montserrat text-sm text-muted-foreground/50 mt-3">Practical content to help you manage your property</p>
                <div className="w-16 h-px bg-secondary/30 mx-auto mt-8" />
              </div>
            </ScrollAnimated>
          )}
        </div>
      </section>

      {/* Professionals CTA */}
      <section className="py-16 md:py-20 lg:py-28 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ScrollAnimated>
            <p className="font-montserrat text-sm tracking-widest uppercase text-secondary mb-3">Premium Services</p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground mb-6">Recommended Professionals</h2>
            <div className="w-16 h-px bg-secondary mx-auto mb-8" />
            <p className="text-muted-foreground mb-10 leading-relaxed font-montserrat max-w-xl mx-auto">
              Our curated list of trusted professionals — renovators, electricians, plumbers and more. Everyone you need when managing a property.
            </p>
            <button
              onClick={() => navigate("/professionals/shared/en")}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-10 py-3.5 font-montserrat text-sm tracking-widest uppercase hover:bg-secondary/90 transition-colors"
            >
              View Professionals
              <ArrowRight className="w-4 h-4" />
            </button>
          </ScrollAnimated>
        </div>
      </section>

      <EnglishFooter />
    </div>
  );
};

export default EnglishInsights;

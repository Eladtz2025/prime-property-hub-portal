import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import FullScreenHero from "@/components/FullScreenHero";
import { ScrollAnimated } from "@/components/about/ScrollAnimated";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface Insight {
  id: string;
  type: string;
  title_he: string | null;
  summary_he: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
}

const InsightCardVertical = ({ item, onClick }: { item: Insight; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-right w-full bg-card overflow-hidden shadow-md hover:shadow-2xl transition-all duration-700"
  >
    {item.image_url && (
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={item.image_url}
          alt={item.title_he || ""}
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
        {item.title_he}
      </h3>
      {item.summary_he && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {item.summary_he}
        </p>
      )}
      <div className="w-8 h-px bg-secondary/40 mt-6 transition-all duration-500 group-hover:w-16 group-hover:bg-secondary" />
      <div className="flex items-center gap-1 mt-5 text-secondary text-sm font-medium font-montserrat tracking-wide">
        <span>קרא עוד</span>
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

const InsightCardHorizontal = ({ item, onClick }: { item: Insight; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-right w-full bg-card overflow-hidden shadow-md hover:shadow-2xl transition-all duration-700 grid grid-cols-1 md:grid-cols-2"
  >
    {item.image_url && (
      <div className="aspect-[4/3] md:aspect-auto md:h-full overflow-hidden relative">
        <img
          src={item.image_url}
          alt={item.title_he || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    )}
    <div className="p-8 md:p-12 flex flex-col justify-center">
      {item.category && (
        <span className="text-xs font-semibold text-secondary tracking-widest uppercase font-montserrat">
          {item.category}
        </span>
      )}
      <h3 className="text-2xl md:text-3xl font-normal text-foreground mt-3 mb-5 group-hover:text-secondary transition-colors duration-500 font-playfair tracking-wide">
        {item.title_he}
      </h3>
      {item.summary_he && (
        <p className="text-base text-muted-foreground leading-relaxed">
          {item.summary_he}
        </p>
      )}
      <div className="w-8 h-px bg-secondary/40 mt-8 transition-all duration-500 group-hover:w-16 group-hover:bg-secondary" />
      <div className="flex items-center gap-1 mt-6 text-secondary text-sm font-medium font-montserrat tracking-wide">
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
        .from("insights" as any)
        .select("id, type, title_he, summary_he, image_url, category, published_at")
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

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>תובנות | כתבות ומדריכי נדל"ן - City Market Properties</title>
        <meta name="description" content='כתבות, מדריכים וטיפים מעולם הנדל"ן בתל אביב. תובנות מקצועיות מצוות City Market Properties.' />
        <meta property="og:title" content="תובנות | כתבות ומדריכי נדל״ן - City Market Properties" />
        <meta property="og:image" content="/images/city-market-icon.png" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/insights" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/insights" />
      <OrganizationSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "תובנות", url: "https://www.ctmarketproperties.com/he/insights" },
      ]} />

      <HebrewHeader />

      <FullScreenHero
        title="תובנות"
        subtitle="כתבות, מדריכים ותובנות מעולם הנדל״ן"
        backgroundImage="https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920&q=80"
        backgroundAlt="תובנות נדל״ן תל אביב"
        minHeight="50vh"
      />

      {/* Articles Section */}
      <section className="py-12 md:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollAnimated>
            <div className="text-center mb-14">
              <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">מאמרים ועדכונים</p>
              <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">כתבות אחרונות</h2>
              <div className="w-16 h-px bg-secondary mx-auto mt-5" />
            </div>
          </ScrollAnimated>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-96" />
              ))}
            </div>
          ) : articles.length === 1 ? (
            <ScrollAnimated>
              <InsightCardHorizontal item={articles[0]} onClick={() => navigate(`/he/insights/${articles[0].id}`)} />
            </ScrollAnimated>
          ) : articles.length > 1 ? (
            <div className={articles.length === 2 ? "grid md:grid-cols-2 gap-8" : "grid md:grid-cols-3 gap-8"}>
              {articles.map((item, index) => (
                <ScrollAnimated key={item.id} delay={index * 150}>
                  <InsightCardVertical item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
                </ScrollAnimated>
              ))}
            </div>
          ) : (
            <ScrollAnimated>
              <div className="text-center py-20">
                <div className="w-16 h-px bg-secondary/30 mx-auto mb-8" />
                <p className="font-playfair text-2xl text-muted-foreground/70 italic tracking-wide">כתבות חדשות יפורסמו בקרוב</p>
                <p className="font-montserrat text-sm text-muted-foreground/50 mt-3">אנחנו מכינים עבורכם תכנים מקצועיים</p>
                <div className="w-16 h-px bg-secondary/30 mx-auto mt-8" />
              </div>
            </ScrollAnimated>
          )}
        </div>
      </section>

      {/* Guides Section — only show if there are guides */}
      {!loading && guides.length > 0 && (
        <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <ScrollAnimated>
              <div className="text-center mb-14">
                <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">ידע מעשי</p>
                <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">מדריכים</h2>
                <div className="w-16 h-px bg-secondary mx-auto mt-5" />
              </div>
            </ScrollAnimated>
            {guides.length === 1 ? (
              <ScrollAnimated>
                <InsightCardHorizontal item={guides[0]} onClick={() => navigate(`/he/insights/${guides[0].id}`)} />
              </ScrollAnimated>
            ) : (
              <div className={guides.length === 2 ? "grid md:grid-cols-2 gap-8" : "grid md:grid-cols-3 gap-8"}>
                {guides.map((item, index) => (
                  <ScrollAnimated key={item.id} delay={index * 150}>
                    <InsightCardVertical item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
                  </ScrollAnimated>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Professionals CTA */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ScrollAnimated>
            <p className="font-montserrat text-sm tracking-widest uppercase text-secondary mb-3">שירותי פרימיום</p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground mb-6">בעלי מקצוע מומלצים</h2>
            <div className="w-16 h-px bg-secondary mx-auto mb-8" />
            <p className="text-muted-foreground mb-10 leading-relaxed font-montserrat max-w-xl mx-auto">
              רשימת בעלי המקצוע המומלצים שלנו — שיפוצניקים, חשמלאים, אינסטלטורים ועוד. כל מי שצריך כשמתנהלים עם נכס.
            </p>
            <button
              onClick={() => navigate("/professionals/shared")}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-10 py-3.5 font-montserrat text-sm tracking-widest uppercase hover:bg-secondary/90 transition-colors"
            >
              לרשימת בעלי המקצוע
              <ArrowLeft className="w-4 h-4" />
            </button>
          </ScrollAnimated>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default HebrewInsights;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import FullScreenHero from "@/components/FullScreenHero";
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

const InsightCard = ({ item, onClick }: { item: Insight; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group text-right w-full bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border/30"
  >
    {item.image_url && (
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={item.image_url}
          alt={item.title_he || ""}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
      </div>
    )}
    <div className="p-6">
      {item.category && (
        <span className="text-xs font-semibold text-secondary tracking-widest uppercase font-montserrat">
          {item.category}
        </span>
      )}
      <h3 className="text-lg font-normal text-foreground mt-2 mb-3 line-clamp-2 group-hover:text-secondary transition-colors font-playfair tracking-wide">
        {item.title_he}
      </h3>
      {item.summary_he && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {item.summary_he}
        </p>
      )}
      <div className="flex items-center gap-1 mt-5 text-secondary text-sm font-medium font-montserrat tracking-wide">
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
        backgroundImage="/images/tel-aviv-aerial.jpg"
        backgroundAlt="תובנות נדל״ן תל אביב"
        minHeight="50vh"
      />

      {/* Articles Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">מאמרים ועדכונים</p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">כתבות אחרונות</h2>
            <div className="w-16 h-px bg-secondary mx-auto mt-5" />
          </div>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-80" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {articles.map((item) => (
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-px bg-border mx-auto mb-6" />
              <p className="font-playfair text-xl text-muted-foreground italic">כתבות חדשות יפורסמו בקרוב</p>
              <div className="w-16 h-px bg-border mx-auto mt-6" />
            </div>
          )}
        </div>
      </section>

      {/* Guides Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="font-montserrat text-sm tracking-widest uppercase text-muted-foreground mb-3">ידע מעשי</p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide text-foreground">מדריכים</h2>
            <div className="w-16 h-px bg-secondary mx-auto mt-5" />
          </div>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted/30 animate-pulse h-80" />
              ))}
            </div>
          ) : guides.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {guides.map((item) => (
                <InsightCard key={item.id} item={item} onClick={() => navigate(`/he/insights/${item.id}`)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-px bg-border mx-auto mb-6" />
              <p className="font-playfair text-xl text-muted-foreground italic">מדריכים חדשים יפורסמו בקרוב</p>
              <div className="w-16 h-px bg-border mx-auto mt-6" />
            </div>
          )}
        </div>
      </section>

      {/* Professionals CTA */}
      <section className="py-24 bg-gradient-to-b from-foreground to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="font-montserrat text-sm tracking-widest uppercase text-secondary mb-3">שירותי פרימיום</p>
          <h2 className="font-playfair text-3xl sm:text-4xl font-normal tracking-wide mb-6">בעלי מקצוע מומלצים</h2>
          <div className="w-16 h-px bg-secondary mx-auto mb-8" />
          <p className="text-primary-foreground/80 mb-10 leading-relaxed font-montserrat max-w-xl mx-auto">
            רשימת בעלי המקצוע המומלצים שלנו — שיפוצניקים, חשמלאים, אינסטלטורים ועוד. כל מי שצריך כשמתנהלים עם נכס.
          </p>
          <button
            onClick={() => navigate("/professionals/shared")}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-10 py-3.5 font-montserrat text-sm tracking-widest uppercase hover:bg-secondary/90 transition-colors"
          >
            לרשימת בעלי המקצוע
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </section>

      <HebrewFooter />
    </div>
  );
};

export default HebrewInsights;

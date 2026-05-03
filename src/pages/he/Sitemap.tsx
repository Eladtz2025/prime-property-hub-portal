import { Link } from "react-router-dom";
import { Map, Home, Building2, MapPin, FileText, Languages } from "lucide-react";
import { useEffect } from "react";

interface SitemapItem {
  label: string;
  path: string;
}

interface SitemapSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SitemapItem[];
}

const sections: SitemapSection[] = [
  {
    title: "עמודים ראשיים",
    icon: Home,
    items: [
      { label: "דף הבית", path: "/he" },
      { label: "השכרות", path: "/he/rentals" },
      { label: "מכירות", path: "/he/sales" },
      { label: "ניהול נכסים", path: "/he/management" },
      { label: "פרויקטים חדשים", path: "/he/new-developments" },
      { label: "תובנות ומאמרים", path: "/he/insights" },
      { label: "אודות", path: "/he/about" },
      { label: "צור קשר", path: "/he/contact" },
    ],
  },
  {
    title: "שכונות",
    icon: MapPin,
    items: [
      { label: "כל השכונות", path: "/he/neighborhoods" },
      { label: "רוטשילד", path: "/he/neighborhoods/rothschild" },
      { label: "נווה צדק", path: "/he/neighborhoods/neve-tzedek" },
      { label: "פלורנטין", path: "/he/neighborhoods/florentin" },
      { label: "דיזנגוף", path: "/he/neighborhoods/dizengoff" },
      { label: "צפון ישן", path: "/he/neighborhoods/old-north" },
    ],
  },
  {
    title: "טפסים ושירותים",
    icon: FileText,
    items: [
      { label: "טופס לקוח / ליד", path: "/client-intake" },
      { label: "בעלי מקצוע מומלצים", path: "/professionals/shared" },
    ],
  },
  {
    title: "שפות",
    icon: Languages,
    items: [
      { label: "English Sitemap", path: "/en/sitemap" },
      { label: "Home (English)", path: "/en" },
    ],
  },
];

const HebrewSitemap = () => {
  useEffect(() => {
    document.title = "מפת האתר | City Market Properties";
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-luxury text-luxury-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Map className="h-10 w-10 mx-auto mb-4 text-secondary" />
          <h1 className="font-playfair text-4xl md:text-5xl font-light mb-2">
            מפת האתר
          </h1>
          <p className="text-sm tracking-[0.3em] text-luxury-foreground/70">
            SITEMAP
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-card border border-secondary/30 rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-secondary/20">
                  <Icon className="h-5 w-5 text-secondary" />
                  <h2 className="font-playfair text-xl md:text-2xl font-normal text-foreground">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className="flex items-center justify-between gap-3 text-sm hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded transition-colors group"
                      >
                        <span className="text-foreground group-hover:text-secondary transition-colors">
                          {item.label}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground/70 ltr:text-left rtl:text-right" dir="ltr">
                          {item.path}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          © {new Date().getFullYear()} City Market Properties
        </p>
      </div>
    </div>
  );
};

export default HebrewSitemap;

import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const HebrewFooter = () => {
  const currentYear = new Date().getFullYear();

  return <footer className="bg-foreground text-background" dir="rtl">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info - Right in RTL */}
          <div className="text-right">
            <div className="mb-4">
              <h3 className="text-2xl font-bold tracking-wide">
                CITY MARKET
              </h3>
              <p className="text-xs text-background/70 tracking-widest">
                Properties
              </p>
            </div>
            <p className="text-sm text-background/70 mb-6">
              מומחים בתיווך נדל"ן, השכרה, מכירה וניהול נכסים בתל אביב.
            </p>
            <div className="flex gap-3 justify-start">
              <a href="https://www.instagram.com/citymarket/" target="_blank" rel="noopener noreferrer" className="hover:text-background/90 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/Ctmarket" target="_blank" rel="noopener noreferrer" className="hover:text-background/90 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="text-right">
            <h4 className="text-sm tracking-widest uppercase mb-4 font-semibold">
              שירותים
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <Link to="/he/sales" className="block hover:text-background transition-colors">מכירות</Link>
              <Link to="/he/rentals" className="block hover:text-background transition-colors">השכרות</Link>
              <Link to="/he/management" className="block hover:text-background transition-colors">ניהול נכסים</Link>
              <Link to="/he/new-developments" className="block hover:text-background transition-colors">פרויקטים חדשים</Link>
              <Link to="/he/insights" className="block hover:text-background transition-colors">תובנות</Link>
            </div>
          </div>

          {/* Areas */}
          <div className="text-right">
            <h4 className="text-sm tracking-widest uppercase mb-4 font-semibold">
              אזורים
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <Link to="/he/neighborhoods/neve-tzedek" className="block hover:text-background transition-colors">נווה צדק</Link>
              <Link to="/he/neighborhoods/rothschild" className="block hover:text-background transition-colors">רוטשילד</Link>
              <Link to="/he/neighborhoods/old-north" className="block hover:text-background transition-colors">הצפון הישן</Link>
              <Link to="/he/neighborhoods/florentin" className="block hover:text-background transition-colors">פלורנטין</Link>
            </div>
          </div>

          {/* Contact - Left in RTL */}
          <div className="text-right">
            <h4 className="text-sm tracking-widest uppercase mb-4 font-semibold">
              יצירת קשר
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2 justify-start">
                <Phone className="h-4 w-4" />
                <a href="tel:+972545503055" className="hover:text-background transition-colors">
                  054-550-3055
                </a>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <Mail className="h-4 w-4" />
                <a href="mailto:citymarketlv@gmail.com" className="hover:text-background transition-colors">
                  citymarketlv@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <MapPin className="h-4 w-4" />
                <span>תל אביב, ישראל</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Links Bar */}
        <div className="border-t border-background/20 pt-6 mb-6">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-background/60">
            <Link to="/he" className="hover:text-background transition-colors">בית</Link>
            <span className="text-background/30">|</span>
            <Link to="/he/about" className="hover:text-background transition-colors">אודות</Link>
            <span className="text-background/30">|</span>
            <Link to="/he/contact" className="hover:text-background transition-colors">צור קשר</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-background/50">
            © {currentYear} City Market Properties. כל הזכויות שמורות.{" "}
            <span
              onClick={() => navigate('/he/sitemap')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/he/sitemap'); }}
              className="underline hover:text-background transition-colors cursor-pointer"
            >
              מפת האתר
            </span>
          </p>
        </div>
      </div>
    </footer>;
};

export default HebrewFooter;

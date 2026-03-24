import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail, Instagram, Facebook } from "lucide-react";

const EnglishHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isPropertyPage = location.pathname.includes('/en/property/');

  useEffect(() => {
    const handleScroll = () => {
      const isHomePage = location.pathname === '/en';
      const scrollThreshold = isPropertyPage ? 200 : (isHomePage ? window.innerHeight : 150);
      const progress = Math.min(window.scrollY / scrollThreshold, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isPropertyPage]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navItems = [
    { label: "Home", path: "/en" },
    { label: "Property Management", path: "/en/management" },
    { label: "New Projects", path: "/en/new-developments" },
    { label: "Neighborhoods", path: "/en/neighborhoods" },
    { label: "About Us", path: "/en/about" },
    { label: "Contact", path: "/en/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isScrolled = scrollProgress > 0.5;

  const iconColor = menuOpen ? '#ffffff' : (isScrolled ? 'hsl(var(--foreground))' : '#ffffff');
  const iconFilter = menuOpen ? 'none' : (isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16">
        {/* Dark gradient for property pages when not scrolled */}
        {isPropertyPage && !menuOpen && (
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent transition-opacity duration-300"
            style={{ opacity: 1 - scrollProgress }}
          />
        )}
        
        {/* Gradual white background — hidden when menu open */}
        {!menuOpen && (
          <div 
            className="absolute inset-0 bg-white shadow-md transition-opacity duration-300"
            style={{ opacity: scrollProgress }}
          />
        )}
        
        <div className="container mx-auto px-4 relative h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left: Logo */}
            <button
              onClick={() => { navigate("/en"); setMenuOpen(false); }}
              className="transition-transform duration-200 hover:scale-105 z-10"
            >
              <img 
                src="/images/city-market-icon.png" 
                alt="City Market" 
                className="h-10 md:h-12 w-auto translate-y-1 transition-all duration-300"
                style={{
                  filter: menuOpen ? 'brightness(0) invert(1)' : (isScrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'),
                }}
              />
            </button>

            {/* Right: Phone + Mail + Hamburger */}
            <div className="flex items-center gap-3 md:gap-4 z-10">
              <a
                href="tel:+972542284477"
                className="p-2 transition-all duration-300 hover:scale-110"
                style={{ color: iconColor, filter: iconFilter }}
                aria-label="Call us"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href="mailto:citymarketlv@gmail.com"
                className="p-2 transition-all duration-300 hover:scale-110"
                style={{ color: iconColor, filter: iconFilter }}
                aria-label="Email us"
              >
                <Mail className="w-5 h-5" />
              </a>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 transition-all duration-300 hover:scale-110"
                style={{ color: iconColor, filter: iconFilter }}
                aria-label="Menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu */}
      <div className={`fixed inset-0 z-40 bg-[#0a1628] flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Nav items */}
          <nav className="flex flex-col items-center gap-6 md:gap-8">
            {navItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className={`font-montserrat text-2xl md:text-3xl tracking-[0.15em] uppercase transition-all duration-500 hover:opacity-80 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{
                  transitionDelay: menuOpen ? `${index * 60}ms` : '0ms',
                }}
                style={{
                  color: isActive(item.path) ? '#c9a96e' : 'rgba(255,255,255,0.85)',
                  fontWeight: isActive(item.path) ? 600 : 300,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom: Social + contact info */}
          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <a href="https://www.facebook.com/Ctmarket" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/citymarket/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/50 text-xs md:text-sm tracking-wide">
              <a href="mailto:citymarketlv@gmail.com" className="hover:text-white/80 transition-colors">citymarketlv@gmail.com</a>
              <span className="hidden md:inline">·</span>
              <a href="tel:+972542284477" className="hover:text-white/80 transition-colors">Tali: +972-54-228-4477</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnglishHeader;

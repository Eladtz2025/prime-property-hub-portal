import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const EnglishHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Use different scroll thresholds based on the page
      const isHomePage = location.pathname === '/en';
      const scrollThreshold = isHomePage ? window.innerHeight : 150;
      const progress = Math.min(window.scrollY / scrollThreshold, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const leftNavItems = [
    { label: "Home", path: "/en" },
    { label: "Management", path: "/en/management" },
    { label: "New Developments", path: "/en/new-developments" },
  ];

  const rightNavItems = [
    { label: "Neighborhoods", path: "/en/neighborhoods" },
    { label: "About Us", path: "/en/about" },
    { label: "Contact", path: "/en/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const isScrolled = scrollProgress > 0.5;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Gradual white background */}
      <div 
        className="absolute inset-0 bg-white shadow-md transition-opacity duration-300"
        style={{ opacity: scrollProgress }}
      />
      
      <div className="container mx-auto px-4 relative h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo - Always visible */}
          <button
            onClick={() => navigate("/en")}
            className="flex items-center gap-2 md:gap-3 transition-transform duration-200 hover:scale-105"
          >
            <img 
              src="/images/city-market-icon.png" 
              alt="City Market" 
              className="h-10 md:h-12 w-auto transition-all duration-300"
              style={{
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
            <div className="hidden md:flex items-baseline gap-2">
              <div 
                className="font-playfair text-xl md:text-3xl font-normal tracking-widest uppercase transition-all duration-300 whitespace-nowrap"
                style={{
                  color: isScrolled ? 'hsl(var(--foreground))' : '#ffffff',
                  textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                CITY MARKET
              </div>
              <div 
                className="font-montserrat text-[8px] md:text-xs tracking-widest transition-all duration-300"
                style={{
                  color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : 'rgba(255,255,255,0.9)',
                  textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Properties
              </div>
            </div>
          </button>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-8">
            {[...leftNavItems, ...rightNavItems].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative font-montserrat text-[15px] tracking-wide uppercase font-semibold transition-all duration-300"
                style={{
                  color: isScrolled 
                    ? (isActive(item.path) ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.7)')
                    : (isActive(item.path) ? '#ffffff' : 'rgba(255,255,255,0.9)'),
                  textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ position: 'relative' }}>
                  {item.label}
                  <span 
                    className="absolute w-full h-0.5 bottom-0 left-0 origin-left transition-transform duration-300"
                    style={{
                      backgroundColor: isScrolled ? 'hsl(var(--primary))' : '#ffffff',
                      transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                    }}
                  />
                </span>
              </button>
            ))}
          </nav>

          {/* Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="font-montserrat text-sm tracking-wide transition-all duration-300"
              style={{
                color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : 'rgba(255,255,255,0.9)',
                textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              עברית
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X 
                  className="w-6 h-6 transition-all duration-300" 
                  style={{
                    color: isScrolled ? 'hsl(var(--foreground))' : '#ffffff',
                    filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              ) : (
                <Menu 
                  className="w-6 h-6 transition-all duration-300"
                  style={{
                    color: isScrolled ? 'hsl(var(--foreground))' : '#ffffff',
                    filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-border">
            <div className="flex flex-col gap-2 py-4 px-4">
              {[...leftNavItems, ...rightNavItems].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-base tracking-wide uppercase text-left py-3 px-2 rounded-md transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default EnglishHeader;

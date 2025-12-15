import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, Facebook } from "lucide-react";

const EnglishHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isPropertyPage = location.pathname.includes('/en/property/');

  useEffect(() => {
    const handleScroll = () => {
      // Use different scroll thresholds based on the page
      const isHomePage = location.pathname === '/en';
      // Property pages use shorter threshold for quick transition
      const scrollThreshold = isPropertyPage ? 200 : (isHomePage ? window.innerHeight : 150);
      const progress = Math.min(window.scrollY / scrollThreshold, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isPropertyPage]);

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
      {/* Dark gradient for property pages when not scrolled */}
      {isPropertyPage && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent transition-opacity duration-300"
          style={{ opacity: 1 - scrollProgress }}
        />
      )}
      
      {/* Gradual white background */}
      <div 
        className="absolute inset-0 bg-white shadow-md transition-opacity duration-300"
        style={{ opacity: scrollProgress }}
      />
      
      <div className="container mx-auto px-4 relative h-full">
        <div className="grid grid-cols-3 items-center h-full">
          {/* Left Navigation with Facebook icon */}
          <nav className="hidden lg:flex items-center gap-6 justify-start">
            {/* Facebook icon on far left */}
            <a
              href="https://www.facebook.com/Ctmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80 mr-2"
              style={{
                color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : '#ffffff',
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              <Facebook className="w-5 h-5" />
            </a>
            
            {leftNavItems.map((item) => (
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

          {/* Center Logo - Absolute Center */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/en")}
              className="transition-transform duration-200 hover:scale-105"
            >
              <img 
                src="/images/city-market-icon.png" 
                alt="City Market" 
                className="h-10 md:h-12 w-auto translate-y-1 transition-all duration-300"
                style={{
                  filter: isScrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }}
              />
            </button>
          </div>

          {/* Right Navigation with Instagram icon */}
          <nav className="hidden lg:flex items-center gap-6 justify-end">
            {rightNavItems.map((item) => (
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
            
            {/* Instagram icon on far right */}
            <a
              href="https://www.instagram.com/citymarket/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80 ml-2"
              style={{
                color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : '#ffffff',
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              <Instagram className="w-5 h-5" />
            </a>
          </nav>

          {/* Mobile Menu Button with Social Icons */}
          <div className="fixed right-4 top-4 flex items-center gap-3 z-50 lg:hidden">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
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
            
            {/* Social Icons next to hamburger */}
            <a
              href="https://www.facebook.com/Ctmarket"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80"
              style={{
                color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : '#ffffff',
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/citymarket/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 hover:scale-110 hover:opacity-80"
              style={{
                color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : '#ffffff',
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              <Instagram className="w-5 h-5" />
            </a>
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

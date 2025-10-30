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
      // Use a smaller threshold that works for both tall and short heroes
      const scrollThreshold = 150;
      const progress = Math.min(window.scrollY / scrollThreshold, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
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

          {/* Center Logo */}
          <button
            onClick={() => navigate("/en")}
            className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
          >
            <img 
              src="/images/city-market-icon.png" 
              alt="City Market" 
              className="h-10 md:h-12 w-auto translate-y-1 transition-all duration-300"
              style={{
                filter: isScrolled ? 'none' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
            <div className="text-center">
              <div 
                className="font-playfair text-2xl md:text-3xl font-normal tracking-widest uppercase transition-all duration-300"
                style={{
                  color: isScrolled ? 'hsl(var(--foreground))' : '#ffffff',
                  textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                CITY MARKET
              </div>
              <div 
                className="font-montserrat text-[10px] md:text-xs tracking-widest transition-all duration-300"
                style={{
                  color: isScrolled ? 'hsl(var(--foreground) / 0.7)' : 'rgba(255,255,255,0.9)',
                  textShadow: isScrolled ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Properties
              </div>
            </div>
          </button>

          {/* Right Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
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
          <nav className="lg:hidden py-6 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {[...leftNavItems, ...rightNavItems].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-[15px] tracking-wide uppercase text-left py-2 transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-primary font-medium"
                      : "text-foreground/70 hover:text-primary"
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

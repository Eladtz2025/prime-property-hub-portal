import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const EnglishHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/en" },
    { label: "Buy", path: "/en/sales" },
    { label: "Rent", path: "/en/rentals" },
    { label: "New Developments", path: "/en/new-developments" },
    { label: "Neighborhoods", path: "/en/neighborhoods" },
    { label: "About", path: "/en/about" },
    { label: "Contact", path: "/en/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => navigate("/en")}
            className="font-playfair text-2xl md:text-3xl font-normal tracking-widest uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          >
            CITY MARKET
            <div className="text-xs font-montserrat tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              Luxury Real Estate
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`font-montserrat text-sm tracking-wide uppercase transition-colors duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${
                  isActive(item.path)
                    ? "text-white font-medium"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="font-montserrat text-sm tracking-wide text-white/90 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            >
              עברית
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              ) : (
                <Menu className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-sm tracking-wide uppercase text-left py-2 transition-colors duration-200 ${
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

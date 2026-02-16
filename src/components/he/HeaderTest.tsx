import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const HeaderTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rightNavItems = [
    { label: "אודות", path: "/he/about" },
    { label: "בניינים חדשים", path: "/he/new-developments" },
  ];

  const leftNavItems = [
    { label: "הזמנת יעוץ", path: "/he/contact" },
    { label: "טופס חיפוש דירה", path: "/he/search-form", bordered: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  const textColor = '#000';
  const activeColor = 'hsl(var(--primary))';
  const mutedColor = 'hsl(var(--foreground))';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-border/20" dir="rtl">
      <div className="container mx-auto px-6 relative h-full">
        <div className="grid grid-cols-3 items-center h-full">
          {/* Right Navigation (RTL) */}
          <nav className="hidden lg:flex items-center gap-8 justify-start -mr-4">
            {rightNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative text-[14px] tracking-[0.08em] font-normal transition-all duration-300"
                style={{
                  color: isActive(item.path) ? activeColor : mutedColor,
                  fontFamily: "'Heebo', sans-serif",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/he")}
              className="transition-transform duration-200 hover:scale-105 tracking-[0.35em] uppercase font-normal"
              style={{ color: textColor, fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 400 }}
            >
              CITY MARKET
            </button>
          </div>

          {/* Left Navigation (RTL) */}
          <nav className="hidden lg:flex items-center gap-8 justify-end -ml-4">
            {leftNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative text-[14px] tracking-[0.08em] font-normal transition-all duration-300 ${
                  (item as any).bordered ? 'border border-foreground px-5 py-1.5 hover:bg-primary hover:text-white hover:border-primary' : ''
                }`}
                style={{
                  color: isActive(item.path) ? activeColor : mutedColor,
                  fontFamily: "'Heebo', sans-serif",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" style={{ color: textColor }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: textColor }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-border" dir="rtl">
            <div className="flex flex-col gap-2 py-4 px-4">
              {[...rightNavItems, ...leftNavItems].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-montserrat text-sm tracking-[0.15em] uppercase text-right py-3 px-2 rounded-md transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-foreground hover:text-primary hover:bg-accent font-normal"
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

export default HeaderTest;

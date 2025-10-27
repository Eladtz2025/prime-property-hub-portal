import { useNavigate } from "react-router-dom";

const HebrewFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4 tracking-wide">
              CITY MARKET
            </h3>
            <p className="text-sm text-background/70">
              נדל"ן
            </p>
          </div>
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">
              קישורים מהירים
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/')}
              >
                בית
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/sales')}
              >
                מכירות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/rentals')}
              >
                השכרות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/neighborhoods')}
              >
                שכונות
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">
              החברה
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/about')}
              >
                אודות
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/contact')}
              >
                צור קשר
              </p>
              <p 
                className="cursor-pointer hover:text-background transition-colors"
                onClick={() => navigate('/management')}
              >
                ניהול נכסים
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm tracking-widest uppercase mb-4">
              יצירת קשר
            </h4>
            <div className="space-y-2 text-sm text-background/70">
              <p>תל אביב, ישראל</p>
              <p>info@citymarket.co.il</p>
              <p>054-550-3055</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center">
          <p className="text-sm text-background/70">
            © 2024 City Market Real Estate. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HebrewFooter;

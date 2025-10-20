import { WatermarkProcessor } from '@/components/WatermarkProcessor';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const WatermarkManager = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="container max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">ניהול Watermark</h1>
          <p className="text-lg text-muted-foreground">
            כלי לעיבוד תמונות קיימות והוספת watermark אוטומטי
          </p>
          <Link to="/admin-dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה לדשבורד
            </Button>
          </Link>
        </div>

        <WatermarkProcessor />

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">מידע נוסף</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>תמונות מקוריות:</strong> נשמרות ב-bucket "property-images-original"
            </p>
            <p>
              <strong>תמונות עם watermark:</strong> נמצאות ב-bucket "property-images"
            </p>
            <p>
              <strong>העלאות חדשות:</strong> כל תמונה חדשה שתועלה תקבל watermark אוטומטית והמקור יישמר
            </p>
            <p>
              <strong>הגדרות watermark:</strong> שקיפות 40%, גודל 15% מרוחב התמונה, מיקום: פינה ימנית תחתונה
            </p>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="/watermark-demo.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            צפה בדוגמאות Watermark →
          </a>
        </div>
      </div>
    </div>
  );
};

export default WatermarkManager;

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { removeBackground, loadImageFromSrc } from '@/utils/removeLogoBackground';
import logoImage from '@/assets/city-market-logo.png';

const LogoBackgroundRemover = () => {
  const [processing, setProcessing] = useState(false);
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);

  const handleRemoveBackground = async () => {
    setProcessing(true);
    try {
      // Load the logo image
      const img = await loadImageFromSrc(logoImage);
      
      // Remove background
      const blob = await removeBackground(img);
      
      // Create URL for the new image
      const url = URL.createObjectURL(blob);
      setNewLogoUrl(url);
      
      // Download the new logo
      const link = document.createElement('a');
      link.href = url;
      link.download = 'city-market-logo-transparent.png';
      link.click();
      
    } catch (error) {
      console.error('Error processing logo:', error);
      alert('שגיאה בעיבוד הלוגו');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">הסרת רקע מהלוגו</h2>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">לוגו נוכחי:</p>
          <img src={logoImage} alt="Current Logo" className="mx-auto max-h-32" />
        </div>
        
        {newLogoUrl && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">לוגו חדש (שקוף):</p>
            <div className="bg-gray-200 p-4 rounded">
              <img src={newLogoUrl} alt="New Logo" className="mx-auto max-h-32" />
            </div>
          </div>
        )}
        
        <Button
          onClick={handleRemoveBackground}
          disabled={processing}
          className="w-full"
        >
          {processing ? 'מעבד...' : 'הסר רקע מהלוגו'}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          הלוגו החדש יורד אוטומטית. שמור אותו בתיקייה src/assets
        </p>
      </div>
    </div>
  );
};

export default LogoBackgroundRemover;

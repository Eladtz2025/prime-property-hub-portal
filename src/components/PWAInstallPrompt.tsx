import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if dismissed before
  if (localStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  if (!showInstallBanner && !isIOS) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary bg-primary/5 md:left-auto md:right-4 md:w-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">התקן את האפליקציה</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {isIOS 
            ? 'הוסף למסך הבית לחוויה משופרת'
            : 'קבל גישה מהירה וחוויה משופרת'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isIOS ? (
          <div className="text-sm text-muted-foreground">
            <p>להתקנה:</p>
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li>לחץ על כפתור השיתוף</li>
              <li>בחר "הוסף למסך הבית"</li>
              <li>לחץ "הוסף"</li>
            </ol>
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            התקן עכשיו
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
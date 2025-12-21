import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AdminPWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    if (standalone) return;

    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Switch manifest to admin version
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', '/admin-manifest.json');
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner for iOS after a delay
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('admin-pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      // Restore original manifest when leaving admin
      if (manifestLink) {
        manifestLink.setAttribute('href', '/manifest.json');
      }
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
    localStorage.setItem('admin-pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isStandalone) return null;
  if (localStorage.getItem('admin-pwa-install-dismissed')) return null;
  if (!showInstallBanner && !isIOS) return null;

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">התקן את האפליקציה</CardTitle>
          </div>
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
            ? 'הוסף למסך הבית לגישה מהירה לאדמין'
            : 'התקן את מערכת הניהול כאפליקציה לגישה מהירה'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isIOS ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">להתקנה ב-iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 mr-2">
              <li>לחץ על כפתור השיתוף <span className="inline-block">⬆️</span></li>
              <li>גלול ובחר "הוסף למסך הבית"</li>
              <li>לחץ "הוסף" בפינה הימנית העליונה</li>
            </ol>
            <p className="text-xs text-muted-foreground/70 mt-2">
              האפליקציה תיפתח ישירות לדף הניהול
            </p>
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full">
            <Download className="ml-2 h-4 w-4" />
            התקן עכשיו
          </Button>
        )}
      </CardContent>
    </Card>
  );
};


import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.99d4f02036e54778a578516b9e139943',
  appName: 'PrimePropertyAI',
  webDir: 'dist',
  server: {
    url: 'https://99d4f020-36e5-4778-a578-516b9e139943.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;

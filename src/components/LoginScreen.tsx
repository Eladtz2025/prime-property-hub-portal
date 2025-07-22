import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Eye, EyeOff } from 'lucide-react';
import { useMobileOptimization } from '../hooks/useMobileOptimization';

interface LoginScreenProps {
  onLogin: (credentials: { email: string; password: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { isMobile } = useMobileOptimization();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate loading time
    setTimeout(() => {
      onLogin(credentials);
      setIsLoading(false);
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* App Logo/Header */}
        <div className="text-center mb-10">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl border border-white/20">
            <Building className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">מערכת ניהול נכסים</h1>
          <p className="text-white/80 text-lg">היכנס למערכת כדי לנהל את הנכסים שלך</p>
        </div>

        <Card className="shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-white">התחברות</CardTitle>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white text-base font-semibold">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="text-left bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 rounded-xl h-12 text-base backdrop-blur-sm"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-white text-base font-semibold">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="text-left pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 rounded-xl h-12 text-base backdrop-blur-sm"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 rounded-lg"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-white/70" />
                    ) : (
                      <Eye className="h-4 w-4 text-white/70" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Demo credentials hint */}
              <div className="text-sm text-white/70 bg-white/5 rounded-xl p-4 text-center border border-white/10 backdrop-blur-sm">
                <p>להדגמה: השתמש בכל אימייל וסיסמה</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-blue-900 hover:bg-white/90 h-12 text-base font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                    <span>מתחבר למערכת...</span>
                  </div>
                ) : (
                  'התחבר למערכת'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-white/50 text-sm font-medium">
            © {new Date().getFullYear()} מערכת ניהול נכסים. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  );
};
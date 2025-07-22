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
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* App Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">מערכת ניהול נכסים</h1>
          <p className="text-white/80 text-sm">היכנס למערכת כדי לנהל את הנכסים שלך</p>
        </div>

        <Card className="shadow-elevated backdrop-blur-sm bg-white/95 border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">התחברות</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="text-left"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="text-left pl-10"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Demo credentials hint */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
                <p>להדגמה: השתמש בכל אימייל וסיסמה</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary border-0 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    מתחבר...
                  </div>
                ) : (
                  'התחבר למערכת'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-xs">
            © {new Date().getFullYear()} מערכת ניהול נכסים. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  );
};
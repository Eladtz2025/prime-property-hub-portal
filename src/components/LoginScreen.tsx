import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { signInWithEmail, signUp } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface LoginScreenProps {
  onLogin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);

  useEffect(() => {
    // קריאת פרמטרים מה-URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    const email = params.get('email');
    
    if (token) {
      setInviteToken(token);
      setIsSignUp(true); // מעבר אוטומטי להרשמה
      
      if (email) {
        setCredentials(prev => ({ ...prev, email }));
      }
      
      // טעינת פרטי ההזמנה
      loadInvitationDetails(token);
    }
  }, []);

  const loadInvitationDetails = async (token: string) => {
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();
      
    if (data) {
      setInvitedRole(data.role);
      toast({
        title: "הוזמנת להצטרף!",
        description: `הוזמנת כ${getRoleLabel(data.role)}`,
      });
    } else {
      toast({
        title: "קישור לא תקף",
        description: "ההזמנה פגה או כבר נוצלה",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (await import('@/constants/roleLabels')).getRoleLabel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { data, error } = await signUp(credentials.email, credentials.password, credentials.fullName);
        
        if (error) {
          setError(error.message);
          logger.error('Sign up error:', error);
          return;
        }

        logger.info('User signed up successfully');
        
        toast({
          title: "הרשמה הצליחה!",
          description: inviteToken 
            ? "החשבון נוצר והתפקיד שלך אושר אוטומטית" 
            : "נרשמת בהצלחה! החשבון שלך ממתין לאישור מנהל",
        });
        
        // אם יש token, אישרנו אוטומטית ב-trigger
        // עובר ל-login
        setIsSignUp(false);
        setCredentials(prev => ({ ...prev, password: '', fullName: '' }));
      } else {
        const { data, error } = await signInWithEmail(credentials.email, credentials.password);
        
        if (error) {
          setError(error.message);
          logger.error('Login error:', error);
          return;
        }

        if (data.user) {
          logger.info('User logged in successfully');
          
          toast({
            title: "התחברות הצליחה",
            description: "ברוך הבא למערכת ניהול הנכסים",
          });
          
          onLogin?.();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא צפויה';
      setError(errorMessage);
      logger.error('Unexpected auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-cyan-300/20 rounded-full blur-2xl"></div>
      </div>
      
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* App Logo/Header */}
        <div className="text-center mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg border border-white/20">
            <img 
              src="/images/city-market-logo.png" 
              alt="City Market" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">City Market</h1>
          <p className="text-white/80 text-sm">מערכת ניהול נכסים</p>
        </div>

        <Card className="shadow-xl backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-lg font-bold text-white">
              {isSignUp ? "הרשמה למערכת" : "התחברות"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-500/10 border-red-500/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white text-sm font-medium">שם מלא</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={credentials.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="שם מלא"
                    required={isSignUp}
                    className="text-right bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 rounded-lg h-10 backdrop-blur-sm"
                    dir="rtl"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="text-left bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 rounded-lg h-10 backdrop-blur-sm"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">סיסמה</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="text-left pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 rounded-lg h-10 backdrop-blur-sm"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 rounded-md"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-white/70" />
                    ) : (
                      <Eye className="h-4 w-4 text-white/70" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-blue-700 hover:bg-white/90 h-10 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full animate-spin" />
                    <span>{isSignUp ? "נרשם..." : "מתחבר..."}</span>
                  </div>
                ) : (
                  isSignUp ? "הירשם למערכת" : "התחבר למערכת"
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setCredentials({ email: '', password: '', fullName: '' });
                  }}
                  className="text-white/80 hover:text-white text-sm"
                >
                  {isSignUp ? "יש לך כבר חשבון? התחבר" : "אין לך חשבון? הירשם"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} City Market. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  );
};
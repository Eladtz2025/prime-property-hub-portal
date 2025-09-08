import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInvitationByToken, useInvitation } from '@/lib/owner-portal';
import type { PropertyInvitation } from '@/types/owner-portal';

export const OwnerInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<PropertyInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  React.useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('קישור הזמנה לא תקין');
    }
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const invitationData = await getInvitationByToken(token);
      if (invitationData) {
        setInvitation(invitationData);
      } else {
        setError('הזמנה לא תקינה או שפגה תוקפה');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('שגיאה בטעינת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      const { error } = await useInvitation(token, user.id);
      if (error) {
        setError('שגיאה בקבלת ההזמנה');
        console.error('Error accepting invitation:', error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/owner-dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('שגיאה בקבלת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">נדרשת התחברות</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              עליך להתחבר כדי לקבל את ההזמנה לניהול נכסים
            </p>
            <Button onClick={() => navigate('/login')}>
              התחבר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען הזמנה...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">ההזמנה התקבלה!</h2>
            <p className="text-green-700 mb-4">
              הרשאות הניהול שלך הופעלו בהצלחה
            </p>
            <p className="text-sm text-green-600">
              מעביר אותך לפורטל הניהול...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">שגיאה</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/')}>
              חזור לעמוד הראשי
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Building className="h-6 w-6" />
            הזמנה לניהול נכסים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <>
              <Alert>
                <AlertDescription>
                  הוזמנת לנהל {invitation.property_ids.length} נכסים במערכת ניהול הנכסים
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">פרטי ההזמנה:</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>מספר נכסים:</strong> {invitation.property_ids.length}</p>
                    <p><strong>תאריך הזמנה:</strong> {new Date(invitation.created_at).toLocaleDateString('he-IL')}</p>
                    <p><strong>תאריך תפוגה:</strong> {new Date(invitation.expires_at).toLocaleDateString('he-IL')}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">מה תקבל גישה אליו:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• ניהול פרטי הנכסים שלך</li>
                    <li>• מעקב אחר שוכרים וחוזי שכירות</li>
                    <li>• מעקב הכנסות והוצאות</li>
                    <li>• העלאת מסמכים ותמונות</li>
                    <li>• קבלת התראות והודעות</li>
                    <li>• דוחות פיננסיים מפורטים</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleAcceptInvitation}
                    disabled={loading}
                    className="flex-1"
                  >
                    קבל הזמנה
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    בטל
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
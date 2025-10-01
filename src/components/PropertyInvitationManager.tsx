import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  UserPlus, 
  Send, 
  Copy, 
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  AlertCircle,
  Search,
  Phone,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createPropertyInvitation } from '@/lib/owner-portal';
import type { DatabaseProperty, PropertyInvitation } from '@/types/owner-portal';

interface PropertyWithSelected extends DatabaseProperty {
  selected?: boolean;
}

export const PropertyInvitationManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyWithSelected[]>([]);
  const [invitations, setInvitations] = useState<PropertyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load properties
      const { data: propertiesData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propError) throw propError;

      // Load existing invitations
      const { data: invitationsData, error: invError } = await supabase
        .from('property_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      setProperties((propertiesData || []) as PropertyWithSelected[]);
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הנתונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim() || selectedProperties.length === 0 || !user) {
      toast({
        title: "שגיאה",
        description: "נא למלא אימייל ולבחור לפחות נכס אחד",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createPropertyInvitation(
        inviteEmail.trim(),
        selectedProperties,
        user.id
      );

      if (error) throw error;

      if (data) {
        const invitationUrl = `https://prime-property-hub-portal.vercel.app/owner-invitation?token=${data.invitation_token}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(invitationUrl);
        
        toast({
          title: "הזמנה נוצרה בהצלחה!",
          description: "קישור ההזמנה הועתק ללוח. שלח אותו לבעל הנכס.",
        });

        // Reset form
        setInviteEmail('');
        setSelectedProperties([]);
        
        // Reload invitations
        await loadData();
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת ההזמנה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = async (token: string) => {
    const invitationUrl = `https://prime-property-hub-portal.vercel.app/owner-invitation?token=${token}`;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "הועתק!",
        description: "קישור ההזמנה הועתק ללוח",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getInvitationStatus = (invitation: PropertyInvitation) => {
    if (invitation.used_at) {
      return { text: 'התקבל', color: 'bg-green-500', icon: CheckCircle };
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return { text: 'פג תוקף', color: 'bg-red-500', icon: AlertCircle };
    }
    
    return { text: 'ממתין', color: 'bg-yellow-500', icon: Clock };
  };

  // Filter properties based on search query
  const filteredProperties = properties.filter(property => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    return (
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.owner_name?.toLowerCase().includes(searchLower) ||
      property.owner_phone?.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Create New Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            הזמן בעל נכס חדש
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">כתובת אימייל של בעל הנכס</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>בחר נכסים להקצאה ({selectedProperties.length} נבחרו)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedProperties.length === properties.length ? 'בטל הכל' : 'בחר הכל'}
                  </Button>
                </div>
                
                {/* Search field */}
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חפש לפי כתובת, עיר, שם בעל נכס או טלפון..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {filteredProperties.map((property) => (
                    <div 
                      key={property.id}
                      className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted/50 rounded"
                    >
                      <Checkbox
                        id={property.id}
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handlePropertyToggle(property.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{property.address}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {property.city}
                            {property.rooms && (
                              <span className="mr-2">• {property.rooms} חדרים</span>
                            )}
                          </div>
                          {property.owner_name && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {property.owner_name}
                            </div>
                          )}
                          {property.owner_phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {property.owner_phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        property.status === 'occupied' ? 'default' :
                        property.status === 'vacant' ? 'destructive' : 'secondary'
                      }>
                        {property.status === 'occupied' ? 'מושכר' :
                         property.status === 'vacant' ? 'פנוי' : 'תחזוקה'}
                      </Badge>
                    </div>
                  ))}
                  
                  {filteredProperties.length === 0 && properties.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2" />
                      <p>לא נמצאו נכסים מתאימים לחיפוש</p>
                    </div>
                  )}
                  
                  {properties.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-8 w-8 mx-auto mb-2" />
                      <p>אין נכסים במערכת</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>איך זה עובד:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• יווצר קישור הזמנה ייחודי</li>
                    <li>• הקישור יועתק ללוח האוטומטית</li>
                    <li>• שלח את הקישור לבעל הנכס באימייל או וואטסאפ</li>
                    <li>• בעל הנכס יצטרך להתחבר כדי לקבל את ההזמנה</li>
                    <li>• ההזמנה תפוג תוקף תוך 7 ימים</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {selectedProperties.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    נכסים שיוקצו ({selectedProperties.length})
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    {selectedProperties.slice(0, 3).map(id => {
                      const property = properties.find(p => p.id === id);
                      return property ? (
                        <div key={id}>• {property.address}, {property.city}</div>
                      ) : null;
                    })}
                    {selectedProperties.length > 3 && (
                      <div>ועוד {selectedProperties.length - 3} נכסים...</div>
                    )}
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSendInvitation}
                disabled={loading || !inviteEmail.trim() || selectedProperties.length === 0}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                צור הזמנה
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            הזמנות קיימות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2" />
              <p>אין הזמנות קיימות</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const status = getInvitationStatus(invitation);
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={invitation.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{invitation.email}</span>
                          <Badge className={`${status.color} text-white`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.text}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <div>נכסים: {invitation.property_ids.length}</div>
                          <div>נוצר: {new Date(invitation.created_at).toLocaleDateString('he-IL')}</div>
                          <div>פוקע: {new Date(invitation.expires_at).toLocaleDateString('he-IL')}</div>
                          {invitation.used_at && (
                            <div className="text-green-600">
                              התקבל: {new Date(invitation.used_at).toLocaleDateString('he-IL')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!invitation.used_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInvitationLink(invitation.invitation_token)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          העתק קישור
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

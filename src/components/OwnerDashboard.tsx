import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Home,
  Bell,
  FileText,
  Image,
  Receipt,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOwnerDashboardStats, getOwnerProperties, getOwnerNotifications } from '@/lib/owner-portal';
import type { OwnerDashboardStats, PropertyWithTenant, Notification } from '@/types/owner-portal';
import { OwnerPropertyCard } from './OwnerPropertyCard';
import { PropertyEditModal } from './PropertyEditModal';
import { QuickRentPaymentModal } from './QuickRentPaymentModal';
import { NotificationPanel } from './NotificationPanel';
import { OwnerFinancialDashboard } from './OwnerFinancialDashboard';
import { OwnerDocuments } from './OwnerDocuments';
import { MarketInsights } from './MarketInsights';
import { PropertyGallery } from './PropertyGallery';
import { ExpensesView } from './ExpensesView';

export const OwnerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [properties, setProperties] = useState<PropertyWithTenant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'documents' | 'notifications' | 'gallery' | 'expenses'>('overview');
  const [editingProperty, setEditingProperty] = useState<PropertyWithTenant | null>(null);
  const [paymentProperty, setPaymentProperty] = useState<PropertyWithTenant | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [statsData, propertiesData, notificationsData] = await Promise.all([
        getOwnerDashboardStats(user.id),
        getOwnerProperties(user.id),
        getOwnerNotifications(user.id)
      ]);

      setStats(statsData);
      setProperties(propertiesData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-500';
      case 'vacant': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  if (loading) {
    return (
      <div className={`${profile?.role !== 'super_admin' ? 'min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5' : ''} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`w-full ${profile?.role !== 'super_admin' ? 'min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-3 md:p-4 pb-20 md:pb-4' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">ברוך הבא לפורטל בעלי הנכסים</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {profile?.role === 'super_admin' ? 'נהל את הנכסים שלך בקלות ובמהירות' : 'הנכסים שלך'}
          </p>
        </div>

        {/* Property Owners View - All content on same page */}
        {profile?.role === 'property_owner' && (
          <div className="space-y-8">
            {/* Main Tabs for Property Details */}
            <Tabs dir="rtl" defaultValue="properties" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3" dir="rtl">
                <TabsTrigger value="properties" className="gap-2">
                  <Building className="h-4 w-4" />
                  הנכסים שלי
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <Image className="h-4 w-4" />
                  תמונות
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  הוצאות
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <OwnerPropertyCard 
                      key={property.id} 
                      property={property}
                      onEdit={setEditingProperty}
                      onQuickPayment={setPaymentProperty}
                    />
                  ))}
                </div>

                {properties.length === 0 && (
                  <Card className="border-dashed border-2 border-muted-foreground/25">
                    <CardContent className="text-center py-12">
                      <Building className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-4">אין נכסים כרגע</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        הנכסים שלך יופיעו כאן לאחר שהמנהל יקצה אותם אליך
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="gallery">
                <PropertyGallery properties={properties} />
              </TabsContent>

              <TabsContent value="expenses">
                <ExpensesView properties={properties} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Super Admin View - All content on same page */}
        {profile?.role === 'super_admin' && (
          <div className="space-y-8">
            {/* Main Tabs */}
            <Tabs dir="rtl" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5" dir="rtl">
                <TabsTrigger value="overview" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">סקירה</span>
                </TabsTrigger>
                <TabsTrigger value="properties" className="gap-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">נכסים</span>
                  <Badge variant="secondary" className="text-xs h-5">{properties.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">תמונות</span>
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">הוצאות</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">מסמכים</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {stats && (
                  <div className="space-y-6">
                    <OwnerFinancialDashboard statsData={stats} properties={properties} />

                    {stats.properties_needing_attention > 0 && (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="h-5 w-5" />
                            נכסים הדורשים תשומת לב
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-yellow-700">
                            יש לך {stats.properties_needing_attention} נכסים הדורשים תשומת לב מיוחדת
                          </p>
                          <Button 
                            className="mt-3" 
                            variant="outline"
                            onClick={() => setActiveTab('properties')}
                          >
                            בדוק נכסים
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Market Insights Section */}
                    <div className="mt-8">
                      <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                          <BarChart3 className="h-7 w-7 text-primary" />
                          מדדי השוק
                        </h2>
                        <p className="text-muted-foreground">
                          תובנות ונתונים כלליים על שוק הנדל"ן
                        </p>
                      </div>
                      <MarketInsights />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="properties">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">הנכסים שלי</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <OwnerPropertyCard 
                        key={property.id} 
                        property={property}
                        onEdit={setEditingProperty}
                        onQuickPayment={setPaymentProperty}
                      />
                    ))}
                  </div>

                  {properties.length === 0 && (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                      <CardContent className="text-center py-12">
                        <Building className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-4">אין נכסים כרגע</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          הנכסים שלך יופיעו כאן לאחר שהמנהל יקצה אותם אליך
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gallery">
                <PropertyGallery properties={properties} />
              </TabsContent>

              <TabsContent value="expenses">
                <ExpensesView properties={properties} />
              </TabsContent>

              <TabsContent value="documents">
                <OwnerDocuments 
                  properties={properties.map(p => ({
                    property_id: p.id,
                    property_address: p.address
                  }))}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingProperty && (
        <PropertyEditModal
          property={{
            id: editingProperty.id,
            address: editingProperty.address,
            city: editingProperty.city,
            ownerName: editingProperty.owner_name || '',
            ownerPhone: editingProperty.owner_phone || '',
            status: editingProperty.status,
            contactStatus: editingProperty.contact_status,
            contactAttempts: editingProperty.contact_attempts,
            propertySize: editingProperty.property_size,
            floor: editingProperty.floor,
            rooms: editingProperty.rooms,
            notes: editingProperty.notes,
            lastContactDate: editingProperty.last_contact_date,
            contactNotes: editingProperty.contact_notes,
            tenantName: editingProperty.tenant?.name,
            tenantPhone: editingProperty.tenant?.phone,
            monthlyRent: editingProperty.tenant?.monthly_rent || editingProperty.monthly_rent,
            leaseStartDate: editingProperty.tenant?.lease_start_date,
            leaseEndDate: editingProperty.tenant?.lease_end_date,
          }}
          isOpen={true}
          onClose={() => setEditingProperty(null)}
          onSave={loadDashboardData}
        />
      )}

      {paymentProperty && (
        <QuickRentPaymentModal
          property={paymentProperty}
          isOpen={true}
          onClose={() => setPaymentProperty(null)}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
};
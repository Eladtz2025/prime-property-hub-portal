import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Home,
  Bell,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOwnerDashboardStats, getOwnerProperties, getOwnerNotifications } from '@/lib/owner-portal';
import type { OwnerDashboardStats, PropertyWithTenant, Notification } from '@/types/owner-portal';
import { OwnerPropertyCard } from './OwnerPropertyCard';
import { PropertyEditModal } from './PropertyEditModal';
import { QuickRentPaymentModal } from './QuickRentPaymentModal';
import { NotificationPanel } from './NotificationPanel';
import { AddPropertyFlow } from './AddPropertyFlow';
import { OwnerFinancialDashboard } from './OwnerFinancialDashboard';
import { OwnerDocuments } from './OwnerDocuments';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [properties, setProperties] = useState<PropertyWithTenant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'documents' | 'notifications'>('overview');
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ברוך הבא לפורטל בעלי הנכסים</h1>
          <p className="text-muted-foreground">נהל את הנכסים שלך בקלות ובמהירות</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            סקירה כללית
          </Button>
          <Button
            variant={activeTab === 'properties' ? 'default' : 'outline'}
            onClick={() => setActiveTab('properties')}
            className="gap-2"
          >
            <Building className="h-4 w-4" />
            הנכסים שלי
            <Badge variant="secondary">{properties.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'default' : 'outline'}
            onClick={() => setActiveTab('documents')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            מסמכים
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notifications')}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            התראות
            <Badge variant="destructive">
              {notifications.filter(n => !n.is_read).length}
            </Badge>
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Date Range Selector */}
            <OwnerFinancialDashboard statsData={stats} properties={properties} />

            {/* Alerts */}
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
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
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
                  <h3 className="text-2xl font-bold mb-4">התחל לנהל את הנכסים שלך!</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    הוסף את הנכס הראשון שלך כדי להתחיל לעקוב אחר ההכנסות, הוצאות ולנהל דיירים בקלות.
                  </p>
                  <div className="space-y-3">
                    <AddPropertyFlow onPropertyAdded={loadDashboardData} />
                    <p className="text-sm text-muted-foreground">
                      ⚡ תוכל להוסיף מספר נכסים, לעקוב אחר דיירים ולנהל את הכל במקום אחד
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <OwnerDocuments 
            properties={properties.map(p => ({
              property_id: p.id,
              property_address: p.address
            }))}
          />
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <NotificationPanel 
            notifications={notifications}
            onMarkAsRead={(id) => {
              setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
              );
            }}
          />
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
            tenantEmail: editingProperty.tenant?.email,
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
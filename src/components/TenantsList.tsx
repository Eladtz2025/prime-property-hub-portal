import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search,
  Building,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Edit,
  MessageSquare
} from 'lucide-react';
import { useTenantData } from '@/hooks/useTenantData';
import { TenantCard } from './TenantCard';
import { TenantManagementModal } from './TenantManagementModal';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  monthly_rent?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  is_active: boolean;
  property_id: string;
}

export const TenantsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();
  const [modalPropertyId, setModalPropertyId] = useState<string>('');
  const [modalPropertyAddress, setModalPropertyAddress] = useState<string>('');
  
  const { 
    propertiesWithTenants, 
    isLoading, 
    isError, 
    refetch 
  } = useTenantData();
  const { toast } = useToast();

  // Get all tenants across properties
  const allTenants = propertiesWithTenants.flatMap(property => 
    property.tenants.map(tenant => ({
      ...tenant,
      propertyAddress: `${property.address}, ${property.city}`
    }))
  );

  // Filter tenants based on search and property selection
  const filteredTenants = allTenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone?.includes(searchTerm) ||
                         tenant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProperty = selectedProperty === 'all' || 
                           tenant.property_id === selectedProperty;
    
    return matchesSearch && matchesProperty;
  });

  const handleAddTenant = (propertyId: string, propertyAddress: string) => {
    setSelectedTenant(undefined);
    setModalPropertyId(propertyId);
    setModalPropertyAddress(propertyAddress);
    setIsModalOpen(true);
  };

  const handleEditTenant = (tenant: Tenant) => {
    const property = propertiesWithTenants.find(p => p.id === tenant.property_id);
    setSelectedTenant(tenant);
    setModalPropertyId(tenant.property_id);
    setModalPropertyAddress(property ? `${property.address}, ${property.city}` : '');
    setIsModalOpen(true);
  };

  const handleManageTenant = (tenant: Tenant) => {
    const property = propertiesWithTenants.find(p => p.id === tenant.property_id);
    setSelectedTenant(tenant);
    setModalPropertyId(tenant.property_id);
    setModalPropertyAddress(property ? `${property.address}, ${property.city}` : '');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTenant(undefined);
    setModalPropertyId('');
    setModalPropertyAddress('');
  };

  const handleTenantUpdated = () => {
    refetch();
    toast({
      title: "הדייר עודכן בהצלחה!",
      description: "השינויים נשמרו במערכת"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען דיירים...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">שגיאה בטעינת הנתונים</div>
          <Button onClick={() => refetch()} variant="outline">
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{allTenants.length}</div>
                <div className="text-sm text-muted-foreground">סה"כ דיירים</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allTenants.filter(t => t.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">דיירים פעילים</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ₪{allTenants
                    .filter(t => t.is_active && t.monthly_rent)
                    .reduce((sum, t) => sum + (t.monthly_rent || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">הכנסה חודשית</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {propertiesWithTenants.filter(p => p.tenants.length === 0).length}
                </div>
                <div className="text-sm text-muted-foreground">נכסים פנויים</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">ניהול דיירים</CardTitle>
          <CardDescription className="text-right">
            נהל את כל הדיירים שלך במקום אחד
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="חפש דייר לפי שם, טלפון או אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-right"
            >
              <option value="all">כל הנכסים</option>
              {propertiesWithTenants.map(property => (
                <option key={property.id} value={property.id}>
                  {property.address}, {property.city}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Properties with Tenants */}
      <div className="space-y-6">
        {propertiesWithTenants.map(property => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => handleAddTenant(property.id, `${property.address}, ${property.city}`)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  הוסף דייר
                </Button>
                <div className="text-right">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {property.address}, {property.city}
                  </CardTitle>
                  <CardDescription>
                    {property.tenants.length} דיירים
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {property.tenants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.tenants
                    .filter(tenant => {
                      if (selectedProperty !== 'all' && selectedProperty !== property.id) return false;
                      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          tenant.phone?.includes(searchTerm) ||
                                          tenant.email?.toLowerCase().includes(searchTerm.toLowerCase());
                      return matchesSearch;
                    })
                    .map(tenant => (
                      <TenantCard
                        key={tenant.id}
                        tenant={tenant}
                        propertyAddress={`${property.address}, ${property.city}`}
                        onEditTenant={handleEditTenant}
                        onManageTenant={handleManageTenant}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>אין דיירים בנכס זה</p>
                  <p className="text-sm">לחץ על "הוסף דייר" כדי להוסיף דייר ראשון</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {propertiesWithTenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין נכסים</h3>
            <p className="text-muted-foreground">
              הוסף נכסים כדי להתחיל לנהל דיירים
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tenant Management Modal */}
      <TenantManagementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        propertyId={modalPropertyId}
        propertyAddress={modalPropertyAddress}
        tenant={selectedTenant}
        onTenantUpdated={handleTenantUpdated}
      />
    </div>
  );
};
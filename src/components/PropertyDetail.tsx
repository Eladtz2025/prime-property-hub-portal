
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, Home, FileText, History } from 'lucide-react';
import { Property } from '../types/property';
import { processPropertiesData } from '../utils/dataProcessor';
import { PropertyEditModal } from './PropertyEditModal';

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      
      try {
        const properties = await processPropertiesData();
        const foundProperty = properties.find(p => p.id === id);
        setProperty(foundProperty || null);
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'תפוס';
      case 'vacant': return 'פנוי';
      case 'maintenance': return 'תחזוקה';
      default: return status;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperty(updatedProperty);
    setIsEditModalOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">טוען...</div>;
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-muted-foreground">נכס לא נמצא</h2>
        <Button onClick={() => navigate('/properties')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          חזור לרשימת נכסים
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/properties')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזור
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{property.address}</h1>
            <p className="text-muted-foreground">{property.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(property.status)}>
            {getStatusText(property.status)}
          </Badge>
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            עריכה
          </Button>
        </div>
      </div>

      {/* Property Details Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">פרטים כלליים</TabsTrigger>
          <TabsTrigger value="contract">חוזה</TabsTrigger>
          <TabsTrigger value="documents">מסמכים</TabsTrigger>
          <TabsTrigger value="history">היסטוריה</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
        </TabsList>

        {/* General Details */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  פרטי הנכס
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">כתובת:</span>
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">עיר:</span>
                  <span>{property.city}</span>
                </div>
                {property.propertySize && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">גודל:</span>
                    <span>{property.propertySize} מ"ר</span>
                  </div>
                )}
                {property.floor && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">קומה:</span>
                    <span>{property.floor}</span>
                  </div>
                )}
                {property.rooms && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">חדרים:</span>
                    <span>{property.rooms}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>פרטי הבעלים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">שם:</span>
                  <span className="mr-2">{property.ownerName}</span>
                </div>
                {property.ownerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${property.ownerPhone}`} className="text-blue-600 hover:underline">
                      {formatPhoneNumber(property.ownerPhone)}
                    </a>
                  </div>
                )}
                {property.ownerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${property.ownerEmail}`} className="text-blue-600 hover:underline">
                      {property.ownerEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle>פרטי השוכר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.tenantName ? (
                  <>
                    <div>
                      <span className="font-medium">שם:</span>
                      <span className="mr-2">{property.tenantName}</span>
                    </div>
                    {property.tenantPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${property.tenantPhone}`} className="text-blue-600 hover:underline">
                          {formatPhoneNumber(property.tenantPhone)}
                        </a>
                      </div>
                    )}
                    {property.tenantEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${property.tenantEmail}`} className="text-blue-600 hover:underline">
                          {property.tenantEmail}
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">אין שוכר כרגע</p>
                )}
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card>
              <CardHeader>
                <CardTitle>מידע כספי</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.monthlyRent ? (
                  <div>
                    <span className="font-medium">שכירות חודשית:</span>
                    <span className="mr-2 text-lg font-bold">₪{property.monthlyRent.toLocaleString()}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">לא הוגדר מחיר</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contract Details */}
        <TabsContent value="contract" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                פרטי חוזה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.leaseStartDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">תאריך התחלה:</span>
                  <span>{new Date(property.leaseStartDate).toLocaleDateString('he-IL')}</span>
                </div>
              )}
              {property.leaseEndDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">תאריך סיום:</span>
                  <span>{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                </div>
              )}
              {!property.leaseStartDate && !property.leaseEndDate && (
                <p className="text-muted-foreground">לא הוגדרו תאריכי חוזה</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>מסמכים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">תכונה זו תתווסף בקרוב</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                היסטוריית שינויים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">אין שינויים להצגה</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>הערות</CardTitle>
            </CardHeader>
            <CardContent>
              {property.notes ? (
                <p className="whitespace-pre-wrap">{property.notes}</p>
              ) : (
                <p className="text-muted-foreground">אין הערות</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <PropertyEditModal
        property={property}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handlePropertyUpdate}
      />
    </div>
  );
};

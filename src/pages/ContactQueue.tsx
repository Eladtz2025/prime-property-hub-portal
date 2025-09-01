import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Property } from '../types/property';
import { ContactOwnerCard } from '../components/ContactOwnerCard';
import { Phone, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ContactQueueProps {
  properties: Property[];
  onUpdateProperty: (property: Property) => void;
}

export const ContactQueue: React.FC<ContactQueueProps> = ({
  properties,
  onUpdateProperty
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'not_contacted' | 'needs_callback' | 'contacted'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'last_contact'>('priority');

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = contactFilter === 'all' || 
                          (contactFilter === 'not_contacted' && property.contactStatus === 'not_contacted') ||
                          (contactFilter === 'needs_callback' && property.contactStatus === 'needs_callback') ||
                          (contactFilter === 'contacted' && ['called_answered', 'called_no_answer'].includes(property.contactStatus));
      
      return matchesSearch && matchesFilter;
    });

    // Sort by priority
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { 'not_contacted': 3, 'needs_callback': 2, 'called_no_answer': 1, 'called_answered': 0 };
        return priorityOrder[b.contactStatus] - priorityOrder[a.contactStatus];
      } else if (sortBy === 'name') {
        return a.ownerName.localeCompare(b.ownerName, 'he');
      } else if (sortBy === 'last_contact') {
        const aDate = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        const bDate = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        return bDate - aDate;
      }
      return 0;
    });

    return filtered;
  }, [properties, searchTerm, contactFilter, sortBy]);

  const stats = {
    notContacted: properties.filter(p => p.contactStatus === 'not_contacted').length,
    needsCallback: properties.filter(p => p.contactStatus === 'needs_callback').length,
    contacted: properties.filter(p => ['called_answered', 'called_no_answer'].includes(p.contactStatus)).length,
    noAnswer: properties.filter(p => p.contactStatus === 'called_no_answer').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">תור התקשרויות לבעלי נכסים</h1>
        <div className="text-sm text-muted-foreground">
          {stats.notContacted + stats.needsCallback} בעלי נכסים ממתינים ליצירת קשר
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">טרם נוצר קשר</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.notContacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">נדרש מעקב</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.needsCallback}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">נוצר קשר</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">לא ענו לטלפון</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.noAnswer}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="חיפוש לפי כתובת או שם בעל הנכס..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={contactFilter} onValueChange={(value: any) => setContactFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="סינון לפי סטטוס יצירת קשר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="not_contacted">טרם נוצר קשר</SelectItem>
                  <SelectItem value="needs_callback">נדרש מעקב</SelectItem>
                  <SelectItem value="contacted">נוצר קשר</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">לפי עדיפות</SelectItem>
                  <SelectItem value="name">לפי שם</SelectItem>
                  <SelectItem value="last_contact">לפי קשר אחרון</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact List */}
      <div className="grid gap-4">
        {filteredAndSortedProperties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || contactFilter !== 'all' 
                    ? 'לא נמצאו נכסים המתאימים לקריטריוני החיפוש'
                    : 'נוצר קשר עם כל בעלי הנכסים'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedProperties.map((property) => (
            <ContactOwnerCard
              key={property.id}
              property={property}
              onUpdateProperty={onUpdateProperty}
            />
          ))
        )}
      </div>
    </div>
  );
};
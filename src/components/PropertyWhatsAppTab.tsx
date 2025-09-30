import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Plus, X, User, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { Property } from '@/types/property';
import { SearchHighlight } from './SearchHighlight';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface PropertyWhatsAppTabProps {
  properties: Property[];
  searchTerm?: string;
}

export const PropertyWhatsAppTab: React.FC<PropertyWhatsAppTabProps> = ({ properties, searchTerm = '' }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  
  const { toast } = useToast();
  const { sendWhatsAppMessage } = useWhatsAppSender();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
    setSelectedTemplate(templateId);
  };

  const addRecipient = (property: Property) => {
    if (!property.ownerPhone) {
      toast({
        title: "שגיאה",
        description: "אין מספר טלפון לבעל נכס זה",
        variant: "destructive"
      });
      return;
    }

    if (selectedRecipients.find(r => r.id === property.id)) {
      toast({
        title: "כבר נבחר",
        description: "בעל הנכס כבר ברשימת הנמענים",
        variant: "destructive"
      });
      return;
    }

    setSelectedRecipients(prev => [...prev, property]);
    toast({
      title: "נוסף לרשימה",
      description: `${property.ownerName} נוסף לרשימת הנמענים`,
    });
  };

  const removeRecipient = (propertyId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== propertyId));
  };

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditContent(template.content);
    setEditDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          name: editName,
          content: editContent,
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "התבנית עודכנה בהצלחה",
        description: `"${editName}" נשמר`,
      });

      await loadTemplates();
      setEditDialogOpen(false);
      
      // If the edited template was selected, update the message
      if (selectedTemplate === editingTemplate.id) {
        setMessage(editContent);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "שגיאה בעדכון",
        description: "לא הצלחנו לשמור את התבנית",
        variant: "destructive"
      });
    }
  };

  const sendMessages = async () => {
    if (selectedRecipients.length === 0 || !message.trim()) {
      toast({
        title: "שגיאה",
        description: "נא לבחור נמענים ולכתוב הודעה",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const property of selectedRecipients) {
        if (!property.ownerPhone) continue;

        // Extract first name only from owner name
        const firstName = property.ownerName?.split(' ')[0] || property.ownerName || '';
        
        const personalizedMessage = message
          // Support {שם} and {{שם}} for first name only (more personal)
          .replace(/\{שם\}/g, firstName)
          .replace(/\{\{שם\}\}/g, firstName)
          // Support {שם_מלא} and {{ownerName}} for full name
          .replace(/\{שם_מלא\}/g, property.ownerName || '')
          .replace('{{ownerName}}', property.ownerName || '')
          // Support address placeholders
          .replace(/\{כתובת\}/g, property.address)
          .replace('{{address}}', property.address);

        const result = await sendWhatsAppMessage({
          phone: property.ownerPhone,
          message: personalizedMessage,
          propertyId: property.id,
          property,
          isOwner: true
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      toast({
        title: "הודעות נשלחו",
        description: `נשלחו ${successCount} הודעות בהצלחה${failCount > 0 ? `, ${failCount} נכשלו` : ''}`,
      });

      setSelectedRecipients([]);
      setMessage('');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "שגיאה בשליחה",
        description: "אירעה שגיאה בשליחת ההודעות",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const propertiesWithPhone = properties.filter(p => p.ownerPhone && p.ownerPhone.trim() !== '');

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Template Selection & Message Editing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>תבניות הודעות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">בחר תבנית</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית הודעה" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {templates.map(template => (
                      <div key={template.id} className="flex items-center justify-between group px-2 hover:bg-accent rounded-sm">
                        <SelectItem value={template.id} className="flex-1 cursor-pointer">
                          {template.name}
                        </SelectItem>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(template);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>עריכת הודעה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">תוכן ההודעה</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="כתוב את ההודעה כאן... (השתמש ב-{{address}} ו-{{ownerName}} להחלפה אוטומטית)"
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  טיפ: השתמש ב-{"{{address}}"} ו-{"{{ownerName}}"} כדי להתאים את ההודעה לכל נמען
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>נמענים נבחרים</span>
                <Badge variant="secondary">{selectedRecipients.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {selectedRecipients.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    לא נבחרו נמענים. לחץ על הכפתור הירוק ליד נכס להוספה
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedRecipients.map(property => (
                      <div 
                        key={property.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{property.ownerName}</div>
                            <div className="text-xs text-muted-foreground truncate">{property.address}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeRecipient(property.id)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="mt-4">
                <Button 
                  onClick={sendMessages} 
                  disabled={loading || selectedRecipients.length === 0 || !message.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'שולח...' : `שלח ל-${selectedRecipients.length} נמענים`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Property List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>בחירת נכסים</span>
              <Badge variant="secondary">{propertiesWithPhone.length} נכסים</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {propertiesWithPhone.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  אין נכסים עם מספר טלפון
                </div>
              ) : (
                <div className="space-y-2">
                  {propertiesWithPhone.map(property => {
                    const isSelected = selectedRecipients.find(r => r.id === property.id);
                    
                    return (
                      <div 
                        key={property.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary' 
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-medium text-sm">
                              <SearchHighlight text={property.address} searchTerm={searchTerm} />
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">
                                <SearchHighlight text={property.ownerName} searchTerm={searchTerm} />
                              </span>
                            </div>
                            {property.ownerPhone && (
                              <div className="text-xs text-muted-foreground" dir="ltr">
                                {property.ownerPhone}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? "secondary" : "default"}
                            onClick={() => addRecipient(property)}
                            disabled={!!isSelected}
                            className={`flex-shrink-0 ${!isSelected ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                          >
                            {isSelected ? (
                              <>נבחר</>
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>עריכת תבנית</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">שם התבנית</Label>
              <Input
                id="template-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="שם התבנית"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">תוכן התבנית</Label>
              <Textarea
                id="template-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="תוכן ההודעה..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                טיפ: השתמש ב-{"{שם}"} לשם פרטי, {"{שם_מלא}"} לשם מלא, ו-{"{כתובת}"} לכתובת הנכס
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={saveTemplate}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

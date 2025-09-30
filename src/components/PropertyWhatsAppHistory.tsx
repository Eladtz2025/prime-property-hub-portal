import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, User, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/property';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sender_name?: string;
  contact_name?: string;
  property_id?: string;
}

interface ConversationGroup {
  phone: string;
  ownerName: string;
  messages: WhatsAppMessage[];
  lastMessage: WhatsAppMessage;
  propertyAddresses: string[];
}

interface PropertyWhatsAppHistoryProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

export const PropertyWhatsAppHistory: React.FC<PropertyWhatsAppHistoryProps> = ({ 
  properties,
  onPropertySelect 
}) => {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Normalize phone number for comparison
  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Convert 972XXXXXXXXX to 05XXXXXXXX or keep as is
    if (digits.startsWith('972')) {
      return '0' + digits.substring(3);
    }
    return digits;
  };

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group messages by normalized phone number
      const groupedByPhone: { [key: string]: WhatsAppMessage[] } = {};
      
      messages?.forEach((msg) => {
        // Skip group messages and messages without proper phone numbers
        if (msg.chat_type === 'group' || !msg.phone || msg.phone.includes('@g.us')) {
          return;
        }
        
        const normalizedPhone = normalizePhone(msg.phone);
        
        // Only include messages that have a matching property owner
        const hasMatchingProperty = properties.some(p => normalizePhone(p.ownerPhone) === normalizedPhone);
        if (!hasMatchingProperty) {
          return;
        }
        
        if (!groupedByPhone[normalizedPhone]) {
          groupedByPhone[normalizedPhone] = [];
        }
        groupedByPhone[normalizedPhone].push(msg as WhatsAppMessage);
      });

      // Create conversation groups with owner info
      const conversationGroups: ConversationGroup[] = Object.entries(groupedByPhone)
        .map(([normalizedPhone, msgs]) => {
          // Find owner info from properties using normalized phone
          const ownerProperty = properties.find(p => normalizePhone(p.ownerPhone) === normalizedPhone);
          
          // Skip if no owner found
          if (!ownerProperty) {
            return null;
          }
          
          const ownerName = ownerProperty.ownerName;
          
          // Get all properties for this owner
          const ownerProperties = properties.filter(p => normalizePhone(p.ownerPhone) === normalizedPhone);
          const propertyAddresses = ownerProperties.map(p => p.address);

          return {
            phone: ownerProperty.ownerPhone, // Use the original format from property
            ownerName,
            messages: msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            lastMessage: msgs[0],
            propertyAddresses
          };
        })
        .filter((group): group is ConversationGroup => group !== null);

      // Sort by last message time
      conversationGroups.sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );

      setConversations(conversationGroups);
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [properties]);

  useEffect(() => {
    if (properties.length > 0) {
      fetchMessages();
    }
  }, [properties, fetchMessages]);

  const getDirectionColor = (direction: string) => {
    return direction === 'outbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getDirectionText = (direction: string) => {
    return direction === 'outbound' ? 'נשלח' : 'התקבל';
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: he });
    } catch {
      return new Date(timestamp).toLocaleDateString('he-IL');
    }
  };

  const selectedConversation = conversations.find(c => c.phone === selectedPhone);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">טוען היסטוריית שיחות...</div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>אין עדיין היסטוריית שיחות WhatsApp</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Conversations List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            שיחות ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 p-4">
              {conversations.map((conv) => (
                <button
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  className={`w-full text-right p-4 rounded-lg border transition-colors ${
                    selectedPhone === conv.phone 
                      ? 'bg-primary/10 border-primary' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{conv.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{conv.phone}</span>
                      </div>
                      {conv.propertyAddresses.length > 0 && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {conv.propertyAddresses.slice(0, 2).join(', ')}
                          {conv.propertyAddresses.length > 2 && ` +${conv.propertyAddresses.length - 2}`}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 text-right">
                        {conv.lastMessage.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {conv.messages.length}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages View */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedConversation ? (
              <>
                <User className="h-5 w-5" />
                {selectedConversation.ownerName}
                <Badge variant="secondary">{selectedConversation.messages.length} הודעות</Badge>
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                בחר שיחה
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <ScrollArea className="h-[540px]">
              <div className="space-y-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.direction === 'outbound'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getDirectionColor(msg.direction)}`}>
                          {getDirectionText(msg.direction)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-right">{msg.message}</p>
                      {msg.status && (
                        <div className="mt-2 text-xs text-muted-foreground text-right">
                          סטטוס: {msg.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[540px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>בחר שיחה כדי לראות את ההודעות</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

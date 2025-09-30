import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedPhone, conversations]);

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
            messages: msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), // Oldest first for chat view
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
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      {/* Conversations List - First on mobile, right on desktop */}
      <Card className="lg:col-span-1 lg:order-2">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
            שיחות ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] md:h-[600px]">
            <div className="space-y-1 p-2 md:p-4">
              {conversations.map((conv) => (
                <button
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  className={`w-full text-right p-3 md:p-4 rounded-lg border transition-colors ${
                    selectedPhone === conv.phone 
                      ? 'bg-primary/10 border-primary' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-xs md:text-sm truncate">{conv.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[10px] md:text-xs text-muted-foreground truncate">{conv.phone}</span>
                      </div>
                      {conv.propertyAddresses.length > 0 && (
                        <div className="text-[10px] md:text-xs text-muted-foreground mb-2 line-clamp-1">
                          {conv.propertyAddresses.slice(0, 2).join(', ')}
                          {conv.propertyAddresses.length > 2 && ` +${conv.propertyAddresses.length - 2}`}
                        </div>
                      )}
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 text-right">
                        {conv.lastMessage.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 md:px-2">
                        {conv.messages.length}
                      </Badge>
                      <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
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

      {/* Messages View - Second on mobile, left on desktop */}
      <Card className="lg:col-span-2 lg:order-1">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            {selectedConversation ? (
              <>
                <User className="h-4 w-4 md:h-5 md:w-5" />
                <span className="truncate">{selectedConversation.ownerName}</span>
                <Badge variant="secondary" className="text-xs">{selectedConversation.messages.length} הודעות</Badge>
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                בחר שיחה
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {selectedConversation ? (
            <ScrollArea className="h-[400px] md:h-[540px]">
              <div className="space-y-3 md:space-y-4 p-2 md:p-4">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[80%] rounded-lg p-3 md:p-4 ${
                        msg.direction === 'outbound'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-[10px] md:text-xs ${getDirectionColor(msg.direction)}`}>
                          {getDirectionText(msg.direction)}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm whitespace-pre-wrap text-right">{msg.message}</p>
                      {msg.status && (
                        <div className="mt-2 text-[10px] md:text-xs text-muted-foreground text-right">
                          סטטוס: {msg.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[400px] md:h-[540px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">בחר שיחה כדי לראות את ההודעות</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

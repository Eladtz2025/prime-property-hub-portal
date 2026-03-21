import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  created_at: string;
  direction: string;
  status: string;
  sender_name?: string;
  contact_name?: string;
}

interface Conversation {
  phone: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  direction: string;
  status: string;
  messages: WhatsAppMessage[];
}

export const WhatsAppRecentChats: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group by phone
      const grouped = new Map<string, WhatsAppMessage[]>();
      (data || []).forEach(msg => {
        const phone = msg.phone;
        if (!grouped.has(phone)) grouped.set(phone, []);
        grouped.get(phone)!.push(msg);
      });

      const convs: Conversation[] = Array.from(grouped.entries()).map(([phone, msgs]) => {
        const last = msgs[0];
        return {
          phone,
          name: last.contact_name || last.sender_name || formatPhone(phone),
          lastMessage: last.message,
          lastTime: last.created_at,
          direction: last.direction,
          status: last.status,
          messages: msgs.reverse() // chronological
        };
      });

      // Sort by most recent
      convs.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
      setConversations(convs);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('972')) return '0' + phone.substring(3);
    return phone;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': case 'delivered': case 'read':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            שיחות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">טוען...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">אין שיחות להצגה</div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {conversations.map(conv => (
                <div
                  key={conv.phone}
                  className="py-3 px-2 cursor-pointer hover:bg-muted/50 transition-colors rounded"
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{conv.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastTime), { addSuffix: true, locale: he })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {conv.direction === 'outbound' && getStatusIcon(conv.status)}
                    <Badge variant={conv.direction === 'inbound' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {conv.direction === 'inbound' ? 'נכנס' : 'יוצא'}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {conv.lastMessage.substring(0, 60)}{conv.lastMessage.length > 60 ? '...' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-md max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              {selectedConversation?.name}
              <span className="text-sm font-normal text-muted-foreground" dir="ltr">
                {selectedConversation && formatPhone(selectedConversation.phone)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[60vh] p-2">
            {selectedConversation?.messages.map(msg => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                  msg.direction === 'outbound'
                    ? 'bg-green-100 dark:bg-green-900/30 mr-auto'
                    : 'bg-muted ml-auto'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.message}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString('he-IL')}
                  </span>
                  {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp,
  Plus,
  Search
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MobileWhatsAppHubProps {
  className?: string;
}

export const MobileWhatsAppHub: React.FC<MobileWhatsAppHubProps> = ({ className }) => {
  const [message, setMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Mock data for mobile view
  const conversations = [
    { id: '1', name: 'יעקב כהן', lastMessage: 'שלום, אני רוצה לדעת על התשלום', time: '10:30', unread: 2 },
    { id: '2', name: 'רחל לוי', lastMessage: 'תודה על העזרה', time: '09:15', unread: 0 },
    { id: '3', name: 'דוד אברהם', lastMessage: 'מתי יבוא הטכנאי?', time: '08:45', unread: 1 },
  ];

  const stats = {
    totalChats: 24,
    unreadMessages: 5,
    sentToday: 12
  };

  return (
    <div className={`space-y-3 p-2 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-3">
            <div className="text-center">
              <MessageSquare className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold text-blue-700">{stats.totalChats}</p>
              <p className="text-xs text-blue-600">שיחות</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-3">
            <div className="text-center">
              <Send className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold text-green-700">{stats.sentToday}</p>
              <p className="text-xs text-green-600">נשלחו היום</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-3">
            <div className="text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              <p className="text-lg font-bold text-orange-700">{stats.unreadMessages}</p>
              <p className="text-xs text-orange-600">לא נקראו</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="חפש שיחה..." 
              className="pr-10 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Send */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Send className="h-4 w-4" />
            שלח הודעה מהירה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          <Textarea 
            placeholder="כתוב הודעה..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs">
              <Send className="h-3 w-3 ml-1" />
              שלח לכולם
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Plus className="h-3 w-3" />
              בחר איש קשר
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-bold">שיחות אחרונות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border border-border/30"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {conv.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-xs text-foreground truncate">{conv.name}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                    {conv.unread > 0 && (
                      <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm font-bold">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-10 text-xs">
              <Users className="h-3.5 w-3.5 ml-1" />
              שליחה קבוצתית
            </Button>
            <Button variant="outline" size="sm" className="h-10 text-xs">
              <MessageSquare className="h-3.5 w-3.5 ml-1" />
              תבניות הודעות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
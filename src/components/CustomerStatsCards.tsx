import { Card } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, Calendar, TrendingUp } from "lucide-react";
import type { Customer } from "@/hooks/useCustomerData";

interface CustomerStatsCardsProps {
  customers: Customer[];
}

export const CustomerStatsCards = ({ customers }: CustomerStatsCardsProps) => {
  const totalCustomers = customers.length;
  
  const newThisWeek = customers.filter(c => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(c.created_at) > weekAgo;
  }).length;

  const activeCustomers = customers.filter(c => 
    ['contacted', 'active', 'viewing_scheduled', 'offer_made'].includes(c.status)
  ).length;

  const needFollowup = customers.filter(c => {
    if (!c.next_followup_date) return false;
    return new Date(c.next_followup_date) <= new Date();
  }).length;

  const hotLeads = customers.filter(c => 
    c.priority === 'high' || c.priority === 'urgent'
  ).length;

  const stats = [
    {
      title: 'סה"כ לקוחות',
      value: totalCustomers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'חדשים השבוע',
      value: newThisWeek,
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'לקוחות פעילים',
      value: activeCustomers,
      icon: UserCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'דורש מעקב',
      value: needFollowup,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'לידים חמים',
      value: hotLeads,
      icon: TrendingUp,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

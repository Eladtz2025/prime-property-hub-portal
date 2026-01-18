import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbNavProps {
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'דף הבית',
  '/admin-dashboard': 'לוח בקרה',
  '/admin-dashboard/properties': 'נכסים',
  '/admin-dashboard/settings': 'הגדרות',
  '/admin-dashboard/admin-control': 'בקרת מערכת',
  '/admin-dashboard/whatsapp': 'WhatsApp',
  '/admin-dashboard/all-features': 'כל הפיצ\'רים',
  '/admin-dashboard/import-data': 'ייבוא נתונים',
  '/admin-dashboard/import-from-storage': 'ייבוא מאחסון',
  '/admin-dashboard/forms': 'טפסים',
  '/admin-dashboard/pitch-decks': 'מצגות',
  '/admin-dashboard/price-offers': 'הצעות מחיר',
  '/admin-dashboard/customers': 'לקוחות',
  '/admin-dashboard/leads': 'לידים',
  '/admin-dashboard/photo-studio': 'סטודיו תמונות',
  '/admin-dashboard/property-scout': 'סקאוט נדל"ן',
  '/admin-dashboard/devops': 'DevOps',
  '/alerts': 'התראות',
  '/messages': 'הודעות',
  '/reports': 'דוחות',
  '/users': 'משתמשים',
  '/contact-queue': 'צור קשר',
  '/owner-portal': 'פורטל בעלים',
  '/owner-financials': 'כספים',
  '/property-invitations': 'הזמנות נכסים',
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ className }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null; // Don't show breadcrumb on home page
  }

  return (
    <Breadcrumb className={cn("mb-4", className)}>
      <BreadcrumbList className="text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <NavLink to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Home className="h-3 w-3" />
              <span>בית</span>
            </NavLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          // Handle dynamic paths (UUIDs and special keywords)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);
          const isNewPath = pathname === 'new';
          const isCreatePath = pathname === 'create';
          const isEditPath = pathname === 'edit';
          
          let label: string;
          if (isUUID) {
            label = 'עריכה';
          } else if (isNewPath || isCreatePath) {
            label = 'יצירה חדשה';
          } else if (isEditPath) {
            label = 'עריכה';
          } else {
            label = routeLabels[routeTo] || pathname;
          }

          return (
            <div key={routeTo} className="contents">
              <BreadcrumbSeparator>
                <ChevronLeft className="h-3 w-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <NavLink 
                      to={routeTo}
                      className="hover:text-primary transition-colors"
                    >
                      {label}
                    </NavLink>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
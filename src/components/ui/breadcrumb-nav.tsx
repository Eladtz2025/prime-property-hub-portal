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
  '/': 'לוח בקרה',
  '/properties': 'נכסים',
  '/alerts': 'התראות',
  '/messages': 'הודעות',
  '/reports': 'דוחות',
  '/users': 'משתמשים',
  '/contact-queue': 'צור קשר',
  '/owner-portal': 'פורטל בעלים',
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
          const label = routeLabels[routeTo] || pathname;

          return (
            <React.Fragment key={routeTo}>
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
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
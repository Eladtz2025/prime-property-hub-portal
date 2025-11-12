import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div dir="rtl" className="rtl min-h-screen">
      {children}
    </div>
  );
};

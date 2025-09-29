import React from 'react';
import { WhatsAppHub } from '@/components/WhatsAppHub';
import { MobileWhatsAppHub } from '@/components/MobileWhatsAppHub';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

export const WhatsAppCenter: React.FC = () => {
  const { isMobile } = useMobileOptimization();
  
  return isMobile ? <MobileWhatsAppHub /> : <WhatsAppHub />;
};
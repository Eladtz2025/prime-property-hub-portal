import type jsPDF from 'jspdf';
import { brokerSharingTranslations } from './broker-sharing-translations';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { BUSINESS_INFO } from '@/constants/business';

export interface BrokerSharingFormData {
  // Primary broker (from BUSINESS_INFO)
  primary_broker_name: string;
  primary_broker_license: string;
  primary_broker_phone: string;
  primary_broker_company: string;
  
  // Secondary broker
  secondary_broker_name: string;
  secondary_broker_license: string;
  secondary_broker_phone: string;
  secondary_broker_email?: string;
  secondary_broker_company?: string;
  
  // Property details
  property_address: string;
  property_city: string;
  transaction_type: 'sale' | 'rental';
  
  // Commission split
  primary_broker_share: string;
  secondary_broker_share: string;
  
  // Dates
  form_date: string;
  
  // Signatures
  primary_broker_signature: string;
  secondary_broker_signature?: string | null;
  
  // Language
  language: 'he' | 'en';
}

export async function generateBrokerSharingPDF(formData: BrokerSharingFormData): Promise<jsPDF> {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');
  const t = brokerSharingTranslations[formData.language];
  const isRTL = formData.language === 'he';
  const formDate = format(new Date(formData.form_date), 'dd/MM/yyyy', { locale: he });
  const transactionTypeText = formData.transaction_type === 'sale' ? t.sale : t.rental;

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 20px 30px;
    background: white;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: ${isRTL ? 'rtl' : 'ltr'};
    color: #000;
  `;

  const sectionStyle = `margin-bottom: 14px; padding: 10px 14px; background: #f8f9fa; border-radius: 6px; border-${isRTL ? 'right' : 'left'}: 4px solid #2563eb;`;
  const headerStyle = `font-size: 13px; font-weight: bold; margin: 0 0 8px 0; color: #1e40af;`;
  const textStyle = `font-size: 11px; line-height: 1.5; margin: 4px 0; color: #333;`;
  const smallTextStyle = `font-size: 10px; line-height: 1.4; margin: 3px 0; color: #444;`;

  container.innerHTML = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #2563eb;">
      <h1 style="font-size: 22px; margin: 0; color: #1e40af; font-weight: bold;">${t.title}</h1>
      <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">${t.subtitle}</p>
      <p style="font-size: 10px; color: #666; margin-top: 6px;">${t.formDate}: ${formDate}</p>
    </div>
    
    <!-- Primary Broker Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.primaryBrokerDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.brokerCompany}:</strong> ${BUSINESS_INFO.name}</p>
        <p style="${textStyle}"><strong>${t.brokerName}:</strong> ${isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
        <p style="${textStyle}"><strong>${t.brokerLicense}:</strong> ${BUSINESS_INFO.license}</p>
        <p style="${textStyle}"><strong>${t.brokerPhone}:</strong> ${BUSINESS_INFO.phone}</p>
      </div>
    </div>
    
    <!-- Secondary Broker Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.secondaryBrokerDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.secondaryBrokerName}:</strong> ${formData.secondary_broker_name}</p>
        <p style="${textStyle}"><strong>${t.secondaryBrokerLicense}:</strong> ${formData.secondary_broker_license}</p>
        <p style="${textStyle}"><strong>${t.secondaryBrokerPhone}:</strong> ${formData.secondary_broker_phone}</p>
        ${formData.secondary_broker_email ? `<p style="${textStyle}"><strong>${t.secondaryBrokerEmail}:</strong> ${formData.secondary_broker_email}</p>` : ''}
        ${formData.secondary_broker_company ? `<p style="${textStyle}"><strong>${t.secondaryBrokerCompany}:</strong> ${formData.secondary_broker_company}</p>` : ''}
      </div>
    </div>
    
    <!-- Property Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.propertyDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.propertyAddress}:</strong> ${formData.property_address}</p>
        <p style="${textStyle}"><strong>${t.propertyCity}:</strong> ${formData.property_city}</p>
        <p style="${textStyle}"><strong>${t.transactionType}:</strong> ${transactionTypeText}</p>
      </div>
    </div>
    
    <!-- Commission Split -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.commissionSplit}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.primaryBrokerShare}:</strong> ${formData.primary_broker_share}%</p>
        <p style="${textStyle}"><strong>${t.secondaryBrokerShare}:</strong> ${formData.secondary_broker_share}%</p>
      </div>
    </div>
    
    <!-- Legal Terms -->
    <div style="margin-bottom: 14px; padding: 12px 16px; background: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe;">
      <h2 style="${headerStyle}">${t.legalTerms}</h2>
      <p style="${smallTextStyle}">1. ${t.legalText1}</p>
      <p style="${smallTextStyle}">2. ${t.legalText2}</p>
      <p style="${smallTextStyle}">3. ${t.legalText3}</p>
      <p style="${smallTextStyle}">4. ${t.legalText4}</p>
      <p style="${smallTextStyle}">5. ${t.legalText5}</p>
      <p style="${smallTextStyle}">6. ${t.legalText6}</p>
    </div>
    
    <!-- Confidentiality & Responsibility -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
      <div style="padding: 10px 12px; background: #fef3c7; border-radius: 6px; border: 1px solid #fcd34d;">
        <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 4px 0; color: #92400e;">${t.confidentialityTitle}</h3>
        <p style="${smallTextStyle}">${t.confidentialityText}</p>
      </div>
      <div style="padding: 10px 12px; background: #d1fae5; border-radius: 6px; border: 1px solid #6ee7b7;">
        <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 4px 0; color: #065f46;">${t.responsibilityTitle}</h3>
        <p style="${smallTextStyle}">${t.responsibilityText}</p>
      </div>
    </div>
    
    <!-- Confirmation -->
    <div style="margin-bottom: 14px; padding: 8px 12px; background: #d1fae5; border-radius: 6px; border: 1px solid #10b981;">
      <p style="${smallTextStyle}">✓ ${t.confirmationText}</p>
    </div>
    
    <!-- Signatures -->
    <div style="margin-top: 20px; padding-top: 16px; border-top: 3px solid #2563eb;">
      <div style="display: flex; justify-content: space-around; gap: 40px;">
        <div style="text-align: center; flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #1e40af;">${t.primaryBrokerSignature}</p>
          ${formData.primary_broker_signature ? `
            <img src="${formData.primary_broker_signature}" style="max-width: 140px; max-height: 60px; border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 4px;" />
          ` : `
            <div style="width: 140px; height: 60px; border: 2px dashed #d1d5db; border-radius: 6px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 10px; color: #374151; margin-top: 6px; font-weight: 600;">${isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
        </div>
        <div style="text-align: center; flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #1e40af;">${t.secondaryBrokerSignature}</p>
          ${formData.secondary_broker_signature ? `
            <img src="${formData.secondary_broker_signature}" style="max-width: 140px; max-height: 60px; border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 4px;" />
          ` : `
            <div style="width: 140px; height: 60px; border: 2px dashed #d1d5db; border-radius: 6px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 10px; color: #374151; margin-top: 6px; font-weight: 600;">${formData.secondary_broker_name}</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 16px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 9px; color: #6b7280;">© ${BUSINESS_INFO.name} | ${t.formDate}: ${formDate}</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;

    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Handle multi-page content
    if (imgHeight > pageHeight - (margin * 2)) {
      let heightLeft = imgHeight;
      let pageNumber = 0;

      while (heightLeft > 0) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        const sourceY = pageNumber * (canvas.height * (pageHeight - margin * 2) / imgHeight);
        const sourceHeight = Math.min(
          canvas.height - sourceY,
          canvas.height * (pageHeight - margin * 2) / imgHeight
        );

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );

          const pageImgData = tempCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
        }

        heightLeft -= (pageHeight - margin * 2);
        pageNumber++;
      }
    } else {
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    }

    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadBrokerSharingPDF(formData: BrokerSharingFormData): Promise<void> {
  const pdf = await generateBrokerSharingPDF(formData);
  const formDate = format(new Date(formData.form_date), 'yyyy-MM-dd');
  const fileName = `broker-sharing-${formData.secondary_broker_name.replace(/\s+/g, '-')}-${formDate}.pdf`;
  pdf.save(fileName);
}

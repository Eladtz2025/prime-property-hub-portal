import type jsPDF from 'jspdf';
import { exclusivityTranslations } from './exclusivity-translations';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { BUSINESS_INFO } from '@/constants/business';

export interface ExclusivityFormData {
  // Seller details
  seller_name: string;
  seller_id_number: string;
  seller_address: string;
  seller_phone: string;
  seller_email?: string;
  
  // Property details
  property_address: string;
  property_city: string;
  property_floor?: string;
  property_rooms?: string;
  property_size?: string;
  property_gush_helka?: string;
  
  // Exclusivity terms
  exclusivity_period: string;
  start_date: string;
  end_date: string;
  asking_price: string;
  
  // Commission
  commission_percentage: string;
  commission_includes_vat: boolean;
  
  // Dates
  form_date: string;
  
  // Signatures
  seller_signature: string;
  agent_signature?: string | null;
  
  // Language
  language: 'he' | 'en';
}

export async function generateExclusivityPDF(formData: ExclusivityFormData): Promise<jsPDF> {
  const t = exclusivityTranslations[formData.language];
  const isRTL = formData.language === 'he';
  const formDate = format(new Date(formData.form_date), 'dd/MM/yyyy', { locale: he });
  const startDate = format(new Date(formData.start_date), 'dd/MM/yyyy', { locale: he });
  const endDate = format(new Date(formData.end_date), 'dd/MM/yyyy', { locale: he });

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

  const sectionStyle = `margin-bottom: 14px; padding: 10px 14px; background: #f8f9fa; border-radius: 6px; border-${isRTL ? 'right' : 'left'}: 4px solid #dc2626;`;
  const headerStyle = `font-size: 13px; font-weight: bold; margin: 0 0 8px 0; color: #991b1b;`;
  const textStyle = `font-size: 11px; line-height: 1.5; margin: 4px 0; color: #333;`;
  const smallTextStyle = `font-size: 10px; line-height: 1.4; margin: 3px 0; color: #444;`;

  const vatText = formData.commission_includes_vat 
    ? (isRTL ? 'כולל מע"מ' : 'Including VAT')
    : (isRTL ? 'לא כולל מע"מ' : 'Excluding VAT');

  container.innerHTML = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #dc2626;">
      <h1 style="font-size: 22px; margin: 0; color: #991b1b; font-weight: bold;">${t.title}</h1>
      <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">${t.subtitle}</p>
      <p style="font-size: 10px; color: #666; margin-top: 6px;">${t.formDate}: ${formDate}</p>
    </div>
    
    <!-- Agent/Broker Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.agentDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${isRTL ? 'שם המשרד' : 'Office'}:</strong> ${BUSINESS_INFO.name}</p>
        <p style="${textStyle}"><strong>${t.agentName}:</strong> ${isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
        <p style="${textStyle}"><strong>${t.agentLicense}:</strong> ${BUSINESS_INFO.license}</p>
        <p style="${textStyle}"><strong>${t.agentPhone}:</strong> ${BUSINESS_INFO.phone}</p>
      </div>
    </div>
    
    <!-- Seller Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.sellerDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.sellerName}:</strong> ${formData.seller_name}</p>
        <p style="${textStyle}"><strong>${t.sellerId}:</strong> ${formData.seller_id_number}</p>
        <p style="${textStyle}"><strong>${t.sellerPhone}:</strong> ${formData.seller_phone}</p>
        <p style="${textStyle}"><strong>${t.sellerAddress}:</strong> ${formData.seller_address}</p>
        ${formData.seller_email ? `<p style="${textStyle}"><strong>${t.sellerEmail}:</strong> ${formData.seller_email}</p>` : ''}
      </div>
    </div>
    
    <!-- Property Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.propertyDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.propertyAddress}:</strong> ${formData.property_address}</p>
        <p style="${textStyle}"><strong>${t.propertyCity}:</strong> ${formData.property_city}</p>
        ${formData.property_floor ? `<p style="${textStyle}"><strong>${t.propertyFloor}:</strong> ${formData.property_floor}</p>` : ''}
        ${formData.property_rooms ? `<p style="${textStyle}"><strong>${t.propertyRooms}:</strong> ${formData.property_rooms}</p>` : ''}
        ${formData.property_size ? `<p style="${textStyle}"><strong>${t.propertySize}:</strong> ${formData.property_size}</p>` : ''}
        ${formData.property_gush_helka ? `<p style="${textStyle}"><strong>${t.propertyGushHelka}:</strong> ${formData.property_gush_helka}</p>` : ''}
      </div>
    </div>
    
    <!-- Exclusivity Terms -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.exclusivityTerms}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.exclusivityPeriod}:</strong> ${formData.exclusivity_period} ${isRTL ? 'ימים' : 'days'}</p>
        <p style="${textStyle}"><strong>${t.startDate}:</strong> ${startDate}</p>
        <p style="${textStyle}"><strong>${t.endDate}:</strong> ${endDate}</p>
        <p style="${textStyle}"><strong>${t.askingPrice}:</strong> ₪${formData.asking_price}</p>
      </div>
    </div>
    
    <!-- Commission Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.commissionDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <p style="${textStyle}"><strong>${t.commissionPercentage}:</strong> ${formData.commission_percentage}% (${vatText})</p>
        <p style="${textStyle}"><strong>${t.breachCompensation}:</strong> ${t.breachCompensationNote}</p>
      </div>
    </div>
    
    <!-- Legal Terms -->
    <div style="margin-bottom: 14px; padding: 12px 16px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca;">
      <h2 style="${headerStyle}">${t.legalTerms}</h2>
      <p style="${smallTextStyle}">1. ${t.legalText1}</p>
      <p style="${smallTextStyle}">2. ${t.legalText2}</p>
      <p style="${smallTextStyle}">3. ${t.legalText3}</p>
      <p style="${smallTextStyle}">4. ${t.legalText4}</p>
      <p style="${smallTextStyle}">5. ${t.legalText5}</p>
    </div>
    
    <!-- Confirmation -->
    <div style="margin-bottom: 14px; padding: 8px 12px; background: #d1fae5; border-radius: 6px; border: 1px solid #10b981;">
      <p style="${smallTextStyle}">✓ ${t.confirmationText}</p>
    </div>
    
    <!-- Signatures -->
    <div style="margin-top: 20px; padding-top: 16px; border-top: 3px solid #dc2626;">
      <div style="display: flex; justify-content: space-around; gap: 40px;">
        <div style="text-align: center; flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #991b1b;">${t.agentSignature}</p>
          ${formData.agent_signature ? `
            <img src="${formData.agent_signature}" style="max-width: 140px; max-height: 60px; border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 4px;" />
          ` : `
            <div style="width: 140px; height: 60px; border: 2px dashed #d1d5db; border-radius: 6px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 10px; color: #374151; margin-top: 6px; font-weight: 600;">${isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
        </div>
        <div style="text-align: center; flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #991b1b;">${t.sellerSignature}</p>
          ${formData.seller_signature ? `
            <img src="${formData.seller_signature}" style="max-width: 140px; max-height: 60px; border: 1px solid #d1d5db; border-radius: 6px; background: white; padding: 4px;" />
          ` : `
            <div style="width: 140px; height: 60px; border: 2px dashed #d1d5db; border-radius: 6px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 10px; color: #374151; margin-top: 6px; font-weight: 600;">${formData.seller_name}</p>
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

export async function downloadExclusivityPDF(formData: ExclusivityFormData): Promise<void> {
  const pdf = await generateExclusivityPDF(formData);
  const formDate = format(new Date(formData.form_date), 'yyyy-MM-dd');
  const fileName = `exclusivity-${formData.seller_name.replace(/\s+/g, '-')}-${formDate}.pdf`;
  pdf.save(fileName);
}

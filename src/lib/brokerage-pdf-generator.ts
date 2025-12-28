import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { brokerageFormTranslations } from './brokerage-form-translations';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { BUSINESS_INFO } from '@/constants/business';

interface BrokerageFormData {
  client_name: string;
  client_id: string;
  client_phone: string;
  client_signature: string;
  agent_name: string;
  agent_id: string;
  agent_signature?: string | null;
  form_date: string;
  fee_type_rental: boolean | null;
  fee_type_sale: boolean | null;
  properties: any[] | null;
  special_terms: string | null;
  referred_by: string | null;
}

export async function generateBrokerageFormPDF(formData: BrokerageFormData): Promise<jsPDF> {
  const t = brokerageFormTranslations.he;
  const properties = formData.properties || [];
  const formDate = format(new Date(formData.form_date), 'dd/MM/yyyy', { locale: he });

  // Create a temporary container for rendering - ultra compact for single page
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 12px 18px;
    background: white;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #000;
  `;

  const sectionStyle = `margin-bottom: 6px; padding: 5px 8px; background: #f8f9fa; border-radius: 4px; border-right: 2px solid #2563eb;`;
  const headerStyle = `font-size: 10px; font-weight: bold; margin: 0 0 4px 0; color: #1e40af;`;
  const textStyle = `font-size: 9px; line-height: 1.3; margin: 2px 0; color: #333;`;
  const smallTextStyle = `font-size: 8px; line-height: 1.2; margin: 1px 0; color: #555;`;

  container.innerHTML = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #2563eb;">
      <h1 style="font-size: 13px; margin: 0; color: #1e3a5f; font-weight: bold;">${t.title}</h1>
      <p style="font-size: 8px; color: #666; margin-top: 2px;">${t.date}: ${formDate}</p>
    </div>
    
    <!-- Broker Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.brokerDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <p style="${textStyle}"><strong>שם המשרד:</strong> ${BUSINESS_INFO.name}</p>
        <p style="${textStyle}"><strong>שם המתווך:</strong> ${BUSINESS_INFO.brokerName}</p>
        <p style="${textStyle}"><strong>מס׳ רישיון:</strong> ${BUSINESS_INFO.license}</p>
        <p style="${textStyle}"><strong>ת.ז:</strong> ${BUSINESS_INFO.idNumber}</p>
        <p style="${textStyle}"><strong>טלפון:</strong> ${BUSINESS_INFO.phone}</p>
      </div>
    </div>
    
    <!-- Declarations -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.declarations}</h2>
      <p style="${smallTextStyle}">${t.declarationText1}</p>
      <p style="${smallTextStyle}">${t.declarationText2}</p>
    </div>
    
    <!-- Fee Types -->
    <div style="margin-bottom: 5px;">
      <h2 style="${headerStyle}">${t.feeTypes}</h2>
      ${formData.fee_type_rental ? `<p style="${smallTextStyle}">✓ ${t.rentalFee} <strong>${t.rentalFeeAmount}</strong> ${t.rentalFeeText} ${t.plusVat} ${t.inCash}</p>` : ''}
      ${formData.fee_type_sale ? `<p style="${smallTextStyle}">✓ ${t.saleFee} <strong>${t.saleFeeAmount}</strong> ${t.saleFeeText} ${t.plusVat} ${t.inCash}</p>` : ''}
    </div>
    
    <!-- Properties Table -->
    <div style="margin-bottom: 5px;">
      <h2 style="${headerStyle}">${t.propertiesReferred}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
        <thead>
          <tr style="background: #e5e7eb;">
            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">#</th>
            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">${t.address}</th>
            ${formData.fee_type_sale ? `<th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">${t.gushHelka}</th>` : ''}
            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">${t.floor}</th>
            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">${t.rooms}</th>
            <th style="padding: 4px; border: 1px solid #d1d5db; text-align: right;">${t.price}</th>
          </tr>
        </thead>
        <tbody>
          ${properties.filter((p: any) => p.address).map((prop: any, idx: number) => `
            <tr>
              <td style="padding: 4px; border: 1px solid #d1d5db;">${idx + 1}</td>
              <td style="padding: 4px; border: 1px solid #d1d5db;">${prop.address}</td>
              ${formData.fee_type_sale ? `<td style="padding: 4px; border: 1px solid #d1d5db;">${prop.gushHelka || '—'}</td>` : ''}
              <td style="padding: 4px; border: 1px solid #d1d5db;">${prop.floor || '—'}</td>
              <td style="padding: 4px; border: 1px solid #d1d5db;">${prop.rooms || '—'}</td>
              <td style="padding: 4px; border: 1px solid #d1d5db;">${prop.price || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Special Terms (if any) -->
    ${formData.special_terms ? `
      <div style="margin-bottom: 5px; padding: 4px 6px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
        <h2 style="${headerStyle} color: #92400e;">${t.specialTerms}</h2>
        <p style="${smallTextStyle} white-space: pre-wrap;">${formData.special_terms}</p>
      </div>
    ` : ''}
    
    <!-- Supplementary Terms -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.supplementaryTerms}</h2>
      <ol style="margin: 0; padding-right: 12px; columns: 3; column-gap: 10px; font-size: 7px;">
        <li style="${smallTextStyle}">${t.term1}</li>
        <li style="${smallTextStyle}">${t.term2}</li>
        <li style="${smallTextStyle}">${t.term3}</li>
        <li style="${smallTextStyle}">${t.term4}</li>
        <li style="${smallTextStyle}">${t.term5}</li>
        <li style="${smallTextStyle}">${t.term6}</li>
        <li style="${smallTextStyle}">${t.term7}</li>
      </ol>
    </div>
    
    <!-- Client Details -->
    <div style="${sectionStyle}">
      <h2 style="${headerStyle}">${t.clientDetails}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
        <p style="${textStyle}"><strong>${t.fullName}:</strong> ${formData.client_name}</p>
        <p style="${textStyle}"><strong>${t.clientId}:</strong> ${formData.client_id}</p>
        <p style="${textStyle}"><strong>${t.clientPhone}:</strong> ${formData.client_phone}</p>
        ${formData.referred_by ? `<p style="${textStyle}"><strong>מופנה ע"י:</strong> ${formData.referred_by}</p>` : ''}
      </div>
    </div>
    
    <!-- Client Confirmation -->
    <div style="margin-bottom: 6px; padding: 4px 6px; background: #d1fae5; border-radius: 4px; border: 1px solid #10b981;">
      <p style="${smallTextStyle}">✓ ${t.confirmationText}</p>
    </div>
    
    <!-- Signatures - Always show both -->
    <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-around; gap: 15px;">
        <div style="text-align: center; flex: 1;">
          <p style="font-size: 8px; font-weight: bold; margin-bottom: 2px; color: #1e40af;">${t.brokerSignature}</p>
          ${formData.agent_signature ? `
            <img src="${formData.agent_signature}" style="max-width: 100px; max-height: 35px; border: 1px solid #d1d5db; border-radius: 3px; background: white; padding: 1px;" />
          ` : `
            <div style="width: 100px; height: 35px; border: 1px dashed #d1d5db; border-radius: 3px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 7px; color: #666; margin-top: 1px;">${BUSINESS_INFO.brokerName}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <p style="font-size: 8px; font-weight: bold; margin-bottom: 2px; color: #1e40af;">${t.clientSignature}</p>
          ${formData.client_signature ? `
            <img src="${formData.client_signature}" style="max-width: 100px; max-height: 35px; border: 1px solid #d1d5db; border-radius: 3px; background: white; padding: 1px;" />
          ` : `
            <div style="width: 100px; height: 35px; border: 1px dashed #d1d5db; border-radius: 3px; margin: 0 auto;"></div>
          `}
          <p style="font-size: 7px; color: #666; margin-top: 1px;">${formData.client_name}</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 7px; color: #9ca3af;">© ${BUSINESS_INFO.name} | ${t.date}: ${formDate}</p>
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

        // Create a temporary canvas for this page slice
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

export async function downloadBrokerageFormPDF(formData: BrokerageFormData): Promise<void> {
  const pdf = await generateBrokerageFormPDF(formData);
  const formDate = format(new Date(formData.form_date), 'yyyy-MM-dd');
  const fileName = `brokerage-form-${formData.client_name.replace(/\s+/g, '-')}-${formDate}.pdf`;
  pdf.save(fileName);
}

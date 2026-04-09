import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PresentationExclusivityFormData {
  language: 'en' | 'he';
  // Property
  propertyAddress: string;
  propertyCity: string;
  propertyFloor: string;
  propertyRooms: string;
  propertySize: string;
  askingPrice: string;
  gushHelka?: string;
  // Owner
  ownerName: string;
  ownerId: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail?: string;
  // Terms
  exclusivityDays: number;
  startDate: string;
  endDate: string;
  commissionPercentage: string;
  includesVat: boolean;
  // Signatures
  ownerSignature?: string;
  agentSignature?: string;
  signedAt?: string;
}

export const generatePresentationExclusivityPDF = async (formData: PresentationExclusivityFormData): Promise<jsPDF> => {
  const isHebrew = formData.language === 'he';
  const dir = isHebrew ? 'rtl' : 'ltr';
  const textAlign = isHebrew ? 'right' : 'left';
  
  const marketingMessages = isHebrew ? [
    "לא משנה מאיפה הקונה יגיע, הוא תמיד יוכל לעבור דרכנו",
    "כל מתווך יוכל לעבוד איתנו בשיתוף פעולה מלא",
    "חשיפה מקסימלית תוך שמירה על תיאום ומקצועיות",
    "נקודת קשר אחת, אפס קונפליקטים"
  ] : [
    "No matter where the buyer comes from, they can always work through us",
    "Every agent can partner with us and work together",
    "Maximum exposure while maintaining full coordination",
    "One point of contact, zero conflicts"
  ];

  const labels = isHebrew ? {
    title: "הסכם בלעדיות",
    subtitle: "סיטי מרקט נכסים",
    propertySection: "פרטי הנכס",
    ownerSection: "פרטי בעל הנכס",
    termsSection: "תנאי הבלעדיות",
    legalSection: "תנאים משפטיים",
    signatures: "חתימות",
    address: "כתובת",
    city: "עיר",
    floor: "קומה",
    rooms: "חדרים",
    size: "גודל",
    price: "מחיר מבוקש",
    name: "שם",
    id: "ת.ז",
    phone: "טלפון",
    email: "אימייל",
    period: "תקופה",
    from: "מתאריך",
    to: "עד תאריך",
    commission: "עמלה",
    vat: "כולל מע\"מ",
    ownerSig: "חתימת בעל הנכס",
    agentSig: "חתימת הסוכן",
    date: "תאריך",
    legalText: "אני מאשר/ת שקראתי והבנתי את תנאי ההסכם ומסכים/ה להם במלואם."
  } : {
    title: "Exclusive Listing Agreement",
    subtitle: "City Market Properties",
    propertySection: "Property Details",
    ownerSection: "Owner Details",
    termsSection: "Exclusivity Terms",
    legalSection: "Legal Terms",
    signatures: "Signatures",
    address: "Address",
    city: "City",
    floor: "Floor",
    rooms: "Rooms",
    size: "Size",
    price: "Asking Price",
    name: "Name",
    id: "ID",
    phone: "Phone",
    email: "Email",
    period: "Period",
    from: "From",
    to: "To",
    commission: "Commission",
    vat: "Includes VAT",
    ownerSig: "Owner Signature",
    agentSig: "Agent Signature",
    date: "Date",
    legalText: "I confirm that I have read and understood the agreement terms and agree to them in full."
  };

  const container = document.createElement('div');
  container.style.cssText = `
    width: 794px;
    padding: 40px;
    background: linear-gradient(135deg, #8b7765 0%, #6d5a4a 100%);
    font-family: ${isHebrew ? 'Heebo, Arial, sans-serif' : 'Arial, sans-serif'};
    direction: ${dir};
    color: white;
  `;

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
    </style>
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f5c242; padding-bottom: 20px;">
      <h1 style="font-size: 28px; font-weight: 600; margin: 0; color: #f5c242;">${labels.title}</h1>
      <p style="font-size: 16px; margin: 5px 0 0; opacity: 0.9;">${labels.subtitle}</p>
    </div>
    
    <!-- Marketing Messages -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 25px; border-left: 3px solid #f5c242;">
      ${marketingMessages.map(msg => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 8px; font-size: 12px;">
          <span style="color: #f5c242; margin-${isHebrew ? 'left' : 'right'}: 8px;">✓</span>
          <span>${msg}</span>
        </div>
      `).join('')}
    </div>
    
    <!-- Property Details -->
    <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #f5c242; margin: 0 0 12px; border-bottom: 1px solid rgba(245,194,66,0.3); padding-bottom: 8px;">${labels.propertySection}</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
        <div><strong>${labels.address}:</strong> ${formData.propertyAddress}</div>
        <div><strong>${labels.city}:</strong> ${formData.propertyCity}</div>
        <div><strong>${labels.floor}:</strong> ${formData.propertyFloor}</div>
        <div><strong>${labels.rooms}:</strong> ${formData.propertyRooms}</div>
        <div><strong>${labels.size}:</strong> ${formData.propertySize} ${isHebrew ? 'מ"ר' : 'sqm'}</div>
        <div><strong>${labels.price}:</strong> ₪${formData.askingPrice}</div>
      </div>
    </div>
    
    <!-- Owner Details -->
    <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #f5c242; margin: 0 0 12px; border-bottom: 1px solid rgba(245,194,66,0.3); padding-bottom: 8px;">${labels.ownerSection}</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
        <div><strong>${labels.name}:</strong> ${formData.ownerName}</div>
        <div><strong>${labels.id}:</strong> ${formData.ownerId}</div>
        <div><strong>${labels.phone}:</strong> ${formData.ownerPhone}</div>
        <div><strong>${labels.email}:</strong> ${formData.ownerEmail || '-'}</div>
        <div style="grid-column: span 2;"><strong>${labels.address}:</strong> ${formData.ownerAddress}</div>
      </div>
    </div>
    
    <!-- Terms -->
    <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #f5c242; margin: 0 0 12px; border-bottom: 1px solid rgba(245,194,66,0.3); padding-bottom: 8px;">${labels.termsSection}</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
        <div><strong>${labels.period}:</strong> ${formData.exclusivityDays} ${isHebrew ? 'ימים' : 'days'}</div>
        <div><strong>${labels.commission}:</strong> ${formData.commissionPercentage}% ${formData.includesVat ? `(${labels.vat})` : ''}</div>
        <div><strong>${labels.from}:</strong> ${formData.startDate}</div>
        <div><strong>${labels.to}:</strong> ${formData.endDate}</div>
      </div>
    </div>
    
    <!-- Legal -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 11px; line-height: 1.6;">
      <h3 style="font-size: 14px; color: #f5c242; margin: 0 0 10px;">${labels.legalSection}</h3>
      <p style="margin: 0;">${labels.legalText}</p>
    </div>
    
    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; gap: 30px; margin-top: 30px;">
      <div style="flex: 1; text-align: center;">
        <p style="font-size: 12px; color: #f5c242; margin-bottom: 10px;">${labels.ownerSig}</p>
        ${formData.ownerSignature ? `<img src="${formData.ownerSignature}" style="max-width: 150px; max-height: 60px; background: white; border-radius: 4px; padding: 5px;" />` : '<div style="height: 60px; border-bottom: 1px solid rgba(255,255,255,0.5);"></div>'}
        <p style="font-size: 11px; margin-top: 8px;">${formData.ownerName}</p>
      </div>
      <div style="flex: 1; text-align: center;">
        <p style="font-size: 12px; color: #f5c242; margin-bottom: 10px;">${labels.agentSig}</p>
        ${formData.agentSignature ? `<img src="${formData.agentSignature}" style="max-width: 150px; max-height: 60px; background: white; border-radius: 4px; padding: 5px;" />` : '<div style="height: 60px; border-bottom: 1px solid rgba(255,255,255,0.5);"></div>'}
        <p style="font-size: 11px; margin-top: 8px;">${isHebrew ? 'אלעד צברי - סיטי מרקט נכסים' : 'Elad Tzabari - City Market Properties'}</p>
      </div>
    </div>
    
    <!-- Date -->
    <div style="text-align: center; margin-top: 20px; font-size: 11px; opacity: 0.8;">
      <p>${labels.date}: ${formData.signedAt || new Date().toLocaleDateString(isHebrew ? 'he-IL' : 'en-US')}</p>
    </div>
  `;

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#8b7765',
  });

  document.body.removeChild(container);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  return pdf;
};

export const downloadPresentationExclusivityPDF = async (formData: PresentationExclusivityFormData): Promise<void> => {
  const pdf = await generatePresentationExclusivityPDF(formData);
  const fileName = `exclusivity-agreement-${formData.propertyAddress.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

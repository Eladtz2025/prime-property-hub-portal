export type ExclusiveListingLanguage = 'he' | 'en';

interface ExclusiveListingTranslation {
  // Page titles
  title: string;
  subtitle: string;
  fillDetails: string;
  
  // Language selector
  languageLabel: string;
  
  // Broker section
  brokerDetails: string;
  name: string;
  license: string;
  phone: string;
  idNumber: string;
  brokerDetailsIncomplete: string;
  brokerDetailsWarning: string;
  goToSettings: string;
  
  // Owner section
  ownerDetails: string;
  ownerName: string;
  ownerIdNumber: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerEmailOptional: string;
  
  // Property section
  propertyDetails: string;
  propertyAddress: string;
  propertyGushHelka: string;
  propertyGushHelkaHint: string;
  propertySizeSqm: string;
  propertyRooms: string;
  propertyFloor: string;
  propertyParking: string;
  propertyStorage: string;
  propertyBalcony: string;
  propertyElevator: string;
  
  // Transaction type
  transactionType: string;
  sale: string;
  rent: string;
  askingPrice: string;
  askingPriceSale: string;
  askingPriceRent: string;
  currency: string;
  
  // Exclusivity period
  exclusivityPeriod: string;
  startDate: string;
  periodLength: string;
  endDate: string;
  months: string;
  month: string;
  periodWarning: string;
  periodLegalNote: string;
  maxPeriodApartment: string;
  maxPeriodOther: string;
  
  // Defects disclosure
  defectsDisclosure: string;
  defectsDisclosureDesc: string;
  defectMoisture: string;
  defectMoistureDesc: string;
  defectBuildingViolations: string;
  defectBuildingViolationsDesc: string;
  defectInfrastructure: string;
  defectInfrastructureDesc: string;
  defectDangerousBuilding: string;
  defectDangerousBuildingDesc: string;
  defectLegalClaims: string;
  defectLegalClaimsDesc: string;
  defectNuisance: string;
  defectNuisanceDesc: string;
  defectOther: string;
  defectOtherDesc: string;
  defectNone: string;
  defectNoneDesc: string;
  defectDetails: string;
  defectDetailsPlaceholder: string;
  
  // Marketing activities
  marketingActivities: string;
  marketingActivitiesDesc: string;
  marketingSignage: string;
  marketingSignageDesc: string;
  marketingInternet: string;
  marketingInternetDesc: string;
  marketingSocialMedia: string;
  marketingSocialMediaDesc: string;
  marketingPress: string;
  marketingPressDesc: string;
  marketingBrokerNetwork: string;
  marketingBrokerNetworkDesc: string;
  marketingPhotography: string;
  marketingPhotographyDesc: string;
  marketingVirtualTour: string;
  marketingVirtualTourDesc: string;
  marketingOther: string;
  marketingOtherPlaceholder: string;
  marketingLegalNote: string;
  
  // Commission
  commission: string;
  commissionPercentage: string;
  commissionIncludesVat: string;
  commissionExcludesVat: string;
  commissionRentalNote: string;
  commissionSaleNote: string;
  
  // Legal terms
  legalTerms: string;
  term1Title: string;
  term1Text: string;
  term2Title: string;
  term2Text: string;
  term3Title: string;
  term3Text: string;
  term4Title: string;
  term4Text: string;
  term5Title: string;
  term5Text: string;
  term6Title: string;
  term6Text: string;
  
  // Confirmations
  confirmations: string;
  confirmUnderstanding: string;
  confirmUnderstandingText: string;
  confirmAccuracy: string;
  confirmAccuracyText: string;
  confirmDefects: string;
  confirmDefectsText: string;
  
  // Signatures
  signatures: string;
  ownerSignature: string;
  brokerSignature: string;
  clearSignature: string;
  date: string;
  
  // Buttons
  createLink: string;
  copyLink: string;
  sendWhatsApp: string;
  saveForm: string;
  closeWindow: string;
  
  // Messages
  linkCreated: string;
  linkCreatedSuccess: string;
  sendLinkToOwner: string;
  linkCopied: string;
  formSaved: string;
  whatsAppMessage: string;
  
  // Errors
  errorInvalidLink: string;
  errorLoadingForm: string;
  errorFillDate: string;
  errorCompleteBrokerDetails: string;
  errorSelectTransactionType: string;
  errorFillPropertyAddress: string;
  errorAgentSignature: string;
  errorOwnerDetails: string;
  errorOwnerConfirmation: string;
  errorOwnerSignature: string;
  errorCreatingLink: string;
  errorSavingForm: string;
  errorSelectMarketingActivities: string;
  errorSelectExclusivityPeriod: string;
}

export const exclusiveListingTranslations: Record<ExclusiveListingLanguage, ExclusiveListingTranslation> = {
  he: {
    // Page titles
    title: 'הסכם בלעדיות למכירה/השכרה',
    subtitle: 'הסכם הזמנת שירותי תיווך בבלעדיות',
    fillDetails: 'נא למלא את הפרטים ולחתום על הטופס',
    
    // Language selector
    languageLabel: 'שפה',
    
    // Broker section
    brokerDetails: 'פרטי המתווך',
    name: 'שם',
    license: 'רישיון',
    phone: 'טלפון',
    idNumber: 'ת.ז.',
    brokerDetailsIncomplete: 'פרטי המתווך חסרים',
    brokerDetailsWarning: 'יש להשלים את פרטי המתווך בהגדרות לפני יצירת טופס בלעדיות',
    goToSettings: 'עבור להגדרות',
    
    // Owner section
    ownerDetails: 'פרטי בעל הנכס',
    ownerName: 'שם מלא',
    ownerIdNumber: 'תעודת זהות',
    ownerAddress: 'כתובת מגורים',
    ownerPhone: 'טלפון',
    ownerEmail: 'אימייל',
    ownerEmailOptional: 'אופציונלי',
    
    // Property section
    propertyDetails: 'פרטי הנכס',
    propertyAddress: 'כתובת הנכס',
    propertyGushHelka: 'גוש/חלקה',
    propertyGushHelkaHint: 'חובה למכירה',
    propertySizeSqm: 'שטח במ"ר',
    propertyRooms: 'מספר חדרים',
    propertyFloor: 'קומה',
    propertyParking: 'חניה',
    propertyStorage: 'מחסן',
    propertyBalcony: 'מרפסת',
    propertyElevator: 'מעלית',
    
    // Transaction type
    transactionType: 'סוג העסקה',
    sale: 'מכירה',
    rent: 'השכרה',
    askingPrice: 'מחיר מבוקש',
    askingPriceSale: 'מחיר מכירה מבוקש',
    askingPriceRent: 'דמי שכירות חודשיים',
    currency: '₪',
    
    // Exclusivity period
    exclusivityPeriod: 'תקופת הבלעדיות',
    startDate: 'תאריך התחלה',
    periodLength: 'משך התקופה',
    endDate: 'תאריך סיום',
    months: 'חודשים',
    month: 'חודש',
    periodWarning: 'ללא ציון תקופה - הבלעדיות תפקע לאחר 30 יום בלבד',
    periodLegalNote: 'לפי חוק המתווכים במקרקעין: דירה - עד 6 חודשים, נכס אחר - עד שנה',
    maxPeriodApartment: 'מקסימום לדירה: 6 חודשים',
    maxPeriodOther: 'מקסימום לנכס אחר: 12 חודשים',
    
    // Defects disclosure
    defectsDisclosure: 'שאלון גילוי ליקויים',
    defectsDisclosureDesc: 'לפי תקנות המתווכים במקרקעין (פרטים ותנאים בהסכם בלעדיות), תשפ"ד-2024',
    defectMoisture: 'רטיבויות',
    defectMoistureDesc: 'האם קיימות רטיבויות או סימני רטיבות בנכס?',
    defectBuildingViolations: 'חריגות בנייה',
    defectBuildingViolationsDesc: 'האם קיימות חריגות בנייה או תוספות שנבנו ללא היתר?',
    defectInfrastructure: 'ליקויים בתשתיות',
    defectInfrastructureDesc: 'האם קיימים ליקויים במערכות המים, חשמל, ביוב או גז?',
    defectDangerousBuilding: 'בניין מסוכן',
    defectDangerousBuildingDesc: 'האם הנכס/הבניין הוכרז כמבנה מסוכן?',
    defectLegalClaims: 'תביעות משפטיות',
    defectLegalClaimsDesc: 'האם קיימות תביעות משפטיות או מחלוקות הנוגעות לנכס?',
    defectNuisance: 'מטרדים סביבתיים',
    defectNuisanceDesc: 'האם קיימים מטרדי רעש, ריח או קרינה באזור?',
    defectOther: 'ליקויים אחרים',
    defectOtherDesc: 'האם ידוע לך על ליקויים נוספים שלא צוינו לעיל?',
    defectNone: 'לא ידוע לי על ליקויים',
    defectNoneDesc: 'אני מצהיר/ה שלא ידוע לי על ליקויים בנכס',
    defectDetails: 'פרטים נוספים על הליקויים',
    defectDetailsPlaceholder: 'נא לפרט את הליקויים שסומנו...',
    
    // Marketing activities
    marketingActivities: 'פעולות שיווק',
    marketingActivitiesDesc: 'פעולות השיווק שהמתווך מתחייב לבצע (לפי תקנות המתווכים במקרקעין)',
    marketingSignage: 'שילוט פיזי',
    marketingSignageDesc: 'הצבת שלט על הנכס או בסביבתו',
    marketingInternet: 'פרסום באינטרנט',
    marketingInternetDesc: 'פרסום באתרי נדל"ן (יד2, מדלן, הומלס וכו\')',
    marketingSocialMedia: 'רשתות חברתיות',
    marketingSocialMediaDesc: 'פרסום בפייסבוק, אינסטגרם ופלטפורמות נוספות',
    marketingPress: 'עיתונות',
    marketingPressDesc: 'פרסום בעיתונות מודפסת או דיגיטלית',
    marketingBrokerNetwork: 'רשת מתווכים',
    marketingBrokerNetworkDesc: 'הזמנת לפחות 5 מתווכים לשיתוף פעולה',
    marketingPhotography: 'צילום מקצועי',
    marketingPhotographyDesc: 'צילום תמונות מקצועיות של הנכס',
    marketingVirtualTour: 'סיור וירטואלי',
    marketingVirtualTourDesc: 'יצירת סיור 360° או סרטון וידאו',
    marketingOther: 'פעולות נוספות',
    marketingOtherPlaceholder: 'פרט פעולות שיווק נוספות...',
    marketingLegalNote: 'הבלעדיות תפקע לאחר שליש מהתקופה אם לא בוצעו פעולות השיווק',
    
    // Commission
    commission: 'עמלת תיווך',
    commissionPercentage: 'אחוז עמלה',
    commissionIncludesVat: 'כולל מע"מ',
    commissionExcludesVat: 'לא כולל מע"מ',
    commissionRentalNote: 'עמלה מקובלת להשכרה: דמי שכירות חודש אחד + מע"מ',
    commissionSaleNote: 'עמלה מקובלת למכירה: 2% מערך העסקה + מע"מ',
    
    // Legal terms
    legalTerms: 'תנאי ההסכם',
    term1Title: 'בלעדיות מלאה',
    term1Text: 'בעל הנכס מתחייב שלא להתקשר עם מתווך אחר ו/או לפרסם את הנכס בעצמו במהלך תקופת הבלעדיות.',
    term2Title: 'תוקף הבלעדיות',
    term2Text: 'הבלעדיות תיכנס לתוקף עם חתימת הסכם זה ותסתיים בתאריך הסיום הנקוב לעיל.',
    term3Title: 'הפרת הבלעדיות',
    term3Text: 'במקרה של הפרת הבלעדיות על ידי בעל הנכס, הוא יחויב בתשלום מלוא דמי התיווך המוסכמים.',
    term4Title: 'הגורם היעיל',
    term4Text: 'המתווך יהיה זכאי לעמלה מלאה על כל עסקה שנסגרה עם לקוח שהופנה על ידו במהלך תקופת הבלעדיות.',
    term5Title: 'תקופת מימוש',
    term5Text: 'המתווך יהיה זכאי לעמלה גם על עסקאות שנסגרות תוך 6 חודשים לאחר תום הבלעדיות עם לקוח שהופנה במהלכה.',
    term6Title: 'ביטול הסכם',
    term6Text: 'ביטול ההסכם לפני תום תקופת הבלעדיות יחייב בפיצוי המתווך בגובה העמלה המוסכמת.',
    
    // Confirmations
    confirmations: 'אישורים',
    confirmUnderstanding: 'הבנת המסמך',
    confirmUnderstandingText: 'אני מאשר/ת כי הוסבר לי תוכן מסמך זה ואני מבין/ה את משמעותו',
    confirmAccuracy: 'נכונות המידע',
    confirmAccuracyText: 'אני מאשר/ת כי כל המידע שמסרתי על הנכס הוא נכון, מלא ומדויק',
    confirmDefects: 'גילוי ליקויים',
    confirmDefectsText: 'אני מאשר/ת כי גיליתי את כל הליקויים הידועים לי בנכס כמפורט לעיל',
    
    // Signatures
    signatures: 'חתימות',
    ownerSignature: 'חתימת בעל הנכס',
    brokerSignature: 'חתימת המתווך',
    clearSignature: 'נקה חתימה',
    date: 'תאריך',
    
    // Buttons
    createLink: 'צור לינק לחתימה',
    copyLink: 'העתק לינק',
    sendWhatsApp: 'שלח בוואטסאפ',
    saveForm: 'שמור טופס',
    closeWindow: 'סגור חלון',
    
    // Messages
    linkCreated: 'הלינק נוצר בהצלחה!',
    linkCreatedSuccess: 'הלינק נוצר בהצלחה!',
    sendLinkToOwner: 'שלח את הלינק לבעל הנכס לחתימה',
    linkCopied: 'הלינק הועתק ללוח',
    formSaved: 'הטופס נשמר בהצלחה!',
    whatsAppMessage: 'שלום, מצורף קישור להסכם בלעדיות:',
    
    // Errors
    errorInvalidLink: 'הלינק לא תקין או שפג תוקפו',
    errorLoadingForm: 'שגיאה בטעינת הטופס',
    errorFillDate: 'נא למלא תאריך',
    errorCompleteBrokerDetails: 'נא להשלים את פרטי המתווך בהגדרות',
    errorSelectTransactionType: 'נא לבחור סוג עסקה (מכירה/השכרה)',
    errorFillPropertyAddress: 'נא למלא כתובת הנכס',
    errorAgentSignature: 'נא לחתום חתימת מתווך',
    errorOwnerDetails: 'נא למלא את כל פרטי בעל הנכס',
    errorOwnerConfirmation: 'נא לאשר את כל ההצהרות',
    errorOwnerSignature: 'נא לחתום חתימת בעל נכס',
    errorCreatingLink: 'שגיאה ביצירת הלינק',
    errorSavingForm: 'שגיאה בשמירת הטופס',
    errorSelectMarketingActivities: 'נא לבחור לפחות פעולת שיווק אחת',
    errorSelectExclusivityPeriod: 'נא לבחור תקופת בלעדיות',
  },
  en: {
    // Page titles
    title: 'Exclusive Listing Agreement',
    subtitle: 'Exclusive Real Estate Brokerage Agreement',
    fillDetails: 'Please fill in the details and sign the form',
    
    // Language selector
    languageLabel: 'Language',
    
    // Broker section
    brokerDetails: 'Broker Details',
    name: 'Name',
    license: 'License',
    phone: 'Phone',
    idNumber: 'ID',
    brokerDetailsIncomplete: 'Broker details are incomplete',
    brokerDetailsWarning: 'Please complete broker details in settings before creating an exclusive listing form',
    goToSettings: 'Go to Settings',
    
    // Owner section
    ownerDetails: 'Property Owner Details',
    ownerName: 'Full Name',
    ownerIdNumber: 'ID Number',
    ownerAddress: 'Residential Address',
    ownerPhone: 'Phone',
    ownerEmail: 'Email',
    ownerEmailOptional: 'Optional',
    
    // Property section
    propertyDetails: 'Property Details',
    propertyAddress: 'Property Address',
    propertyGushHelka: 'Block/Parcel',
    propertyGushHelkaHint: 'Required for sale',
    propertySizeSqm: 'Size (sqm)',
    propertyRooms: 'Rooms',
    propertyFloor: 'Floor',
    propertyParking: 'Parking',
    propertyStorage: 'Storage',
    propertyBalcony: 'Balcony',
    propertyElevator: 'Elevator',
    
    // Transaction type
    transactionType: 'Transaction Type',
    sale: 'Sale',
    rent: 'Rent',
    askingPrice: 'Asking Price',
    askingPriceSale: 'Sale Price',
    askingPriceRent: 'Monthly Rent',
    currency: '₪',
    
    // Exclusivity period
    exclusivityPeriod: 'Exclusivity Period',
    startDate: 'Start Date',
    periodLength: 'Period Length',
    endDate: 'End Date',
    months: 'months',
    month: 'month',
    periodWarning: 'Without specifying a period - exclusivity expires after 30 days only',
    periodLegalNote: 'According to Israeli Real Estate Brokers Law: Apartment - up to 6 months, Other property - up to 1 year',
    maxPeriodApartment: 'Maximum for apartment: 6 months',
    maxPeriodOther: 'Maximum for other property: 12 months',
    
    // Defects disclosure
    defectsDisclosure: 'Defects Disclosure Questionnaire',
    defectsDisclosureDesc: 'According to Real Estate Brokers Regulations (Details and Conditions in Exclusivity Agreement), 2024',
    defectMoisture: 'Moisture',
    defectMoistureDesc: 'Is there moisture or signs of moisture damage in the property?',
    defectBuildingViolations: 'Building Violations',
    defectBuildingViolationsDesc: 'Are there building violations or additions built without permit?',
    defectInfrastructure: 'Infrastructure Defects',
    defectInfrastructureDesc: 'Are there defects in water, electricity, sewage or gas systems?',
    defectDangerousBuilding: 'Dangerous Building',
    defectDangerousBuildingDesc: 'Has the property/building been declared as a dangerous structure?',
    defectLegalClaims: 'Legal Claims',
    defectLegalClaimsDesc: 'Are there legal claims or disputes regarding the property?',
    defectNuisance: 'Environmental Nuisances',
    defectNuisanceDesc: 'Are there noise, odor or radiation nuisances in the area?',
    defectOther: 'Other Defects',
    defectOtherDesc: 'Are you aware of any other defects not mentioned above?',
    defectNone: 'No Known Defects',
    defectNoneDesc: 'I declare that I am not aware of any defects in the property',
    defectDetails: 'Additional Details About Defects',
    defectDetailsPlaceholder: 'Please detail the defects marked above...',
    
    // Marketing activities
    marketingActivities: 'Marketing Activities',
    marketingActivitiesDesc: 'Marketing activities the broker commits to perform (per Real Estate Brokers Regulations)',
    marketingSignage: 'Physical Signage',
    marketingSignageDesc: 'Placing a sign on or near the property',
    marketingInternet: 'Internet Advertising',
    marketingInternetDesc: 'Advertising on real estate websites (Yad2, Madlan, Homeless, etc.)',
    marketingSocialMedia: 'Social Media',
    marketingSocialMediaDesc: 'Advertising on Facebook, Instagram and other platforms',
    marketingPress: 'Press',
    marketingPressDesc: 'Advertising in print or digital press',
    marketingBrokerNetwork: 'Broker Network',
    marketingBrokerNetworkDesc: 'Inviting at least 5 brokers for cooperation',
    marketingPhotography: 'Professional Photography',
    marketingPhotographyDesc: 'Taking professional photos of the property',
    marketingVirtualTour: 'Virtual Tour',
    marketingVirtualTourDesc: 'Creating a 360° tour or video',
    marketingOther: 'Additional Activities',
    marketingOtherPlaceholder: 'Specify additional marketing activities...',
    marketingLegalNote: 'Exclusivity expires after one-third of the period if marketing activities are not performed',
    
    // Commission
    commission: 'Brokerage Commission',
    commissionPercentage: 'Commission Percentage',
    commissionIncludesVat: 'Including VAT',
    commissionExcludesVat: 'Excluding VAT',
    commissionRentalNote: 'Standard rental commission: One month\'s rent + VAT',
    commissionSaleNote: 'Standard sale commission: 2% of transaction value + VAT',
    
    // Legal terms
    legalTerms: 'Agreement Terms',
    term1Title: 'Full Exclusivity',
    term1Text: 'The property owner commits not to engage with any other broker and/or advertise the property independently during the exclusivity period.',
    term2Title: 'Exclusivity Validity',
    term2Text: 'The exclusivity shall take effect upon signing this agreement and shall end on the end date specified above.',
    term3Title: 'Breach of Exclusivity',
    term3Text: 'In case of breach of exclusivity by the property owner, they shall be liable for the full agreed brokerage fee.',
    term4Title: 'Effective Cause',
    term4Text: 'The broker shall be entitled to the full commission for any transaction closed with a client referred by them during the exclusivity period.',
    term5Title: 'Realization Period',
    term5Text: 'The broker shall be entitled to commission for transactions closed within 6 months after the exclusivity ends with clients referred during it.',
    term6Title: 'Agreement Cancellation',
    term6Text: 'Cancellation of the agreement before the end of the exclusivity period shall require compensation to the broker equal to the agreed commission.',
    
    // Confirmations
    confirmations: 'Confirmations',
    confirmUnderstanding: 'Document Understanding',
    confirmUnderstandingText: 'I confirm that this document was explained to me and I understand its meaning',
    confirmAccuracy: 'Information Accuracy',
    confirmAccuracyText: 'I confirm that all information I provided about the property is true, complete and accurate',
    confirmDefects: 'Defects Disclosure',
    confirmDefectsText: 'I confirm that I have disclosed all known defects in the property as detailed above',
    
    // Signatures
    signatures: 'Signatures',
    ownerSignature: 'Property Owner Signature',
    brokerSignature: 'Broker Signature',
    clearSignature: 'Clear Signature',
    date: 'Date',
    
    // Buttons
    createLink: 'Create Signing Link',
    copyLink: 'Copy Link',
    sendWhatsApp: 'Send via WhatsApp',
    saveForm: 'Save Form',
    closeWindow: 'Close Window',
    
    // Messages
    linkCreated: 'Link created successfully!',
    linkCreatedSuccess: 'Link Created Successfully!',
    sendLinkToOwner: 'Send the link to the property owner for signature',
    linkCopied: 'Link copied to clipboard',
    formSaved: 'Form saved successfully!',
    whatsAppMessage: 'Hello, attached is a link to the exclusive listing agreement:',
    
    // Errors
    errorInvalidLink: 'Invalid or expired link',
    errorLoadingForm: 'Error loading form',
    errorFillDate: 'Please fill in the date',
    errorCompleteBrokerDetails: 'Please complete broker details in settings',
    errorSelectTransactionType: 'Please select transaction type (sale/rent)',
    errorFillPropertyAddress: 'Please fill in property address',
    errorAgentSignature: 'Please provide broker signature',
    errorOwnerDetails: 'Please fill in all property owner details',
    errorOwnerConfirmation: 'Please confirm all declarations',
    errorOwnerSignature: 'Please provide property owner signature',
    errorCreatingLink: 'Error creating link',
    errorSavingForm: 'Error saving form',
    errorSelectMarketingActivities: 'Please select at least one marketing activity',
    errorSelectExclusivityPeriod: 'Please select exclusivity period',
  }
};

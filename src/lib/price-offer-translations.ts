export const priceOfferBuilderTranslations = {
  he: {
    // Page titles
    newOffer: 'הצעת מחיר חדשה',
    editOffer: 'עריכת הצעת מחיר',
    
    // Action buttons
    preview: 'תצוגה מקדימה',
    copyLink: 'העתק לינק',
    shareWhatsApp: 'שתף ב-WhatsApp',
    saveAsTemplate: 'שמור כתבנית',
    saveDraft: 'שמור טיוטה',
    publish: 'פרסם',
    
    // Basic details section
    basicDetails: 'פרטים בסיסיים',
    propertyTitle: 'כותרת נכס',
    propertyTitlePlaceholder: 'פנקס 67, תל אביב יפו',
    slug: 'Slug / קישור מותאם (אופציונלי)',
    slugPlaceholder: 'penthouse-rothschild-67',
    linkWillBe: 'הקישור יהיה:',
    yourSlug: '[slug-שלך]',
    technicalDetails: 'פרטים טכניים',
    technicalDetailsPlaceholder: 'קומה 2 | כיכר 2 | מגרש 902...',
    
    // Language
    language: 'שפה',
    hebrew: 'עברית',
    english: 'English',
    
    // Block builder
    buildOffer: 'בניית ההצעה',
    saveOfferToAddBlocks: 'שמור את ההצעה כדי להתחיל להוסיף בלוקים',
    
    // Messages
    saveFirst: 'שמור קודם',
    saveBeforePreview: 'יש לשמור את ההצעה לפני התצוגה המקדימה',
    saveBeforeShare: 'יש לשמור ולפרסם את ההצעה לפני השיתוף',
    saveBeforeCopyLink: 'יש לשמור את ההצעה לפני העתקת הלינק',
    saveBeforeTemplate: 'יש לשמור את ההצעה לפני שמירה כתבנית',
    
    linkCopied: 'הלינק הועתק!',
    linkCopiedDesc: 'הלינק הועתק ללוח',
    
    offerPublished: 'הצעה פורסמה!',
    offerPublishedDesc: 'ההצעה פעילה ונגישה ללקוחות',
    offerSaved: 'הצעה נשמרה',
    draftSavedDesc: 'טיוטה נשמרה בהצלחה',
    
    templateSaved: 'תבנית נשמרה!',
    templateSavedDesc: 'התבנית נשמרה בהצלחה וזמינה לשימוש',
    
    error: 'שגיאה',
    saveError: 'שגיאה בשמירה',
    
    // WhatsApp
    whatsAppMessage: 'שלום! הנה הצעת המחיר עבור',
  },
  en: {
    // Page titles
    newOffer: 'New Price Offer',
    editOffer: 'Edit Price Offer',
    
    // Action buttons
    preview: 'Preview',
    copyLink: 'Copy Link',
    shareWhatsApp: 'Share on WhatsApp',
    saveAsTemplate: 'Save as Template',
    saveDraft: 'Save Draft',
    publish: 'Publish',
    
    // Basic details section
    basicDetails: 'Basic Details',
    propertyTitle: 'Property Title',
    propertyTitlePlaceholder: 'Rothschild 67, Tel Aviv',
    slug: 'Slug / Custom Link (optional)',
    slugPlaceholder: 'penthouse-rothschild-67',
    linkWillBe: 'Link will be:',
    yourSlug: '[your-slug]',
    technicalDetails: 'Technical Details',
    technicalDetailsPlaceholder: 'Floor 2 | Block 2 | Plot 902...',
    
    // Language
    language: 'Language',
    hebrew: 'עברית',
    english: 'English',
    
    // Block builder
    buildOffer: 'Build Offer',
    saveOfferToAddBlocks: 'Save the offer to start adding blocks',
    
    // Messages
    saveFirst: 'Save first',
    saveBeforePreview: 'Please save the offer before previewing',
    saveBeforeShare: 'Please save and publish the offer before sharing',
    saveBeforeCopyLink: 'Please save the offer before copying the link',
    saveBeforeTemplate: 'Please save the offer before saving as template',
    
    linkCopied: 'Link copied!',
    linkCopiedDesc: 'Link copied to clipboard',
    
    offerPublished: 'Offer published!',
    offerPublishedDesc: 'The offer is now active and accessible to clients',
    offerSaved: 'Offer saved',
    draftSavedDesc: 'Draft saved successfully',
    
    templateSaved: 'Template saved!',
    templateSavedDesc: 'Template saved successfully and is ready for use',
    
    error: 'Error',
    saveError: 'Error saving',
    
    // WhatsApp
    whatsAppMessage: "Hello! Here's the price offer for",
  }
};

export type PriceOfferLanguage = 'he' | 'en';

export const usePriceOfferTranslation = (language: PriceOfferLanguage) => {
  return priceOfferBuilderTranslations[language];
};

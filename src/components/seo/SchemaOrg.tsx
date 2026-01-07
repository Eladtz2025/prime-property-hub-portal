import { Helmet } from "react-helmet";

const BASE_URL = "https://www.ctmarketproperties.com";

interface OrganizationSchemaProps {
  language: 'he' | 'en';
}

export const OrganizationSchema = ({ language }: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "name": "CITY MARKET Properties",
    "alternateName": language === 'he' ? "סיטי מרקט נכסים" : "City Market Properties",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo.png`,
    "image": `${BASE_URL}/images/hero-about.jpg`,
    "description": language === 'he' 
      ? "מומחים בתיווך נדל\"ן, השכרות, מכירות וניהול נכסים בתל אביב"
      : "Experts in real estate brokerage, rentals, sales and property management in Tel Aviv",
    "telephone": "+972-54-228-4477",
    "email": "citymarketlv@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tel Aviv",
      "addressRegion": "Tel Aviv District",
      "addressCountry": "IL"
    },
    "areaServed": {
      "@type": "City",
      "name": "Tel Aviv",
      "containedIn": "Israel"
    },
    "priceRange": "₪₪₪",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Friday",
        "opens": "09:00",
        "closes": "14:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/citymarketproperties",
      "https://www.instagram.com/citymarketproperties"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface WebSiteSchemaProps {
  language: 'he' | 'en';
}

export const WebSiteSchema = ({ language }: WebSiteSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CITY MARKET Properties",
    "alternateName": language === 'he' ? "סיטי מרקט נכסים" : "City Market Properties",
    "url": BASE_URL,
    "inLanguage": language === 'he' ? "he-IL" : "en-US",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/${language}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface LocalBusinessSchemaProps {
  language: 'he' | 'en';
}

export const LocalBusinessSchema = ({ language }: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#localbusiness`,
    "name": "CITY MARKET Properties",
    "image": `${BASE_URL}/images/hero-about.jpg`,
    "telephone": "+972-54-228-4477",
    "email": "citymarketlv@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tel Aviv",
      "addressRegion": "Tel Aviv District",
      "addressCountry": "IL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 32.0853,
      "longitude": 34.7818
    },
    "url": BASE_URL,
    "priceRange": "₪₪₪",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Friday",
        "opens": "09:00",
        "closes": "14:00"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": language === 'he' ? "שירותי נדל\"ן" : "Real Estate Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": language === 'he' ? "מכירת נכסים" : "Property Sales"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": language === 'he' ? "השכרת נכסים" : "Property Rentals"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": language === 'he' ? "ניהול נכסים" : "Property Management"
          }
        }
      ]
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface RealEstateListingSchemaProps {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  address: string;
  city: string;
  rooms?: number;
  size?: number;
  imageUrl?: string;
  url: string;
  listingType: 'sale' | 'rent';
}

export const RealEstateListingSchema = ({ 
  title, 
  description, 
  price, 
  currency = 'ILS',
  address, 
  city, 
  rooms, 
  size, 
  imageUrl,
  url,
  listingType
}: RealEstateListingSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": title,
    "description": description,
    "url": url,
    ...(imageUrl && { "image": imageUrl }),
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "businessFunction": listingType === 'sale' 
          ? "https://schema.org/Sell" 
          : "https://schema.org/LeaseOut"
      }
    }),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address,
      "addressLocality": city,
      "addressCountry": "IL"
    },
    ...(rooms && { "numberOfRooms": rooms }),
    ...(size && { "floorSize": { "@type": "QuantitativeValue", "value": size, "unitCode": "MTK" } })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

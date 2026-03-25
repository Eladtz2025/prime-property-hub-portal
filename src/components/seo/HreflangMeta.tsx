import { Helmet } from "react-helmet";

const BASE_URL = "https://www.ctmarketproperties.com";

// Map of Hebrew paths to English paths
const PATH_MAPPING: Record<string, string> = {
  '/he': '/en',
  '/he/about': '/en/about',
  '/he/contact': '/en/contact',
  '/he/rentals': '/en/rentals',
  '/he/sales': '/en/sales',
  '/he/management': '/en/management',
  '/he/neighborhoods': '/en/neighborhoods',
  '/he/new-developments': '/en/new-developments',
  '/he/insights': '/en/insights',
  '/he/properties': '/en/properties',
  // Neighborhood pages
  '/he/neighborhoods/rothschild': '/en/neighborhoods/rothschild',
  '/he/neighborhoods/neve-tzedek': '/en/neighborhoods/neve-tzedek',
  '/he/neighborhoods/florentin': '/en/neighborhoods/florentin',
  '/he/neighborhoods/dizengoff': '/en/neighborhoods/dizengoff',
  '/he/neighborhoods/old-north': '/en/neighborhoods/old-north',
  '/he/neighborhoods/lev-hair': '/en/neighborhoods/lev-hair',
  '/he/neighborhoods/kerem-hateimanim': '/en/neighborhoods/kerem-hateimanim',
};

// Create reverse mapping
const REVERSE_PATH_MAPPING: Record<string, string> = {};
Object.entries(PATH_MAPPING).forEach(([he, en]) => {
  REVERSE_PATH_MAPPING[en] = he;
});

interface HreflangMetaProps {
  currentLang: 'he' | 'en';
  currentPath: string;
}

export const HreflangMeta = ({ currentLang, currentPath }: HreflangMetaProps) => {
  // Normalize path (remove trailing slash)
  const normalizedPath = currentPath.endsWith('/') && currentPath !== '/' 
    ? currentPath.slice(0, -1) 
    : currentPath;
  
  // Determine the alternate language path
  let hePath: string;
  let enPath: string;
  
  if (currentLang === 'he') {
    hePath = normalizedPath;
    enPath = PATH_MAPPING[normalizedPath] || normalizedPath.replace('/he', '/en');
  } else {
    enPath = normalizedPath;
    hePath = REVERSE_PATH_MAPPING[normalizedPath] || normalizedPath.replace('/en', '/he');
  }
  
  const heUrl = `${BASE_URL}${hePath}`;
  const enUrl = `${BASE_URL}${enPath}`;
  
  // x-default points to Hebrew (primary market)
  const defaultUrl = heUrl;

  return (
    <Helmet>
      <link rel="alternate" hrefLang="he" href={heUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={defaultUrl} />
    </Helmet>
  );
};

export default HreflangMeta;

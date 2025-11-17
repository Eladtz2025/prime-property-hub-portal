/**
 * Create SEO-friendly slug from property title and ID
 * Example: "דירת גן מהממת" + "7d7a22d9-..." → "דירת-גן-מהממת-7d7a22d9"
 */
export const createPropertySlug = (title: string, id: string): string => {
  // Extract first part of UUID for shorter URL
  const shortId = id.split('-')[0];
  
  // Create slug from title
  const slug = title
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\u0590-\u05FF\w-]/g, ''); // Keep only Hebrew letters, word chars, and hyphens
  
  return `${slug}-${shortId}`;
};

/**
 * Extract property ID from slug
 * Example: "דירת-גן-מהממת-7d7a22d9" → "7d7a22d9"
 */
export const extractIdFromSlug = (slug: string): string => {
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  return shortId;
};

/**
 * Find full property ID from short ID (requires database query)
 */
export const isShortId = (id: string): boolean => {
  // UUID format: 8-4-4-4-12 characters
  // Short ID: 8 characters
  return id.length === 8 && !id.includes('-');
};

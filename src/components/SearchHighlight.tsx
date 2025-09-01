import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ 
  text, 
  searchTerm, 
  className = "" 
}) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark 
            key={index} 
            className="bg-yellow-200 text-yellow-900 px-1 rounded dark:bg-yellow-900 dark:text-yellow-100"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
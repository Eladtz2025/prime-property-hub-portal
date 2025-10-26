interface PriceOfferMapBlockProps {
  title?: string;
  address: string;
  mapUrl?: string;
}

const PriceOfferMapBlock = ({ title, address, mapUrl }: PriceOfferMapBlockProps) => {
  const getMapEmbedSrc = () => {
    if (mapUrl) {
      // Extract src from iframe
      const srcMatch = mapUrl.match(/src="([^"]+)"/);
      if (srcMatch) {
        return srcMatch[1];
      }
      return mapUrl;
    }
    
    // Fallback: Generate Google Maps embed URL from address
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      {title && (
        <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
      )}
      
      <div className="mb-4">
        <p className="text-muted-foreground">
          <span className="font-medium">כתובת:</span> {address}
        </p>
      </div>

      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
        <iframe
          src={getMapEmbedSrc()}
          title={`מפה - ${address}`}
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default PriceOfferMapBlock;

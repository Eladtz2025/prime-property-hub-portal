import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import LightPitchDeck from "@/components/price-offer/light-pitch/LightPitchDeck";

// Static offer data for known slugs
const STATIC_OFFERS: Record<string, { propertyAddress: string; propertyCity: string }> = {
  'ben-yehuda-110': {
    propertyAddress: '110 BEN YEHUDA STREET',
    propertyCity: 'TEL AVIV-YAFO',
  }
};

const PriceOfferLightView = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check for static offer
  const offer = STATIC_OFFERS[token];
  
  if (!offer) {
    return <Navigate to="/" replace />;
  }

  return (
    <LightPitchDeck 
      propertyAddress={offer.propertyAddress} 
      propertyCity={offer.propertyCity} 
    />
  );
};

export default PriceOfferLightView;

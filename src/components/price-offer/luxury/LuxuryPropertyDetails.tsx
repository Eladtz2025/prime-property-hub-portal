import { Home, Maximize, Layers, Car, Wind, DoorOpen, Square } from "lucide-react";

interface PropertyDetail {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

interface LuxuryPropertyDetailsProps {
  details: PropertyDetail[];
  title?: string;
}

const LuxuryPropertyDetails = ({ details, title }: LuxuryPropertyDetailsProps) => {
  if (!details || details.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-16 text-center font-serif text-3xl font-light text-gray-900 md:text-4xl">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {details.map((detail, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center border-b border-gray-100 pb-6 text-center"
          >
            <div className="mb-4 text-gray-400">
              {detail.icon}
            </div>
            <p className="mb-1 text-2xl font-light text-gray-900 md:text-3xl">
              {detail.value}
            </p>
            <p className="text-xs font-light uppercase tracking-widest text-gray-500">
              {detail.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LuxuryPropertyDetails;

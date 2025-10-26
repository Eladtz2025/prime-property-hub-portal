const PriceOfferDivider = () => {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative flex justify-center">
        <div className="bg-background px-4">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default PriceOfferDivider;

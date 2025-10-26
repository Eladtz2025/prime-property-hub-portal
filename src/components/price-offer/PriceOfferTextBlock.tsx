interface PriceOfferTextBlockProps {
  title?: string;
  content: string;
}

const PriceOfferTextBlock = ({ title, content }: PriceOfferTextBlockProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      {title && (
        <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
};

export default PriceOfferTextBlock;

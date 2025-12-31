interface ImageSlideProps {
  imageUrl: string;
  caption?: string;
}

const ImageSlide = ({ imageUrl, caption }: ImageSlideProps) => {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-8 pt-24 pb-32">
      {/* Image Container */}
      <div className="relative w-full h-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
        <img
          src={imageUrl}
          alt={caption || ""}
          className="w-full h-full object-cover"
        />
        
        {/* Caption Overlay */}
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
            <p className="text-white text-xl md:text-2xl font-light text-center">
              {caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSlide;

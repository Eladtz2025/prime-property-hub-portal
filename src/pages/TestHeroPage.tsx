import HeaderTest from "@/components/he/HeaderTest";
import VideoHero from "@/components/he/VideoHero";

const TestHeroPage = () => {
  return (
    <div dir="rtl">
      <HeaderTest />
      <VideoHero
        title="CITY MARKET"
        subtitle="מומחיות מקומית. שירות אישי. תהליך ברור."
      />
    </div>
  );
};

export default TestHeroPage;

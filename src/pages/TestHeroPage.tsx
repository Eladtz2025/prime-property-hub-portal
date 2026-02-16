import HeaderTest from "@/components/he/HeaderTest";
import VideoHero from "@/components/he/VideoHero";

const TestHeroPage = () => {
  return (
    <div dir="rtl">
      <HeaderTest />
      <VideoHero
        title="CITY MARKET"
        subtitle="נדל״ן בתל אביב"
      />
    </div>
  );
};

export default TestHeroPage;

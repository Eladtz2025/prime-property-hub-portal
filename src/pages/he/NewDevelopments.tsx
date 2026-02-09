import HebrewHeader from "@/components/he/Header";
import HebrewFooter from "@/components/he/Footer";
import { NewDevelopmentCard } from "@/components/NewDevelopmentCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";
import HreflangMeta from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const NewDevelopments = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-projects-he"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", "project")
        .eq("show_on_website", true)
        .order("neighborhood", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Group by neighborhood
  const grouped = projects.reduce<Record<string, typeof projects>>((acc, project) => {
    const key = project.neighborhood || project.city || "אחר";
    if (!acc[key]) acc[key] = [];
    acc[key].push(project);
    return acc;
  }, {});

  return (
    <div className="min-h-screen hebrew-luxury" dir="rtl">
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>פרויקטים חדשים - נכסים חדשים בתל אביב, פלורנטין ונווה צדק | CITY MARKET Properties</title>
        <meta name="description" content='פרויקטי נדל"ן חדשים ויוקרתיים בתל אביב, פלורנטין ונווה צדק. גלו דירות חדשות, פנטהאוזים ונכסי בוטיק בפרויקטים המובילים.' />
        <meta property="og:title" content="פרויקטים חדשים - נכסים חדשים בתל אביב | CITY MARKET Properties" />
        <meta property="og:description" content='פרויקטי נדל"ן חדשים ויוקרתיים בתל אביב. גלו דירות חדשות, פנטהאוזים ונכסי בוטיק.' />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/he/new-developments" />
      </Helmet>
      <HreflangMeta currentLang="he" currentPath="/he/new-developments" />
      <OrganizationSchema language="he" />
      <WebSiteSchema language="he" />
      <BreadcrumbSchema items={[
        { name: "דף הבית", url: "https://www.ctmarketproperties.com/he" },
        { name: "פרויקטים חדשים", url: "https://www.ctmarketproperties.com/he/new-developments" }
      ]} />
      <HebrewHeader />

      <FullScreenHero
        title="פרויקטים חדשים בתל אביב"
        backgroundImage="/images/hero-new-developments.jpg"
        minHeight="100vh"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">פרויקטים חדשים יתווספו בקרוב</p>
        </div>
      ) : (
        Object.entries(grouped).map(([neighborhood, neighborhoodProjects], idx) => (
          <section key={neighborhood} className={`py-16 ${idx % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide text-foreground mb-2">
                  {neighborhood}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {neighborhoodProjects.map((project) => (
                  <NewDevelopmentCard
                    key={project.id}
                    id={project.id}
                    name={project.title || project.address}
                    neighborhood={project.neighborhood || ''}
                    city={project.city}
                    description={project.description || undefined}
                    roomsRange={project.rooms_range || undefined}
                    sizeRange={project.size_range || undefined}
                    buildingFloors={project.building_floors || undefined}
                    unitsCount={project.units_count || undefined}
                    parking={project.parking || false}
                    elevator={project.elevator || false}
                    balcony={project.balcony || false}
                    mamad={project.mamad || false}
                    hasStorage={project.has_storage || false}
                    projectStatus={project.project_status || undefined}
                    language="he"
                  />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      <HebrewFooter />
    </div>
  );
};

export default NewDevelopments;

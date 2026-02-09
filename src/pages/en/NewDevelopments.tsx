import EnglishHeader from "@/components/en/Header";
import EnglishFooter from "@/components/en/Footer";
import { NewDevelopmentCard } from "@/components/NewDevelopmentCard";
import { Helmet } from "react-helmet";
import FullScreenHero from "@/components/FullScreenHero";
import { HreflangMeta } from "@/components/seo/HreflangMeta";
import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from "@/components/seo/SchemaOrg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const NewDevelopments = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["public-projects-en"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", "project")
        .eq("show_on_website", true)
        .order("neighborhood_en", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Group by neighborhood (English)
  const grouped = projects.reduce<Record<string, typeof projects>>((acc, project) => {
    const key = project.neighborhood_en || project.neighborhood || project.city || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(project);
    return acc;
  }, {});

  return (
    <div className="min-h-screen english-luxury" dir="ltr">
      <Helmet>
        <html lang="en" dir="ltr" />
        <title>New Developments Tel Aviv | City Market Properties</title>
        <meta name="description" content="Explore luxury new developments in Tel Aviv, Florentin, and Neve Tzedek. Modern design, premium amenities, and prime locations. Request information today!" />
        <meta property="og:title" content="New Developments - City Market Properties" />
        <meta property="og:description" content="The future of modern living - luxury developments in Israel's top locations." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.ctmarketproperties.com/en/new-developments" />
      </Helmet>
      <HreflangMeta currentLang="en" currentPath="/en/new-developments" />
      <OrganizationSchema language="en" />
      <WebSiteSchema language="en" />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://www.ctmarketproperties.com/en" },
        { name: "New Developments", url: "https://www.ctmarketproperties.com/en/new-developments" }
      ]} />
      <EnglishHeader />

      <FullScreenHero
        title="New Developments in Tel Aviv"
        backgroundImage="/images/hero-new-developments.jpg"
        minHeight="100vh"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">New developments coming soon</p>
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
                    name={project.title_en || project.title || project.address}
                    neighborhood={project.neighborhood_en || project.neighborhood || ''}
                    city={project.city}
                    description={project.description_en || project.description || undefined}
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
                    language="en"
                  />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      <EnglishFooter />
    </div>
  );
};

export default NewDevelopments;

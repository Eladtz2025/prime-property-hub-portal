import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface TeamMember {
  name: string;
  filename: string;
  prompt: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "David Cohen",
    filename: "david-cohen.jpg",
    prompt: "Professional headshot photograph of an Israeli male executive, age 45-50, salt-and-pepper short hair, wearing an elegant tailored navy blue suit with white shirt, confident professional smile, luxurious modern office background with Tel Aviv cityscape visible through windows, soft natural lighting, corporate photography style, photorealistic, high quality, ultra detailed, 8k resolution",
  },
  {
    name: "Sarah Levi",
    filename: "sarah-levi.jpg",
    prompt: "Professional headshot photograph of an Israeli female executive, age 35-40, long dark brown hair, wearing elegant business attire in deep burgundy, warm professional smile, modern luxury real estate office background, soft natural lighting, approachable and energetic expression, corporate photography style, photorealistic, high quality, ultra detailed, 8k resolution",
  },
  {
    name: "Yossi Abraham",
    filename: "yossi-abraham.jpg",
    prompt: "Professional headshot photograph of an Israeli male professional, age 30-35, short dark hair with well-groomed beard, wearing smart casual attire - light blue button-down shirt, friendly and approachable smile, modern urban office background with natural light, relaxed professional demeanor, corporate photography style, photorealistic, high quality, ultra detailed, 8k resolution",
  },
  {
    name: "Michal Golan",
    filename: "michal-golan.jpg",
    prompt: "Professional headshot photograph of an Israeli female executive, age 40-45, shoulder-length light brown hair with subtle blonde highlights, wearing professional grey blazer, confident professional smile, modern property management office background, natural lighting, assured and competent expression, corporate photography style, photorealistic, high quality, ultra detailed, 8k resolution",
  },
];

export const GenerateTeamImages = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  const generateImage = async (member: TeamMember) => {
    setGenerating(member.name);
    try {
      const { data, error } = await supabase.functions.invoke("generate-team-images", {
        body: { prompt: member.prompt, name: member.name },
      });

      if (error) {
        console.error("Function error:", error);
        toast.error(`Failed to generate ${member.name}: ${error.message}`);
        return;
      }

      if (data.error) {
        console.error("Data error:", data.error);
        toast.error(`Failed to generate ${member.name}: ${data.error}`);
        return;
      }

      if (!data.imageUrl) {
        toast.error(`No image received for ${member.name}`);
        return;
      }

      setGeneratedImages((prev) => ({
        ...prev,
        [member.filename]: data.imageUrl,
      }));

      toast.success(`Generated image for ${member.name}`);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(`Failed to generate image for ${member.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(null);
    }
  };

  const downloadImage = (filename: string, imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${filename}`);
  };

  const generateAll = async () => {
    for (const member of teamMembers) {
      await generateImage(member);
      // Wait 3 seconds between generations to avoid rate limits and allow processing time
      if (generating === null) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Generate Team Member Images</h2>
        <Button onClick={generateAll} disabled={generating !== null} className="mb-4">
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate All Images
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.filename} className="p-6">
            <h3 className="font-semibold text-lg mb-3">{member.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{member.prompt}</p>

            <div className="space-y-3">
              <Button
                onClick={() => generateImage(member)}
                disabled={generating !== null}
                variant="outline"
                className="w-full"
              >
                {generating === member.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Generate ${member.name}`
                )}
              </Button>

              {generatedImages[member.filename] && (
                <div className="space-y-3">
                  <img
                    src={generatedImages[member.filename]}
                    alt={member.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    onClick={() => downloadImage(member.filename, generatedImages[member.filename])}
                    variant="secondary"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download as {member.filename}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Generate All Images" or generate each image individually</li>
          <li>Download each generated image using the download button</li>
          <li>Save the images to <code className="bg-background px-1 rounded">public/images/team/</code></li>
          <li>After saving all images, this component can be deleted</li>
        </ol>
      </div>
    </div>
  );
};

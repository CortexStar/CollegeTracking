import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Function to handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast({
      title: "Success",
      description: "Image uploaded successfully",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <ContextMenu>
        <ContextMenuTrigger>
          <main 
            className="flex-grow flex items-center justify-center" 
            style={backgroundImage ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            {/* Empty main container, right-click anywhere to upload an image */}
          </main>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <label className="cursor-pointer w-full">
              Upload Image
              <Input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </label>
          </ContextMenuItem>
          {backgroundImage && (
            <ContextMenuItem onClick={() => setBackgroundImage(null)}>
              Remove Image
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Footer />
    </div>
  );
}
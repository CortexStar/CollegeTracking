import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (event.target?.result) {
        localStorage.setItem('backgroundImage', event.target.result as string);
        setBackgroundImage(event.target.result as string);
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Load saved image on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('backgroundImage');
    if (savedImage) {
      setBackgroundImage(savedImage);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <ContextMenu>
        <ContextMenuTrigger className="flex-grow">
          <div 
            className="w-full h-full min-h-[calc(100vh-132px)] relative flex items-center justify-center" 
            style={backgroundImage ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            {!backgroundImage && (
              <Button 
                variant="outline" 
                className="absolute bg-gray-700 text-gray-200 border-gray-600"
                onClick={() => fileInputRef.current?.click()}
              >
                Click to Upload an Image
              </Button>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
            Upload Image
          </ContextMenuItem>
          {backgroundImage && (
            <ContextMenuItem onClick={() => {
              setBackgroundImage(null);
              localStorage.removeItem('backgroundImage');
              toast({
                title: "Success",
                description: "Image removed",
              });
            }}>
              Remove Image
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Footer />
    </div>
  );
}
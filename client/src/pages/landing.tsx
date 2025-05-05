import React, { useState, useRef, useEffect, DragEvent } from "react";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to handle file processing
  const processFile = (file: File) => {
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

  // Function to handle image upload from input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      // Reset input value to allow selecting the same file again
      if (e.target) e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Ensure dragging state stays true if moving over children
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Load saved image on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('backgroundImage');
    if (savedImage) {
      setBackgroundImage(savedImage);
    }
  }, []);

  // Dynamic class names for the trigger based on state
  const triggerClasses = `flex flex-col h-full w-full cursor-pointer items-center justify-center transition-colors duration-200 ease-in-out ${
    backgroundImage
      ? '' // No border/extra classes when background is shown
      : `border-2 border-dashed rounded-lg ${
          isDragging
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700"
        }`
  }`;

  const triggerStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    // This outer div now takes full height from the Layout's main area
    <div className="flex h-full w-full flex-col items-center justify-center">
      <ContextMenu>
        <ContextMenuTrigger 
          className={triggerClasses}
          style={triggerStyle}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !backgroundImage && fileInputRef.current?.click()}
        >
          {/* Content shown ONLY when no background image */}
          {!backgroundImage && (
            <div className="text-center p-4">
              {/* icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3 mx-auto"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2 1.6-1.6a2 2 0 012.8 0L20 14M12 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                Click or drag an image here
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                (Right-click for options)
              </p>
            </div>
          )}
        </ContextMenuTrigger>

        {/* Right-click menu */}
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => fileInputRef.current?.click()}>
            Upload image
          </ContextMenuItem>
          {backgroundImage && (
            <ContextMenuItem
              onSelect={() => {
                setBackgroundImage(null);
                localStorage.removeItem("backgroundImage");
                toast({ title: "Success", description: "Image removed" });
              }}
            >
              Remove image
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Hidden file input - moved outside trigger for clarity */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
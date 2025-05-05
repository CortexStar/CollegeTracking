// src/pages/landing.tsx (relevant part)
import React, { useRef, useState, useEffect /* ... other imports */ } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"; // Assuming shadcn/ui path
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn/ui path
// ... other imports and component logic (useState for backgroundImage, refs, handlers etc.)

// ... inside your LandingPage component function ...
const fileInputRef = useRef<HTMLInputElement>(null);
const [backgroundImage, setBackgroundImage] = useState<string | null>(null); // Manage your state
const { toast } = useToast();

// Your event handlers: handleDragEnter, handleDragOver, handleDragLeave, handleDrop etc.
// Example handlers (ensure these are defined in your component):
const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); /* add visual cue? */ };
const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); /* remove visual cue? */ };
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  // Logic to handle dropped file, read it, setBackgroundImage, save to localStorage
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBackgroundImage(result);
      localStorage.setItem("backgroundImage", result);
      toast({ title: "Success", description: "Image uploaded" });
    };
    reader.readAsDataURL(file);
  } else {
     toast({ title: "Error", description: "Please drop an image file", variant: "destructive" });
  }
};

// Load image from local storage on mount
useEffect(() => {
    const storedImage = localStorage.getItem("backgroundImage");
    if (storedImage) {
        setBackgroundImage(storedImage);
    }
}, []);


return (
  <div className="flex h-full flex-col">
    {/* This outer div ensures the flex column layout takes full height */}
    <div className="flex flex-1 items-center justify-center overflow-hidden">
      {/* This div takes remaining space and centers content */}
      <ContextMenu>
        <ContextMenuTrigger
          className="flex h-full w-full cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700" // Added cursor, border for dropzone feel
          style={
            backgroundImage
              ? {
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: 'none', // Remove border when image is present
                }
              : {} // Apply default styles (border, etc.) when no image
          }
          // Apply event handlers directly to the trigger
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !backgroundImage && fileInputRef.current?.click()}
          // REMOVE onContextMenu - let the library handle it
        >
          {/* You can add content here IF needed when no background is set */}
          {!backgroundImage && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Drag & drop an image here, or click to upload</p>
              <p className="text-sm">(Right-click for options)</p>
            </div>
          )}
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
               if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  setBackgroundImage(result);
                  localStorage.setItem("backgroundImage", result);
                  toast({ title: "Success", description: "Image uploaded" });
                };
                reader.readAsDataURL(file);
              } else if (file) {
                 toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
              }
              // Reset input value to allow selecting the same file again
              if (e.target) e.target.value = '';
            }}
            accept="image/*"
            style={{ display: "none" }}
          />
        </ContextMenuTrigger>
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
    </div>
  </div>
);
import { useState, useRef, useEffect } from "react";
import { FileUp, FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Solution } from "@/hooks/use-solutions";
import { useSolutionsContext } from "@/components/solutions-provider";

interface SolutionUploadProps {
  problemSetId: string;
  sectionId: string;
}

export default function SolutionUpload({ problemSetId, sectionId }: SolutionUploadProps) {
  const { getSolution, addSolution, removeSolution } = useSolutionsContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [solution, setSolution] = useState<Solution | undefined>(
    getSolution(problemSetId, sectionId)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update the solution state when it changes in the hook
  useEffect(() => {
    setSolution(getSolution(problemSetId, sectionId));
  }, [getSolution, problemSetId, sectionId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      // Create a URL for the file (in a real app, this would be an API call)
      const fileUrl = URL.createObjectURL(selectedFile);
      
      const newSolution: Solution = {
        problemSetId,
        sectionId,
        fileName: selectedFile.name,
        fileUrl,
      };
      
      addSolution(newSolution);
      setSolution(newSolution);
      setIsDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const handleDelete = () => {
    removeSolution(problemSetId, sectionId);
    setSolution(undefined);
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {solution ? (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-1 h-8"
            onClick={() => window.open(solution.fileUrl, '_blank')}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Solution</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 p-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                Change File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                Remove Solution
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-1 h-8"
          onClick={() => setIsDialogOpen(true)}
        >
          <FileUp className="h-4 w-4" />
          <span className="text-sm font-medium">Solution</span>
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Solution</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div 
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={openFileInput}
            >
              <FileUp className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFile ? selectedFile.name : "Drag files here or click to browse"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
            </div>
            
            {selectedFile && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleUploadClick}
              disabled={!selectedFile}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
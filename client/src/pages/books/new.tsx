import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { BookMeta, saveBook } from "@/lib/bookStore";
import { v4 as uuid } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function NewBook() {
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const { toast } = useToast();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfUrl(URL.createObjectURL(f));
    setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  function save() {
    if (!pdfUrl || !title) {
      toast({
        title: "Missing information",
        description: "Please upload a PDF file and provide a title",
        variant: "destructive"
      });
      return;
    }
    
    const meta: BookMeta = { id: uuid(), title, author, url: pdfUrl };
    saveBook(meta);
    toast({
      title: "Book added",
      description: "Your book has been added successfully"
    });
    navigate(`/books/${meta.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-6 flex-grow">
      <h1 className="text-3xl font-bold mb-6">Add a New Book</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-4">
          <Button 
            size="lg"
            className="w-full h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 dark:text-gray-600"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M9 17h6" />
              <path d="M9 13h6" />
            </svg>
            {pdfUrl ? 'Change PDF...' : 'Choose PDF...'}
          </Button>
          
          <input
            ref={fileRef} 
            type="file" 
            accept="application/pdf" 
            hidden 
            onChange={handleFile}
          />

          {pdfUrl && (
            <>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Book title"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="author" className="text-sm font-medium">Author</label>
                  <Input
                    id="author"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Author name"
                  />
                </div>
              </div>
              
              <Button 
                onClick={save}
                className="mt-4"
                size="lg"
              >
                Save & Open Book
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
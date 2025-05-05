import { useState, useEffect, useMemo } from "react";
import { useLocation, Route, useParams } from "wouter";
import { getBook, updateBook } from "@/lib/bookStore";
import { Input } from "@/components/ui/input";
import TextbookToc from "@/components/textbook-toc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer } from "lucide-react";

export default function BookPage() {
  const params = useParams();
  const id = params.id;
  const [book, setBook] = useState(getBook(id));
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<{field: "title" | "author" | null}>({field: null});
  const { toast } = useToast();
  
  // Create a blob URL for the PDF data if needed
  const pdfUrl = useMemo(() => {
    if (book?.pdfData) {
      // Create a blob URL for the PDF data
      return book.pdfData;
    }
    return book?.url || '';
  }, [book]);

  // Refresh book data when the book changes
  useEffect(() => {
    const updatedBook = getBook(id);
    setBook(updatedBook);
    if (!updatedBook) {
      toast({
        title: "Book not found",
        description: "The book you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate("/textbook");
    }
  }, [id, navigate, toast]);

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold">Book not found</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            The book you're looking for doesn't exist
          </p>
          <Button className="mt-6" onClick={() => navigate("/books/new")}>
            Add a New Book
          </Button>
        </div>
      </div>
    );
  }

  function commit(field: "title" | "author", value: string) {
    updateBook(book.id, { [field]: value });
    setEditing({field: null});
    // Update local state
    setBook({...book, [field]: value});
    
    toast({
      title: `${field.charAt(0).toUpperCase() + field.slice(1)} updated`,
      description: `The ${field} has been updated successfully`,
    });
  }

  return (
    <div className="container mx-auto px-4 py-6 flex-grow">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-0">
          <div className="max-w-3xl">
            {editing.field === "title" ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) commit("title", input.value);
              }}>
                <Input
                  autoFocus 
                  defaultValue={book.title}
                  onBlur={(e) => commit("title", e.target.value)}
                  className="text-4xl font-bold mb-1 h-auto text-left text-gray-900 dark:text-gray-100"
                />
              </form>
            ) : (
              <h1
                className="text-4xl font-bold cursor-pointer hover:underline hover:underline-offset-4 text-gray-900 dark:text-gray-100"
                onDoubleClick={() => setEditing({field: "title"})}
              >
                {book.title}
              </h1>
            )}

            {editing.field === "author" ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input) commit("author", input.value);
              }}>
                <Input
                  autoFocus 
                  defaultValue={book.author}
                  onBlur={(e) => commit("author", e.target.value)}
                  className="text-lg text-left text-gray-600 dark:text-gray-400"
                />
              </form>
            ) : (
              <p
                className="text-lg text-gray-600 dark:text-gray-400 cursor-pointer hover:underline hover:underline-offset-4 mt-1"
                onDoubleClick={() => setEditing({field: "author"})}
              >
                {book.author || "(Double-click to add author)"}
              </p>
            )}
          </div>

          <div>
            <TextbookToc pdfUrl={pdfUrl} />
          </div>
        </div>

        {/* PDF Viewer */}
        <Card>
          <CardContent className="p-0 rounded-lg overflow-hidden">
            <div className="flex flex-col items-center justify-center p-0 bg-white dark:bg-gray-800 min-h-[800px] overflow-auto">
              {/* PDF Header */}
              <div className="w-full border-b border-gray-200 dark:border-gray-800 py-2 px-4 flex justify-end items-center gap-4 bg-gray-50 dark:bg-gray-900">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.open(pdfUrl, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  Full PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
              <div className="w-full">
                <embed 
                  src={pdfUrl} 
                  type="application/pdf" 
                  width="100%" 
                  height="1200px"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
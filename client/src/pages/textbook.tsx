import { useState, useEffect } from 'react';
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import TextbookToc from "@/components/textbook-toc";
import { Input } from "@/components/ui/input";
import { getBook, updateBook, BookMeta, initializeDefaultBooks } from "@/lib/bookStore";
import { useToast } from "@/hooks/use-toast";

export default function TextbookPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 575; // Approximate from the PDF
  const [book, setBook] = useState<BookMeta | null>(null);
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<{field: "title" | "author" | null}>({field: null});
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize the default books to ensure they exist
    initializeDefaultBooks();
    
    // Find the default linear algebra book
    const defaultBook = getBook("linear-algebra-default");
    
    if (defaultBook) {
      setBook(defaultBook);
    } else {
      // If not found, we'll create a minimal book object
      setBook({
        id: "linear-algebra-default",
        title: "Introduction to Linear Algebra",
        author: "Gilbert Strang",
        url: "/linear-algebra-book.pdf"
      });
    }
  }, []);
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // For iframe we can't directly control the page
      // This would be used with the TOC
    }
  }
  
  function commit(field: "title" | "author", value: string) {
    if (!book) return;
    
    updateBook(book.id, { [field]: value });
    setEditing({field: null});
    // Update local state
    setBook({...book, [field]: value});
    
    toast({
      title: `${field.charAt(0).toUpperCase() + field.slice(1)} updated`,
      description: `The ${field} has been updated successfully`,
    });
  }
  
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Loading book...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-grow">
        <div className="max-w-6xl mx-auto mb-0">
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
              <TextbookToc onSelectPage={goToPage} pdfUrl={book.url} />
            </div>
          </div>

          <Card className="border border-gray-200 dark:border-gray-700 mt-3">
            <CardContent className="p-0">
              {/* PDF Document */}
              <div className="flex flex-col items-center justify-center p-0 bg-white dark:bg-gray-800 min-h-[800px] overflow-auto">
                {/* PDF Header */}
                <div className="w-full border-b border-gray-200 dark:border-gray-800 py-2 px-4 flex justify-end items-center gap-4 bg-gray-50 dark:bg-gray-900">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => window.open(book.url, '_blank')}
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
                    src={book.url} 
                    type="application/pdf"
                    width="100%" 
                    height="1200px" 
                    className=""
                  />
                </div>
              </div>
              {/* Copyright notice moved inside card */}
              <div className="text-center py-1 text-gray-500 dark:text-gray-400 text-xs border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <p>© Gilbert Strang. Used with permission.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
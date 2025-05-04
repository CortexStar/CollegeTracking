import { useState, useEffect } from "react";
import { useLocation, Route, useParams } from "wouter";
import { getBook, updateBook } from "@/lib/bookStore";
import { Input } from "@/components/ui/input";
import TextbookToc from "@/components/textbook-toc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function BookPage() {
  const params = useParams();
  const id = params.id;
  const [book, setBook] = useState(getBook(id));
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<{field: "title" | "author" | null}>({field: null});
  const { toast } = useToast();
  
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
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
                  className="text-3xl font-bold mb-1 h-auto text-left"
                />
              </form>
            ) : (
              <h1
                className="text-3xl font-bold cursor-pointer hover:underline hover:underline-offset-4"
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
                  className="text-lg text-left"
                />
              </form>
            ) : (
              <p
                className="text-lg text-gray-600 dark:text-gray-400 cursor-pointer hover:underline hover:underline-offset-4"
                onDoubleClick={() => setEditing({field: "author"})}
              >
                {book.author || "(Double-click to add author)"}
              </p>
            )}
          </div>

          <TextbookToc pdfUrl={book.url} />
        </div>

        {/* PDF Viewer */}
        <Card>
          <CardContent className="p-0 rounded-lg overflow-hidden">
            <div className="w-full h-[800px]">
              <embed 
                src={book.url} 
                type="application/pdf" 
                width="100%" 
                height="100%" 
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
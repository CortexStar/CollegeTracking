import { useEffect } from 'react';
import { useLocation } from "wouter";
import { initializeDefaultBooks } from "@/lib/bookStore";

export default function TextbookPage() {
  const [, navigate] = useLocation();
  
  // Initialize default books and redirect to the unified book system
  useEffect(() => {
    // Initialize the default books to ensure they exist
    initializeDefaultBooks();
    
    // Redirect to the default linear algebra book
    navigate("/books/linear-algebra-default");
  }, [navigate]);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center">Redirecting to textbook...</div>
    </div>
  );
}
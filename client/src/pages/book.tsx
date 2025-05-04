import { useEffect } from "react";
import { useLocation } from "wouter";
import { getBooks } from "@/lib/bookStore";

export default function BookDefault() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const books = getBooks();
    // Redirect to either the first book, new book page, or default textbook
    if (books.length) {
      navigate(`/books/${books[0].id}`);
    } else {
      navigate("/textbook");
    }
  }, [navigate]);
  
  return <div className="flex items-center justify-center p-12">Redirecting...</div>;
}
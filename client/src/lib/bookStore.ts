// client/src/lib/bookStore.ts
import { v4 as uuidv4 } from 'uuid';

export interface BookMeta {
  id: string;          // uuid
  title: string;
  author: string;
  url: string;         // blob URL or file path
  pdfData?: string;    // base64 data for storage
  isBuiltIn?: boolean; // true for default books
}

const KEY = "books";
const FILES_KEY = "book_files";
const listeners = new Set<() => void>();

// Estimate localStorage size
export function getEstimatedLocalStorageSize(): number {
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      totalSize += key.length + value.length;
    }
  }
  return totalSize / (1024 * 1024); // Return in MB
}

// Initialize default books
export function initializeDefaultBooks() {
  const defaultBook: BookMeta = {
    id: "linear-algebra-default",
    title: "Introduction to Linear Algebra",
    author: "Gilbert Strang",
    url: "/linear-algebra-book.pdf",
    isBuiltIn: true
  };
  
  const existingBooks = getBooks();
  const hasDefaultBook = existingBooks.some(book => book.id === defaultBook.id);
  
  if (!hasDefaultBook) {
    saveBook(defaultBook);
  }
}

export function onBooksChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getBooks(): BookMeta[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function getBook(id: string) {
  if (id === "default") {
    // For backward compatibility - redirect to the default book ID
    const defaultBook = getBooks().find(b => b.isBuiltIn);
    return defaultBook || null;
  }
  
  const book = getBooks().find(b => b.id === id);
  if (!book) return null;
  
  // If it's not a built-in book, try to fetch the PDF data from separate storage
  if (!book.isBuiltIn) {
    try {
      // Get the stored PDF data
      const pdfData = localStorage.getItem(`${FILES_KEY}_${id}`);
      if (pdfData) {
        // If we have stored PDF data, create a blob URL for it
        return { ...book, pdfData };
      }
    } catch (e) {
      console.error("Error retrieving book data:", e);
    }
  }
  
  return book;
}

export function saveBook(b: BookMeta) {
  // If we have a data URL for a non-built-in book
  if (b.pdfData && !b.isBuiltIn) {
    try {
      // Use the browser's storage API if we have large data
      storeBookFile(b.id, b.pdfData);
      
      // Store book metadata without the large PDF data
      const metaToStore = { ...b };
      delete metaToStore.pdfData; // Don't store large data in the main books array
      
      localStorage.setItem(KEY, JSON.stringify([...getBooks(), metaToStore]));
      listeners.forEach(fn => fn());
    } catch (error) {
      console.error("Error storing book:", error);
      throw error;
    }
  } else {
    // For built-in books or books without data URLs
    localStorage.setItem(KEY, JSON.stringify([...getBooks(), b]));
    listeners.forEach(fn => fn());
  }
}

// Store file data separately to avoid hitting localStorage limits
function storeBookFile(id: string, data: string) {
  try {
    localStorage.setItem(`${FILES_KEY}_${id}`, data);
  } catch (error) {
    console.error("Error storing book data:", error);
    throw new Error("Failed to store book due to browser storage limits. Try a smaller file.");
  }
}

export function updateBook(id: string, patch: Partial<Pick<BookMeta,"title"|"author">>) {
  const all = getBooks();
  const i = all.findIndex(b => b.id === id);
  if (i === -1) return;
  all[i] = { ...all[i], ...patch };
  localStorage.setItem(KEY, JSON.stringify(all));
  listeners.forEach(fn => fn());
}

export function deleteBook(id: string) {
  // Remove the book from the main metadata store
  const all = getBooks();
  const filtered = all.filter(book => book.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
  
  // Remove the associated PDF data if it exists
  try {
    localStorage.removeItem(`${FILES_KEY}_${id}`);
  } catch (e) {
    console.error("Error removing book data:", e);
  }
  
  listeners.forEach(fn => fn());
  return filtered;
}
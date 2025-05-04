// client/src/lib/bookStore.ts
import { v4 as uuidv4 } from 'uuid';

export interface BookMeta {
  id: string;          // uuid
  title: string;
  author: string;
  url: string;         // blob URL
  isBuiltIn?: boolean; // true for default books
}

const KEY = "books";
const listeners = new Set<() => void>();

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
  return getBooks().find(b => b.id === id);
}

export function saveBook(b: BookMeta) {
  localStorage.setItem(KEY, JSON.stringify([...getBooks(), b]));
  listeners.forEach(fn => fn());
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
  const all = getBooks();
  const filtered = all.filter(book => book.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
  listeners.forEach(fn => fn());
  return filtered;
}
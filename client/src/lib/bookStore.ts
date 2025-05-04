// client/src/lib/bookStore.ts
export interface BookMeta {
  id: string;          // uuid
  title: string;
  author: string;
  url: string;         // blob URL
}

const KEY = "books";
const listeners = new Set<() => void>();

export function onBooksChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getBooks(): BookMeta[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function getBook(id: string) {
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
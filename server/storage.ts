import { db } from "../db";
import { books } from "../shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { promises as fs } from "fs";
import path from "path";

// Ensure the uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Create uploads directory using async fs
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
})();

export const storage = {
  // Book/PDF storage methods
  async saveBookFile(fileBuffer: Buffer, originalName: string, userId: string, title: string, author: string = ""): Promise<string> {
    // Generate unique IDs for the book and filename
    const bookId = nanoid();
    const fileExt = path.extname(originalName);
    const storedName = `${nanoid()}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, storedName);
    
    try {
      // Write the file to disk using async fs
      await fs.writeFile(filePath, fileBuffer);
      
      // Insert the book record into the database
      await db.insert(books).values({
        id: bookId,
        userId,
        title,
        author,
        storedName,
        originalName,
        isBuiltIn: false,
      });
      
      return bookId;
    } catch (error) {
      console.error('Error saving book file:', error);
      throw error; // Re-throw to be caught by global error handler
    }
  },
  
  async getUserBooks(userId: string) {
    return await db.query.books.findMany({
      where: eq(books.userId, userId),
      orderBy: (books, { desc }) => [desc(books.uploadedAt)]
    });
  },
  
  async getBookById(id: string) {
    return await db.query.books.findFirst({
      where: eq(books.id, id)
    });
  },
  
  getBookFilePath(storedName: string): string {
    return path.join(UPLOAD_DIR, storedName);
  },
  
  async deleteBook(id: string): Promise<void> {
    try {
      // First get the book to find its file
      const book = await db.query.books.findFirst({
        where: eq(books.id, id)
      });
      
      if (!book) {
        throw new Error('Book not found');
      }
      
      // Delete the file from disk if it exists
      const filePath = path.join(UPLOAD_DIR, book.storedName);
      
      try {
        // Check if file exists and delete it using async fs
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (fileError) {
        // File doesn't exist or couldn't be accessed, just log and continue
        console.log(`File ${filePath} not found or couldn't be accessed`);
      }
      
      // Delete the book record from the database
      await db.delete(books).where(eq(books.id, id));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error; // Re-throw to be caught by global error handler
    }
  },
  
  // For user session management
  async storeUserPreference(userId: string, theme: string): Promise<void> {
    // This would store a user preference in the database
    // console.log(`Storing user ${userId} preference: ${theme}`);
  },
  
  async getUserPreference(userId: string): Promise<string | null> {
    // This would retrieve a user preference from the database
    return null;
  }
};

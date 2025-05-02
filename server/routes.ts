import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get('/api/problem-sets', async (req, res) => {
    try {
      // This is a static content app, so we just return a success status
      // In a real app, this would fetch data from the database
      return res.status(200).json({ message: "API working" });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

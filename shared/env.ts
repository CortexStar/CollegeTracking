import 'dotenv/config';
import { z } from 'zod';

// Define AWS variables as optional with proper validation
const awsSchema = z.object({
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
});

// Define required application variables
const appSchema = z.object({
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

// Combine schemas
export const env = appSchema.merge(awsSchema).parse(process.env);
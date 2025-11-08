import { z } from "zod";

/**
 * Standard error response schema
 */
export const ErrorSchema = z.object({
  error: z.string().describe("Error message"),
  code: z.string().optional().describe("Error code"),
  details: z.record(z.any()).optional().describe("Additional error details"),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

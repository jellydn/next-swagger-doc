import { z } from "zod";

/**
 * Product schema representing a product in the catalog
 */
export const ProductSchema = z.object({
  id: z.string().uuid().describe("Unique product identifier"),
  name: z.string().min(1).max(200).describe("Product name"),
  description: z.string().max(1000).describe("Product description"),
  price: z.number().positive().describe("Product price in USD"),
  category: z.enum(["electronics", "clothing", "food", "books", "other"]).describe("Product category"),
  inStock: z.boolean().describe("Whether the product is in stock"),
  tags: z.array(z.string()).optional().describe("Product tags for search"),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Schema for creating a new product
 */
export const CreateProductSchema = ProductSchema.omit({ id: true });

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

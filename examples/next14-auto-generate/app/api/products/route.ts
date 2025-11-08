import { NextRequest, NextResponse } from "next/server";
import { ProductSchema, CreateProductSchema, type Product } from "@/models/product";

/**
 * Get all products with filtering
 *
 * HYBRID MODE: This demonstrates mixing auto-generation with explicit JSDoc.
 * Auto-gen provides: path (/api/products), method (GET), path parameters
 * JSDoc provides: detailed query parameters, tags, security, specific response schemas
 *
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - products
 *       - catalog
 *     summary: Get all products with filtering
 *     description: Retrieve a list of products with optional filtering by category and stock status
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, food, books, other]
 *         description: Filter products by category
 *       - name: inStock
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - name: minPrice
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - name: maxPrice
 *         in: query
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 count:
 *                   type: integer
 *                   description: Number of products returned
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const inStock = searchParams.get("inStock");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  // Mock products
  let products: Product[] = [
    {
      id: crypto.randomUUID(),
      name: "Laptop",
      description: "High-performance laptop",
      price: 999.99,
      category: "electronics",
      inStock: true,
      tags: ["computer", "portable"],
    },
    {
      id: crypto.randomUUID(),
      name: "T-Shirt",
      description: "Cotton t-shirt",
      price: 19.99,
      category: "clothing",
      inStock: true,
      tags: ["apparel", "casual"],
    },
  ];

  // Apply filters (simplified)
  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (inStock !== null) {
    const stockFilter = inStock === "true";
    products = products.filter((p) => p.inStock === stockFilter);
  }

  return NextResponse.json({
    products,
    count: products.length,
  });
}

/**
 * Create a new product
 *
 * In hybrid mode, this method uses minimal JSDoc while auto-gen handles the rest.
 */
export async function POST(request: NextRequest): Promise<NextResponse<Product>> {
  const body = await request.json();

  // Validate with Zod
  const validatedData = CreateProductSchema.parse(body);

  const newProduct: Product = {
    id: crypto.randomUUID(),
    ...validatedData,
  };

  return NextResponse.json(newProduct, { status: 201 });
}

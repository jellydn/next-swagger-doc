import { NextRequest, NextResponse } from "next/server";
import { UserListSchema, CreateUserSchema, type User } from "@/models/user";

/**
 * Get all users with pagination
 *
 * This endpoint demonstrates MINIMAL JSDOC MODE - just a summary comment!
 * Everything else (path, method, parameters, response schema) is auto-generated.
 */
export async function GET(request: NextRequest): Promise<NextResponse<typeof UserListSchema._type>> {
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get("page") || "1");
  const pageSize = Number.parseInt(searchParams.get("pageSize") || "10");

  // Mock data
  const mockUsers: User[] = [
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "john@example.com",
      name: "John Doe",
      role: "admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      email: "jane@example.com",
      name: "Jane Smith",
      role: "user",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  return NextResponse.json({
    users: mockUsers,
    total: mockUsers.length,
    page,
    pageSize,
  });
}

/**
 * Create a new user
 *
 * Also demonstrates minimal JSDoc - schema is auto-inferred from Zod!
 */
export async function POST(request: NextRequest): Promise<NextResponse<User>> {
  const body = await request.json();

  // Validate with Zod
  const validatedData = CreateUserSchema.parse(body);

  // Mock creation
  const newUser: User = {
    id: crypto.randomUUID(),
    ...validatedData,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(newUser, { status: 201 });
}

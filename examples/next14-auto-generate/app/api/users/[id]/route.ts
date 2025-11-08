import { NextRequest, NextResponse } from "next/server";
import { UserSchema, UpdateUserSchema, type User } from "@/models/user";
import { type ErrorResponse } from "@/models/error";

/**
 * Get user by ID
 *
 * SCHEMA INFERENCE MODE: Return type is automatically converted to OpenAPI schema!
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<User>> {
  const { id } = params;

  // Mock data
  const mockUser: User = {
    id,
    email: "john@example.com",
    name: "John Doe",
    role: "admin",
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  return NextResponse.json(mockUser);
}

/**
 * Update user by ID
 *
 * Request body schema is auto-inferred from UpdateUserSchema!
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<User | ErrorResponse>> {
  const { id } = params;
  const body = await request.json();

  try {
    // Validate with Zod
    const validatedData = UpdateUserSchema.parse(body);

    // Mock update
    const updatedUser: User = {
      id,
      email: validatedData.email || "john@example.com",
      name: validatedData.name || "John Doe",
      role: validatedData.role || "user",
      createdAt: new Date().toISOString(),
      isActive: validatedData.isActive ?? true,
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "Validation failed",
      details: error as Record<string, any>,
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }
}

/**
 * Delete user by ID
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean; message: string }>> {
  const { id } = params;

  return NextResponse.json({
    success: true,
    message: `User ${id} deleted successfully`,
  });
}

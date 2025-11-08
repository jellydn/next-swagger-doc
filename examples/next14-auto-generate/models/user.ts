import { z } from "zod";

/**
 * User schema representing a user in the system
 */
export const UserSchema = z.object({
  id: z.string().uuid().describe("Unique user identifier"),
  email: z.string().email().describe("User email address"),
  name: z.string().min(1).max(100).describe("User full name"),
  role: z.enum(["admin", "user", "guest"]).describe("User role"),
  createdAt: z.string().datetime().describe("Account creation timestamp"),
  isActive: z.boolean().describe("Whether the user account is active"),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Schema for creating a new user
 */
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Schema for updating a user
 */
export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * Paginated user list response
 */
export const UserListSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().int().min(0).describe("Total number of users"),
  page: z.number().int().min(1).describe("Current page number"),
  pageSize: z.number().int().min(1).max(100).describe("Number of items per page"),
});

export type UserList = z.infer<typeof UserListSchema>;

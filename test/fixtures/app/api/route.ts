/**
 * Get all users
 */
export async function GET(request: Request) {
  return Response.json({ users: [] });
}

/**
 * Create a new user
 */
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ user: body }, { status: 201 });
}

export async function DELETE(request: Request) {
  return Response.json({ deleted: true });
}

/**
 * Arrow function handler
 */
export const GET = async (request: Request) => {
  return Response.json({ data: 'test' });
};

export const POST = async (request: Request) => {
  return Response.json({ created: true }, { status: 201 });
};

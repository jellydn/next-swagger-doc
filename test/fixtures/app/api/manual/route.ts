/**
 * @swagger
 * /api/manual:
 *   get:
 *     summary: Manual documentation
 *     responses:
 *       204:
 *         description: No content
 */
export function GET() {
  return new Response(null, { status: 204 });
}

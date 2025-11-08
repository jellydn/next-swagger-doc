import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Get user by ID
 *
 * @swagger
 * /api/users/{id}:
 *   get:
 *     description: Retrieves detailed information for a specific user by their unique identifier
 *     responses:
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auto-generation infers: GET /api/users/{id}, path param, 200 response, summary from JSDoc
  // JSDoc adds: detailed description, 404 and 500 responses
  // Hybrid result: path param from auto-gen + responses from JSDoc
  const { id } = req.query;
  res.status(200).json({ id, name: 'John Doe', email: 'john@example.com' });
}

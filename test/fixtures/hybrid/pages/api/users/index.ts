import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     description: Returns a paginated list of users from the database
 *     tags:
 *       - users
 *       - admin
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 page:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized - authentication required
 *     security:
 *       - bearerAuth: []
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auto-generation would infer: GET /api/users with basic 200 response
  // JSDoc adds: pagination params, detailed schema, security, 401 response
  res.status(200).json({ users: [], page: 1, total: 0 });
}

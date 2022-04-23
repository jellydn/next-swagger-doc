// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { Organization } from '../../models/organization';

/**
 * @swagger
 * /api/organization:
 *   get:
 *     tags: [Organization]
 *     responses:
 *       200:
 *         description: Organization
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Organization'
 */

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse<Organization[]>,
) => {
  res.status(200).json([
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      name: 'IT Man Channel',
      parent: 'Dung Huynh',
      createdAt: new Date().toUTCString(),
      updatedAt: new Date().toUTCString(),
    },
  ]);
};

export default handler;

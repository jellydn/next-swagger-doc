import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/pet:
 *   get:
 *     description: List all pets
 *     security:
 *       - OAuth2: ['read:pets']
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: list of pets.
 */
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    pets: [
      {
        name: 'dog',
      },
      {
        name: 'cat',
      },
    ],
  });
};

export default handler;

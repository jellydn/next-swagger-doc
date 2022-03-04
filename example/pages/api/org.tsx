// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/org:
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
interface OrgResponse{
    message: string
}
const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<OrgResponse>
) => {
  res.status(200).json({message: "Organization"});
};

export default handler;

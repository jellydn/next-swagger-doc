import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple API handler
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello World' });
}

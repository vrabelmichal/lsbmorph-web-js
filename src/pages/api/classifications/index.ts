import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { galaxyId, lsbClass, morphology, comments, awesomeFlag, validRedshift } = req.body;

    const classification = await prisma.classification.upsert({
      where: {
        userId_galaxyId: {
          userId: user.userId,
          galaxyId
        }
      },
      update: {
        lsbClass,
        morphology,
        comments,
        awesomeFlag,
        validRedshift,
        dateClassified: new Date()
      },
      create: {
        userId: user.userId,
        galaxyId,
        lsbClass,
        morphology,
        comments,
        awesomeFlag,
        validRedshift
      }
    });

    res.status(200).json(classification);
  }
}

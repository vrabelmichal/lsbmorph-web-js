import { NextApiRequest, NextApiResponse } from 'next';
import { GalaxyService } from '../../../lib/services/galaxyService';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    id: currentId,
    withRedshift,
    classified,
    skipped,
    validRedshift,
    lsbClass,
    morphology 
  } = req.query;

  const params = {
    withRedshift: withRedshift === 'true' ? true : withRedshift === 'false' ? false : undefined,
    classified: classified === 'true' ? true : classified === 'false' ? false : undefined,
    skipped: skipped === 'true' ? true : skipped === 'false' ? false : undefined,
    validRedshift: validRedshift === 'true' ? true : validRedshift === 'false' ? false : undefined,
    lsbClass: lsbClass ? parseInt(lsbClass as string) : undefined,
    morphology: morphology ? parseInt(morphology as string) : undefined,
  };

  const galaxy = await GalaxyService.getNextGalaxy(
    user.userId,
    currentId as string,
    params
  );

  if (!galaxy) {
    return res.status(404).json({ error: 'No galaxy found' });
  }

  res.status(200).json(galaxy);
}

